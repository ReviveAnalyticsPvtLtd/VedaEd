import api from "./apiClient";

const API_URL = "/user-settings";

export const userSettingsAPI = {
  // Get all user settings
  async getSettings() {
    try {
      const { data } = await api.get(`${API_URL}`);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to fetch settings";
      throw new Error(message);
    }
  },

  // Get user profile
  async getProfile() {
    try {
      const { data } = await api.get(`${API_URL}/profile`);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to fetch profile";
      throw new Error(message);
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    try {
      const { data } = await api.put(`${API_URL}/profile`, profileData);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update profile";
      throw new Error(message);
    }
  },

  // Update preferences
  async updatePreferences(preferences) {
    try {
      const { data } = await api.put(`${API_URL}/preferences`, preferences);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update preferences";
      throw new Error(message);
    }
  },

  // Update notification settings
  async updateNotifications(notifications) {
    try {
      const { data } = await api.put(`${API_URL}/notifications`, notifications);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update notifications";
      throw new Error(message);
    }
  },

  // Update security settings
  async updateSecuritySettings(security) {
    try {
      const { data } = await api.put(`${API_URL}/security`, security);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update security settings";
      throw new Error(message);
    }
  }
};
