const onboardingEmailOtpService = require("../services/onboardingEmailOtpService");

exports.getEmailVerification = async (req, res) => {
  try {
    const result = await onboardingEmailOtpService.getEmailVerificationState(
      req.user.userId
    );

    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("onboarding getEmailVerification error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch email verification state",
    });
  }
};

exports.sendEmailOtp = async (req, res) => {
  try {
    const result = await onboardingEmailOtpService.sendEmailOtp(req.user.userId);

    return res.json({
      success: true,
      expiresIn: result.expiresIn,
      resent: result.resent,
      email: result.email,
      otpExpiresAt: result.otpExpiresAt,
      serverNow: result.serverNow,
    });
  } catch (error) {
    console.error("onboarding sendEmailOtp error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to send verification code",
    });
  }
};

exports.resendEmailOtp = async (req, res) => {
  try {
    const result = await onboardingEmailOtpService.resendEmailOtp(req.user.userId);

    return res.json({
      success: true,
      expiresIn: result.expiresIn,
      email: result.email,
      otpExpiresAt: result.otpExpiresAt,
      serverNow: result.serverNow,
    });
  } catch (error) {
    console.error("onboarding resendEmailOtp error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to resend verification code",
      expiresIn: error.expiresIn,
    });
  }
};

exports.verifyEmailOtp = async (req, res) => {
  try {
    const result = await onboardingEmailOtpService.verifyEmailOtp(
      req.user.userId,
      req.body
    );

    return res.json({
      success: true,
      verified: result.verified,
      currentStep: result.currentStep,
      onboarding: result.onboarding,
    });
  } catch (error) {
    console.error("onboarding verifyEmailOtp error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to verify code",
      errors: error.errors,
      attemptsRemaining: error.attemptsRemaining,
      attemptsLocked: error.attemptsLocked,
      expired: error.expired,
    });
  }
};
