const onboardingCompleteService = require("../services/onboardingCompleteService");

exports.getWorkspace = async (req, res) => {
  try {
    const data = await onboardingCompleteService.getWorkspaceReadyInfo(
      req.user.userId
    );

    return res.json({
      success: true,
      schoolName: data.schoolName,
      workspaceSlug: data.workspaceSlug,
      workspaceUrl: data.workspaceUrl,
      workspacePreviewUrl: data.workspacePreviewUrl,
      adminName: data.adminName,
      adminEmail: data.adminEmail,
      onboardingCompleted: data.onboardingCompleted,
    });
  } catch (error) {
    console.error("onboarding getWorkspace error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to load workspace information",
      code: error.code,
      redirectTo: error.redirectTo,
      steps: error.steps,
    });
  }
};

exports.completeOnboarding = async (req, res) => {
  try {
    const result = await onboardingCompleteService.completeOnboardingAndAuthenticate(
      req.user.userId
    );

    return res.json({
      success: true,
      onboardingCompleted: true,
      workspaceUrl: result.workspaceUrl,
      redirect: result.redirect,
      token: result.token,
      refreshToken: result.refreshToken,
      refreshTokenExpiresAt: result.refreshTokenExpiresAt,
      role: result.role,
      permissions: result.permissions,
      platformPermissions: result.platformPermissions,
      user: result.user,
    });
  } catch (error) {
    console.error("onboarding complete error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to complete onboarding",
    });
  }
};
