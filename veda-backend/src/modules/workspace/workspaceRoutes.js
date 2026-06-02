const express = require("express");
const authMiddleware = require("../../middleware/authMiddleware");
const workspaceController = require("./controllers/workspaceController");

const router = express.Router();

router.post("/check", authMiddleware, workspaceController.checkAvailability);

module.exports = router;
