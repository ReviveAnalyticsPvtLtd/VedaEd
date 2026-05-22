import React from "react";
import SmartCheckCard from "./SmartCheckCard";
import { DEPENDENCY_MODULES } from "../constants/academicStructure";

const AcademicStructureSidebar = ({
  form,
  estimatedSections,
  gradeRangeLabel,
  summarySubtitle,
  recommendationText,
  dependencyStatus,
  smartCheckMessages,
}) => {
  return (
    <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-5 text-white shadow-lg">
        <h3 className="text-base font-bold">Academic Summary</h3>
        <p className="mt-2 text-sm leading-relaxed text-blue-100">
          {summarySubtitle}
        </p>
        <div className="mt-4 space-y-2">
          {[
            { label: "Academic Year", value: form.academicYear || "—" },
            { label: "Division", value: form.termStructure || "—" },
            {
              label: "Grades",
              value: gradeRangeLabel || "—",
            },
            {
              label: "Estimated Sections",
              value: estimatedSections > 0 ? String(estimatedSections) : "—",
            },
          ].map((row) => (
            <div
              key={row.label}
              className="rounded-lg bg-blue-900/40 px-3 py-2.5 text-sm transition-colors duration-300"
            >
              <span className="text-blue-100/90">{row.label}: </span>
              <span className="font-semibold">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-setup-border bg-white p-5 shadow-sm">
        <h3 className="text-base font-bold text-setup-heading">
          Dependency Impact
        </h3>
        <p className="mt-1 text-sm text-setup-muted">
          These modules depend on this setup.
        </p>
        <ul className="mt-4 space-y-2">
          {DEPENDENCY_MODULES.map((module) => (
            <li
              key={module}
              className="flex items-center justify-between rounded-lg border border-setup-border bg-gray-50/80 px-3 py-2.5 text-sm"
            >
              <span className="font-medium text-setup-heading">{module}</span>
              <span
                className={`text-xs font-bold uppercase tracking-wide ${
                  dependencyStatus === "Depends"
                    ? "text-emerald-600"
                    : "text-amber-600"
                }`}
              >
                {dependencyStatus}
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

export default AcademicStructureSidebar;
