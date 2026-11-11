import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAccess } from "./useAccess";

/**
 * Route guard that ensures the user is authorized to view a specific module.
 *
 * @param {string} module - The canonical or alias key of the module (e.g. 'sis', 'fees', 'identity_access')
 * @param {boolean} platformOnly - If true, restricts route exclusively to superadmin
 * @param {string} redirectTo - Fallback path if unauthorized
 */
export function ModuleAccessGuard({
  module,
  platformOnly = false,
  redirectTo = "/unauthorized",
  children,
}) {
  const { isPlatformAuthorized, canViewModule, role } = useAccess();

  if (platformOnly && !isPlatformAuthorized) {
    return <Navigate to={redirectTo} replace />;
  }

  if (module && !canViewModule(module)) {
    // If Admin lacks module view permission, redirect to their home dashboard
    const fallback = role === "admin" ? "/admin-front" : redirectTo;
    return <Navigate to={fallback} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export default ModuleAccessGuard;

