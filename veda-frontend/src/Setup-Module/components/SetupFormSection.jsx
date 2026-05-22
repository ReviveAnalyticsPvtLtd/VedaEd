import React from "react";

const SetupFormSection = ({ title, subtitle, required, badge, children }) => {
  const trailingLabel = required ? "Required" : badge;
  const trailingClass = required
    ? "bg-amber-50 text-amber-800"
    : "bg-emerald-50 text-emerald-800";

  return (
    <section className="rounded-xl border border-setup-border bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-setup-heading">{title}</h3>
          {subtitle ? (
            <p className="mt-1 text-sm leading-relaxed text-setup-muted">{subtitle}</p>
          ) : null}
        </div>
        {trailingLabel ? (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${trailingClass}`}
          >
            {trailingLabel}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
};

export default SetupFormSection;
