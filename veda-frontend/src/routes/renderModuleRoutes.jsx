import React from "react";
import { Route } from "react-router-dom";
import ModuleAccessGuard from "../access/ModuleAccessGuard";
import { OPERATIONAL_MODULES } from "../config/modules";

/**
 * Helper to render an operational module route guarded by ModuleAccessGuard
 */
export function renderModuleRoute(moduleKey, path, element, children = null) {
  return (
    <Route
      key={moduleKey}
      path={path}
      element={<ModuleAccessGuard module={moduleKey} element={element} />}
    >
      {children}
    </Route>
  );
}

export default renderModuleRoute;

