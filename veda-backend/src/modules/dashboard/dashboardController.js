const mongoose = require("mongoose");
const Student = require("../student/studentModels");
const Staff = require("../staff/staffModels");
const Class = require("../class/classSchema");
const Notice = require("../communication/noticeModel");
const Complaint = require("../communication/complaintModel");
const AdmissionApplication = require("../admission/admissionApplicationModel");
const AdmissionEnquiry = require("../admission/admissionEnquiryModel");

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

exports.getAdminDashboardStats = async (req, res) => {
  try {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;

    // =========================
    // TOTAL COUNTS
    // =========================

    const totalStudents =
      await Student.countDocuments({ schoolId });

    const totalTeachers =
      await Staff.countDocuments({ schoolId });

    const totalClasses =
      await Class.countDocuments({ schoolId });

    // =========================
    // STUDENTS BY CLASS
    // =========================

    const studentsByClass =
      await Student.aggregate(buildStudentsByClassPipeline(schoolId));

    // =========================
    // FINAL RESPONSE
    // =========================

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
      confirmedAdmissions
    ] = await Promise.all([
      Student.countDocuments({ schoolId }),
      Staff.countDocuments({ schoolId }),
      Class.countDocuments({ schoolId }),
      AdmissionApplication.countDocuments({ schoolId }),
      AdmissionApplication.countDocuments({ schoolId, status: "Approved" })
    ]);

    // ---- Intentionally fail-closed communication counts --------------------
    // Notice and Complaint are NOT counted here.
    //
    // Neither model declares a schoolId field, and both run with strict:true,
    // so Mongoose silently strips schoolId from newly created documents while
    // older documents in the database still carry one. Ownership therefore
    // cannot be relied on: a count would be a cross-school total today and
    // would silently start under-counting as new records arrive. Reporting 0 is
    // a safe under-count; reporting the raw total would be a real data leak.
    //
    // These two metrics are pending the separate Notice/Complaint
    // tenant-ownership fix (declare schoolId on both models, backfill, then
    // scope). The response keys stay in place so the contract is unchanged.
    const totalNotices = 0;
    const totalComplaints = 0;

    // ---- Intentionally fail-closed admission enquiry count ----------------
    // AdmissionEnquiry has no schoolId on the model and none in the schema at
    // all, so there is no field to scope by. Counting it would return every
    // school's enquiries, so it stays at 0 until the model is made
    // tenant-owned. Same reasoning as Notice/Complaint.
    const totalEnquiries = 0;

    // Get gender ratio for students
    const genderRatio = await Student.aggregate(buildGenderRatioPipeline(schoolId));

    // Get students by class for pie chart
    const studentsByClass = await Student.aggregate(buildStudentsByClassPipeline(schoolId));

    res.json({
      success: true,
      stats: {
        sis: {
          totalStudents,
          totalStaff,
          totalClasses,
          studentsByClass: studentsByClass.map(item => ({ name: `Class ${item._id}`, value: item.count })),
          genderRatio: genderRatio.map(item => ({ name: item._id || 'Unknown', value: item.count }))
        },
        communication: {
          totalNotices,
          totalComplaints,
          totalMessages: 0 // Placeholder until message model is confirmed
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
          collected: 0,
          pending: 0
        }
      }
    });
  } catch (err) {
    console.error("Error in getMasterDashboardStats:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
