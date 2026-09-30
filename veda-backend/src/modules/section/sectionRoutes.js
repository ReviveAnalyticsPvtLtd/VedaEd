const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");
const sectionController = require('./sectionController');

router.post('/', authMiddleware, sectionController.createSection);
router.get('/', authMiddleware, sectionController.getSections); // Changed from getAllSections to getSections
router.delete("/:id", authMiddleware, sectionController.deleteSection);

module.exports = router;
