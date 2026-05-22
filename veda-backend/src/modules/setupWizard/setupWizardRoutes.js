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
router.post(
  "/recommendation/generate",
  setupWizardController.generateRecommendation
);
router.get("/recommendation", setupWizardController.getRecommendation);

module.exports = router;
