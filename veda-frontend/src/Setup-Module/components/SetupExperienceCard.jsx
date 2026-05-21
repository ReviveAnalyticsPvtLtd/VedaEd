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
      className={`w-full rounded-xl border-2 p-5 text-left transition-all duration-200 ${
        selected
          ? "border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-100"
          : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-semibold text-gray-900">{title}</span>
        {recommended && (
          <span className="rounded-full bg-green-500 px-2.5 py-0.5 text-xs font-semibold text-white">
            Recommended
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
    </button>
  );
};

export default SetupExperienceCard;
