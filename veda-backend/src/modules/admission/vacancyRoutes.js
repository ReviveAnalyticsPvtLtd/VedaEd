const express = require("express");
const router = express.Router();
const controller = require("./vacancyController");
const authMiddleware = require("../../middleware/authMiddleware");
const requireSchoolContext = require("../../middleware/requireSchoolContext");

// Seat counts are school-owned configuration: the list, the update and the
// delete are all confined to the caller's own school.
router.use(authMiddleware);
router.use(requireSchoolContext);

router.post("/", controller.createVacancy);
router.get("/", controller.getAllVacancies);
router.put("/:id", controller.updateVacancy);
router.delete("/:id", controller.deleteVacancy);

module.exports = router;
