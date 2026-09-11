const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");
const requireSuperAdmin = require("../../middleware/requireSuperAdminMiddleware");
const setupProfileController = require("./setupProfileController");

router.use(authMiddleware);

router.get("/", requireSuperAdmin, setupProfileController.getSetupProfile);
router.put("/", requireSuperAdmin, setupProfileController.updateSetupProfile);

module.exports = router;