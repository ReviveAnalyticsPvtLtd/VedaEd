const express = require("express");
const router = express.Router();
const controller = require("./vacancyController");
const authMiddleware = require("../../middleware/authMiddleware");

// Seat counts are school-owned configuration.
router.use(authMiddleware);

router.post("/", controller.createVacancy);
router.get("/", controller.getAllVacancies);
router.put("/:id", controller.updateVacancy);
router.delete("/:id", controller.deleteVacancy);

module.exports = router;
