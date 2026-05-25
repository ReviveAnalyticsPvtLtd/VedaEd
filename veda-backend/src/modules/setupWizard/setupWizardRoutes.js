const express = require("express");
const router = express.Router();
const setupWizardController = require("./setupWizardController");
const imageUpload = require("../../middleware/imageUpload");

router.get("/progress", setupWizardController.getSetupProgress);
router.post("/initialize", setupWizardController.initializeSetup);
router.get("/", setupWizardController.getSetupWizard);
router.post("/", setupWizardController.saveSetupWizard);
router.post("/step-2", setupWizardController.saveStep2OrganizationType);
router.post(
  "/step-3/logo",
  imageUpload.single("schoolLogo"),
  setupWizardController.uploadSchoolLogo
);
router.post("/step-3", setupWizardController.saveStep3SchoolProfile);
router.post("/step-4", setupWizardController.saveStep4SchoolTypeCurriculum);
router.post("/step-5", setupWizardController.saveStep5ModuleSelection);
router.post("/step-6", setupWizardController.saveStep6AcademicStructure);
router.get("/step-7", setupWizardController.getStep7RolesHrFoundation);
router.post("/step-7", setupWizardController.saveStep7RolesHrFoundation);
router.put("/step-7/roles", setupWizardController.updateStep7RoleConfiguration);
router.delete(
  "/step-7/roles/:roleKey",
  setupWizardController.deleteStep7OptionalRole
);
router.get("/step-8", setupWizardController.getStep8AttendanceRules);
router.post("/step-8", setupWizardController.saveStep8AttendanceRules);
router.put("/step-8", setupWizardController.updateStep8AttendanceRules);
router.patch("/step-8/toggles", setupWizardController.patchStep8AttendanceToggles);
router.get("/step-9", setupWizardController.getStep9ExaminationGradebook);
router.post("/step-9", setupWizardController.saveStep9ExaminationGradebook);
router.put("/step-9", setupWizardController.updateStep9ExaminationGradebook);
router.patch("/step-9/grade-scale", setupWizardController.patchStep9GradeScale);
router.delete(
  "/step-9/grade-rows/:rowId",
  setupWizardController.deleteStep9GradeRow
);
router.delete(
  "/step-9/weightage-rows/:rowId",
  setupWizardController.deleteStep9WeightageRow
);
router.post(
  "/recommendation/generate",
  setupWizardController.generateRecommendation
);
router.get("/recommendation", setupWizardController.getRecommendation);

// Step 10 — Fee Setup
router.post("/step-10", setupWizardController.saveStep10FeeSetup);

// Step 11 — Communication Setup
router.post("/step-11", setupWizardController.saveStep11CommunicationSetup);

// Step 12 — Review & Launch
router.get("/step-12/review", setupWizardController.getSetupReview);
router.post("/step-12/launch", setupWizardController.launchSchoolSetup);

module.exports = router;
