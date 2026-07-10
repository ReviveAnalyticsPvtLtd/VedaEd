const fs = require("fs");
const path = require("path");
const Syllabus = require("./syllabusModel");
const StudyMaterial = require("./studyMaterialModel");
const Student = require("../student/studentModels");
const Class = require("../class/classSchema");
const Subject = require("../subject/subjectSchema");

const UPLOADS_DIR = path.resolve(__dirname, "../../../public/uploads");

// Helper function to safely delete file from disk
const deleteFileFromDisk = (fileUrl) => {
  if (!fileUrl) return;
  try {
    const filename = path.basename(fileUrl);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Successfully deleted file from disk: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error deleting file from disk (${fileUrl}):`, error);
  }
};

// ==========================================
// SYLLABUS CONTROLLERS (Teacher & Student)
// ==========================================

// 1. Upload Syllabus (Teacher)
exports.uploadSyllabus = async (req, res) => {
  try {
    const { classId, subjectId, academicYear, title, description, status } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Syllabus file is required" });
    }

    if (!classId || !subjectId || !academicYear || !title) {
      // Remove uploaded file if validation fails
      deleteFileFromDisk(req.file.filename);
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const newSyllabus = new Syllabus({
      class: classId,
      subject: subjectId,
      academicYear,
      title,
      description,
      fileUrl,
      status: status || "Draft",
      uploadedBy: req.user.userId,
    });

    await newSyllabus.save();

    res.status(201).json({
      success: true,
      message: "Syllabus uploaded successfully",
      data: newSyllabus,
    });
  } catch (error) {
    console.error("Upload Syllabus Error:", error);
    if (req.file) deleteFileFromDisk(req.file.filename);
    res.status(500).json({ success: false, message: "Error uploading syllabus", error: error.message });
  }
};

// 2. Get Teacher's Syllabuses (Teacher)
exports.getTeacherSyllabuses = async (req, res) => {
  try {
    const { classId, subjectId, academicYear } = req.query;
    const filter = { uploadedBy: req.user.userId };

    if (classId) filter.class = classId;
    if (subjectId) filter.subject = subjectId;
    if (academicYear) filter.academicYear = academicYear;

    const syllabuses = await Syllabus.find(filter)
      .populate("class", "name")
      .populate("subject", "subjectName subjectCode")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: syllabuses.length,
      data: syllabuses,
    });
  } catch (error) {
    console.error("Get Teacher Syllabuses Error:", error);
    res.status(500).json({ success: false, message: "Error fetching syllabuses", error: error.message });
  }
};

// 3. Update Syllabus (Teacher)
exports.updateSyllabus = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, classId, subjectId, academicYear } = req.body;

    const syllabus = await Syllabus.findById(id);
    if (!syllabus) {
      if (req.file) deleteFileFromDisk(req.file.filename);
      return res.status(404).json({ success: false, message: "Syllabus not found" });
    }

    // Authorization check
    if (syllabus.uploadedBy.toString() !== req.user.userId.toString() && req.user.role !== "admin") {
      if (req.file) deleteFileFromDisk(req.file.filename);
      return res.status(403).json({ success: false, message: "Not authorized to update this syllabus" });
    }

    if (title) syllabus.title = title;
    if (description !== undefined) syllabus.description = description;
    if (status) syllabus.status = status;
    if (classId) syllabus.class = classId;
    if (subjectId) syllabus.subject = subjectId;
    if (academicYear) syllabus.academicYear = academicYear;

    // If new file is uploaded, replace the old one
    if (req.file) {
      const oldFileUrl = syllabus.fileUrl;
      syllabus.fileUrl = `/uploads/${req.file.filename}`;
      deleteFileFromDisk(oldFileUrl);
    }

    await syllabus.save();

    res.status(200).json({
      success: true,
      message: "Syllabus updated successfully",
      data: syllabus,
    });
  } catch (error) {
    console.error("Update Syllabus Error:", error);
    if (req.file) deleteFileFromDisk(req.file.filename);
    res.status(500).json({ success: false, message: "Error updating syllabus", error: error.message });
  }
};

// 4. Delete Syllabus (Teacher)
exports.deleteSyllabus = async (req, res) => {
  try {
    const { id } = req.params;

    const syllabus = await Syllabus.findById(id);
    if (!syllabus) {
      return res.status(404).json({ success: false, message: "Syllabus not found" });
    }

    // Authorization check
    if (syllabus.uploadedBy.toString() !== req.user.userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to delete this syllabus" });
    }

    // Delete file from filesystem
    deleteFileFromDisk(syllabus.fileUrl);

    // Delete record from database
    await Syllabus.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Syllabus deleted successfully",
    });
  } catch (error) {
    console.error("Delete Syllabus Error:", error);
    res.status(500).json({ success: false, message: "Error deleting syllabus", error: error.message });
  }
};

// 5. Get Student's Syllabuses (Student Portal POV)
exports.getStudentSyllabuses = async (req, res) => {
  try {
    let classId;

    if (req.user.role === "student") {
      const student = await Student.findById(req.user.refId);
      if (!student || !student.personalInfo?.class) {
        return res.status(400).json({ success: false, message: "Student record or class assignment not found" });
      }
      classId = student.personalInfo.class;
    } else {
      // Allow classId filter directly for Admin/Teacher queries or testing
      classId = req.query.classId;
      if (!classId) {
        return res.status(400).json({ success: false, message: "Class ID is required" });
      }
    }

    const { subjectId } = req.query;
    const filter = { class: classId, status: "Published" };

    if (subjectId) filter.subject = subjectId;

    const syllabuses = await Syllabus.find(filter)
      .populate("subject", "subjectName subjectCode")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: syllabuses.length,
      data: syllabuses,
    });
  } catch (error) {
    console.error("Get Student Syllabuses Error:", error);
    res.status(500).json({ success: false, message: "Error fetching student syllabuses", error: error.message });
  }
};

// ==========================================
// STUDY MATERIAL CONTROLLERS (Teacher & Student)
// ==========================================

// 1. Upload Study Material (Teacher)
exports.uploadStudyMaterial = async (req, res) => {
  try {
    const { classId, subjectId, title, description, visibleToStudents } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "At least one file is required" });
    }

    if (!classId || !subjectId || !title) {
      // Delete uploaded files if validation fails
      req.files.forEach(file => deleteFileFromDisk(file.filename));
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const filesArray = req.files.map(file => ({
      fileName: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      fileType: path.extname(file.originalname).substring(1),
    }));

    const newMaterial = new StudyMaterial({
      class: classId,
      subject: subjectId,
      title,
      description,
      files: filesArray,
      visibleToStudents: visibleToStudents === "true" || visibleToStudents === true,
      uploadedBy: req.user.userId,
    });

    await newMaterial.save();

    res.status(201).json({
      success: true,
      message: "Study material uploaded successfully",
      data: newMaterial,
    });
  } catch (error) {
    console.error("Upload Study Material Error:", error);
    if (req.files) {
      req.files.forEach(file => deleteFileFromDisk(file.filename));
    }
    res.status(500).json({ success: false, message: "Error uploading study material", error: error.message });
  }
};

// 2. Get Teacher's Study Materials (Teacher)
exports.getTeacherStudyMaterials = async (req, res) => {
  try {
    const { classId, subjectId } = req.query;
    const filter = { uploadedBy: req.user.userId };

    if (classId) filter.class = classId;
    if (subjectId) filter.subject = subjectId;

    const materials = await StudyMaterial.find(filter)
      .populate("class", "name")
      .populate("subject", "subjectName subjectCode")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials,
    });
  } catch (error) {
    console.error("Get Teacher Study Materials Error:", error);
    res.status(500).json({ success: false, message: "Error fetching study materials", error: error.message });
  }
};

// 3. Update Study Material (Teacher)
exports.updateStudyMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, visibleToStudents, classId, subjectId } = req.body;

    const material = await StudyMaterial.findById(id);
    if (!material) {
      if (req.files) req.files.forEach(file => deleteFileFromDisk(file.filename));
      return res.status(404).json({ success: false, message: "Study material not found" });
    }

    // Authorization check
    if (material.uploadedBy.toString() !== req.user.userId.toString() && req.user.role !== "admin") {
      if (req.files) req.files.forEach(file => deleteFileFromDisk(file.filename));
      return res.status(403).json({ success: false, message: "Not authorized to update this material" });
    }

    if (title) material.title = title;
    if (description !== undefined) material.description = description;
    if (visibleToStudents !== undefined) {
      material.visibleToStudents = visibleToStudents === "true" || visibleToStudents === true;
    }
    if (classId) material.class = classId;
    if (subjectId) material.subject = subjectId;

    // Append new files if uploaded
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map(file => ({
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        fileType: path.extname(file.originalname).substring(1),
      }));
      material.files = [...material.files, ...newFiles];
    }

    await material.save();

    res.status(200).json({
      success: true,
      message: "Study material updated successfully",
      data: material,
    });
  } catch (error) {
    console.error("Update Study Material Error:", error);
    if (req.files) {
      req.files.forEach(file => deleteFileFromDisk(file.filename));
    }
    res.status(500).json({ success: false, message: "Error updating study material", error: error.message });
  }
};

// 4. Delete Study Material File (Remove a single file from study material upload)
exports.deleteStudyMaterialFile = async (req, res) => {
  try {
    const { id, fileId } = req.params;

    const material = await StudyMaterial.findById(id);
    if (!material) {
      return res.status(404).json({ success: false, message: "Study material not found" });
    }

    // Authorization check
    if (material.uploadedBy.toString() !== req.user.userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to modify this material" });
    }

    const fileIndex = material.files.findIndex(f => f._id.toString() === fileId);
    if (fileIndex === -1) {
      return res.status(404).json({ success: false, message: "File not found in study material" });
    }

    // Delete from filesystem
    deleteFileFromDisk(material.files[fileIndex].fileUrl);

    // Remove from array
    material.files.splice(fileIndex, 1);
    await material.save();

    res.status(200).json({
      success: true,
      message: "File removed from study material successfully",
      data: material,
    });
  } catch (error) {
    console.error("Delete Study Material File Error:", error);
    res.status(500).json({ success: false, message: "Error deleting file", error: error.message });
  }
};

// 5. Delete Full Study Material (Teacher)
exports.deleteStudyMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const material = await StudyMaterial.findById(id);
    if (!material) {
      return res.status(404).json({ success: false, message: "Study material not found" });
    }

    // Authorization check
    if (material.uploadedBy.toString() !== req.user.userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to delete this material" });
    }

    // Delete all files from disk
    material.files.forEach(file => deleteFileFromDisk(file.fileUrl));

    // Delete database record
    await StudyMaterial.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Study material deleted successfully",
    });
  } catch (error) {
    console.error("Delete Study Material Error:", error);
    res.status(500).json({ success: false, message: "Error deleting study material", error: error.message });
  }
};

// 6. Get Student's Study Materials (Student Portal POV)
exports.getStudentStudyMaterials = async (req, res) => {
  try {
    let classId;

    if (req.user.role === "student") {
      const student = await Student.findById(req.user.refId);
      if (!student || !student.personalInfo?.class) {
        return res.status(400).json({ success: false, message: "Student record or class assignment not found" });
      }
      classId = student.personalInfo.class;
    } else {
      // Allow classId filter directly for Admin/Teacher queries or testing
      classId = req.query.classId;
      if (!classId) {
        return res.status(400).json({ success: false, message: "Class ID is required" });
      }
    }

    const { subjectId } = req.query;
    const filter = { class: classId, visibleToStudents: true };

    if (subjectId) filter.subject = subjectId;

    const materials = await StudyMaterial.find(filter)
      .populate("subject", "subjectName subjectCode")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials,
    });
  } catch (error) {
    console.error("Get Student Study Materials Error:", error);
    res.status(500).json({ success: false, message: "Error fetching student study materials", error: error.message });
  }
};
