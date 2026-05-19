const express = require("express");

const controller = require("./superadminIdentityController");

const authMiddleware = require("../../middleware/authMiddleware");

const requireSuperAdmin = require("../../middleware/requireSuperAdminMiddleware");



const router = express.Router();



// Public invitation routes (no auth)

router.get("/invite/validate", controller.validateInviteToken);

router.post("/invite/accept", controller.acceptInvite);



router.use(authMiddleware, requireSuperAdmin);



router.get("/meta", controller.getMeta);

router.get("/next-employee-id", controller.getNextEmployeeId);

router.get("/permissions/default", controller.getDefaultPermissions);

router.post("/validate", controller.validateAccess);



router.get("/admins", controller.listAdmins);

router.get("/admins/:id", controller.getAdmin);

router.post("/admins", controller.createAdmin);

router.put("/admins/:id", controller.updateAdmin);

router.patch("/admins/:id/status", controller.updateStatus);

router.post("/admins/:id/send-invite", controller.sendInvite);

router.post("/admins/:id/resend-invite", controller.resendInvite);

module.exports = router;

