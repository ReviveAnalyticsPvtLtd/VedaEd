const onboardingPasswordService = require("../services/onboardingPasswordService");

exports.getCreatePassword = async (req, res) => {
  try {
    const result = await onboardingPasswordService.getCreatePasswordState(
      req.user.userId
    );

    return res.json({
      success: true,
      passwordCreated: result.passwordCreated,
      authProvider: result.authProvider,
      onboarding: result.onboarding,
    });
  } catch (error) {
    console.error("onboarding getCreatePassword error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch password setup state",
    });
  }
};

exports.createPassword = async (req, res) => {
  try {
    const result = await onboardingPasswordService.createPasswordAndAdvance(
      req.user.userId,
      req.body
    );

    return res.json({
      success: true,
      currentStep: result.currentStep,
      onboarding: result.onboarding,
      passwordCreated: result.passwordCreated,
    });
  } catch (error) {
    console.error("onboarding createPassword error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to create password",
      errors: error.errors,
      fieldErrors: error.fieldErrors,
    });
  }
};
