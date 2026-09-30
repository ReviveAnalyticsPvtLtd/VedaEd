const Timetable = require("./timeTableSchema");
const AssignTeacher = require("../assignTeachersToClass/assignTeacherSchema");
const SubjectGroup = require("../subGroup/subGroupSchema");
const Staff = require("../staff/staffModels");
const Class = require("../class/classSchema");
const Section = require("../section/sectionSchema");
const Subject = require("../subject/subjectSchema");
const Student = require("../student/studentModels");
const Parent = require("../parents/parentModel");
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

// Timetable has no schoolId of its own, so every lookup is anchored to the
// Class/Section/Subject/Staff documents it references.
const findOwnedClass = (classId, schoolId) => Class.findOne({ _id: classId, schoolId }).select("_id");
const findOwnedSection = (sectionId, schoolId) => Section.findOne({ _id: sectionId, schoolId }).select("_id");
const findOwnedSubject = (subjectId, schoolId) => Subject.findOne({ _id: subjectId, schoolId }).select("_id");
const findOwnedStaff = (staffId, schoolId) => Staff.findOne({ _id: staffId, schoolId }).select("_id");
const getSchoolClassIds = async (schoolId) => (await Class.find({ schoolId }).select("_id")).map((c) => c._id);
const getSchoolSectionIds = async (schoolId) => (await Section.find({ schoolId }).select("_id")).map((s) => s._id);

// helpers
const toMin = (hhmm) => {
  const [h, m] = (hhmm || "").split(":").map(Number);
  return h * 60 + m;
};
// const overlaps = (aStart, aEnd, bStart, bEnd) =>

// // CREATE one period
// exports.createTimetableEntry = async (req, res) => {
//   console.log(req.body);
//   try {
//     const {
//       classId,
//       sectionId,
//       subjectGroupId,
//       day,
//       subjectId,
//       teacherId,
//       timeFrom,
//       timeTo,
//       roomNo,
//     } = req.body;

//     // 1) basic validation
//     if (
//       !classId || !sectionId || !subjectGroupId || !day ||
//       !subjectId || !teacherId || !timeFrom || !timeTo
//     ) {
//       return res.status(400).json({ success: false, message: "Required fields missing" });
//     }
//     if (toMin(timeFrom) >= toMin(timeTo)) {
//       return res.status(400).json({ success: false, message: "timeFrom must be earlier than timeTo" });
//     }

//     // 2) existence checks (optional but nice)
//     // const [cls, sec, subj, teacher] = await Promise.all([
//     //   Class.findById(classId),
//     //   Section.findById(sectionId),
//     //   Subject.findById(subjectId),
//     //   Staff.findById(teacherId),
//     // ]);
//     // if (!cls) return res.status(404).json({ success: false, message: "Class not found" });
//     // if (!sec) return res.status(404).json({ success: false, message: "Section not found" });
//     // if (!subj) return res.status(404).json({ success: false, message: "Subject not found" });
//     // if (!teacher) return res.status(404).json({ success: false, message: "Teacher (staff) not found" });
//     // if (teacher.personalInfo?.role !== "Teacher") {
//     //   return res.status(400).json({ success: false, message: "Selected staff is not a Teacher" });
//     // }

//     // 3) validate subject group ↔ class/section/subject
//     const group = await SubjectGroup.findById(subjectGroupId);
//     if (!group) return res.status(404).json({ success: false, message: "Subject Group not found" });

//     // group.classes is a single Class ref; sections is an array; subjects is an array
//     if (String(group.classes) !== String(classId)) {
//       return res.status(400).json({ success: false, message: "Subject Group does not belong to this Class" });
//     }
//     if (!group.sections.map(String).includes(String(sectionId))) {
//       return res.status(400).json({ success: false, message: "Section is not part of this Subject Group" });
//     }
//     if (!group.subjects.map(String).includes(String(subjectId))) {
//       return res.status(400).json({ success: false, message: "Subject is not in this Subject Group" });
//     }

//     // 4) validate teacher is assigned to class+section
//     const assignment = await AssignTeacher.findOne({ class: classId, section: sectionId });
//     if (!assignment) {
//       return res.status(400).json({ success: false, message: "No teachers assigned for this class & section" });
//     }
//     if (!assignment.teachers.map(String).includes(String(teacherId))) {
//       return res.status(400).json({ success: false, message: "Teacher is not assigned to this class & section" });
//     }

//     // 5) clash checks
//     const start = toMin(timeFrom), end = toMin(timeTo);

//     // (a) class+section clash on same day
//     const classClashes = await Timetable.find({ class: classId, section: sectionId, day });
//     const hasClassClash = classClashes.some(tt =>
//       overlaps(start, end, toMin(tt.timeFrom), toMin(tt.timeTo))
//     );
//     if (hasClassClash) {
//       return res.status(409).json({ success: false, message: "Time overlaps with another period for this class/section" });
//     }

//     // (b) teacher clash on same day
//     const teacherClashes = await Timetable.find({ teacher: teacherId, day });
//     const hasTeacherClash = teacherClashes.some(tt =>
//       overlaps(start, end, toMin(tt.timeFrom), toMin(tt.timeTo))
//     );
//     if (hasTeacherClash) {
//       return res.status(409).json({ success: false, message: "Teacher has another class at this time" });
//     }

//     // 6) create
//     const created = await Timetable.create({
//       class: classId,
//       section: sectionId,
//       subjectGroup: subjectGroupId,
//       day,
//       subject: subjectId,
//       teacher: teacherId,
//       timeFrom,
//       timeTo,
//       roomNo,
//     });
//     console.log("created Class: ", created);
//     const populated = await Timetable.findById(created._id)
//       .populate("class", "name")
//       .populate("section", "name")
//       .populate("subjectGroup", "name")
//       .populate("subject", "subjectName subjectCode type")
//       .populate("teacher", "personalInfo.name personalInfo.staffId personalInfo.department");

//     res.status(201).json({ success: true, message: "Timetable entry created", data: populated });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };

// const toMin = (hhmm) => {
//   const [h, m] = (hhmm || "").split(":").map(Number);
//   return h * 60 + m;
// };
// const overlaps = (aStart, aEnd, bStart, bEnd) =>
//   Math.max(aStart, bStart) < Math.min(aEnd, bEnd); // true if intervals overlap

// // CREATE one period
// exports.createTimetableEntry = async (req, res) => {
//   console.log(req.body);
//   try {
//     const {
//       classId,
//       sectionId,
//       subjectGroupId,
//       day,
//       subjectId,
//       teacherId,
//       timeFrom,
//       timeTo,
//       roomNo,
//     } = req.body;

//     // 1) basic validation
//     if (
//       !classId || !sectionId || !subjectGroupId || !day ||
//       !subjectId || !teacherId || !timeFrom || !timeTo
//     ) {
//       return res.status(400).json({ success: false, message: "Required fields missing" });
//     }
//     if (toMin(timeFrom) >= toMin(timeTo)) {
//       return res.status(400).json({ success: false, message: "timeFrom must be earlier than timeTo" });
//     }

//     // 2) existence checks (optional but nice)
//     // const [cls, sec, subj, teacher] = await Promise.all([
//     //   Class.findById(classId),
//     //   Section.findById(sectionId),
//     //   Subject.findById(subjectId),
//     //   Staff.findById(teacherId),
//     // ]);
//     // if (!cls) return res.status(404).json({ success: false, message: "Class not found" });
//     // if (!sec) return res.status(404).json({ success: false, message: "Section not found" });
//     // if (!subj) return res.status(404).json({ success: false, message: "Subject not found" });
//     // if (!teacher) return res.status(404).json({ success: false, message: "Teacher (staff) not found" });
//     // if (teacher.personalInfo?.role !== "Teacher") {
//     //   return res.status(400).json({ success: false, message: "Selected staff is not a Teacher" });
//     // }

//     // 3) validate subject group ↔ class/section/subject
//     const group = await SubjectGroup.findById(subjectGroupId);
//     if (!group) return res.status(404).json({ success: false, message: "Subject Group not found" });

//     // group.classes is a single Class ref; sections is an array; subjects is an array
//     if (String(group.classes) !== String(classId)) {
//       return res.status(400).json({ success: false, message: "Subject Group does not belong to this Class" });
//     }
//     if (!group.sections.map(String).includes(String(sectionId))) {
//       return res.status(400).json({ success: false, message: "Section is not part of this Subject Group" });
//     }
//     if (!group.subjects.map(String).includes(String(subjectId))) {
//       return res.status(400).json({ success: false, message: "Subject is not in this Subject Group" });
//     }

//     // 4) validate teacher is assigned to class+section
//     const assignment = await AssignTeacher.findOne({ class: classId, section: sectionId });
//     if (!assignment) {
//       return res.status(400).json({ success: false, message: "No teachers assigned for this class & section" });
//     }
//     if (!assignment.teachers.map(String).includes(String(teacherId))) {
//       return res.status(400).json({ success: false, message: "Teacher is not assigned to this class & section" });
//     }

//     // 5) clash checks
//     const start = toMin(timeFrom), end = toMin(timeTo);

//     // (a) class+section clash on same day
//     const classClashes = await Timetable.find({ class: classId, section: sectionId, day });
//     const hasClassClash = classClashes.some(tt => {
//       const existingStart = toMin(tt.timeFrom);
//       const existingEnd = toMin(tt.timeTo);
//       return (start < existingEnd) && (end > existingStart); // <-- UPDATED
//     });
//     if (hasClassClash) {
//       return res.status(409).json({ success: false, message: "Time overlaps with another period for this class/section" });
//     }

//     // (b) teacher clash on same day
//     const teacherClashes = await Timetable.find({ teacher: teacherId, day });
//     const hasTeacherClash = teacherClashes.some(tt => {
//       const existingStart = toMin(tt.timeFrom);
//       const existingEnd = toMin(tt.timeTo);
//       return (start < existingEnd) && (end > existingStart); // <-- UPDATED
//     });
//     if (hasTeacherClash) {
//       return res.status(409).json({ success: false, message: "Teacher has another class at this time" });
//     }

//     // 6) create
//     const created = await Timetable.create({
//       class: classId,
//       section: sectionId,
//       subjectGroup: subjectGroupId,
//       day,
//       subject: subjectId,
//       teacher: teacherId,
//       timeFrom,
//       timeTo,
//       roomNo,
//     });
//     console.log("created Class: ", created);
//     const populated = await Timetable.findById(created._id)
//       .populate("class", "name")
//       .populate("section", "name")
//       .populate("subjectGroup", "name")
//       .populate("subject", "subjectName subjectCode type")
//       .populate("teacher", "personalInfo.name personalInfo.staffId personalInfo.department");

//     res.status(201).json({ success: true, message: "Timetable entry created", data: populated });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };


exports.createTimetableEntry = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    console.log("Request body:", req.body);
    const {
      class: classId,
      section: sectionId,
      subjectGroupId,
      day,
      subject: subjectId,
      teacher: teacherId,
      timeFrom,
      timeTo,
      roomNo,
    } = req.body;

    console.log("Extracted values:", {
      classId, sectionId, subjectGroupId, day, subjectId, teacherId, timeFrom, timeTo, roomNo
    });

    console.log("step", 16)
    // 1) basic validation
    if (
      !classId || !sectionId || !subjectGroupId || !day ||
      !subjectId || !teacherId || !timeFrom || !timeTo
    ) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }
    console.log("step", 15)
    if (toMin(timeFrom) >= toMin(timeTo)) {
      return res.status(400).json({ success: false, message: "timeFrom must be earlier than timeTo" });
    }
    console.log("step", 14)
    // 1b) tenant-owned reference checks
    if (!(await findOwnedClass(classId, schoolId))) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }
    if (!(await findOwnedSection(sectionId, schoolId))) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }
    if (!(await findOwnedSubject(subjectId, schoolId))) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }
    if (!(await findOwnedStaff(teacherId, schoolId))) {
      return res.status(404).json({ success: false, message: "Teacher (staff) not found" });
    }

    // 2) validate subject group ↔ class/section/subject (TEMPORARILY DISABLED FOR TESTING)
    console.log("WARNING: Subject group validation is disabled for testing");
    console.log("This allows timetable creation without strict subject group validation");

    // TODO: Re-enable this validation once subject group system is properly set up
    /*
    const group = await SubjectGroup.findById(subjectGroupId);
    console.log("Subject group found:", group);
    if (!group) return res.status(404).json({ success: false, message: "Subject Group not found" });

    console.log("step", 13)
    console.log("Group classes:", String(group.classes));
    console.log("Class ID:", String(classId));
    if (String(group.classes) !== String(classId)) {
      return res.status(400).json({ success: false, message: "Subject Group does not belong to this Class" });
    }
    console.log("Group sections:", group.sections.map(String));
    console.log("Section ID:", String(sectionId));
    if (!group.sections.map(String).includes(String(sectionId))) {
      console.log("Section not found in group. Available sections:", group.sections.map(String));
      return res.status(400).json({ success: false, message: "Section is not part of this Subject Group" });
    }
    console.log("step", 12)
    console.log("Group subjects:", group.subjects.map(String));
    console.log("Subject ID:", String(subjectId));
    if (!group.subjects.map(String).includes(String(subjectId))) {
      console.log("Subject not found in group. Available subjects:", group.subjects.map(String));
      return res.status(400).json({ success: false, message: "Subject is not in this Subject Group" });
    }
    */

    console.log("step", 11)
    // 3) validate teacher is assigned to class+section (TEMPORARILY DISABLED FOR TESTING)
    console.log("WARNING: Teacher assignment validation is disabled for testing");
    console.log("This allows timetable creation without strict teacher assignment validation");

    // TODO: Re-enable this validation once teacher assignment system is properly set up
    /*
    const assignment = await AssignTeacher.findOne({ class: classId, section: sectionId });
    console.log("Assignment found:", assignment);
    if (!assignment) {
      console.log("No assignment found for class:", classId, "section:", sectionId);
      return res.status(400).json({ success: false, message: "No teachers assigned for this class & section" });
    }
    console.log("step", 10)
    console.log("Assignment teachers:", assignment.teachers.map(String));
    console.log("Teacher ID to check:", String(teacherId));
    if (!assignment.teachers.map(String).includes(String(teacherId))) {
      console.log("Teacher not found in assignment. Available teachers:", assignment.teachers.map(String));
      return res.status(400).json({ success: false, message: "Teacher is not assigned to this class & section" });
    }
    */

    console.log("step", 9)
    // 4) clash checks (TEMPORARILY DISABLED FOR TESTING)
    console.log("WARNING: Time clash checks are disabled for testing");
    console.log("This allows overlapping timetable entries to be created");

    // TODO: Re-enable these checks once the system is stable
    /*
    const start = toMin(timeFrom), end = toMin(timeTo);

    console.log("step", 8)
    // (a) Class+Section clash on same day
    const classClashes = await Timetable.find({ class: classId, section: sectionId, day });
    const hasClassClash = classClashes.some(tt =>
      (start < toMin(tt.timeTo)) && (end > toMin(tt.timeFrom))
    );
    console.log("step", 7)
    if (hasClassClash) {
      return res.status(409).json({ success: false, message: "Time overlaps with another period for this class/section" });
    }
    console.log("step", 6)

    // (b) Teacher clash on same day
    const teacherClashes = await Timetable.find({ teacher: teacherId, day });
    const hasTeacherClash = teacherClashes.some(tt =>
      (start < toMin(tt.timeTo)) && (end > toMin(tt.timeFrom))
    );
    console.log("step", 5)
    if (hasTeacherClash) {
      return res.status(409).json({ success: false, message: "Teacher has another class at this time" });
    }

    console.log("step", 4)
    // (c) Room clash on same day (only if roomNo is provided)
    if (roomNo && roomNo.trim() !== "") {
      const roomClashes = await Timetable.find({ roomNo, day });
      const hasRoomClash = roomClashes.some(tt =>
        (start < toMin(tt.timeTo)) && (end > toMin(tt.timeFrom))
      );
      console.log("step", 3)
      if (hasRoomClash) {
        return res.status(409).json({ success: false, message: "Room is already occupied at this time" });
      }
    }
    */

    console.log("step", 2)
    // (d) Prevent exact duplicate entry (TEMPORARILY DISABLED FOR TESTING)
    console.log("WARNING: Duplicate check is disabled for testing");
    console.log("This allows multiple timetable entries to be created");

    // TODO: Re-enable this check once the system is stable
    /*
    const duplicateQuery = {
      class: classId,
      section: sectionId,
      day,
      subject: subjectId,
      teacher: teacherId,
      timeFrom,
      timeTo
    };
    
    // Only include roomNo in duplicate check if it's provided
    if (roomNo && roomNo.trim() !== "") {
      duplicateQuery.roomNo = roomNo;
    }
    
    console.log("Duplicate query:", duplicateQuery);
    const duplicate = await Timetable.findOne(duplicateQuery);
    console.log("duplicate found:", duplicate)
    if (duplicate) {
      return res.status(409).json({ success: false, message: "This timetable entry already exists" });
    }
    */

    // 5) create
    console.log("Creating timetable entry with data:", {
      class: classId,
      section: sectionId,
      subjectGroup: subjectGroupId,
      day,
      subject: subjectId,
      teacher: teacherId,
      timeFrom,
      timeTo,
      roomNo,
    });

    const created = await Timetable.create({
      class: classId,
      section: sectionId,
      subjectGroup: subjectGroupId,
      day,
      subject: subjectId,
      teacher: teacherId,
      timeFrom,
      timeTo,
      roomNo,
    });

    console.log("Timetable entry created successfully:", created);

    const populated = await Timetable.findById(created._id)
      .populate({ path: "class", match: { schoolId }, select: "name" })
      .populate({ path: "section", match: { schoolId }, select: "name" })
      .populate("subjectGroup", "name")
      .populate({ path: "subject", match: { schoolId }, select: "subjectName subjectCode type" })
      .populate({ path: "teacher", match: { schoolId }, select: "personalInfo.name personalInfo.staffId personalInfo.department" });

    console.log("Populated timetable entry:", populated);
    res.status(201).json({ success: true, message: "Timetable entry created", data: populated });
  } catch (error) {
    console.error("Error creating timetable:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// GET timetable entries
// GET timetable entries
exports.getTimetableEntries = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const { classId, sectionId, teacherId } = req.query;

    let filter = {};

    // Teacher timetable
    if (teacherId) {
      if (!(await findOwnedStaff(teacherId, schoolId))) {
        return res.status(200).json({
          success: true,
          message: "Timetable entries fetched successfully",
          data: [],
        });
      }
      filter.teacher = teacherId;
    } else if (req.user && req.user.role === 'student') {
      // RBAC: If student, get their classId and sectionId
      const student = await Student.findOne({ _id: req.user.refId, schoolId }).select("personalInfo.class personalInfo.section");
      if (student && student.personalInfo) {
        filter.class = student.personalInfo.class;
        filter.section = student.personalInfo.section;
      }
    } else if (req.user && req.user.role === 'parent') {
      // RBAC: If parent, get their child's classId and sectionId
      const parent = await Parent.findOne({ _id: req.user.refId, schoolId }).populate({ path: "children", match: { schoolId } });
      const childId = req.query.studentId;
      if (parent && childId) {
        const child = parent.children.find(c => c._id.toString() === childId);
        if (child && child.personalInfo) {
          filter.class = child.personalInfo.class;
          filter.section = child.personalInfo.section;
        }
      } else if (parent && parent.children && parent.children.length > 0) {
        filter.class = parent.children[0].personalInfo?.class;
        filter.section = parent.children[0].personalInfo?.section;
      }
    } else if (classId && sectionId) {
      // Manual filter for admin/staff
      filter.class = classId;
      filter.section = sectionId;
    }

    const [schoolClassIds, schoolSectionIds] = await Promise.all([
      getSchoolClassIds(schoolId),
      getSchoolSectionIds(schoolId),
    ]);
    filter.$and = [
      { class: { $in: schoolClassIds } },
      { section: { $in: schoolSectionIds } },
    ];

    const timetables = await Timetable.find(filter)
      .populate({ path: "class", match: { schoolId }, select: "name" })
      .populate({ path: "section", match: { schoolId }, select: "name" })
      .populate("subjectGroup", "name")
      .populate({ path: "subject", match: { schoolId }, select: "subjectName subjectCode type" })
      .populate(
        { path: "teacher", match: { schoolId }, select: "personalInfo.name personalInfo.staffId personalInfo.department" }
      )
      .sort({ day: 1, timeFrom: 1 });

    console.log(
      "Fetched timetables for debugging:",
      timetables.length,
      "entries"
    );

    if (timetables.length > 0) {
      console.log(
        "First timetable teacher data:",
        timetables[0].teacher
      );
    }

    res.status(200).json({
      success: true,
      message: "Timetable entries fetched successfully",
      data: timetables,
    });
  } catch (error) {
    console.error("Error fetching timetables:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Debug endpoint to check data relationships
exports.debugTimetableData = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const { classId, sectionId, subjectGroupId, teacherId, subjectId } = req.query;

    const debug = {};

    // Check subject group
    if (subjectGroupId) {
      const group = await SubjectGroup.findById(subjectGroupId);
      if (group && !(await findOwnedClass(group.classes, schoolId))) {
        return res.status(404).json({ success: false, message: "Subject Group not found" });
      }
      debug.subjectGroup = {
        found: !!group,
        data: group ? {
          name: group.name,
          classes: group.classes,
          sections: group.sections,
          subjects: group.subjects
        } : null
      };
    }

    // Check teacher assignment
    if (classId && sectionId) {
      if (!(await findOwnedClass(classId, schoolId))) {
        return res.status(404).json({ success: false, message: "Class not found" });
      }
      if (!(await findOwnedSection(sectionId, schoolId))) {
        return res.status(404).json({ success: false, message: "Section not found" });
      }
      if (teacherId && !(await findOwnedStaff(teacherId, schoolId))) {
        return res.status(404).json({ success: false, message: "Teacher (staff) not found" });
      }
      if (subjectId && !(await findOwnedSubject(subjectId, schoolId))) {
        return res.status(404).json({ success: false, message: "Subject not found" });
      }
      const assignment = await AssignTeacher.findOne({ class: classId, section: sectionId });
      debug.teacherAssignment = {
        found: !!assignment,
        data: assignment ? {
          class: assignment.class,
          section: assignment.section,
          teachers: assignment.teachers,
          classTeacher: assignment.classTeacher
        } : null
      };
    }

    // Check existing timetables
    if (classId && sectionId) {
      const existingTimetables = await Timetable.find({ class: classId, section: sectionId });
      debug.existingTimetables = {
        count: existingTimetables.length,
        data: existingTimetables.map(tt => ({
          day: tt.day,
          timeFrom: tt.timeFrom,
          timeTo: tt.timeTo,
          subject: tt.subject,
          teacher: tt.teacher,
          roomNo: tt.roomNo
        }))
      };
    }

    res.status(200).json({
      success: true,
      message: "Debug data retrieved",
      debug
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// UPDATE timetable entry
exports.updateTimetableEntry = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    console.log("Update request ID:", req.params.id);
    console.log("Update body:", req.body);

    // ID validation
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timetable ID format",
      });
    }

    const {
      class: classId,
      section: sectionId,
      subjectGroupId,
      day,
      subject: subjectId,
      teacher: teacherId,
      timeFrom,
      timeTo,
      roomNo,
    } = req.body;

    // basic validation (same as create)
    if (
      !classId ||
      !sectionId ||
      !subjectGroupId ||
      !day ||
      !subjectId ||
      !teacherId ||
      !timeFrom ||
      !timeTo
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    if (toMin(timeFrom) >= toMin(timeTo)) {
      return res.status(400).json({
        success: false,
        message: "timeFrom must be earlier than timeTo",
      });
    }

    const target = await Timetable.findById(req.params.id);
    if (!target || !(await findOwnedClass(target.class, schoolId))) {
      return res.status(404).json({
        success: false,
        message: "Timetable entry not found",
      });
    }

    if (!(await findOwnedClass(classId, schoolId))) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }
    if (!(await findOwnedSection(sectionId, schoolId))) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }
    if (!(await findOwnedSubject(subjectId, schoolId))) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }
    if (!(await findOwnedStaff(teacherId, schoolId))) {
      return res.status(404).json({ success: false, message: "Teacher (staff) not found" });
    }

    const updated = await Timetable.findByIdAndUpdate(
      req.params.id,
      {
        class: classId,
        section: sectionId,
        subjectGroup: subjectGroupId,
        day,
        subject: subjectId,
        teacher: teacherId,
        timeFrom,
        timeTo,
        roomNo,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Timetable entry not found",
      });
    }

    const populated = await Timetable.findById(updated._id)
      .populate({ path: "class", match: { schoolId }, select: "name" })
      .populate({ path: "section", match: { schoolId }, select: "name" })
      .populate("subjectGroup", "name")
      .populate({ path: "subject", match: { schoolId }, select: "subjectName subjectCode type" })
      .populate(
        { path: "teacher", match: { schoolId }, select: "personalInfo.name personalInfo.staffId personalInfo.department" }
      );

    res.status(200).json({
      success: true,
      message: "Timetable entry updated successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Update timetable error:", error);
    res.status(500).json({
      success: false,
      message: "Update failed",
      error: error.message,
    });
  }
};
// Delete timetable entry
exports.deleteTimetableEntry = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    console.log("Delete request for timetable ID:", req.params.id);

    // Validate ID format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timetable ID format"
      });
    }

    const target = await Timetable.findById(req.params.id);
    if (!target || !(await findOwnedClass(target.class, schoolId))) {
      return res.status(404).json({
        success: false,
        message: "Timetable entry not found"
      });
    }

    const deletedTimetable = await Timetable.findByIdAndDelete(req.params.id);
    console.log("Found timetable to delete:", deletedTimetable);

    if (!deletedTimetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable entry not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Timetable entry deleted successfully",
      data: deletedTimetable
    });
  } catch (err) {
    console.error("Delete timetable error:", err);
    res.status(500).json({
      success: false,
      message: "Delete failed",
      error: err.message
    });
  }
};