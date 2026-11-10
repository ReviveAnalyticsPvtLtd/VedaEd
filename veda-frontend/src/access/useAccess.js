import { useCallback } from "react";
import { getModule } from "../config/modules";

/**
 * Reads the current role from the same storage key the login flow writes.
 * Kept as a function (not a hook) so non-React helpers can reuse it.
 */
export function getCurrentRole() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role") || null;
}

/**
 * Minimal access helper for Phase 1.
 *
 * Only role and module base paths are exposed today. Capability checks
 * (`can(module, action)`) will be added when the access layer is built out.
 */
export default function useAccess() {
  const role = getCurrentRole();
  const isSuperAdmin = role === "superadmin";

  const basePath = useCallback(
    (moduleId) => {
      const mod = getModule(moduleId);
      if (!mod) return "";
      return mod.basePaths?.[role] || mod.basePaths?.admin || "";
    },
    [role]
  );

  const hasRole = useCallback((roles = []) => roles.includes(role), [role]);

  return { role, isSuperAdmin, basePath, hasRole };
}
