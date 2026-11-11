import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { isTokenExpired, terminateSession } from "../services/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [role, setRole] = useState(() => localStorage.getItem("role"));
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [permissions, setPermissions] = useState(() => {
    try {
      const stored = localStorage.getItem("permissions");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [platformPermissions, setPlatformPermissions] = useState(() => {
    try {
      const stored = localStorage.getItem("platformPermissions");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Sync state with localStorage if changes occur
  const syncFromStorage = useCallback(() => {
    const currentToken = localStorage.getItem("token");
    setToken(currentToken);
    setRole(localStorage.getItem("role"));

    try {
      const u = localStorage.getItem("user");
      setUser(u ? JSON.parse(u) : null);
    } catch {
      setUser(null);
    }

    try {
      const p = localStorage.getItem("permissions");
      setPermissions(p ? JSON.parse(p) : []);
    } catch {
      setPermissions([]);
    }

    try {
      const pp = localStorage.getItem("platformPermissions");
      setPlatformPermissions(pp ? JSON.parse(pp) : null);
    } catch {
      setPlatformPermissions(null);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, [syncFromStorage]);

  const login = useCallback((authData) => {
    const { token: newToken, refreshToken, role: newRole, permissions: newPerms, platformPermissions: newPlatformPerms, user: newUser } = authData;

    localStorage.setItem("token", newToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    } else {
      localStorage.removeItem("refreshToken");
    }
    localStorage.setItem("role", newRole);
    localStorage.setItem("permissions", JSON.stringify(newPerms || []));
    localStorage.setItem("user", JSON.stringify(newUser));

    if (newRole === "admin" && newPlatformPerms) {
      localStorage.setItem("platformPermissions", JSON.stringify(newPlatformPerms));
    } else {
      localStorage.removeItem("platformPermissions");
    }

    setToken(newToken);
    setRole(newRole);
    setUser(newUser);
    setPermissions(newPerms || []);
    setPlatformPermissions(newPlatformPerms || null);
  }, []);

  const logout = useCallback((message) => {
    terminateSession(message);
    setToken(null);
    setRole(null);
    setUser(null);
    setPermissions([]);
    setPlatformPermissions(null);
  }, []);

  const isAuthenticated = Boolean(token && !isTokenExpired(token));

  const value = {
    token,
    role,
    user,
    permissions,
    platformPermissions,
    isAuthenticated,
    isSuperAdmin: role === "superadmin",
    isAdmin: role === "admin",
    login,
    logout,
    syncFromStorage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Provide a safe fallback reading directly from localStorage if called outside provider
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    let user = null;
    let permissions = [];
    let platformPermissions = null;

    try {
      user = JSON.parse(localStorage.getItem("user") || "null");
      permissions = JSON.parse(localStorage.getItem("permissions") || "[]");
      platformPermissions = JSON.parse(localStorage.getItem("platformPermissions") || "null");
    } catch {}

    return {
      token,
      role,
      user,
      permissions,
      platformPermissions,
      isAuthenticated: Boolean(token && !isTokenExpired(token)),
      isSuperAdmin: role === "superadmin",
      isAdmin: role === "admin",
      login: () => {},
      logout: terminateSession,
      syncFromStorage: () => {},
    };
  }
  return context;
}

export default AuthContext;

