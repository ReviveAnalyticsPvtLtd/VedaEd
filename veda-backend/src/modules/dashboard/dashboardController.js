const mongoose = require("mongoose");
const Student = require("../student/studentModels");
const Staff = require("../staff/staffModels");
const Class = require("../class/classSchema");
const Notice = require("../communication/noticeModel");
const Complaint = require("../communication/complaintModel");
const Message = require("../communication/messageModel");
const CommunicationLog = require("../communication/communicationLogModel");
const AdmissionApplication = require("../admission/admissionApplicationModel");
const AdmissionEnquiry = require("../admission/admissionEnquiryModel");
const Attendance = require("../attendence/attendenceSchema");
const { AcademicYear, FeeTransaction } = require("../fees/feeModels");

/**
 * Resolves the authoritative tenant for the request.
 *
 * This is the same guard used by the other tenant-scoped modules (student,
 * staff, class, section, exam, gradebook, timetable, ...). The routes also mount
 * requireSchoolContext, so in normal request flow this is a second line of
 * defence; it exists so the controller is still safe when invoked directly.
 *
 * req.user.schoolId is written by authMiddleware from the User document in
 * MongoDB. It is never taken from the request body, query string, headers or the
 * JWT claims.
 */
const requireSchool = (req, res) => {
  const schoolId = req.user?.schoolId;
  if (!schoolId || !mongoose.isValidObjectId(String(schoolId))) {
    res.status(403).json({
      success: false,
      code: "NO_SCHOOL_CONTEXT",
      message: "Your account is not linked to a school.",
    });
    return null;
  }
  return String(schoolId);
};

/**
 * Short-lived cache for the master dashboard payload.
 */
const MASTER_STATS_TTL_MS = 20 * 1000; 
const masterStatsCache = new Map(); // schoolId -> { data, expiresAt }
// schoolId -> Promise<payload>. See getOrComputeMasterStats.
const masterStatsInFlight = new Map();

// How many students' fee summaries are calculated in parallel per batch.
const FEE_LOOKUP_CONCURRENCY = 10;

/**
 * Tenant filter for the Student aggregations below.
 *
 * Mongoose casts values in ordinary queries (countDocuments, findOne, ...) but
 * it does NOT cast anything inside an aggregate() pipeline — the pipeline is
 * handed to MongoDB untouched. Passing the String schoolId here would therefore
 * match nothing and silently report an empty dashboard, so it must be an
 * ObjectId. Verified against the local database: a String $match returns 0
 * students where the ObjectId form returns 7.
 */
const tenantMatchFor = (schoolId) => ({ schoolId: new mongoose.Types.ObjectId(String(schoolId)) });

/**
 * Students grouped by class, restricted to one school.
 *
 * The $match is the FIRST stage on purpose. Filtering after $group is not
 * possible — the group key is the class, and the count is already accumulated —
 * so the tenant filter has to run before any counting happens.
 */
const buildStudentsByClassPipeline = (schoolId) => [
  { $match: tenantMatchFor(schoolId) },
  {
    $group: {
      _id: "$personalInfo.class",
      count: { $sum: 1 }
    }
  },
  {
    $sort: { _id: 1 }
  }
];

const buildStudentBreakdownPipeline = (schoolId) => [
  { $match: tenantMatchFor(schoolId) },
  {
    $facet: {
      studentsByClass: [
        { $group: { _id: "$personalInfo.class", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ],
      genderRatio: [
        { $group: { _id: "$personalInfo.gender", count: { $sum: 1 } } }
      ]
    }
  }
];

const currentWeekRange = () => {
  const start = new Date();
  start.setDate(start.getDate() + (start.getDay() === 0 ? -6 : 1 - start.getDay()));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const buildWeeklyAttendancePipeline = (studentIds, start, end) => [
  { $match: { student: { $in: studentIds }, date: { $gte: start, $lte: end } } },
  {
    $group: {
      _id: { $dayOfWeek: "$date" },
      total: { $sum: 1 },
      attended: {
        $sum: { $cond: [{ $in: ["$status", ["Present", "Late"]] }, 1, 0] }
      }
    }
  }
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/**
 * Collected = sum of Paid transactions for the active academic year.
 * 'Cancelled' rows are excluded, matching the parent dashboard.
 */
const buildFeesCollectedPipeline = (schoolId, year) => [
  {
    $match: {
      schoolId: new mongoose.Types.ObjectId(String(schoolId)),
      year,
      status: "Paid"
    }
  },
  { $group: { _id: null, total: { $sum: "$totalAmount" } } }
];

exports.getAdminDashboardStats = async (req, res) => {
  try {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;


    // TOTAL COUNTS

    const totalStudents =
      await Student.countDocuments({ schoolId });

    const totalTeachers =
      await Staff.countDocuments({ schoolId });

    const totalClasses =
      await Class.countDocuments({ schoolId });

    // STUDENTS BY CLASS

    const studentsByClass =
      await Student.aggregate(buildStudentsByClassPipeline(schoolId));

    // FINAL RESPONSE

    res.json({
      students: totalStudents,

      teachers: totalTeachers,

      classes: totalClasses,

      other: 0,

      studentsByClass
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: err.message
    });
  }
};

/**
 * Builds the master-stats payload for exactly one school.
 *
 * Every count, aggregate and fee lookup below is tenant-scoped to `schoolId`,
 * which requireSchool() resolved from the authenticated user record — never
 * from anything the client sent. That matters beyond a single response: the
 * payload is cached and replayed to that school's later requests, so one
 * unscoped value here would be stored and served as if it were school-owned.
 */
const computeMasterStats = async (schoolId) => {
  const [
    totalStudents,
    totalStaff,
    totalClasses,
    totalApplications,
    confirmedAdmissions,
    totalNotices,
    totalComplaints,
    totalMessages,
    totalLogs,
    totalEnquiries,
    studentBreakdown
  ] = await Promise.all([
    Student.countDocuments({ schoolId }),
    Staff.countDocuments({ schoolId }),
    Class.countDocuments({ schoolId }),
    AdmissionApplication.countDocuments({ schoolId }),
    AdmissionApplication.countDocuments({ schoolId, status: "Approved" }),
    Notice.countDocuments({ schoolId }),
    Complaint.countDocuments({ schoolId }),
    Message.countDocuments({ schoolId }),
    CommunicationLog.countDocuments({ schoolId }),
    AdmissionEnquiry.countDocuments({ schoolId }),
    Student.aggregate(buildStudentBreakdownPipeline(schoolId))
  ]);

  const genderRatio = studentBreakdown[0]?.genderRatio || [];
  const studentsByClass = studentBreakdown[0]?.studentsByClass || [];

  const students = await Student.find({ schoolId }).populate("personalInfo.class");

  const { start, end } = currentWeekRange();
  const attendanceRows = await Attendance.aggregate(
    buildWeeklyAttendancePipeline(students.map((s) => s._id), start, end)
  );

  const attendanceByDay = new Map(attendanceRows.map((r) => [r._id, r]));
  const weeklyAttendance = WEEKDAYS.map((day, i) => {
    const row = attendanceByDay.get(i + 2);
    if (!row || !row.total) return { day, value: null };
    return { day, value: Math.round((row.attended / row.total) * 100) };
  });


  const activeYear = await AcademicYear.findOne({ isActive: true })
    .select("label")
    .lean();

  let feesCollected = 0;
  let feesPending = 0;

  if (activeYear?.label) {
    const [collectedRow] = await FeeTransaction.aggregate(
      buildFeesCollectedPipeline(schoolId, activeYear.label)
    );
    feesCollected = collectedRow?.total || 0;
    const { calculateStudentFees, buildFeeContext } = require("../fees/feeControllers");
    const feeCtx = await buildFeeContext(students, activeYear.label, schoolId);
    for (let i = 0; i < students.length; i += FEE_LOOKUP_CONCURRENCY) {
      const summaries = await Promise.all(
        students
          .slice(i, i + FEE_LOOKUP_CONCURRENCY)
          .map((student) => calculateStudentFees(student, activeYear.label, schoolId, feeCtx))
      );
      for (const summary of summaries) {
        feesPending += summary.balance || 0;
      }
    }
  }

  return {
    success: true,
    stats: {
      sis: {
        totalStudents,
        totalStaff,
        totalClasses,
        studentsByClass: studentsByClass.map(item => ({ name: `Class ${item._id}`, value: item.count })),
        genderRatio: genderRatio.map(item => ({ name: item._id || 'Unknown', value: item.count })),
        weeklyAttendance
      },
      communication: {
        totalNotices,
        totalComplaints,
        totalMessages,
        totalLogs
      },
      admission: {
        totalApplications,
        totalEnquiries,
        confirmedAdmissions
      },
      hr: {
        totalStaff
      },
      calendar: {
        totalEvents: 0 // Placeholder
      },
      fees: {
        collected: feesCollected,
        pending: feesPending,
        year: activeYear?.label || null
      }
    }
  };
};

/**
 * Read-through cache with single-flight.
 *
 * Key is the authoritative schoolId only, so one school can never receive
 * another school's cached payload.
 *
 * Single-flight: when a request arrives while another is already building this
 * school's payload, it awaits that same promise rather than starting a second
 * full recomputation — otherwise a busy dashboard would fire the entire query
 * set N times in parallel, one per visitor.
 */
const getOrComputeMasterStats = (schoolId) => {
  const cached = masterStatsCache.get(schoolId);
  if (cached && Date.now() < cached.expiresAt) {
    return Promise.resolve(cached.data);
  }

  const inFlight = masterStatsInFlight.get(schoolId);
  if (inFlight) return inFlight;

  const work = Promise.resolve()
    .then(() => computeMasterStats(schoolId))
    .then((payload) => {
      masterStatsCache.set(schoolId, {
        data: payload,
        expiresAt: Date.now() + MASTER_STATS_TTL_MS
      });
      return payload;
    })
    .finally(() => {
      masterStatsInFlight.delete(schoolId);
    });

  masterStatsInFlight.set(schoolId, work);
  return work;
};

exports.getMasterDashboardStats = async (req, res) => {
  try {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;

    res.json(await getOrComputeMasterStats(schoolId));
  } catch (err) {
    console.error("Error in getMasterDashboardStats:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
