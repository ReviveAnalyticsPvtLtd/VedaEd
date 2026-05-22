import React from "react";
import SetupStepHeader from "./SetupStepHeader";
import RoleCard from "./RoleCard";
import {
  APPROVAL_WORKFLOW_OPTIONS,
  CORE_ROLES,
  DEFAULT_PERMISSION_MATRIX,
  DEPARTMENT_SETUP_OPTIONS,
  OPTIONAL_ROLES,
  STAFF_CATEGORY_OPTIONS,
} from "../constants/rolesHrFoundation";
import { formatIdPreview, permissionChipClass } from "../utils/rolesHrFoundation";

const RolesHrFoundationForm = ({
  form,
  errors,
  permissionMatrix,
  onFieldChange,
  onToggleOptionalRole,
  onToggleCategory,
}) => {
  return (
    <div className="space-y-6">
      <SetupStepHeader
        badge="User Access Foundation"
        title="Set up roles, permissions, and HR basics"
        description="Define who can access what, create staff categories, and prepare the foundation for teacher onboarding, attendance, timetable, approvals, and operations."
      />

      <section className="rounded-xl border border-setup-border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-setup-heading">Recommended Roles</h3>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Safe Defaults
          </span>
        </div>
        <p className="mb-5 text-sm text-setup-muted">
          Core roles are locked for safe operations. Optional operational roles can
          be enabled now or later.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CORE_ROLES.map((role) => (
            <RoleCard
              key={role.key}
              role={role}
              enabled
              locked
            />
          ))}
          {OPTIONAL_ROLES.map((role) => (
            <RoleCard
              key={role.key}
              role={role}
              enabled={form.optionalRoles.includes(role.key)}
              onToggle={onToggleOptionalRole}
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-setup-border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-setup-heading">
            Permission Setup Style
          </h3>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Recommended
          </span>
        </div>
        <p className="mb-4 text-sm text-setup-muted">
          Choose how deeply you want to configure permissions now.
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { key: "recommended", label: "Use Recommended Permissions" },
            { key: "custom", label: "Customize Permissions" },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onFieldChange("permissionSetupStyle", opt.key)}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                form.permissionSetupStyle === opt.key
                  ? "bg-setup-primary text-white shadow-md"
                  : "border border-setup-border bg-white text-setup-heading hover:border-setup-primary hover:text-setup-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-setup-border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-setup-heading">
            Basic HR Foundation
          </h3>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Required
          </span>
        </div>
        <p className="mb-5 text-sm text-setup-muted">
          Create staff categories and ID rules needed for teacher onboarding and staff
          operations.
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-setup-heading">
              Staff ID Format
            </label>
            <input
              type="text"
              value={form.staffIdFormat}
              onChange={(e) => onFieldChange("staffIdFormat", e.target.value)}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-setup-primary ${
                errors.staffIdFormat ? "border-red-400" : "border-setup-border"
              }`}
            />
            <p className="mt-1 text-xs text-setup-muted">
              Example output: {formatIdPreview(form.staffIdFormat)}
            </p>
            {errors.staffIdFormat ? (
              <p className="mt-1 text-xs text-red-600">{errors.staffIdFormat}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-setup-heading">
              Teacher ID Format
            </label>
            <input
              type="text"
              value={form.teacherIdFormat}
              onChange={(e) => onFieldChange("teacherIdFormat", e.target.value)}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-setup-primary ${
                errors.teacherIdFormat ? "border-red-400" : "border-setup-border"
              }`}
            />
            <p className="mt-1 text-xs text-setup-muted">
              Example output: {formatIdPreview(form.teacherIdFormat)}
            </p>
            {errors.teacherIdFormat ? (
              <p className="mt-1 text-xs text-red-600">{errors.teacherIdFormat}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-setup-heading">
            Staff Categories
          </label>
          <div className="flex flex-wrap gap-2">
            {STAFF_CATEGORY_OPTIONS.map((cat) => {
              const selected = form.staffCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onToggleCategory(cat)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                    selected
                      ? "bg-setup-primary text-white shadow-sm"
                      : "border border-setup-border bg-white text-setup-heading hover:border-setup-primary"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
          {errors.staffCategories ? (
            <p className="mt-1 text-xs text-red-600">{errors.staffCategories}</p>
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-setup-heading">
              Department Setup
            </label>
            <select
              value={form.departmentSetup}
              onChange={(e) => onFieldChange("departmentSetup", e.target.value)}
              className="w-full rounded-lg border border-setup-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-setup-primary"
            >
              {DEPARTMENT_SETUP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-setup-heading">
              Approval Workflow
            </label>
            <select
              value={form.approvalWorkflow}
              onChange={(e) => onFieldChange("approvalWorkflow", e.target.value)}
              className="w-full rounded-lg border border-setup-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-setup-primary"
            >
              {APPROVAL_WORKFLOW_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-setup-border bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-base font-bold text-setup-heading">Permission Preview</h3>
        <p className="mt-1 text-sm text-setup-muted">
          Initial matrix generated from recommended permissions.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <th className="px-3 pb-1">Role</th>
                <th className="px-3 pb-1">Academic</th>
                <th className="px-3 pb-1">Fees</th>
                <th className="px-3 pb-1">Setup</th>
                <th className="px-3 pb-1">Portal</th>
              </tr>
            </thead>
            <tbody>
              {(permissionMatrix.length > 0
                ? permissionMatrix
                : DEFAULT_PERMISSION_MATRIX
              ).map((row) => (
                <tr key={row.role}>
                  <td className="rounded-l-lg bg-gray-50 px-3 py-3 font-semibold text-setup-heading">
                    {row.role}
                  </td>
                  {["academic", "fees", "setup", "portal"].map((col, idx) => (
                    <td
                      key={col}
                      className={`bg-gray-50 px-3 py-3 ${
                        idx === 3 ? "rounded-r-lg" : ""
                      }`}
                    >
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${permissionChipClass(row[col])}`}
                      >
                        {row[col]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default RolesHrFoundationForm;
