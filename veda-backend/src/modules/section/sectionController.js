const mongoose = require("mongoose");
const Section = require("./sectionSchema");
const Class = require("../class/classSchema");

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

exports.createSection = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Section name is required' });

    const exists = await Section.findOne({ name, schoolId });
    if (exists) return res.status(409).json({ success: false, message: 'Section already exists' });

    const section = new Section({ name, schoolId });
    await section.save();

    return res.status(201).json({ success: true, data: section });
  } catch (err) {
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
exports.getAllSections = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const sections = await Section.find({ schoolId }).sort({ name: 1 });
    return res.status(200).json({ success: true, data: sections });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
exports.getSections = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const { name, classId } = req.query;

    let query = { schoolId };
    if (name) {
      query.name = name.trim();
    }

    let sections;
    
    // If classId is provided, get sections for that specific class
    if (classId) {
      const classDoc = await Class.findOne({ _id: classId, schoolId }).populate({
        path: 'sections',
        match: { schoolId },
      });
      if (!classDoc) {
        return res.status(404).json({ 
          success: false, 
          message: 'Class not found' 
        });
      }
      sections = classDoc.sections;
    } else {
      // If no classId, get all sections
      sections = await Section.find(query);
    }

    return res.status(200).json({
      success: true,
      data: sections,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
exports.deleteSection = async(req,res)=>{
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const deletedSection = await Section.findOneAndDelete({ _id: req.params.id, schoolId });

    if (!deletedSection) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }
    await Class.updateMany(
      { sections: req.params.id, schoolId },   // where this section is present
      { $pull: { sections: req.params.id } }  // remove it from the array
    );

    res.status(200).json({
      success: true,
      message: "Section deleted successfully and removed from the linked class",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed", error: err.message });
  }
}
