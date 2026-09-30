const Attendance = require("./attendenceSchema");
const Student = require("../student/studentModels");
const Parent = require("../parents/parentModel");
const Class = require("../class/classSchema");
const Section = require("../section/sectionSchema");
const mongoose = require("mongoose");

// Tenant context is resolved by authMiddleware from the authenticated User
// document. It is never read from the request payload.
const requireSchool = (req, res) => {
  const schoolId = req.user?.schoolId;
  if (!schoolId || !mongoose.isValidObjectId(String(schoolId))) {
    res.status(403).json({
      success: false,
      message: "Your account is not linked to a school.",
    });
    return null;
  }
  return String(schoolId);
};

// Attendance has no schoolId of its own, so every lookup is anchored to
// Class/Section/Student documents that do.
const findOwnedClass = (classId, schoolId) => Class.findOne({ _id: classId, schoolId }).select("_id");
const findOwnedSection = (sectionId, schoolId) => Section.findOne({ _id: sectionId, schoolId }).select("_id");
const findOwnedStudent = (studentId, schoolId) => Student.findOne({ _id: studentId, schoolId }).select("_id");
const getSchoolStudentIds = async (schoolId) => (await Student.find({ schoolId }).select("_id")).map((s) => s._id);

/*
 * Mark attendance for an entire class (bulk insert)
 * req.body = {
 *   classId, sectionId, date,
 *   records: [
 *     { studentId, status, time },
 *     { studentId, status, time }
 *   ]
 * }
 */

// Mark attendance for an entire class
exports.markClassAttendance = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const { classId, sectionId, date, records } = req.body;

    if (!classId || !sectionId || !date || !records || records.length === 0) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!(await findOwnedClass(classId, schoolId))) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    if (!(await findOwnedSection(sectionId, schoolId))) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    const studentIds = [...new Set(records.map((r) => String(r.studentId)))];
    const ownedStudents = await Student.find({ _id: { $in: studentIds }, schoolId }).select("_id");
    if (ownedStudents.length !== studentIds.length) {
      return res.status(404).json({ success: false, message: "Some students not found" });
    }

    // Remove existing attendance for the same date/class/section (so teacher can re-mark)
    await Attendance.deleteMany({ class: classId, section: sectionId, date });

    // Insert all student attendance records
    const newRecords = records.map(r => ({
      student: r.studentId,
      class: classId,
      section: sectionId,
      date,
      status: r.status,
      time: r.time || null
    }));

    const saved = await Attendance.insertMany(newRecords);

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      count: saved.length,
      data: saved
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};


/*
 * Get attendance by class & section for a specific date
 * req.query = { classId, sectionId, date }
 */

// Get attendance by class + section + date
exports.getAttendanceByClass = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const { classId, sectionId, date } = req.params;

    if (!classId || !sectionId || !date) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!(await findOwnedClass(classId, schoolId))) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    if (!(await findOwnedSection(sectionId, schoolId))) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    // Normalize date to start/end of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      class: classId,
      section: sectionId,
      student: { $in: await getSchoolStudentIds(schoolId) },
      date: { $gte: startOfDay, $lte: endOfDay },
    }).populate({ path: "student", match: { schoolId }, select: "personalInfo.name personalInfo.rollNo" });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

exports.updateAttendanceByStudent = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const { studentId } = req.params;
    const { date, status, time } = req.body;

    if (!date || !status) {
      return res.status(400).json({
        success: false,
        message: "Date and status are required",
      });
    }

    // Check if student exists in this school
    const student = await Student.findOne({ _id: studentId, schoolId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Normalize date (start of the day)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Find attendance for this student on that day
    let attendance = await Attendance.findOne({
      student: studentId,
      class: student.personalInfo.class,
      section: student.personalInfo.section,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    if (!attendance) {
      // Create new attendance doc
      attendance = new Attendance({
        student: studentId,
        class: student.personalInfo.class,
        section: student.personalInfo.section,
        date: startOfDay,
        status,
        time: status === "Absent" ? "--" : (time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
      });
    } else {
      // Update existing doc
      attendance.status = status;
      attendance.time = status === "Absent" ? "--" : (time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Attendance updated for student",
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get attendance history of a student
// exports.getAttendanceByStudent = async (req, res) => {
//   try {
//     const { studentId } = req.params;

//     if (!studentId) {
//       return res.status(400).json({ success: false, message: "Student ID required" });
//     }

//     const records = await Attendance.find({ student: studentId })
//       .populate("class", "name")
//       .populate("section", "name");

//     res.status(200).json({
//       success: true,
//       count: records.length,
//       data: records
//     });

//   } catch (err) {
//     res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };



exports.getAttendanceByStudent = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID required",
      });
    }

    // RBAC check
    if (req.user) {
      if (req.user.role === 'student' && req.user.refId !== studentId) {
        return res.status(403).json({ success: false, message: "Unauthorized access to other student's attendance" });
      }
      if (req.user.role === 'parent') {
        const parent = await Parent.findOne({ _id: req.user.refId, schoolId });
        if (!parent || !parent.children.includes(studentId)) {
          return res.status(403).json({ success: false, message: "Unauthorized access to this student's attendance" });
        }
      }
    }

    if (!(await findOwnedStudent(studentId, schoolId))) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const records = await Attendance.find({ student: studentId })

      .populate({ path: "class", match: { schoolId }, select: "name" })
      .populate({ path: "section", match: { schoolId }, select: "name" })
      .sort({ date: -1 }); // latest first

    if (!records || records.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found for this student",
      });
    }

    res.status(200).json({
      success: true,
      count: records.length,
      data: records.map(r => ({
        date: r.date,
        class: r.class?.name,
        section: r.section?.name,
        status: r.status,
        time: r.time,
      })),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// Get attendance summary for today
exports.getAttendanceSummary = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const stats = await Attendance.aggregate([
      {
        $match: {
          student: { $in: await getSchoolStudentIds(schoolId) },
          date: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = {
      Present: 0,
      Absent: 0,
      Late: 0
    };

    stats.forEach(stat => {
      if (summary.hasOwnProperty(stat._id)) {
        summary[stat._id] = stat.count;
      }
    });

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get weekly attendance statistics
exports.getWeeklyStats = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const stats = await Attendance.aggregate([
      {
        $match: {
          student: { $in: await getSchoolStudentIds(schoolId) },
          date: { $gte: startOfWeek, $lte: endOfWeek }
        }
      },
      {
        $group: {
          _id: {
            day: { $dayOfWeek: "$date" },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Map day numbers to names (1=Sun, 2=Mon...)
    const daysHead = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const trends = daysHead.map((day, index) => {
      const dayNum = index + 1;
      const presentCount = stats.find(s => s._id.day === dayNum && s._id.status === "Present")?.count || 0;
      return { day, students: presentCount };
    });

    res.status(200).json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get recent attendance records
exports.getRecentAttendance = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const records = await Attendance.find({ student: { $in: await getSchoolStudentIds(schoolId) } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({ path: "student", match: { schoolId }, select: "personalInfo.name" })
      .populate({ path: "class", match: { schoolId }, select: "name" })
      .populate({ path: "section", match: { schoolId }, select: "name" });

    const formatted = records.map(r => ({
      name: r.student?.personalInfo?.name || "Unknown",
      grade: `${r.class?.name || ""} - ${r.section?.name || ""}`,
      status: r.status,
      time: r.time || "--"
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get attendance by date for all students
exports.getAttendanceByDate = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const { date } = req.params;
    if (!date) {
      return res.status(400).json({ success: false, message: "Date is required" });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      student: { $in: await getSchoolStudentIds(schoolId) },
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate({ path: "student", match: { schoolId }, select: "personalInfo.name personalInfo.rollNo" })
      .populate({ path: "class", match: { schoolId }, select: "name" })
      .populate({ path: "section", match: { schoolId }, select: "name" });

    res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};