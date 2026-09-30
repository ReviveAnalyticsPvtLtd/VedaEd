const express = require("express");
const {
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  activateAcademicYear,
  getFeeCategories,
  createFeeCategory,
  updateFeeCategory,
  deleteFeeCategory,
  toggleFeeCategory,
  getGradeFees,
  updateGradeFee,
  getInstallmentPlans,
  createInstallmentPlan,
  updateInstallmentPlan,
  deleteInstallmentPlan,
  getLateFeePolicies,
  createLateFeePolicy,
  updateLateFeePolicy,
  deleteLateFeePolicy,
  getDiscountRules,
  createDiscountRule,
  updateDiscountRule,
  deleteDiscountRule,
  getFines,
  createFine,
  updateFine,
  deleteFine,
  toggleFineStatus,
  getFeesDashboard,
  getStudentFeeProfile,
  recordFeePayment,
  searchFeeTransactions,
  getDueFees,
  getPaymentReceipt,
  getStudentFeeLedger,
  updatePaymentStatus,
  getDailyCollectionReport,
  getMonthlyCollectionReport,
  getFeeDueReport,
  getClassWiseCollectionReport,
  getPaymentModeReport,
  getFineCollectionReport,
  getDiscountReport
} = require("./feeControllers");

const authMiddleware = require("../../middleware/authMiddleware");
const { requireSchoolContext } = require("../../middleware/requireSchoolContext");
const permissionMiddleware = require("../../middleware/permissionMiddleware");
const { CAP } = require("./feeTenant");

/**
 * Every route below runs the project's existing tenant + RBAC chain:
 *
 *   authMiddleware      -> verifies the JWT and loads the authoritative
 *                         req.user.schoolId from the User document
 *   requireSchoolContext -> validates that tenant and strips any
 *                         client-supplied body/query schoolId
 *   permissionMiddleware -> resolves an EXISTING permission
 *                         (view_fees / manage_fees / collect_fees)
 *
 * Capability mapping (no new permission names are introduced):
 *   view_fees    - reading configuration, dashboards and reports
 *   manage_fees  - creating / updating / deleting configuration
 *   collect_fees - recording payments, status changes, ledgers
 *
 * The two parent-facing collection reads (student/:id and receipt/:id) use
 * auth + school context only, because parents legitimately hold no fee
 * permission rows. Those controllers fall back to the parent's own verified
 * `children` list, matching the parent dashboard, and fail closed otherwise.
 *
 * AcademicYear is deliberately GLOBAL (it has no schoolId by design). It is
 * still gated behind auth + a valid school context, and its writes require
 * manage_fees, matching the admin UI that already drives this screen.
 */
const tenant = [authMiddleware, requireSchoolContext];
const view = (permission) => [...tenant, permissionMiddleware(permission)];

const academicYearRouter = express.Router();

academicYearRouter.get("/", ...view(CAP.VIEW_FEES), getAcademicYears);
academicYearRouter.post("/", ...view(CAP.MANAGE_FEES), createAcademicYear);
academicYearRouter.put("/:id", ...view(CAP.MANAGE_FEES), updateAcademicYear);
academicYearRouter.delete("/:id", ...view(CAP.MANAGE_FEES), deleteAcademicYear);
academicYearRouter.patch("/:id/activate", ...view(CAP.MANAGE_FEES), activateAcademicYear);

const feeCategoryRouter = express.Router();

feeCategoryRouter.get("/", ...view(CAP.VIEW_FEES), getFeeCategories);
feeCategoryRouter.post("/", ...view(CAP.MANAGE_FEES), createFeeCategory);
feeCategoryRouter.put("/:id", ...view(CAP.MANAGE_FEES), updateFeeCategory);
feeCategoryRouter.delete("/:id", ...view(CAP.MANAGE_FEES), deleteFeeCategory);
feeCategoryRouter.patch("/:id/toggle", ...view(CAP.MANAGE_FEES), toggleFeeCategory);

const gradeFeeRouter = express.Router();
gradeFeeRouter.get("/", ...view(CAP.VIEW_FEES), getGradeFees);
gradeFeeRouter.patch("/update", ...view(CAP.MANAGE_FEES), updateGradeFee);

const installmentPlanRouter = express.Router();
installmentPlanRouter.get("/", ...view(CAP.VIEW_FEES), getInstallmentPlans);
installmentPlanRouter.post("/", ...view(CAP.MANAGE_FEES), createInstallmentPlan);
installmentPlanRouter.put("/:id", ...view(CAP.MANAGE_FEES), updateInstallmentPlan);
installmentPlanRouter.delete("/:id", ...view(CAP.MANAGE_FEES), deleteInstallmentPlan);

const lateFeePolicyRouter = express.Router();
lateFeePolicyRouter.get("/", ...view(CAP.VIEW_FEES), getLateFeePolicies);
lateFeePolicyRouter.post("/", ...view(CAP.MANAGE_FEES), createLateFeePolicy);
lateFeePolicyRouter.put("/:id", ...view(CAP.MANAGE_FEES), updateLateFeePolicy);
lateFeePolicyRouter.delete("/:id", ...view(CAP.MANAGE_FEES), deleteLateFeePolicy);

const discountRuleRouter = express.Router();
discountRuleRouter.get("/", ...view(CAP.VIEW_FEES), getDiscountRules);
discountRuleRouter.post("/", ...view(CAP.MANAGE_FEES), createDiscountRule);
discountRuleRouter.put("/:id", ...view(CAP.MANAGE_FEES), updateDiscountRule);
discountRuleRouter.delete("/:id", ...view(CAP.MANAGE_FEES), deleteDiscountRule);

const fineRouter = express.Router();
fineRouter.get("/", ...view(CAP.VIEW_FEES), getFines);
fineRouter.post("/", ...view(CAP.MANAGE_FEES), createFine);
fineRouter.put("/:id", ...view(CAP.MANAGE_FEES), updateFine);
fineRouter.delete("/:id", ...view(CAP.MANAGE_FEES), deleteFine);
fineRouter.patch("/:id/toggle", ...view(CAP.MANAGE_FEES), toggleFineStatus);

const dashboardRouter = express.Router();
dashboardRouter.get("/", ...view(CAP.VIEW_FEES), getFeesDashboard);

const collectionRouter = express.Router();
collectionRouter.get("/payments", ...view(CAP.VIEW_FEES), searchFeeTransactions);
collectionRouter.get("/dues", ...view(CAP.VIEW_FEES), getDueFees);
collectionRouter.get("/student/:id", ...tenant, getStudentFeeProfile);
collectionRouter.post("/payment", ...view(CAP.COLLECT_FEES), recordFeePayment);
collectionRouter.get("/receipt/:id", ...tenant, getPaymentReceipt);
collectionRouter.get("/ledger/:id", ...view(CAP.VIEW_FEES), getStudentFeeLedger);
collectionRouter.patch("/payment/:id/status", ...view(CAP.COLLECT_FEES), updatePaymentStatus);

const reportRouter = express.Router();
reportRouter.get("/daily", ...view(CAP.VIEW_FEES), getDailyCollectionReport);
reportRouter.get("/monthly", ...view(CAP.VIEW_FEES), getMonthlyCollectionReport);
reportRouter.get("/due", ...view(CAP.VIEW_FEES), getFeeDueReport);
reportRouter.get("/class-wise", ...view(CAP.VIEW_FEES), getClassWiseCollectionReport);
reportRouter.get("/payment-mode", ...view(CAP.VIEW_FEES), getPaymentModeReport);
reportRouter.get("/fine", ...view(CAP.VIEW_FEES), getFineCollectionReport);
reportRouter.get("/discount", ...view(CAP.VIEW_FEES), getDiscountReport);

module.exports = {
  academicYearRouter,
  feeCategoryRouter,
  gradeFeeRouter,
  installmentPlanRouter,
  lateFeePolicyRouter,
  discountRuleRouter,
  fineRouter,
  dashboardRouter,
  collectionRouter,
  reportRouter
};
