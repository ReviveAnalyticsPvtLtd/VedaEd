import React from "react";
import { FiCheck, FiGlobe, FiHome, FiLayers } from "react-icons/fi";

const ICONS = {
  home: FiHome,
  campus: FiLayers,
  globe: FiGlobe,
};

const OrganizationTypeCard = ({
  title,
  description,
  icon,
  features = [],
  selected,
  onSelect,
}) => {
  const Icon = ICONS[icon] || FiHome;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex h-full w-full flex-col rounded-2xl border p-5 text-left shadow-sm transition-all duration-200 sm:p-6 ${
        selected
          ? "border-setup-primary bg-blue-50/60 ring-1 ring-setup-primary/20"
          : "border-setup-border bg-white hover:border-blue-300 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-setup-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span
          className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            selected
              ? "border-setup-primary bg-setup-primary"
              : "border-gray-300 bg-white"
          }`}
          aria-hidden
        >
          {selected ? (
            <span className="h-2 w-2 rounded-full bg-white" />
          ) : null}
        </span>
      </div>

      <h3 className="mt-4 text-base font-semibold text-setup-heading">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-setup-muted">{description}</p>

      {features.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {features.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm text-setup-muted"
            >
              <FiCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-setup-heading"
                aria-hidden
              />
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </button>
  );
};

export default OrganizationTypeCard;
