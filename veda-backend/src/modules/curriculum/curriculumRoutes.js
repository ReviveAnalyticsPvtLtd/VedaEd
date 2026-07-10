const express = require("express");
const router = express.Router();
const curriculumController = require("./curriculumController");
const authMiddleware = require("../../middleware/authMiddleware");
const { upload, uploadSingle } = require("../../middleware/upload");

// ==========================================
// SYLLABUS ROUTES
// ==========================================

// Teacher POV - Upload, Read, Update, Delete
router.post(
  "/syllabus",
  authMiddleware,
  uploadSingle("file"),
  curriculumController.uploadSyllabus
);

router.get(
  "/syllabus/teacher",
  authMiddleware,
  curriculumController.getTeacherSyllabuses
);

router.put(
  "/syllabus/:id",
  authMiddleware,
  uploadSingle("file"),
  curriculumController.updateSyllabus
);

router.delete(
  "/syllabus/:id",
  authMiddleware,
  curriculumController.deleteSyllabus
);

// Student POV - View syllabus matching student's class
router.get(
  "/syllabus/student",
  authMiddleware,
  curriculumController.getStudentSyllabuses
);


// ==========================================
// STUDY MATERIAL ROUTES
// ==========================================

// Teacher POV - Upload, Read, Update, Delete
router.post(
  "/study-materials",
  authMiddleware,
  upload.array("files", 10),
  curriculumController.uploadStudyMaterial
);

router.get(
  "/study-materials/teacher",
  authMiddleware,
  curriculumController.getTeacherStudyMaterials
);

router.put(
  "/study-materials/:id",
  authMiddleware,
  upload.array("files", 10),
  curriculumController.updateStudyMaterial
);

router.delete(
  "/study-materials/:id",
  authMiddleware,
  curriculumController.deleteStudyMaterial
);

// Delete single file from study material list
router.delete(
  "/study-materials/:id/files/:fileId",
  authMiddleware,
  curriculumController.deleteStudyMaterialFile
);

// Student POV - View study materials matching student's class
router.get(
  "/study-materials/student",
  authMiddleware,
  curriculumController.getStudentStudyMaterials
);

module.exports = router;
