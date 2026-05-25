import React from "react";

const AttendanceModeCard = ({ mode, selected, onSelect }) => {
  const Icon = mode.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex h-full w-full flex-col rounded-2xl border p-5 text-left transition-all duration-200 ${
        selected
          ? "border-setup-primary bg-blue-50/70 shadow-md ring-1 ring-setup-primary/25"
          : "border-setup-border bg-white shadow-sm hover:border-blue-300 hover:shadow-md"
      }`}
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-setup-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mt-4 text-base font-semibold text-setup-heading">{mode.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-setup-muted">
        {mode.description}
      </p>
    </button>
  );
};

export default AttendanceModeCard;
