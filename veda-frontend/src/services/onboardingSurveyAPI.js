import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const saveSurveyData = async (surveyData) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(
    `${API_BASE_URL}/api/onboarding/survey`,
    surveyData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getSurveyData = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(
    `${API_BASE_URL}/api/onboarding/survey`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
