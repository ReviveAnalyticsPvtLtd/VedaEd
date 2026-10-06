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

/**
 * Students grouped by gender, restricted to one school.
 * Same placement rule as above: $match first, then $group.
 *
 * The Male/male/null split is a pre-existing data-quality problem in the stored
 * values. It is deliberately left alone here.
 */
const buildGenderRatioPipeline = (schoolId) => [
  { $match: tenantMatchFor(schoolId) },
  {
    $group: {
      _id: "$personalInfo.gender",
      count: { $sum: 1 }
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

exports.getMasterDashboardStats = async (req, res) => {
  try {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;

    // AdmissionApplication and AdmissionEnquiry are handled separately below
    // because they do not have the same ownership guarantees.
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
      totalEnquiries
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
      AdmissionEnquiry.countDocuments({ schoolId })
    ]);

    // Get gender ratio for students
    const genderRatio = await Student.aggregate(buildGenderRatioPipeline(schoolId));

    // Get students by class for pie chart
    const studentsByClass = await Student.aggregate(buildStudentsByClassPipeline(schoolId));

    // One read serves both the attendance chart and the per-student fee
    // balances below, so `personalInfo.class` is populated once here.
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

    // =========================
    // FEES
    // =========================

    // AcademicYear is deliberately not tenant-owned (one active session per
    // deployment), so it is read unscoped exactly as the Fees module does.
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

      // Outstanding balance is derived, never stored. It is taken from the Fees
      // module's own calculation so this figure can never drift from the one
      // shown on the Fees page.
      const { calculateStudentFees } = require("../fees/feeControllers");
      for (const student of students) {
        const summary = await calculateStudentFees(student, activeYear.label, schoolId);
        feesPending += summary.balance || 0;
      }
    }

    res.json({
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
    });
  } catch (err) {
    console.error("Error in getMasterDashboardStats:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
