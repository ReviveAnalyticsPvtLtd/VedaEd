import config from "../config";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const authAPI = {
  changePassword: async ({ currentPassword, newPassword }) => {
    const response = await fetch(`${config.API_BASE_URL}/auth/change-password`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.message || "Failed to update password");
    }
    return payload;
  },
};
