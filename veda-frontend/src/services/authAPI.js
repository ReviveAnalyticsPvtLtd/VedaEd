import axios from "axios";
import config from "../config";
import { getAuthToken } from "../utils/authSession";

const API_URL = `${config.API_BASE_URL}/auth`;

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const checkUserExists = async (email) => {
  const { data } = await axios.post(`${API_URL}/check-user`, { email });
  return data;
};

export const registerWithEmail = async ({ email, password }) => {
  const { data } = await axios.post(`${API_URL}/register`, {
    email,
    password,
    confirmPassword: password,
  });
  return data;
};

export const loginWithEmail = async ({ email, password }) => {
  const { data } = await axios.post(`${API_URL}/login`, { email, password });
  return data;
};

export const authAPI = {
  async changePassword({ currentPassword, newPassword }) {
    try {
      const { data } = await axios.post(
        `${API_URL}/change-password`,
        { currentPassword, newPassword },
        { headers: authHeaders() }
      );
      return data;
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Failed to update password";
      throw new Error(message);
    }
  },
};
