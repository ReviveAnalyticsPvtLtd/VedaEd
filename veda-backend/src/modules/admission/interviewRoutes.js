const express = require("express");
const router = express.Router();
const controller = require("./interviewController");
const authMiddleware = require("../../middleware/authMiddleware");

// Interview scorecards are school-owned.
router.use(authMiddleware);

router.get("/", controller.getInterviewCandidates);
router.post("/schedule", controller.scheduleInterview);
router.put("/:id", controller.updateInterviewResult);
router.post("/result", controller.declareResult);

module.exports = router;
