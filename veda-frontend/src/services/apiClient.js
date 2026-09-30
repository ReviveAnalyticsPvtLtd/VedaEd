import axios from "axios";
import config from "../config";

const DEFAULT_SESSION_ENDED_MESSAGE =
  "Your session was ended because your account was signed in from another device or browser.";

const SESSION_ENDED_CODES = new Set(["SESSION_REPLACED", "SESSION_EXPIRED"]);

// A 401 only ends the session when the backend explicitly says the session is
// over. A plain authorization failure (for example a request sent without a
// token) must not wipe local state or redirect the whole app away.
const isSessionEnded = (data) => {
  const code = data?.code;
  if (code && SESSION_ENDED_CODES.has(code)) return true;

  const message = typeof data?.message === "string" ? data.message : "";
  return /invalid or expired token/i.test(message);
};

const terminateSession = (message) => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("role");
  localStorage.removeItem("permissions");
  localStorage.removeItem("platformPermissions");
  localStorage.removeItem("user");

  sessionStorage.setItem("auth_flash_message", message || DEFAULT_SESSION_ENDED_MESSAGE);

  const currentPath = window.location.pathname;
  if (
    currentPath !== "/" &&
    !currentPath.startsWith("/onboarding") &&
    !currentPath.startsWith("/accept-invitation") &&
    !currentPath.startsWith("/setup")
  ) {
    window.location.replace("/");
  }
};

const handleUnauthorizedResponse = (error) => {
  if (error?.response?.status === 401) {
    const isLoginEndpoint =
      error.config?.url && String(error.config.url).includes("/auth/login");

    if (!isLoginEndpoint && isSessionEnded(error.response?.data)) {
      terminateSession(error.response?.data?.message);
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
    let data = null;
    try {
      data = await response.clone().json();
    } catch (_) {}

    if (isSessionEnded(data)) {
      terminateSession(data?.message);
    }
  }

  return response;
}

export default api;
