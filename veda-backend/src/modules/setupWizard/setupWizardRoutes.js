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
