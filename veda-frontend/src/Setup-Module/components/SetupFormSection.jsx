import React from "react";

const SetupFormSection = ({ title, subtitle, required, children }) => {
  return (
    <section className="rounded-xl border border-setup-border bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-setup-heading">{title}</h3>
            {required ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                Required
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-1 text-sm leading-relaxed text-setup-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
};

export default SetupFormSection;
