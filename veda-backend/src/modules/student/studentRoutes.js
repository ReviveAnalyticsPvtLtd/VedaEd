// student.routes.js
const express = require("express");
const router = express.Router();
const studentController = require("./studentControllers");
const { uploadSingle } = require("../../middleware/upload");
const authMiddleware = require("../../middleware/authMiddleware");
const permissionMiddleware = require("../../middleware/permissionMiddleware");
const studentHealthUpdateMiddleware = require("../../middleware/studentHealthUpdateMiddleware");

// Student CRUD (Admin / Staff roles mostly)
router.post("/", authMiddleware, permissionMiddleware("create_student"), studentController.createStudent);         // Create new student
router.get("/", authMiddleware, permissionMiddleware("view_student"), studentController.getAllStudents);           // Get all students
router.get("/stats", authMiddleware, permissionMiddleware("view_student"), studentController.getStudentStats);    // Get student statistics
router.get("/next-id", authMiddleware, permissionMiddleware("create_student"), studentController.getNextStudentId); // Preview next auto Student ID
// ⚠️ /import MUST be before /:id so Express doesn't treat "import" as a student ID param
router.post("/import", authMiddleware, permissionMiddleware("create_student"), studentController.importStudents); // Bulk import from Excel

// Health-only update: teachers/students with view_student (plus assignment/self checks in controller), or roles with edit_student
router.put("/:id/health", authMiddleware, studentHealthUpdateMiddleware, studentController.updateStudentHealth);

// Static / multi-segment paths MUST be registered before /:id so "documents", "preview", etc. are not captured as ids.
router.post("/upload", authMiddleware, permissionMiddleware("edit_student"), uploadSingle("file"), studentController.uploadDocument);
router.get("/documents/:studentId", authMiddleware, permissionMiddleware("view_student"), studentController.getAllDocuments);
router.get("/preview/:filename", authMiddleware, permissionMiddleware("view_student"), studentController.previewDocument);
router.get("/download/:filename", authMiddleware, permissionMiddleware("view_student"), studentController.downloadDocument);
router.delete("/documents/:studentId/:documentId", authMiddleware, permissionMiddleware("edit_student"), studentController.deleteDocument);

router.put("/:id", authMiddleware, permissionMiddleware("edit_student"), studentController.updateStudent);
router.delete("/:id", authMiddleware, permissionMiddleware("delete_student"), studentController.deleteStudentById);
router.get("/:id/dashboard-stats", authMiddleware, permissionMiddleware("view_student"), studentController.getStudentDashboardStats);
router.get("/:id", authMiddleware, permissionMiddleware("view_student"), studentController.getStudent);

// Student Authentication
// router.post("/login", studentController.loginStudent);     // Student login
// router.post("/logout", studentController.logoutStudent);   // Logout

// Curriculum & Academics
// router.get("/:id/curriculum", studentController.getCurriculum);   // Get assigned curriculum
// router.get("/:id/assignments", studentController.getAssignments); // Get all assignments
// router.get("/:id/exams", studentController.getExams);             // Get exam schedule
// router.get("/:id/reports", studentController.getReports);         // Get report card

// Parent Info
// router.get("/:id/parent", studentController.getParentInfo);
// router.put("/:id/parent", studentController.updateParentInfo);

// Profile
// router.put("/:id/profile", studentController.updateProfile);      // Update contact, image etc.
// router.put("/:id/password", studentController.updatePassword);    // Change password

module.exports = router;
