import React from "react";
import SmartCheckCard from "./SmartCheckCard";

const statusClass = (status) =>
  status === "Ready" ? "text-emerald-600" : "text-emerald-600";

const RolesHrFoundationSidebar = ({
  coreRoleCount,
  optionalRolesOnCount,
  recommendationText,
  dependencyStatus,
  smartCheckMessages,
}) => {
  return (
    <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-5 text-white shadow-lg">
        <h3 className="text-base font-bold">Access Summary</h3>
        <p className="mt-2 text-sm leading-relaxed text-blue-100">
          Recommended role matrix and HR foundation will be created during school
          launch.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-blue-900/40 px-3 py-3 transition-all duration-300">
            <strong className="block text-2xl font-bold">{coreRoleCount}</strong>
            <span className="text-xs text-blue-100">Core Roles</span>
          </div>
          <div className="rounded-lg bg-blue-900/40 px-3 py-3 transition-all duration-300">
            <strong className="block text-2xl font-bold transition-all duration-300">
              {optionalRolesOnCount}
            </strong>
            <span className="text-xs text-blue-100">Optional Roles ON</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-setup-border bg-white p-5 shadow-sm">
        <h3 className="text-base font-bold text-setup-heading">Dependency Impact</h3>
        <p className="mt-1 text-sm text-setup-muted">
          These setup areas use roles and HR foundation.
        </p>
        <ul className="mt-4 space-y-2">
          {dependencyStatus.map(({ module, status }) => (
            <li
              key={module}
              className="flex items-center justify-between rounded-lg border border-setup-border bg-gray-50/80 px-3 py-2.5 text-sm"
            >
              <span className="font-medium text-setup-heading">{module}</span>
              <span
                className={`text-xs font-bold uppercase tracking-wide ${statusClass(status)}`}
              >
                {status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-setup-border bg-white p-5 shadow-sm">
        <h3 className="text-base font-bold text-setup-heading">Recommendation</h3>
        <p className="mt-2 text-sm leading-relaxed text-setup-muted">
          {recommendationText}
        </p>
      </div>

      <SmartCheckCard messages={smartCheckMessages} />
    </aside>
  );
};

export default RolesHrFoundationSidebar;
