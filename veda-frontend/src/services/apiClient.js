import axios from "axios";
import config from "../config";
import {
  clearAuthStorage,
  decodeTokenPayload,
  ensureTabOwnership,
  getAuthRole,
  getAuthSessionId,
  getAuthToken,
  getAuthUserId,
  getRefreshToken,
  isTokenExpired,
  setAuthFlashMessage,
  updateAuthTokens,
  SESSION_EXPIRED_MESSAGE,
  SESSION_REPLACED_MESSAGE,
} from "../utils/authStorage";

export { isTokenExpired };

export const AUTH_ERROR = Object.freeze({
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  SESSION_REPLACED: "SESSION_REPLACED",
  INVALID_REFRESH_TOKEN: "INVALID_REFRESH_TOKEN",
  UNAUTHORIZED: "UNAUTHORIZED",
});

const DEFAULT_SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please log in again.";

const AUTH_FREE_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/check-user",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify",
];

const isAuthFreeEndpoint = (url) => {
  if (!url) return false;
  const value = String(url);
  return AUTH_FREE_ENDPOINTS.some((endpoint) => value.includes(endpoint));
};

export function classifyAuthError(data, status) {
  const code = typeof data?.code === "string" ? data.code : "";
  const message = typeof data?.message === "string" ? data.message : "";

  if (code === AUTH_ERROR.SESSION_REPLACED) return AUTH_ERROR.SESSION_REPLACED;
  if (code === AUTH_ERROR.SESSION_EXPIRED) return AUTH_ERROR.SESSION_EXPIRED;
  if (code === AUTH_ERROR.TOKEN_EXPIRED) return AUTH_ERROR.TOKEN_EXPIRED;
  if (
    code === AUTH_ERROR.INVALID_REFRESH_TOKEN ||
    code === "REVOKED_REFRESH_TOKEN" ||
    code === "REFRESH_TOKEN_EXPIRED" ||
    code === "MISSING_REFRESH_TOKEN"
  ) {
    return AUTH_ERROR.INVALID_REFRESH_TOKEN;
  }
  if (code === AUTH_ERROR.UNAUTHORIZED) return AUTH_ERROR.UNAUTHORIZED;

  if (status !== 401) return null;

  if (/logged in from another device|signed in from another device|session was ended/i.test(message)) {
    return AUTH_ERROR.SESSION_REPLACED;
  }
  if (/session (has )?expired/i.test(message)) return AUTH_ERROR.SESSION_EXPIRED;
  if (/jwt expired|token (has )?expired/i.test(message)) return AUTH_ERROR.TOKEN_EXPIRED;

  return AUTH_ERROR.UNAUTHORIZED;
}

// Retained for callers that still ask "does this response end the session?".
export const isSessionEnded = (data) => {
  const code = classifyAuthError(data, 401);
  return (
    code === AUTH_ERROR.SESSION_REPLACED ||
    code === AUTH_ERROR.SESSION_EXPIRED ||
    code === AUTH_ERROR.TOKEN_EXPIRED
  );
};

let redirectInProgress = false;

export function terminateSession(messageOrOptions) {
  const options =
    typeof messageOrOptions === "string"
      ? { message: messageOrOptions }
      : messageOrOptions || {};

  const code = options.code;
  const message =
    options.message ||
    (code === AUTH_ERROR.SESSION_REPLACED
      ? SESSION_REPLACED_MESSAGE
      : DEFAULT_SESSION_EXPIRED_MESSAGE);

  clearAuthStorage();
  setAuthFlashMessage(message);
  refreshPromise = null;

  if (typeof window === "undefined" || !window.location) return;

  if (redirectInProgress) return;

  const currentPath = window.location.pathname || "";
  if (
    currentPath !== "/" &&
    !currentPath.startsWith("/onboarding") &&
    !currentPath.startsWith("/accept-invitation")
  ) {
    redirectInProgress = true;
    window.location.replace("/");
  }
}

let refreshPromise = null;

const buildAuthError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  error.isAuthError = true;
  return error;
};

async function assertTabOwnership() {
  const owned = await ensureTabOwnership();
  if (!owned) {
    throw buildAuthError(
      AUTH_ERROR.SESSION_REPLACED,
      "This tab is not authorized to use this session. Please sign in again."
    );
  }
}

const validateRefreshedIdentity = (data, newToken) => {
  const payload = decodeTokenPayload(newToken);
  const expectedUserId = getAuthUserId();
  const expectedSessionId = getAuthSessionId();
  const expectedRole = getAuthRole();

  const returnedUserId = data?.user?._id || data?.user?.id || payload?.userId;
  if (!returnedUserId || !expectedUserId || String(returnedUserId) !== String(expectedUserId)) {
    return {
      ok: false,
      code: AUTH_ERROR.UNAUTHORIZED,
      message: "Your session could not be verified. Please sign in again.",
    };
  }

  const returnedSessionId = data?.sessionId || payload?.sessionId || null;
  if (expectedSessionId && returnedSessionId && String(returnedSessionId) !== String(expectedSessionId)) {
    return {
      ok: false,
      code: AUTH_ERROR.SESSION_REPLACED,
      message: SESSION_REPLACED_MESSAGE,
    };
  }

  if (
    payload?.role &&
    expectedRole &&
    String(payload.role).toLowerCase() !== String(expectedRole).toLowerCase()
  ) {
    return {
      ok: false,
      code: AUTH_ERROR.UNAUTHORIZED,
      message: "Your account access has changed. Please sign in again.",
    };
  }

  return { ok: true, userId: returnedUserId, sessionId: returnedSessionId };
};

export async function refreshSessionToken() {
  try {
    await assertTabOwnership();
  } catch (_) {
    return null;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { _skipAuthRefresh: true }
      );
      const data = response.data || {};
      const newToken = data.token;
      if (!newToken) {
        terminateSession({ code: AUTH_ERROR.UNAUTHORIZED, message: DEFAULT_SESSION_EXPIRED_MESSAGE });
        return null;
      }

      const identity = validateRefreshedIdentity(data, newToken);
      if (!identity.ok) {
        terminateSession({ code: identity.code, message: identity.message });
        return null;
      }

      updateAuthTokens({
        token: newToken,
        refreshToken: data.refreshToken,
        sessionId: identity.sessionId || getAuthSessionId(),
        userId: identity.userId,
      });

      return newToken;
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data || {};
      const code = classifyAuthError(data, status);

      if (code === AUTH_ERROR.SESSION_REPLACED) {
        terminateSession({ code, message: data.message || SESSION_REPLACED_MESSAGE });
      } else if (code === AUTH_ERROR.SESSION_EXPIRED) {
        terminateSession({ code, message: data.message || SESSION_EXPIRED_MESSAGE });
      } else {
        terminateSession({
          code: code || AUTH_ERROR.UNAUTHORIZED,
          message: data.message || DEFAULT_SESSION_EXPIRED_MESSAGE,
        });
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

const handleUnauthorizedResponse = async (error) => {
  const originalRequest = error.config;
  const status = error.response?.status;

  if (status !== 401 || !originalRequest) {
    return Promise.reject(error);
  }

  const data = error.response?.data;
  const code = classifyAuthError(data, status);

  if (originalRequest._skipAuthRefresh || isAuthFreeEndpoint(originalRequest.url)) {
    if (code === AUTH_ERROR.SESSION_REPLACED && !isAuthFreeEndpoint(originalRequest.url)) {
      terminateSession({ code, message: data?.message || SESSION_REPLACED_MESSAGE });
    }
    return Promise.reject(error);
  }

  if (code === AUTH_ERROR.SESSION_REPLACED) {
    terminateSession({ code, message: data?.message || SESSION_REPLACED_MESSAGE });
    return Promise.reject(error);
  }

  if (code === AUTH_ERROR.SESSION_EXPIRED) {
    terminateSession({ code, message: data?.message || SESSION_EXPIRED_MESSAGE });
    return Promise.reject(error);
  }

  if (code === AUTH_ERROR.INVALID_REFRESH_TOKEN) {
    terminateSession({
      code,
      message: data?.message || DEFAULT_SESSION_EXPIRED_MESSAGE,
    });
    return Promise.reject(error);
  }

  // A plain authorization failure is not a session-ending event.
  if (code !== AUTH_ERROR.TOKEN_EXPIRED) {
    return Promise.reject(error);
  }

  // At most one retry after a successful refresh.
  if (originalRequest._retry) {
    terminateSession({ code: AUTH_ERROR.SESSION_EXPIRED, message: DEFAULT_SESSION_EXPIRED_MESSAGE });
    return Promise.reject(error);
  }

  if (!getRefreshToken()) {
    terminateSession({ code: AUTH_ERROR.SESSION_EXPIRED, message: DEFAULT_SESSION_EXPIRED_MESSAGE });
    return Promise.reject(error);
  }

  originalRequest._retry = true;
  const newToken = await refreshSessionToken();
  if (!newToken) {
    return Promise.reject(error);
  }

  originalRequest.headers = {
    ...(originalRequest.headers || {}),
    Authorization: `Bearer ${newToken}`,
  };

  // originalRequest still carries its body and headers.
  return axios(originalRequest);
};

axios.interceptors.response.use((response) => response, handleUnauthorizedResponse);

const prepareGlobalRequest = async (request) => {
  if (request._skipAuthRefresh || isAuthFreeEndpoint(request.url)) {
    return request;
  }
  await assertTabOwnership();
  return request;
};

axios.interceptors.request.use(prepareGlobalRequest);

const api = axios.create({
  baseURL: config.API_BASE_URL,
});

const prepareRequestToken = async (request) => {
  if (request._skipAuthRefresh || isAuthFreeEndpoint(request.url)) {
    return request;
  }

  // Never attach credentials to a tab that has not proven ownership.
  await assertTabOwnership();

  let token = getAuthToken();

  if (token && isTokenExpired(token)) {
    if (getRefreshToken()) {
      const refreshedToken = await refreshSessionToken();
      if (!refreshedToken) {
        throw buildAuthError(
          AUTH_ERROR.SESSION_EXPIRED,
          DEFAULT_SESSION_EXPIRED_MESSAGE
        );
      }
      token = refreshedToken;
    } else {
      terminateSession({ code: AUTH_ERROR.SESSION_EXPIRED, message: DEFAULT_SESSION_EXPIRED_MESSAGE });
      throw buildAuthError(AUTH_ERROR.SESSION_EXPIRED, DEFAULT_SESSION_EXPIRED_MESSAGE);
    }
  }

  if (token) {
    request.headers = request.headers || {};
    const headers = request.headers;
    if (typeof headers.set === "function") {
      if (!headers.get("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    } else if (!headers.Authorization && !headers.authorization) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return request;
};

api.interceptors.request.use(prepareRequestToken);

api.interceptors.response.use((response) => response, handleUnauthorizedResponse);

export async function authFetch(path, options = {}) {
  // Ownership must be proven before any token is sent.
  await assertTabOwnership();

  const url = /^https?:\/\//i.test(path) ? path : `${config.API_BASE_URL}${path}`;
  const { _retried, ...requestOptions } = options;

  let token = getAuthToken();

  if (token && isTokenExpired(token)) {
    if (getRefreshToken()) {
      const refreshed = await refreshSessionToken();
      if (!refreshed) {
        throw buildAuthError(AUTH_ERROR.SESSION_EXPIRED, DEFAULT_SESSION_EXPIRED_MESSAGE);
      }
      token = refreshed;
    } else {
      terminateSession({ code: AUTH_ERROR.SESSION_EXPIRED, message: DEFAULT_SESSION_EXPIRED_MESSAGE });
      throw buildAuthError(AUTH_ERROR.SESSION_EXPIRED, DEFAULT_SESSION_EXPIRED_MESSAGE);
    }
  }

  const buildHeaders = (authToken) => ({
    ...(requestOptions.headers || {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  });

  let response = await fetch(url, { ...requestOptions, headers: buildHeaders(token) });

  if (response.status !== 401) return response;

  const data = await response.clone().json().catch(() => null);
  const code = classifyAuthError(data, 401);

  if (code === AUTH_ERROR.SESSION_REPLACED) {
    terminateSession({ code, message: data?.message || SESSION_REPLACED_MESSAGE });
    return response;
  }
  if (code === AUTH_ERROR.SESSION_EXPIRED) {
    terminateSession({ code, message: data?.message || SESSION_EXPIRED_MESSAGE });
    return response;
  }
  if (code === AUTH_ERROR.INVALID_REFRESH_TOKEN) {
    terminateSession({ code, message: data?.message || DEFAULT_SESSION_EXPIRED_MESSAGE });
    return response;
  }

  if (code === AUTH_ERROR.TOKEN_EXPIRED && !_retried && getRefreshToken()) {
    const newToken = await refreshSessionToken();
    if (newToken) {
      response = await fetch(url, { ...requestOptions, headers: buildHeaders(newToken) });
    }
  }

  return response;
}

export default api;
