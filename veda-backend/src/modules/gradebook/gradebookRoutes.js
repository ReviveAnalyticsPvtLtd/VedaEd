const express = require("express");
const router = express.Router();
const gradebookController = require("./gradebookController");
const authMiddleware = require("../../middleware/authMiddleware");

router.post("/save", authMiddleware, gradebookController.saveMarks);
router.get("/marks", authMiddleware, gradebookController.getMarks);
router.get("/students", authMiddleware, gradebookController.getStudentsForGradebook);

module.exports = router;
