import apiClient from "./apiClient";

const chatbotAPI = {
  ask: async (message, role, userName, history = [], currentPage = "") => {
    try {
      const response = await apiClient.post("/chatbot/ask", {
        message,
        role,
        userName,
        history,
        currentPage,
      });
      return response.data;
    } catch (error) {
      console.error("Chatbot API Error:", error);
      throw error;
    }
  },
};

export default chatbotAPI;

