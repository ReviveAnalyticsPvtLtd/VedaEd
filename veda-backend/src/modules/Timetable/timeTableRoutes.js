const express = require('express');
const router = express.Router();
const timeTableControllers = require("./timeTableControllers");
const authMiddleware = require("../../middleware/authMiddleware");

// Existing CRUD endpoints (must remain working)
router.post("/", authMiddleware, timeTableControllers.createTimetableEntry);
router.get("/", authMiddleware, timeTableControllers.getTimetableEntries);
router.get("/debug", authMiddleware, timeTableControllers.debugTimetableData);
router.put("/:id", authMiddleware, timeTableControllers.updateTimetableEntry);
router.delete("/:id", authMiddleware, timeTableControllers.deleteTimetableEntry);

// New header-based endpoints (Phase 2B)
router.get("/headers", authMiddleware, timeTableControllers.getTimetableHeaders);
router.post("/headers", authMiddleware, timeTableControllers.createTimetableHeader);
router.get("/headers/:id", authMiddleware, timeTableControllers.getTimetableHeaderById);
router.post("/headers/:id/copy-from", authMiddleware, timeTableControllers.copyTimetableSetup);
router.get("/headers/:id/audit", authMiddleware, timeTableControllers.getTimetableAuditTrail);
router.get("/headers/:id/export", authMiddleware, timeTableControllers.exportTimetableHeader);
router.get("/headers/:id/export/:format", authMiddleware, timeTableControllers.exportTimetableHeader);
router.put("/headers/:id/schedule", authMiddleware, timeTableControllers.updateTimetableHeaderSchedule);
router.get("/headers/:id/requirements", authMiddleware, timeTableControllers.getTimetableRequirements);
router.put("/headers/:id/requirements", authMiddleware, timeTableControllers.updateTimetableRequirements);
router.get("/headers/:id/entries", authMiddleware, timeTableControllers.getTimetableHeaderEntries);
router.put("/headers/:id/entries", authMiddleware, timeTableControllers.replaceTimetableHeaderEntries);
router.put("/headers/:id/status", authMiddleware, timeTableControllers.updateTimetableHeaderStatus);
router.post("/headers/:id/validate", authMiddleware, timeTableControllers.validateTimetableHeader);
router.post("/headers/:id/publish", authMiddleware, timeTableControllers.publishTimetableHeader);
router.post("/headers/:id/move", authMiddleware, timeTableControllers.moveTimetableAssignment);
router.post("/headers/:id/move-series", authMiddleware, timeTableControllers.moveTimetableSeries);
router.post("/headers/:id/generate", authMiddleware, timeTableControllers.generateTimetableForHeader);

module.exports = router;