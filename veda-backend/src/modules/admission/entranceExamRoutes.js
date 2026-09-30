const express = require("express");
const router = express.Router();
const controller = require("./entranceExamController");
const authMiddleware = require("../../middleware/authMiddleware");

// Exam scheduling and results are school-owned.
router.use(authMiddleware);

router.get("/", controller.getEntranceCandidates);
router.post("/schedule", controller.scheduleEntranceExam);
router.put("/:id", controller.updateEntranceResult);
router.post("/result", controller.declareResult);

module.exports = router;
