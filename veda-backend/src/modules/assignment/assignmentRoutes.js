const express = require("express");
const router = express.Router();
const assignmentControllers = require("./assignmentController.js");
const { upload } = require("../../middleware/upload");
const { teacherOnly } = require("../../middleware/auth");
const authMiddleware = require("../../middleware/authMiddleware");

// Teacher routes
router.post("/", authMiddleware, upload.single("document"), assignmentControllers.createAssignment);
router.get("/", authMiddleware, assignmentControllers.getAssignments);
router.get("/:id", authMiddleware, assignmentControllers.getAssignmentById);
router.put("/:id", authMiddleware, teacherOnly, upload.single("document"), assignmentControllers.updateAssignment);
router.delete("/:id", authMiddleware, assignmentControllers.deleteAssignment);

// Student routes
router.post("/:id/submit", authMiddleware, upload.single("file"), assignmentControllers.submitAssignment);
router.delete("/:id/submission", authMiddleware, assignmentControllers.deleteSubmission);

// Teacher grading route
router.put("/:id/submissions/:submissionId/grade", authMiddleware, teacherOnly, assignmentControllers.gradeSubmission);

module.exports = router;
