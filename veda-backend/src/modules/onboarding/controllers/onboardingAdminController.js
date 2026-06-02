const onboardingAdminService = require("../services/onboardingAdminService");

exports.getAdminDetails = async (req, res) => {
  try {
    const result = await onboardingAdminService.getAdminDetails(req.user.userId);
    return res.json({
      success: true,
      adminDetails: result.adminDetails,
      profile: result.profile,
      authProvider: result.authProvider,
      onboarding: result.onboarding,
    });
  } catch (error) {
    console.error("onboarding getAdminDetails error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch admin details",
    });
  }
};

exports.saveAdminDetails = async (req, res) => {
  try {
    const result = await onboardingAdminService.saveAdminDetailsAndAdvance(
      req.user.userId,
      req.body
    );

    return res.json({
      success: true,
      currentStep: result.currentStep,
      onboarding: result.onboarding,
      adminDetails: result.adminDetails,
    });
  } catch (error) {
    console.error("onboarding saveAdminDetails error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to save admin details",
      errors: error.errors,
      fieldErrors: error.fieldErrors,
    });
  }
};
