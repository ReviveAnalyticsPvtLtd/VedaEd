import axios from "axios";
import config from "../config";

const DEFAULT_SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please log in again.";

const SESSION_ENDED_CODES = new Set([
  "SESSION_REPLACED",
  "SESSION_EXPIRED",
  "TOKEN_EXPIRED",
  "INVALID_TOKEN",
]);

export function isTokenExpired(token) {
  if (!token || typeof token !== "string") return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now() + 5000;
  } catch (_) {
    return true;
  }
}

// A 401 only ends the session when the backend explicitly says the session is
// over. A plain authorization failure (for example a request sent without a
// token) must not wipe local state or redirect the whole app away.
export const isSessionEnded = (data) => {
  const code = data?.code;
  if (code && SESSION_ENDED_CODES.has(code)) return true;

  const message = typeof data?.message === "string" ? data.message : "";
  return /invalid or expired token|session.*expired|token.*expired|jwt expired/i.test(message);
};

export const terminateSession = (message) => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("role");
  localStorage.removeItem("permissions");
  localStorage.removeItem("platformPermissions");
  localStorage.removeItem("user");

  sessionStorage.setItem("auth_flash_message", message || DEFAULT_SESSION_EXPIRED_MESSAGE);

  const currentPath = window.location.pathname;
  if (
    currentPath !== "/" &&
    !currentPath.startsWith("/onboarding") &&
    !currentPath.startsWith("/accept-invitation")
  ) {
    window.location.replace("/");
  }
};

let refreshPromise = null;

export async function refreshSessionToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await axios.post(`${config.API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        const { token: newToken, refreshToken: newRefreshToken } = response.data || {};
        if (newToken) {
          localStorage.setItem("token", newToken);
          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
          }
          return newToken;
        }
        return null;
      } catch (err) {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

const handleUnauthorizedResponse = async (error) => {
  const originalRequest = error.config;
  if (error?.response?.status === 401 && originalRequest) {
    const isLoginOrRefreshEndpoint =
      originalRequest.url &&
      (String(originalRequest.url).includes("/auth/login") ||
       String(originalRequest.url).includes("/auth/refresh"));

    if (!isLoginOrRefreshEndpoint && isSessionEnded(error.response?.data)) {
      if (!originalRequest._retry && localStorage.getItem("refreshToken")) {
        originalRequest._retry = true;
        const newToken = await refreshSessionToken();
        if (newToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        }
      }

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

api.interceptors.request.use(async (request) => {
  let token = localStorage.getItem("token");

  // Proactively handle expired token before sending doomed request
  if (token && isTokenExpired(token)) {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      const refreshedToken = await refreshSessionToken();
      if (refreshedToken) {
        token = refreshedToken;
      } else {
        terminateSession("Your session has expired. Please log in again.");
        return Promise.reject(new Error("Session expired and refresh failed."));
      }
    } else {
      terminateSession("Your session has expired. Please log in again.");
      return Promise.reject(new Error("Session expired."));
    }
  }

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
  let token = localStorage.getItem("token");

  if (token && isTokenExpired(token)) {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      const refreshed = await refreshSessionToken();
      if (refreshed) {
        token = refreshed;
      } else {
        terminateSession("Your session has expired. Please log in again.");
        throw new Error("Session expired and refresh failed.");
      }
    } else {
      terminateSession("Your session has expired. Please log in again.");
      throw new Error("Session expired.");
    }
  }

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
