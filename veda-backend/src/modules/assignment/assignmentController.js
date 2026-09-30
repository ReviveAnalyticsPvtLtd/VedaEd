const Assignment = require("./assignment.js");
const Student = require("../student/studentModels");
const AssignTeacher = require("../assignTeachersToClass/assignTeacherSchema");
const Parent = require("../parents/parentModel");
const fs = require("fs");
const path = require("path");
const { uploadsDir } = require("../../middleware/upload");
const Class = require("../class/classSchema");
const Section = require("../section/sectionSchema");
const Subject = require("../subject/subjectSchema");
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

// Assignment has no schoolId of its own, so every lookup is anchored to the
// Class/Section/Subject/Student documents it references.
const findOwnedClass = (classId, schoolId) => Class.findOne({ _id: classId, schoolId }).select("_id");
const findOwnedSection = (sectionId, schoolId) => Section.findOne({ _id: sectionId, schoolId }).select("_id");
const findOwnedSubject = (subjectId, schoolId) => Subject.findOne({ _id: subjectId, schoolId }).select("_id");
const getSchoolClassIds = async (schoolId) => (await Class.find({ schoolId }).select("_id")).map((c) => c._id);
const getSchoolSectionIds = async (schoolId) => (await Section.find({ schoolId }).select("_id")).map((s) => s._id);

exports.createAssignment = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    console.log('=== ASSIGNMENT CREATION START ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Request headers:', req.headers);

    const { classId, sectionId, subjectId, title, description, assignmentType, dueDate, teacherId } = req.body;

    console.log('Extracted fields:', {
      classId, sectionId, subjectId, title, description, assignmentType, dueDate, teacherId
    });

    // Validate required fields
    if (!classId || !sectionId || !subjectId || !title || !dueDate) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: "Missing required fields: classId, sectionId, subjectId, title, and dueDate are required",
        received: { classId, sectionId, subjectId, title, dueDate }
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

    const resolvedTeacherId = req.user?.role === "teacher" ? req.user.refId : teacherId;

    console.log('Creating assignment object...');
    const assignment = new Assignment({
      class: classId,
      section: sectionId,
      subject: subjectId,
      teacher: resolvedTeacherId || undefined, // For teachers, always use JWT refId
      title,
      description,
      assignmentType,
      dueDate,
      document: req.file ? `/uploads/${req.file.filename}` : null,
    });

    console.log('Assignment object created:', assignment);
    console.log('Saving to database...');

    await assignment.save();
    console.log('Assignment saved successfully with ID:', assignment._id);

    // Populate the assignment with related data
    console.log('Populating assignment data...');
    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate({ path: "class", match: { schoolId }, select: "name" })
      .populate({ path: "section", match: { schoolId }, select: "name" })
      .populate({ path: "subject", match: { schoolId }, select: "subjectName subjectCode" })
      .populate({ path: "teacher", match: { schoolId }, select: "personalInfo.name name" });

    console.log('Populated assignment:', populatedAssignment);
    console.log('=== ASSIGNMENT CREATION SUCCESS ===');

    res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      assignment: populatedAssignment
    });
  } catch (err) {
    console.error('=== ASSIGNMENT CREATION ERROR ===');
    console.error('Error details:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('=== END ERROR ===');

    res.status(500).json({
      success: false,
      message: "Error creating assignment",
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.getAssignments = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const { status, classId, subjectId, studentId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (classId) {
      if (!(await findOwnedClass(classId, schoolId))) {
        return res.status(404).json({ success: false, message: "Class not found" });
      }
      filter.class = classId;
    }
    if (subjectId) {
      if (!(await findOwnedSubject(subjectId, schoolId))) {
        return res.status(404).json({ success: false, message: "Subject not found" });
      }
      filter.subject = subjectId;
    }

    // RBAC: If teacher, return only assignments created by logged-in teacher
    if (req.user && req.user.role === "teacher") {
      filter.teacher = req.user.refId;
    }

    // RBAC: If student, filter by their class, section, and allotted teachers
    if (req.user && req.user.role === 'student') {
      const student = await Student.findOne({ _id: req.user.refId, schoolId }).select("personalInfo.class personalInfo.section");
      if (student && student.personalInfo?.class && student.personalInfo?.section) {
        filter.class = student.personalInfo.class;
        filter.section = student.personalInfo.section;

        const assigned = await AssignTeacher.findOne({
          class: filter.class,
          section: filter.section
        });
        if (assigned && assigned.teachers && assigned.teachers.length > 0) {
          filter.$or = [
            { teacher: { $in: assigned.teachers } },
            { teacher: { $exists: false } },
            { teacher: null }
          ];
        }
      } else {
        return res.json([]);
      }
    }

    // RBAC: If parent, filter by their children's class, section, and allotted teachers
    if (req.user && req.user.role === 'parent') {
      const parent = await Parent.findOne({ _id: req.user.refId, schoolId }).populate({ path: "children", match: { schoolId } });
      if (parent && parent.children && parent.children.length > 0) {
        let targets = [];
        
        if (studentId) {
          const child = parent.children.find(c => c._id.toString() === studentId);
          if (child && child.personalInfo?.class && child.personalInfo?.section) {
            targets.push({ class: child.personalInfo.class, section: child.personalInfo.section });
          }
        } else {
          targets = parent.children
            .filter(c => c.personalInfo?.class && c.personalInfo?.section)
            .map(c => ({ class: c.personalInfo.class, section: c.personalInfo.section }));
        }

        if (targets.length > 0) {
          const orConditions = await Promise.all(targets.map(async (t) => {
            const assigned = await AssignTeacher.findOne({ class: t.class, section: t.section });
            const teachers = assigned?.teachers || [];
            
            const teacherFilter = teachers.length > 0 ? {
              $or: [
                { teacher: { $in: teachers } },
                { teacher: { $exists: false } },
                { teacher: null }
              ]
            } : {};

            return {
              class: t.class,
              section: t.section,
              ...teacherFilter
            };
          }));
          filter.$or = orConditions;
        } else {
          return res.json([]);
        }
      } else {
        return res.json([]);
      }
    }

    const [schoolClassIds, schoolSectionIds] = await Promise.all([
      getSchoolClassIds(schoolId),
      getSchoolSectionIds(schoolId),
    ]);
    filter.$and = [
      { class: { $in: schoolClassIds } },
      { section: { $in: schoolSectionIds } },
    ];

    const assignments = await Assignment.find(filter)
      .populate({ path: "class", match: { schoolId }, select: "name" })
      .populate({ path: "section", match: { schoolId }, select: "name" })
      .populate({ path: "subject", match: { schoolId }, select: "subjectName subjectCode" })
      .populate({ path: "teacher", match: { schoolId }, select: "personalInfo.name name" })
      .populate({ path: "submissions.student", match: { schoolId }, select: "personalInfo.name" })
      .sort({ createdAt: -1 });

    // Scope submissions so students/parents only see their own (child's) submissions
    if (req.user?.role === "student") {
      const studentId = String(req.user.refId || "");
      assignments.forEach((a) => {
        a.submissions = (a.submissions || []).filter(
          (s) => String(s.student?._id || s.student) === studentId
        );
      });
    } else if (req.user?.role === "parent") {
      const parent = await Parent.findOne({ _id: req.user.refId, schoolId }).populate({ path: "children", match: { schoolId } });
      const childIds = (parent?.children || []).map((c) => String(c._id));
      assignments.forEach((a) => {
        a.submissions = (a.submissions || []).filter((s) =>
          childIds.includes(String(s.student?._id || s.student))
        );
      });
    }

    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: "Error fetching assignments", error: err.message });
  }
};

exports.getAssignmentById = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const raw = await Assignment.findById(req.params.id).select("class");
    if (!raw || !(await findOwnedClass(raw.class, schoolId))) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const assignment = await Assignment.findById(req.params.id)
      .populate({ path: "class", match: { schoolId }, select: "name" })
      .populate({ path: "section", match: { schoolId }, select: "name" })
      .populate({ path: "subject", match: { schoolId }, select: "subjectName subjectCode" })
      .populate({ path: "teacher", match: { schoolId }, select: "personalInfo.name name" })
      .populate({ path: "submissions.student", match: { schoolId }, select: "personalInfo.name" });

    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    // Students should only ever see their own submission for an assignment
    if (req.user?.role === "student") {
      const studentId = String(req.user.refId || "");
      assignment.submissions = (assignment.submissions || []).filter(
        (s) => String(s.student?._id || s.student) === studentId
      );
    }

    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: "Error fetching assignment", error: err.message });
  }
};

exports.updateAssignment = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const {
      classId,
      sectionId,
      subjectId,
      title,
      description,
      assignmentType,
      dueDate,
      status,
    } = req.body;

    const target = await Assignment.findById(req.params.id).select("class");
    if (!target || !(await findOwnedClass(target.class, schoolId))) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    if (classId && !(await findOwnedClass(classId, schoolId))) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }
    if (sectionId && !(await findOwnedSection(sectionId, schoolId))) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }
    if (subjectId && !(await findOwnedSubject(subjectId, schoolId))) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    const updatePayload = {};

    if (classId) updatePayload.class = classId;
    if (sectionId) updatePayload.section = sectionId;
    if (subjectId) updatePayload.subject = subjectId;
    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (assignmentType !== undefined) updatePayload.assignmentType = assignmentType;
    if (dueDate !== undefined) updatePayload.dueDate = dueDate;
    if (status !== undefined) updatePayload.status = status;
    if (req.file) updatePayload.document = `/uploads/${req.file.filename}`;

    const updated = await Assignment.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Assignment not found" });

    const populatedAssignment = await Assignment.findById(updated._id)
      .populate({ path: "class", match: { schoolId }, select: "name" })
      .populate({ path: "section", match: { schoolId }, select: "name" })
      .populate({ path: "subject", match: { schoolId }, select: "subjectName subjectCode" })
      .populate({ path: "teacher", match: { schoolId }, select: "personalInfo.name name" });

    res.status(200).json({ success: true, assignment: populatedAssignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteAssignment = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const target = await Assignment.findById(req.params.id).select("class");
    if (!target || !(await findOwnedClass(target.class, schoolId))) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const deleted = await Assignment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Assignment not found" });

    res.json({ message: "Assignment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting assignment", error: err.message });
  }
};

exports.getStudentAssignments = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    // Class/section are resolved from the school-scoped student record, never
    // from the token payload.
    const student = await Student.findOne({ _id: req.user.refId, schoolId })
      .select("personalInfo.class personalInfo.section");

    if (!student || !student.personalInfo?.class || !student.personalInfo?.section) {
      return res.json([]);
    }

    const assignments = await Assignment.find({
      class: student.personalInfo.class,
      section: student.personalInfo.section,
    })
      .populate({ path: "subject", match: { schoolId }, select: "subjectName subjectCode" })
      .populate({ path: "teacher", match: { schoolId }, select: "personalInfo.name name" })
      .sort({ dueDate: 1 });

    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: "Error fetching student assignments", error: err.message });
  }
};

exports.submitAssignment = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    if (!req.user || req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can submit assignments" });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment || !(await findOwnedClass(assignment.class, schoolId))) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const studentId = req.user.refId;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const fileUrl = `/uploads/${req.file.filename}`;
    const submission = {
      student: studentId,
      file: fileUrl,
      submittedAt: new Date(),
      status: new Date() > assignment.dueDate ? "Late" : "Submitted",
    };

    // Replacing an earlier submission by the same student (resubmit)
    const existingIndex = assignment.submissions.findIndex(
      (s) => String(s.student) === String(studentId)
    );
    if (existingIndex >= 0) {
      const old = assignment.submissions[existingIndex];
      if (old && old.file) {
        try { fs.unlinkSync(path.join(uploadsDir, path.basename(old.file))); } catch (e) { console.warn("Could not delete old file:", e.message); }
      }
      assignment.submissions[existingIndex] = submission;
    } else {
      assignment.submissions.push(submission);
    }

    await assignment.save();

    const populated = await Assignment.findById(assignment._id).populate({
      path: "submissions.student",
      match: { schoolId },
      select: "personalInfo.name",
    });

    res.json({ message: "Assignment submitted successfully", assignment: populated });
  } catch (err) {
    res.status(500).json({ message: "Error submitting assignment", error: err.message });
  }
};

exports.deleteSubmission = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    if (!req.user || req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can delete their submission" });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment || !(await findOwnedClass(assignment.class, schoolId))) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const studentId = req.user.refId;
    const before = assignment.submissions.length;
    assignment.submissions = assignment.submissions.filter(
      (s) => String(s.student) !== String(studentId)
    );

    if (assignment.submissions.length === before) {
      return res.status(404).json({ message: "No submission found for this student" });
    }

    await assignment.save();
    res.json({ message: "Submission deleted", assignment });
  } catch (err) {
    res.status(500).json({ message: "Error deleting submission", error: err.message });
  }
};

exports.gradeSubmission = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    if (!req.user || req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can grade submissions" });
    }

    const { marks, grade, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment || !(await findOwnedClass(assignment.class, schoolId))) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const submission = assignment.submissions.id(req.params.submissionId);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    if (marks !== undefined) submission.marks = (marks === "" || marks === null) ? null : Number(marks);
    if (grade !== undefined) submission.grade = (grade === "" || grade === null) ? null : grade;
    if (feedback !== undefined) submission.feedback = (feedback === "" || feedback === null) ? null : feedback;

    await assignment.save();
    res.json({ message: "Submission graded", assignment });
  } catch (err) {
    res.status(500).json({ message: "Error grading submission", error: err.message });
  }
};
