import React from "react";
import ModuleToggle from "./ModuleToggle";
import { getRoleIcon } from "../constants/roleIcons";

const tagStyles = {
  required: "bg-emerald-50 text-emerald-700",
  recommended: "bg-emerald-50 text-emerald-700",
  optional: "bg-gray-100 text-gray-600",
  neutral: "bg-gray-100 text-gray-600",
};

const RoleCard = ({
  role,
  enabled,
  locked = false,
  autoLocked = false,
  onToggle,
}) => {
  const Icon = getRoleIcon(role.icon);
  const isActive = enabled;
  const isToggleDisabled = locked;

  return (
    <div
      className={`group relative flex flex-col rounded-xl border p-4 transition-all duration-300 hover:shadow-md ${
        isActive
          ? "border-setup-primary bg-blue-50/50 shadow-sm"
          : "border-setup-border bg-white hover:border-gray-300"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            isActive ? "bg-blue-100 text-setup-primary" : "bg-gray-100 text-gray-500"
          }`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        {!isToggleDisabled ? (
          <ModuleToggle
            checked={enabled}
            onChange={() => onToggle(role.key, !enabled)}
            ariaLabel={`Toggle ${role.key}`}
          />
        ) : (
          <ModuleToggle
            checked={enabled}
            disabled
            ariaLabel={`${role.key} locked`}
          />
        )}
      </div>

      <h4 className="text-sm font-bold text-setup-heading">{role.key}</h4>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-setup-muted">
        {role.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {autoLocked ? (
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
            Auto from Module Selection
          </span>
        ) : null}
        {(role.tags || []).map((tag) => (
          <span
            key={tag.label}
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              tagStyles[tag.variant] || tagStyles.optional
            }`}
          >
            {tag.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RoleCard;
