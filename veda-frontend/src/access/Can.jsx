import React from "react";
import { useAccess } from "./useAccess";

/**
 * Declarative component for conditional rendering based on user permissions.
 *
 * Usage:
 *   <Can perform="create" on="sis">
 *     <button>Add Student</button>
 *   </Can>
 *
 *   <Can permission="delete_student">
 *     <button>Delete</button>
 *   </Can>
 */
export function Can({ perform, on, permission, fallback = null, children }) {
  const { can, hasPermission } = useAccess();

  let isAllowed = false;

  if (permission) {
    isAllowed = hasPermission(permission);
  } else if (perform && on) {
    isAllowed = can(perform, on);
  } else if (on) {
    // If only 'on' is provided, check view access
    isAllowed = can("view", on);
  }

  return isAllowed ? <>{children}</> : fallback;
}

export default Can;

