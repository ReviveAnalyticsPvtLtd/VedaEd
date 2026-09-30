const AssignTeacher = require("./assignTeacherSchema");
const Class = require("../class/classSchema");
const Section = require("../section/sectionSchema");
const Staff = require("../staff/staffModels");
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

// AssignTeacher has no schoolId of its own, so every lookup is anchored to
// Class/Section/Staff documents that do.
const findOwnedClass = (classId, schoolId) => Class.findOne({ _id: classId, schoolId }).select("_id");
const findOwnedSection = (sectionId, schoolId) => Section.findOne({ _id: sectionId, schoolId }).select("_id");
const getSchoolClassIds = async (schoolId) => (await Class.find({ schoolId }).select("_id")).map((c) => c._id);
const getSchoolSectionIds = async (schoolId) => (await Section.find({ schoolId }).select("_id")).map((s) => s._id);

exports.assignTeachers = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  const { classId, sectionId, teachers, classTeacher } = req.body;
  console.log("AssignTeachers request body:", req.body);
  try {
    if (
      !classId ||
      !sectionId ||
      !teachers ||
      teachers.length === 0 ||
      !classTeacher
    ) {
      console.log("Missing required fields:", { classId, sectionId, teachers, classTeacher });
      return res.status(400).json({
        success: false,
        message: "required fields missing",
      });
    }

    if (!(await findOwnedClass(classId, schoolId))) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    if (!(await findOwnedSection(sectionId, schoolId))) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    console.log("Looking for staff with IDs:", teachers);
    const staffFound = await Staff.find({
      _id: { $in: teachers },
      schoolId,
      "personalInfo.role": "Teacher",
    });
    console.log("Found staff:", staffFound.length, "out of", teachers.length);
    console.log("Staff details:", staffFound.map(s => ({ id: s._id, role: s.personalInfo?.role, name: s.personalInfo?.name })));
    
    if (staffFound.length !== teachers.length) {
      console.log("Some staff members are not valid teachers");
      return res.status(400).json({
        success: false,
        message: "Some staff members are not valid teachers",
      });
    }

    // Ensure class teacher is in teachers list
    if (!teachers.includes(classTeacher)) {
      return res.status(400).json({
        success: false,
        message: "Class Teacher must be one of the assigned teachers",
      });
    }

    // Check if assignment already exists
    const existing = await AssignTeacher.findOne({
      class: classId,
      section: sectionId,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Teachers already assigned to this class & section",
      });
    }

    const newAssignment = await AssignTeacher.create({
      class: classId,
      section: sectionId,
      teachers,
      classTeacher,
    });
    const response = await AssignTeacher.findById(newAssignment._id)
      .populate({ path: "class", match: { schoolId }, select: "name" })
      .populate({ path: "section", match: { schoolId }, select: "name" })
      .populate({ path: "teachers", match: { schoolId }, select: "personalInfo.name personalInfo.staffId" })
      .populate({ path: "classTeacher", match: { schoolId }, select: "personalInfo.name personalInfo.staffId" });

    res.status(201).json({
      success: true,
      message: "Teachers assigned successfully",
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


exports.getAllAssignedTeachers = async (req, res) => {
  try {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    console.log("Getting all assigned teachers...");
    const [classIds, sectionIds] = await Promise.all([
      getSchoolClassIds(schoolId),
      getSchoolSectionIds(schoolId),
    ]);
    const assigned = await AssignTeacher.find({
      class: { $in: classIds },
      section: { $in: sectionIds },
    })
      .populate({ path: "class", match: { schoolId }, select: "name" })
      .populate({ path: "section", match: { schoolId }, select: "name" })
      .populate({ path: "teachers", match: { schoolId }, select: "personalInfo.name personalInfo.staffId" })
      .populate({ path: "classTeacher", match: { schoolId }, select: "personalInfo.name personalInfo.staffId" });

    console.log("Found assigned teachers:", assigned.length);
    console.log("Assigned teachers data:", assigned);

    res.status(200).json({
      success: true,
      count: assigned.length,
      data: assigned,
    });

  } catch (err) {
    console.error("Error getting assigned teachers:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

exports.updateAssignTeacher = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  const { classId, sectionId, teachers, classTeacher } = req.body;
  
  try {
    // Validate required fields
    if (!classId || !sectionId || !teachers || teachers.length === 0 || !classTeacher) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const target = await AssignTeacher.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: "Assigned Teacher not found" });
    }

    if (!(await findOwnedClass(target.class, schoolId))) {
      return res.status(404).json({ success: false, message: "Assigned Teacher not found" });
    }

    if (!(await findOwnedClass(classId, schoolId))) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    if (!(await findOwnedSection(sectionId, schoolId))) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    // Validate teachers are actual teachers
    const staffFound = await Staff.find({
      _id: { $in: teachers },
      schoolId,
      "personalInfo.role": "Teacher",
    });
    
    if (staffFound.length !== teachers.length) {
      return res.status(400).json({
        success: false,
        message: "Some staff members are not valid teachers",
      });
    }

    // Ensure class teacher is in teachers list
    if (!teachers.includes(classTeacher)) {
      return res.status(400).json({
        success: false,
        message: "Class Teacher must be one of the assigned teachers",
      });
    }

    // Check if another assignment exists for the same class and section (excluding current one)
    const existing = await AssignTeacher.findOne({
      class: classId,
      section: sectionId,
      _id: { $ne: req.params.id }
    });
    
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Teachers already assigned to this class & section",
      });
    }

    const updateassignTeacher = await AssignTeacher.findByIdAndUpdate(
      req.params.id, 
      { 
        class: classId,
        section: sectionId,
        teachers,
        classTeacher
      }, 
      {
        new: true,
        runValidators: true,
      }
    ).populate({ path: "class", match: { schoolId }, select: "name" })
     .populate({ path: "section", match: { schoolId }, select: "name" })
     .populate({ path: "teachers", match: { schoolId }, select: "personalInfo.name personalInfo.staffId" })
     .populate({ path: "classTeacher", match: { schoolId }, select: "personalInfo.name personalInfo.staffId" });

    if (!updateassignTeacher) {
      return res.status(404).json({ success: false, message: "Assigned Teacher not found" });
    }

    res.status(200).json({
      success: true,
      message: "Assigned Teacher updated successfully",
      data: updateassignTeacher,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: "Update failed", error: err.message });
  }
};

exports.deleteAssignTeachers = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    console.log("Delete request received for ID:", req.params.id);
    console.log("ID type:", typeof req.params.id);
    
    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("Invalid ObjectId format:", req.params.id);
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    
    const target = await AssignTeacher.findById(req.params.id);
    if (!target || !(await findOwnedClass(target.class, schoolId))) {
      return res.status(404).json({ success: false, message: "Assigned Teacher not found" });
    }

    const deleteassignTeachers = await AssignTeacher.findByIdAndDelete(req.params.id);
    console.log("Delete result:", deleteassignTeachers);

    if (!deleteassignTeachers) {
      console.log("No record found with ID:", req.params.id);
      return res.status(404).json({ success: false, message: "Assigned Teacher not found" });
    }

    res.status(200).json({
      success: true,
      message: "Assigned Teacher deleted successfully",
    });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, message: "Delete failed", error: err.message });
  }
};
