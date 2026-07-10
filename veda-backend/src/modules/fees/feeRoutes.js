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
  getDueFees
} = require("./feeControllers");

const academicYearRouter = express.Router();

academicYearRouter.get("/", getAcademicYears);
academicYearRouter.post("/", createAcademicYear);
academicYearRouter.put("/:id", updateAcademicYear);
academicYearRouter.delete("/:id", deleteAcademicYear);
academicYearRouter.patch("/:id/activate", activateAcademicYear);

const feeCategoryRouter = express.Router();

feeCategoryRouter.get("/", getFeeCategories);
feeCategoryRouter.post("/", createFeeCategory);
feeCategoryRouter.put("/:id", updateFeeCategory);
feeCategoryRouter.delete("/:id", deleteFeeCategory);
feeCategoryRouter.patch("/:id/toggle", toggleFeeCategory);

const gradeFeeRouter = express.Router();
gradeFeeRouter.get("/", getGradeFees);
gradeFeeRouter.patch("/update", updateGradeFee);

const installmentPlanRouter = express.Router();
installmentPlanRouter.get("/", getInstallmentPlans);
installmentPlanRouter.post("/", createInstallmentPlan);
installmentPlanRouter.put("/:id", updateInstallmentPlan);
installmentPlanRouter.delete("/:id", deleteInstallmentPlan);

const lateFeePolicyRouter = express.Router();
lateFeePolicyRouter.get("/", getLateFeePolicies);
lateFeePolicyRouter.post("/", createLateFeePolicy);
lateFeePolicyRouter.put("/:id", updateLateFeePolicy);
lateFeePolicyRouter.delete("/:id", deleteLateFeePolicy);

const discountRuleRouter = express.Router();
discountRuleRouter.get("/", getDiscountRules);
discountRuleRouter.post("/", createDiscountRule);
discountRuleRouter.put("/:id", updateDiscountRule);
discountRuleRouter.delete("/:id", deleteDiscountRule);

const fineRouter = express.Router();
fineRouter.get("/", getFines);
fineRouter.post("/", createFine);
fineRouter.put("/:id", updateFine);
fineRouter.delete("/:id", deleteFine);
fineRouter.patch("/:id/toggle", toggleFineStatus);

const dashboardRouter = express.Router();
dashboardRouter.get("/", getFeesDashboard);

const collectionRouter = express.Router();
collectionRouter.get("/payments", searchFeeTransactions);
collectionRouter.get("/dues", getDueFees);
collectionRouter.get("/student/:id", getStudentFeeProfile);
collectionRouter.post("/payment", recordFeePayment);

module.exports = {
  academicYearRouter,
  feeCategoryRouter,
  gradeFeeRouter,
  installmentPlanRouter,
  lateFeePolicyRouter,
  discountRuleRouter,
  fineRouter,
  dashboardRouter,
  collectionRouter
};
