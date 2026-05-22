import React from "react";
const ModuleSelectionSidebar = ({
  requiredCount,
  optionalEnabledCount,
  recommendations,
  recommendationSubtitle,
  dependencyWarnings,
  dependencyGuidance = [],
  autoEnabledNotice,
}) => {
  const showDependencySection =
    dependencyWarnings.length > 0 || dependencyGuidance.length > 0;
  return (
    <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-5 text-white shadow-lg">
        <h3 className="text-base font-bold">Module Summary</h3>
        <p className="mt-2 text-sm leading-relaxed text-blue-100">
          VedaSchool will configure all locked core modules and prepare mini setup
          wizards for selected optional modules.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-blue-900/40 px-3 py-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{requiredCount}</p>
            <p className="text-xs font-medium text-blue-100">Required ON</p>
          </div>
          <div className="rounded-lg bg-blue-900/40 px-3 py-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{optionalEnabledCount}</p>
            <p className="text-xs font-medium text-blue-100">Optional ON</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-setup-border bg-white p-5 shadow-sm">
        <h3 className="text-base font-bold text-setup-heading">
          Smart Recommendations
        </h3>
        <p className="mt-1 text-sm text-setup-muted">{recommendationSubtitle}</p>
        <div className="mt-4 space-y-3">
          {recommendations.map((item) => (
            <div
              key={item.key}
              className="rounded-lg border border-setup-border bg-gray-50/80 px-3 py-3 transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <p className="text-sm font-semibold text-setup-heading">
                {item.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-setup-muted sm:text-sm">
                {item.reason}
              </p>
            </div>
          ))}
        </div>
      </div>

      {autoEnabledNotice ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">Auto-enabled</p>
          <p className="mt-1 text-sm leading-relaxed text-blue-800/90">
            {autoEnabledNotice}
          </p>
        </div>
      ) : null}

      {showDependencySection ? (
        <div
          className={`rounded-xl border p-4 ${
            dependencyWarnings.length > 0
              ? "border-amber-300 bg-amber-50"
              : "border-amber-200 bg-amber-50/80"
          }`}
        >
          <p className="text-sm font-semibold text-amber-900">Dependency Check</p>
          {dependencyWarnings.map((warning) => (
            <p
              key={`warn-${warning}`}
              className="mt-2 text-sm font-medium leading-relaxed text-amber-900"
            >
              {warning}
            </p>
          ))}
          {dependencyGuidance.map((text) => (
            <p
              key={`guide-${text}`}
              className={`text-sm leading-relaxed text-amber-900/90 ${
                dependencyWarnings.length > 0 ? "mt-2" : "mt-1.5"
              }`}
            >
              {text}
            </p>
          ))}
        </div>
      ) : null}
    </aside>
  );
};

export default ModuleSelectionSidebar;
