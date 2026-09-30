const express = require('express');
const router = express.Router();
const assignTeacherController = require('./assignTeacherControllers');
const authMiddleware = require('../../middleware/authMiddleware');

// CRUD Routes for Subjects
router.get("/", authMiddleware, assignTeacherController.getAllAssignedTeachers );
router.post("/", authMiddleware, assignTeacherController.assignTeachers );
router.put("/:id", authMiddleware, assignTeacherController.updateAssignTeacher);
router.delete("/:id", authMiddleware, assignTeacherController.deleteAssignTeachers);

module.exports = router;