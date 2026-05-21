import React from "react";

const SetupExperienceCard = ({
  title,
  description,
  recommended,
  selected,
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border p-5 text-left transition-all duration-200 ${
        selected
          ? "border-setup-primary bg-white shadow-sm"
          : "border-setup-border bg-white hover:border-blue-300"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-semibold text-setup-heading">{title}</span>
        {recommended && (
          <span className="rounded-full bg-setup-success px-2.5 py-0.5 text-xs font-semibold text-white">
            Recommended
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-setup-muted">{description}</p>
    </button>
  );
};

export default SetupExperienceCard;
