const express = require("express");
const dashboardControllers = require("./dashboardController");
const authMiddleware = require("../../middleware/authMiddleware");
const { requireSchoolContext } = require("../../middleware/requireSchoolContext");

const router = express.Router();

// Both dashboard endpoints are school-scoped. They previously carried no
// middleware at all, which made them publicly reachable and globally unscoped:
// every count and aggregate ran across all schools.
//
// requireSchoolContext reads only the school that authMiddleware resolved from
// the authenticated User document and strips any client-supplied schoolId, so a
// caller can never assert its own tenant. It answers 403 NO_SCHOOL_CONTEXT for
// an authenticated account that has no school.
//
// There is deliberately no platform-wide variant. One onboarding produces one
// school and one super admin, so a super admin sees only their own school.
router.get("/stats", authMiddleware, requireSchoolContext, dashboardControllers.getAdminDashboardStats);
router.get(
  "/master-stats",
  authMiddleware,
  requireSchoolContext,
  dashboardControllers.getMasterDashboardStats
);

module.exports = router;
