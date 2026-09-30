const express = require("express");
const router = express.Router();
const controller = require("./interviewController");
const authMiddleware = require("../../middleware/authMiddleware");
const requireSchoolContext = require("../../middleware/requireSchoolContext");

// Interview scorecards are school-owned: the candidate list, the scheduling
// write and the result write are all confined to the caller's own school.
router.use(authMiddleware);
router.use(requireSchoolContext);

router.get("/", controller.getInterviewCandidates);
router.post("/schedule", controller.scheduleInterview);
router.put("/:id", controller.updateInterviewResult);
router.post("/result", controller.declareResult);

module.exports = router;
