import React from "react";
import { getModuleIcon } from "../constants/moduleIcons";
import ModuleToggle from "./ModuleToggle";

const TAG_STYLES = {
  required: "bg-emerald-50 text-emerald-700",
  recommended: "bg-emerald-50 text-emerald-700",
  optional: "bg-slate-100 text-slate-600",
  neutral: "bg-slate-100 text-slate-600",
  link: "bg-violet-50 text-violet-700",
  dependency: "bg-blue-50 text-blue-700",
};

const ModuleCard = ({
  module,
  checked,
  locked = false,
  onToggle,
}) => {
  const { title, description, icon, tags = [] } = module;
  const Icon = getModuleIcon(icon);
  const isActive = locked || checked;

  return (
    <div
      className={`group rounded-xl border bg-white p-5 shadow-sm transition-all duration-200 sm:p-6 ${
        isActive
          ? "border-setup-primary/80 shadow-md ring-1 ring-setup-primary/10"
          : "border-setup-border hover:border-gray-300 hover:shadow-md"
      } ${!locked && onToggle ? "cursor-pointer" : ""}`}
      onClick={!locked && onToggle ? onToggle : undefined}
      onKeyDown={
        !locked && onToggle
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle();
              }
            }
          : undefined
      }
      role={!locked && onToggle ? "button" : undefined}
      tabIndex={!locked && onToggle ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-setup-primary sm:h-12 sm:w-12"
            aria-hidden
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          <h4 className="pt-1.5 text-[15px] font-bold leading-snug text-setup-heading sm:text-base">
            {title}
          </h4>
        </div>
        <ModuleToggle
          checked={isActive}
          disabled={locked}
          onChange={onToggle}
          ariaLabel={`${title} module`}
        />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-setup-muted">
        {description}
      </p>

      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={`${module.key}-${tag.label}`}
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                TAG_STYLES[tag.variant] || TAG_STYLES.optional
              }`}
            >
              {tag.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default ModuleCard;
