import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { isTokenExpired, terminateSession } from "../services/apiClient";
import {
  AUTH_CHANGED_EVENT,
  clearAuthStorage,
  ensureTabOwnership,
  getAuthRole,
  getAuthSessionId,
  getAuthSnapshot,
  getAuthToken,
  getAuthUserId,
  getStoredPermissions,
  getStoredPlatformPermissions,
  getStoredUser,
  migrateLegacyAuthStorage,
  setAuthFlashMessage,
  setAuthSession,
  UNVERIFIABLE_SESSION_MESSAGE,
} from "../utils/authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAuthToken());
  const [role, setRole] = useState(() => getAuthRole());
  const [user, setUser] = useState(() => getStoredUser());
  const [permissions, setPermissions] = useState(() => getStoredPermissions());
  const [platformPermissions, setPlatformPermissions] = useState(() =>
    getStoredPlatformPermissions()
  );
  const [sessionId, setSessionId] = useState(() => getAuthSessionId());
  const [userIdState, setUserIdState] = useState(() => getAuthUserId());
  const [authReady, setAuthReady] = useState(false);

  const syncFromTabStorage = useCallback(() => {
    const snapshot = getAuthSnapshot();
    setToken(snapshot.token);
    setRole(snapshot.role);
    setUser(snapshot.user);
    setPermissions(snapshot.permissions || []);
    setPlatformPermissions(snapshot.platformPermissions);
    setSessionId(snapshot.sessionId);
    setUserIdState(snapshot.userId);
  }, []);

  useEffect(() => {
    // Legacy global auth keys are removed once; they are never read again.
    migrateLegacyAuthStorage();

    let cancelled = false;

    ensureTabOwnership()
      .then((owned) => {
        if (cancelled) return;
        if (!owned) {
          syncFromTabStorage();
        }
        setAuthReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        clearAuthStorage();
        setAuthFlashMessage(UNVERIFIABLE_SESSION_MESSAGE);
        syncFromTabStorage();
        setAuthReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [syncFromTabStorage]);

  useEffect(() => {
    window.addEventListener(AUTH_CHANGED_EVENT, syncFromTabStorage);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, syncFromTabStorage);
  }, [syncFromTabStorage]);

  const login = useCallback((authData) => {
    const snapshot = setAuthSession(authData);

    setToken(snapshot.token);
    setRole(snapshot.role);
    setUser(snapshot.user);
    setPermissions(snapshot.permissions || []);
    setPlatformPermissions(snapshot.platformPermissions);
    setSessionId(snapshot.sessionId);
    setUserIdState(snapshot.userId);
  }, []);

  const logout = useCallback((message) => {
    terminateSession(message);
    setToken(null);
    setRole(null);
    setUser(null);
    setPermissions([]);
    setPlatformPermissions(null);
    setSessionId(null);
    setUserIdState(null);
  }, []);

  const isAuthenticated = Boolean(token && !isTokenExpired(token));

  const value = {
    token,
    role,
    user,
    permissions,
    platformPermissions,
    sessionId,
    userId: userIdState,
    isAuthenticated,
    authReady,
    isSuperAdmin: role === "superadmin",
    isAdmin: role === "admin",
    login,
    logout,
    syncFromStorage: syncFromTabStorage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    const snapshot = getAuthSnapshot();
    return {
      ...snapshot,
      isAuthenticated: Boolean(snapshot.token && !isTokenExpired(snapshot.token)),
      authReady: true,
      isSuperAdmin: snapshot.role === "superadmin",
      isAdmin: snapshot.role === "admin",
      login: () => {},
      logout: () => {
        clearAuthStorage();
        terminateSession();
      },
      syncFromStorage: () => {},
    };
  }
  return context;
}

export default AuthContext;
