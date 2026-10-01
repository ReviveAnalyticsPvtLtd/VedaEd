const express = require("express");
const router = express.Router();
const controller = require("./entranceExamController");
const authMiddleware = require("../../middleware/authMiddleware");
const requireSchoolContext = require("../../middleware/requireSchoolContext");

// Exam schedules and results are school-owned: both the application list and the
// individual exam read/write below are now confined to the caller's own school.
router.use(authMiddleware);
router.use(requireSchoolContext);

router.get("/", controller.getEntranceCandidates);
router.post("/schedule", controller.scheduleEntranceExam);
router.put("/:id", controller.updateEntranceResult);
router.post("/result", controller.declareResult);

module.exports = router;
