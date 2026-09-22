import axios from "axios";
import config from "../config";

const handleUnauthorizedResponse = (error) => {
  if (error?.response?.status === 401) {
    const isLoginEndpoint =
      error.config?.url && String(error.config.url).includes("/auth/login");

    if (!isLoginEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("role");
      localStorage.removeItem("permissions");
      localStorage.removeItem("platformPermissions");
      localStorage.removeItem("user");

      const message =
        error.response?.data?.message ||
        "Your session was ended because your account was signed in from another device or browser.";

      sessionStorage.setItem("auth_flash_message", message);

      const currentPath = window.location.pathname;
      if (
        currentPath !== "/" &&
        !currentPath.startsWith("/onboarding") &&
        !currentPath.startsWith("/accept-invitation") &&
        !currentPath.startsWith("/setup")
      ) {
        window.location.replace("/");
      }
    }
  }
  return Promise.reject(error);
};

// Global interceptor for all axios calls
axios.interceptors.response.use(
  (response) => response,
  handleUnauthorizedResponse
);

const api = axios.create({
  baseURL: config.API_BASE_URL,
});

api.interceptors.request.use((request) => {
  const token = localStorage.getItem("token");
  if (token) {
    request.headers = request.headers || {};
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});

api.interceptors.response.use(
  (response) => response,
  handleUnauthorizedResponse
);

export async function authFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${config.API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    localStorage.removeItem("platformPermissions");
    localStorage.removeItem("user");

    let message = "Your session was ended because your account was signed in from another device or browser.";
    try {
      const data = await response.clone().json();
      if (data?.message) message = data.message;
    } catch (_) {}

    sessionStorage.setItem("auth_flash_message", message);

    const currentPath = window.location.pathname;
    if (
      currentPath !== "/" &&
      !currentPath.startsWith("/onboarding") &&
      !currentPath.startsWith("/accept-invitation") &&
      !currentPath.startsWith("/setup")
    ) {
      window.location.replace("/");
    }
  }

  return response;
}

export default api;
