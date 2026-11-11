import React from "react";
import AppShell from "../shell/AppShell";

/**
 * Backward-compatible wrapper delegating to unified AppShell
 */
export default function SuperAdminShellLayout() {
  return <AppShell role="superadmin" />;
}
