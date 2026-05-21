const express = require("express");
const router = express.Router();
const setupWizardController = require("./setupWizardController");

router.get("/progress", setupWizardController.getSetupProgress);
router.post("/initialize", setupWizardController.initializeSetup);
router.get("/", setupWizardController.getSetupWizard);
router.post("/", setupWizardController.saveSetupWizard);

module.exports = router;
