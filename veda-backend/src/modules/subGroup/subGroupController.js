const SubjectGroup = require("./subGroupSchema");
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

// SubjectGroup has no schoolId of its own, so every lookup is anchored to the
// Class/Section/Subject documents it references.
const findOwnedClass = (classId, schoolId) => Class.findOne({ _id: classId, schoolId }).select("_id");
const getSchoolClassIds = async (schoolId) => (await Class.find({ schoolId }).select("_id")).map((c) => c._id);

exports.createSubjectGroup = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  const { name, classes, sections, subjects } = req.body;

  try {
    //  Validate input
    if (!name || !classes || !sections || !subjects) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing (name, classes, sections, subjects)",
      });
    }

    // Validate Class
    const classDoc = await findOwnedClass(classes, schoolId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // Validate Sections
    const sectionDocs = await Section.find({ _id: { $in: sections }, schoolId });
    if (sectionDocs.length !== sections.length) {
      return res.status(404).json({
        success: false,
        message: "Some sections not found",
      });
    }

    // Validate Subjects
    const subjectDocs = await Subject.find({ _id: { $in: subjects }, schoolId });
    if (subjectDocs.length !== subjects.length) {
      return res.status(404).json({
        success: false,
        message: "Some subjects not found",
      });
    }

    // prevent duplicate subject group from creating 
    const existingGroup = await SubjectGroup.findOne({
      classes: classes,
      sections: { $all: sections, $size: sections.length }, // ensure exact match of sections
    });

    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: "A subject group with the same class, and section(s) already exists",
      });
    }

    //Create Subject Group
    const newSubGroup = await SubjectGroup.create({
      name,
      classes,
      sections,
      subjects,
    });

    // Re-fetch with populated details
    const data = await SubjectGroup.findById(newSubGroup._id)
      .populate({ path: "classes", match: { schoolId }, select: "name" })        // get class name
      .populate({ path: "sections", match: { schoolId }, select: "name" })       // get section names
      .populate({ path: "subjects", match: { schoolId }, select: "subjectName subjectCode" }); // get subject details

    res.status(201).json({
      success: true,
      message: "Subject group created successfully",
      data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

exports.getAllSubjectGroups = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const subjectGroups = await SubjectGroup.find({ classes: { $in: await getSchoolClassIds(schoolId) } })
      .populate({ path: "classes", match: { schoolId }, select: "name" })       // only return class name
      .populate({ path: "sections", match: { schoolId }, select: "name" })      // only return section name
      .populate({ path: "subjects", match: { schoolId }, select: "subjectName subjectCode type" }) // return subject details
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subjectGroups.length,
      data: subjectGroups,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

exports.updateSubjectGroup = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  const { name, classes, sections, subjects } = req.body;

  try {
    // Validate input
    if (!name || !classes || !sections || !subjects) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing (name, classes, sections, subjects)",
      });
    }

    const target = await SubjectGroup.findById(req.params.id);
    if (!target || !(await findOwnedClass(target.classes, schoolId))) {
      return res.status(404).json({ success: false, message: "Subject Group not found" });
    }

    // Validate Class
    const classDoc = await findOwnedClass(classes, schoolId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // Validate Sections
    const sectionDocs = await Section.find({ _id: { $in: sections }, schoolId });
    if (sectionDocs.length !== sections.length) {
      return res.status(404).json({
        success: false,
        message: "Some sections not found",
      });
    }

    // Validate Subjects
    const subjectDocs = await Subject.find({ _id: { $in: subjects }, schoolId });
    if (subjectDocs.length !== subjects.length) {
      return res.status(404).json({
        success: false,
        message: "Some subjects not found",
      });
    }

    const updatedSubjectGroup = await SubjectGroup.findByIdAndUpdate(
      req.params.id, 
      { name, classes, sections, subjects }, 
      {
        new: true,
        runValidators: true,
      }
    ).populate({ path: "classes", match: { schoolId }, select: "name" })
     .populate({ path: "sections", match: { schoolId }, select: "name" })
     .populate({ path: "subjects", match: { schoolId }, select: "subjectName subjectCode" });

    if (!updatedSubjectGroup) {
      return res.status(404).json({ success: false, message: "Subject Group not found" });
    }

    res.status(200).json({
      success: true,
      message: "SubjectGroup updated successfully",
      data: updatedSubjectGroup,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: "Update failed", error: err.message });
  }
};
// GET subject group by ID (with subjects)
exports.getSubjectGroupById = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const group = await SubjectGroup.findById(req.params.id)
      .populate({ path: "subjects", match: { schoolId }, select: "subjectName subjectCode" });

    if (!group || !(await findOwnedClass(group.classes, schoolId))) {
      return res.status(404).json({
        success: false,
        message: "Subject group not found",
      });
    }

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch subject group",
      error: err.message,
    });
  }
};
exports.deleteSubjectGroup = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid ID format" 
      });
    }

    const target = await SubjectGroup.findById(req.params.id);
    if (!target || !(await findOwnedClass(target.classes, schoolId))) {
      return res.status(404).json({ success: false, message: "SubjectGroup not found" });
    }
    
    const deleteSubjectGroup = await SubjectGroup.findByIdAndDelete(req.params.id);

    if (!deleteSubjectGroup) {
      return res.status(404).json({ success: false, message: "SubjectGroup not found" });
    }

    res.status(200).json({
      success: true,
      message: "SubjectGroup deleted successfully",
    });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, message: "Delete failed", error: err.message });
  }
};
