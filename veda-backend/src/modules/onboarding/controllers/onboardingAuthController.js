const onboardingAuthService = require("../services/onboardingAuthService");
const {
  validateGoogleAuthBody,
  validateAdvanceStepBody,
} = require("../validators/onboardingValidators");

exports.emailAuth = async (req, res) => {
  try {
    const result = await onboardingAuthService.authenticateWithEmail(req.body);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("onboarding emailAuth error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Email registration failed",
      code: error.code,
      fieldErrors: error.fieldErrors,
      errors: error.errors,
    });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const errors = validateGoogleAuthBody(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const result = await onboardingAuthService.authenticateWithGoogle(
      req.body.credential
    );

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("onboarding googleAuth error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Google authentication failed",
    });
  }
};

exports.getProgress = async (req, res) => {
  try {
    const progress = await onboardingAuthService.getProgressForUser(req.user.userId);
    return res.json({ success: true, onboarding: progress });
  } catch (error) {
    console.error("onboarding getProgress error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch onboarding progress",
    });
  }
};

exports.advanceStep = async (req, res) => {
  try {
    const errors = validateAdvanceStepBody(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const onboarding = await onboardingAuthService.advanceProgress(
      req.user.userId,
      req.body.step
    );

    return res.json({ success: true, onboarding });
  } catch (error) {
    console.error("onboarding advanceStep error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to update onboarding progress",
    });
  }
};
