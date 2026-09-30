const express = require('express');
const router = express.Router();
const subGroupController = require('./subGroupController');
const authMiddleware = require('../../middleware/authMiddleware');


// CRUD Routes for Subjects
router.get("/", authMiddleware, subGroupController.getAllSubjectGroups);
router.post("/", authMiddleware, subGroupController.createSubjectGroup);
router.put("/:id", authMiddleware, subGroupController.updateSubjectGroup);
router.delete("/:id", authMiddleware, subGroupController.deleteSubjectGroup);
router.get("/:id", authMiddleware, subGroupController.getSubjectGroupById);
module.exports = router;