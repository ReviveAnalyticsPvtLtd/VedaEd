const onboardingSchoolService = require("../services/onboardingSchoolService");
const { validateSaveSchoolInfoBody } = require("../../workspace/validators/workspaceValidators");

exports.getSchoolInformation = async (req, res) => {
  try {
    const workspace = await onboardingSchoolService.getSchoolInformation(
      req.user.userId
    );
    return res.json({ success: true, workspace });
  } catch (error) {
    console.error("onboarding getSchoolInformation error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch school information",
    });
  }
};

exports.saveSchoolInformation = async (req, res) => {
  try {
    const validation = validateSaveSchoolInfoBody(req.body);
    if (validation.errors.length) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        errors: validation.errors,
      });
    }

    const result = await onboardingSchoolService.saveSchoolInformationAndAdvance(
      req.user.userId,
      {
        schoolName: validation.schoolName,
        workspaceSlug: validation.workspaceSlug,
      }
    );

    return res.json({
      success: true,
      workspace: result.workspace,
      onboarding: result.onboarding,
    });
  } catch (error) {
    console.error("onboarding saveSchoolInformation error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to save school information",
      errors: error.errors,
    });
  }
};
