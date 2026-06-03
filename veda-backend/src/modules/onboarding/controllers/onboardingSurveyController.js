const onboardingSurveyService = require("../services/onboardingSurveyService");

exports.saveSurveyData = async (req, res) => {
  try {
    const { institutionType, studentStrength, branches, board, currentSystem } = req.body;
    const userId = req.user.userId;

    const result = await onboardingSurveyService.saveSurveyData(userId, {
      institutionType,
      studentStrength,
      branches,
      board,
      currentSystem,
    });

    return res.json({
      success: true,
      message: "Survey data saved successfully",
      data: result,
    });
  } catch (error) {
    console.error("onboarding survey save error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to save survey data",
    });
  }
};

exports.getSurveyData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const data = await onboardingSurveyService.getSurveyData(userId);

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("onboarding survey get error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to get survey data",
    });
  }
};
