const express = require('express');
const router = express.Router();
const timeTableControllers = require("./timeTableControllers");
const authMiddleware = require("../../middleware/authMiddleware");

console.log("timetable routing works ");
router.post("/", authMiddleware, timeTableControllers.createTimetableEntry );
router.get("/", authMiddleware, timeTableControllers.getTimetableEntries );
router.get("/debug", authMiddleware, timeTableControllers.debugTimetableData );
router.put("/:id", authMiddleware, timeTableControllers.updateTimetableEntry);
router.delete("/:id", authMiddleware, timeTableControllers.deleteTimetableEntry );

module.exports = router;