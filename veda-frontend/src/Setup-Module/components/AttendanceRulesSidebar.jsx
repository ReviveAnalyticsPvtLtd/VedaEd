import React from "react";
import SmartCheckCard from "./SmartCheckCard";

const AttendanceRulesSidebar = ({
  summary,
  dependencyStatus,
  recommendationText,
  smartCheckMessages,
}) => {
  const pills = [
    { label: "Mode", value: summary.mode },
    { label: "Timing", value: summary.timing },
    { label: "Late After", value: summary.lateAfter },
    { label: "Minimum Attendance", value: summary.minimumAttendance },
  ];

  return (
    <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-5 text-white shadow-lg">
        <h3 className="text-base font-bold">Attendance Summary</h3>
        <p className="mt-2 text-sm leading-relaxed text-blue-100">
          {summary.mode === "Hybrid"
            ? "Hybrid attendance is recommended for K12 schools with higher grades."
            : "Summary updates as you change attendance settings."}
        </p>
        <div className="mt-4 space-y-2">
          {pills.map(({ label, value }) => (
            <div
              key={label}
              className="rounded-lg bg-blue-900/40 px-3 py-2.5 text-sm transition-all duration-300"
            >
              <span className="text-blue-200">{label}: </span>
              <span className="font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-setup-border bg-white p-5 shadow-sm">
        <h3 className="text-base font-bold text-setup-heading">Dependency Impact</h3>
        <p className="mt-1 text-sm text-setup-muted">
          Attendance rules feed these areas.
        </p>
        <ul className="mt-4 space-y-2">
          {dependencyStatus.map(({ module, status }) => (
            <li
              key={module}
              className="flex items-center justify-between rounded-lg border border-setup-border bg-gray-50/80 px-3 py-2.5 text-sm"
            >
              <span className="font-medium text-setup-heading">{module}</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
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

export default AttendanceRulesSidebar;
