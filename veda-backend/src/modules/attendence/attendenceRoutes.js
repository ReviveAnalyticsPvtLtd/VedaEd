const express = require("express");
const router = express.Router();
const attendanceControllers = require("./attendenceController");
const authMiddleware = require("../../middleware/authMiddleware");

// Statistics
router.get("/summary", authMiddleware, attendanceControllers.getAttendanceSummary);
router.get("/recent", authMiddleware, attendanceControllers.getRecentAttendance);
router.get("/weekly", authMiddleware, attendanceControllers.getWeeklyStats); 

// By Class
router.post("/class", authMiddleware, attendanceControllers.markClassAttendance); 
router.get("/class/:classId/:sectionId/:date", authMiddleware, attendanceControllers.getAttendanceByClass); 
// By Student
router.get("/date/:date", authMiddleware, attendanceControllers.getAttendanceByDate);
router.put("/student/:studentId", authMiddleware, attendanceControllers.updateAttendanceByStudent); 
router.get("/student/:studentId", authMiddleware, attendanceControllers.getAttendanceByStudent); 

module.exports = router;
