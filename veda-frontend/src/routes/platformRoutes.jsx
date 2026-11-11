import React from "react";
import { Route } from "react-router-dom";
import ModuleAccessGuard from "../access/ModuleAccessGuard";
import {
  AdminList,
  CreateAdmin,
  EditAdmin,
  ViewAdmin,
  InvitePreview,
} from "../platform/identity-access";
import {
  ViewSetupProfile,
  EditSetupProfile,
} from "../platform/institution-setup";
import {
  SuperAdminSettingsManagePlan,
  SuperAdminSettingsBillingDetails,
  SuperAdminSettingsBillingSettings,
} from "../platform/billing";

/**
 * SuperAdmin Platform Routes
 * Gated by ModuleAccessGuard with requiredRole="superadmin"
 */
export function renderPlatformRoutes() {
  return (
    <>
      {/* Identity & Access Management */}
      <Route
        path="/superadmin-front/identity-access"
        element={<ModuleAccessGuard module="identity-access" requiredRole="superadmin" />}
      >
        <Route index element={<AdminList />} />
        <Route path="create" element={<CreateAdmin />} />
        <Route path="preview" element={<InvitePreview />} />
        <Route path="view/:id" element={<ViewAdmin />} />
        <Route path="edit/:id" element={<EditAdmin />} />
      </Route>

      {/* Institution Setup */}
      <Route
        path="/superadmin-front/setup-profile"
        element={<ModuleAccessGuard module="institution-setup" requiredRole="superadmin" />}
      >
        <Route index element={<ViewSetupProfile />} />
        <Route path="edit" element={<EditSetupProfile />} />
      </Route>

      {/* SaaS Billing */}
      <Route
        path="/superadmin/settings/manage-plan"
        element={<ModuleAccessGuard module="billing" requiredRole="superadmin" element={<SuperAdminSettingsManagePlan />} />}
      />
      <Route
        path="/superadmin/settings/billing-details"
        element={<ModuleAccessGuard module="billing" requiredRole="superadmin" element={<SuperAdminSettingsBillingDetails />} />}
      />
      <Route
        path="/superadmin/settings/billing"
        element={<ModuleAccessGuard module="billing" requiredRole="superadmin" element={<SuperAdminSettingsBillingSettings />} />}
      />
    </>
  );
}

export default renderPlatformRoutes;

