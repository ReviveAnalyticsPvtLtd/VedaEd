const OnboardingSurvey = require("../models/OnboardingSurvey");

exports.saveSurveyData = async (userId, surveyData) => {
  try {
    let survey = await OnboardingSurvey.findOne({ userId });

    if (survey) {
      // Update existing survey
      survey = await OnboardingSurvey.findOneAndUpdate(
        { userId },
        { $set: surveyData },
        { new: true, runValidators: true }
      );
    } else {
      // Create new survey
      survey = new OnboardingSurvey({
        userId,
        ...surveyData,
      });
      await survey.save();
    }

    return survey;
  } catch (error) {
    console.error("Error in saveSurveyData:", error);
    throw error;
  }
};

exports.getSurveyData = async (userId) => {
  try {
    const survey = await OnboardingSurvey.findOne({ userId });
    return survey;
  } catch (error) {
    console.error("Error in getSurveyData:", error);
    throw error;
  }
};
