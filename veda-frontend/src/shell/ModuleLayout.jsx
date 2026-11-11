import React from "react";
import { Outlet } from "react-router-dom";
import { Breadcrumbs } from "../components/common/Breadcrumbs";

/**
 * Standard inner layout for modules inside the AppShell.
 * Renders the contextual breadcrumb trail above the module content.
 */
export default function ModuleLayout() {
  return (
    <div className="w-full max-w-full min-w-0 flex flex-col flex-1">
      <Breadcrumbs />
      <div className="flex-1 min-w-0 mt-2">
        <Outlet />
      </div>
    </div>
  );
}

