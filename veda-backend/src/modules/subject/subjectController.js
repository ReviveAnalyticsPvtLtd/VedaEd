const mongoose = require('mongoose');
const Subject = require('./subjectSchema');
const Student = require("../student/studentModels");
const Parent = require("../parents/parentModel");
const Class = require("../class/classSchema");
const Section = require("../section/sectionSchema");
const Curriculum = require("../curriculum/curriculumModel");

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

// SubjectGroup and Curriculum carry no schoolId of their own, so the only safe
// way to reach them is through a Class/Section that is proven to be in-school.
const findOwnedClass = (classId, schoolId) =>
  Class.findOne({ _id: classId, schoolId }).select("_id");

const findOwnedSection = (sectionId, schoolId) =>
  Section.findOne({ _id: sectionId, schoolId }).select("_id");

// Mongoose and MongoDB bury the real cause inside err.message (for example an
// E11000 blob naming an index). Those helpers turn the failures a caller can
// actually act on into a specific message, so a rejected save is never reported
// as a bare "Invalid data".
// Only the discriminating field is named. `schoolId` is deliberately absent: it
// leads the compound index, so matching on it would shadow subjectCode and blame
// the school for what is always a code collision.
const DUPLICATE_MESSAGES = {
  subjectCode:
    "Another subject in your school already uses this subject code. Please use a different subject name.",
};

const describeDuplicate = (err) => {
  // The unique index is compound, so keyPattern lists every field in it. Later
  // fields are the narrower scope, so they are checked first.
  const fields = Object.keys(err.keyPattern || err.keyValue || {}).reverse();
  for (const field of fields) {
    if (DUPLICATE_MESSAGES[field]) return DUPLICATE_MESSAGES[field];
  }
  return "A subject with these details already exists in your school.";
};

const describeValidation = (err) => {
  const first = Object.values(err.errors || {})[0];
  if (first?.message) return first.message;
  if (err.name === "CastError") return `Invalid value for ${err.path}.`;
  return "Subject validation failed.";
};

// 409 for a duplicate, 400 for a rejected payload, 500 for anything unexpected.
// Anything still unclassified is logged, since its detail is no longer returned.
const sendSubjectError = (res, err, fallbackMessage) => {
  if (err?.code === 11000) {
    return res.status(409).json({ success: false, message: describeDuplicate(err) });
  }
  if (err?.name === "ValidationError" || err?.name === "CastError") {
    return res.status(400).json({ success: false, message: describeValidation(err) });
  }
  console.error("Subject error:", err);
  return res.status(500).json({ success: false, message: fallbackMessage });
};

function generatePrefix(name) {
  return name.substring(0, 3).toUpperCase(); // Math -> MATH, English -> ENG
}

// Generate unique subject code
async function generateSubjectCode(name, schoolId) {
  const prefix = generatePrefix(name);

  // Find last subject with same prefix
  const lastSubject = await Subject.findOne({ subjectCode: new RegExp(`^${prefix}`), schoolId })
    .sort({ createdAt: -1 });

  let newNumber = 101; // start at 101
  if (lastSubject && lastSubject.subjectCode) {
    const match = lastSubject.subjectCode.match(/\d+$/);
    if (match) {
      newNumber = parseInt(match[0]) + 1;
    }
  }

  return `${prefix}${newNumber}`;
}


exports.createSubject = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  let { subjectName, type } = req.body;
  try {
    if (!subjectName || !type)
      return res.status(400).json({
        success: false,
        message: "Subject name and type required",
      })

    //Normalize subjectName (trim + collapse spaces)
    subjectName = subjectName.trim().replace(/\s+/g, " ");

    // Check for duplicate (case-insensitive, normalized)
    const existingSubj = await Subject.findOne({
      subjectName: { $regex: new RegExp("^" + subjectName + "$", "i") },
      type,
      schoolId,
    });

    if (existingSubj) {
      return res.status(400).json({
        success: false,
        message: "Subject with the same name and type already exists",
      });
    }

    const code = await generateSubjectCode(subjectName, schoolId);

    const newSubject = await Subject.create({ subjectName, type, subjectCode: code, schoolId });

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: newSubject,
    });

  } catch (err) {
    return sendSubjectError(res, err, "Could not create subject. Please try again.");
  }
};

exports.getSubjects = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const { classId, studentId, sectionId } = req.query;
    let targetClassId = classId;
    let targetSectionId = sectionId;

    // RBAC: If student, get their classId and sectionId
    if (req.user && req.user.role === 'student') {
      const student = await Student.findOne({ _id: req.user.refId, schoolId }).select("personalInfo.class personalInfo.section");
      targetClassId = student?.personalInfo?.class;
      targetSectionId = student?.personalInfo?.section;
    }

    // RBAC: If parent, get their child's classId and sectionId
    if (req.user && req.user.role === 'parent') {
      const parent = await Parent.findOne({ _id: req.user.refId, schoolId }).populate("children");
      if (studentId) {
        const child = parent.children.find(c => c._id.toString() === studentId);
        targetClassId = child?.personalInfo?.class;
        targetSectionId = child?.personalInfo?.section;
      } else if (parent.children && parent.children.length > 0) {
        targetClassId = parent.children[0]?.personalInfo?.class;
        targetSectionId = parent.children[0]?.personalInfo?.section;
      }
    }

    if (targetClassId) {
      // A client-supplied classId is only a class *filter*. It must not be
      // usable to reach another school's SubjectGroup or Curriculum, so it is
      // verified against the authenticated school before any lookup.
      if (!(await findOwnedClass(targetClassId, schoolId))) {
        return res.status(404).json({ success: false, message: "Class not found" });
      }

      if (targetSectionId && !(await findOwnedSection(targetSectionId, schoolId))) {
        return res.status(404).json({ success: false, message: "Section not found" });
      }

      // 1. Check Subject Group for class/section
      let sgQuery = { classes: targetClassId };
      if (targetSectionId) sgQuery.sections = targetSectionId;
      
      const SubjectGroup = require("../subGroup/subGroupSchema");
      const subjectGroup = await SubjectGroup.findOne(sgQuery).populate("subjects");
      
      if (subjectGroup && subjectGroup.subjects && subjectGroup.subjects.length > 0) {
        return res.status(200).json({
          success: true,
          count: subjectGroup.subjects.length,
          data: subjectGroup.subjects,
        });
      }

      // 2. Check Curriculum
      const curriculum = await Curriculum.findOne({ class: targetClassId }).populate("subjects");
      if (curriculum && curriculum.subjects && curriculum.subjects.length > 0) {
        return res.status(200).json({
          success: true,
          count: curriculum.subjects.length,
          data: curriculum.subjects,
        });
      }
      
      // 3. Return empty if requested for specific class but none found (prevents leaking all subjects)
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // Default or for staff: return all subjects if no class filter
    const subjects = await Subject.find({ schoolId }).sort({ createdAt: -1 });

    if (!subjects || subjects.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

exports.updateSubject = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    // A client-supplied schoolId must never move a subject between schools.
    const { schoolId: _ignored, ...safeBody } = req.body || {};
    const updatedSubject = await Subject.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { ...safeBody },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedSubject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: updatedSubject,
    });
  } catch (err) {
    return sendSubjectError(res, err, "Could not update subject. Please try again.");
  }
};

exports.deleteSubject = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    console.log("Delete request for Subject ID:", req.params.id);

    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format"
      });
    }

    const deletedSubject = await Subject.findOneAndDelete({ _id: req.params.id, schoolId });
    console.log("Found subject to delete:", deletedSubject);

    if (!deletedSubject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, message: "Delete failed", error: err.message });
  }
};
