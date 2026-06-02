const express = require("express");
const authMiddleware = require("../../middleware/authMiddleware");
const onboardingAuthController = require("./controllers/onboardingAuthController");
const onboardingSchoolController = require("./controllers/onboardingSchoolController");
const onboardingAdminController = require("./controllers/onboardingAdminController");
const onboardingPasswordController = require("./controllers/onboardingPasswordController");
const onboardingEmailOtpController = require("./controllers/onboardingEmailOtpController");
const onboardingCompleteController = require("./controllers/onboardingCompleteController");

const router = express.Router();

router.post("/auth/google", onboardingAuthController.googleAuth);
router.post("/auth/email", onboardingAuthController.emailAuth);
router.get("/progress", authMiddleware, onboardingAuthController.getProgress);
router.patch("/progress", authMiddleware, onboardingAuthController.advanceStep);

router.get(
  "/school-information",
  authMiddleware,
  onboardingSchoolController.getSchoolInformation
);
router.post(
  "/school-information",
  authMiddleware,
  onboardingSchoolController.saveSchoolInformation
);

router.get(
  "/admin-details",
  authMiddleware,
  onboardingAdminController.getAdminDetails
);
router.post(
  "/admin-details",
  authMiddleware,
  onboardingAdminController.saveAdminDetails
);

router.get(
  "/create-password",
  authMiddleware,
  onboardingPasswordController.getCreatePassword
);
router.post(
  "/create-password",
  authMiddleware,
  onboardingPasswordController.createPassword
);

router.get(
  "/email-verification",
  authMiddleware,
  onboardingEmailOtpController.getEmailVerification
);
router.post(
  "/send-email-otp",
  authMiddleware,
  onboardingEmailOtpController.sendEmailOtp
);
router.post(
  "/resend-email-otp",
  authMiddleware,
  onboardingEmailOtpController.resendEmailOtp
);
router.post(
  "/verify-email-otp",
  authMiddleware,
  onboardingEmailOtpController.verifyEmailOtp
);

router.get(
  "/workspace",
  authMiddleware,
  onboardingCompleteController.getWorkspace
);
router.post(
  "/complete",
  authMiddleware,
  onboardingCompleteController.completeOnboarding
);

module.exports = router;
