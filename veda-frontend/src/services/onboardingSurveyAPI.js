import api from "./apiClient";

export const saveSurveyData = async (surveyData) => {
  const response = await api.post("/onboarding/survey", surveyData);
  return response.data;
};

export const getSurveyData = async () => {
  const response = await api.get("/onboarding/survey");
  return response.data;
};
