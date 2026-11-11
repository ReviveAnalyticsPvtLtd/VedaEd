import { useMemo, useCallback } from "react";
import { useAuth } from "./AuthProvider";
import {
  checkModuleViewAccess,
  checkActionAccess,
  normalizeModuleKey,
} from "./permissions";

/**
 * Custom hook providing centralized role & permission checks.
 */
export function useAccess() {
  const { user, role, permissions, platformPermissions, isAuthenticated } = useAuth();

  const isSuperAdmin = role === "superadmin";
  const isAdmin = role === "admin";

  const canViewModule = useCallback(
    (moduleName) => {
      if (!isAuthenticated) return false;
      return checkModuleViewAccess(
        { role, platformPermissions, permissions },
        moduleName
      );
    },
    [role, platformPermissions, permissions, isAuthenticated]
  );

  const can = useCallback(
    (action, resource) => {
      if (!isAuthenticated) return false;
      return checkActionAccess(
        { role, platformPermissions, permissions },
        action,
        resource
      );
    },
    [role, platformPermissions, permissions, isAuthenticated]
  );

  const hasPermission = useCallback(
    (permissionKey) => {
      if (!isAuthenticated) return false;
      if (isSuperAdmin) return true;
      if (Array.isArray(permissions)) {
        return permissions.includes(permissionKey);
      }
      return false;
    },
    [isSuperAdmin, permissions, isAuthenticated]
  );

  // Platform-level access is strictly reserved for SuperAdmin
  const isPlatformAuthorized = isSuperAdmin;

  return useMemo(
    () => ({
      user,
      role,
      isAuthenticated,
      isSuperAdmin,
      isAdmin,
      isPlatformAuthorized,
      canViewModule,
      can,
      hasPermission,
      normalizeModuleKey,
    }),
    [
      user,
      role,
      isAuthenticated,
      isSuperAdmin,
      isAdmin,
      isPlatformAuthorized,
      canViewModule,
      can,
      hasPermission,
    ]
  );
}

export default useAccess;

