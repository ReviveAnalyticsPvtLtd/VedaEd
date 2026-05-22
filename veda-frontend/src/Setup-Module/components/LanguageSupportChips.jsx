import React from "react";
import { LANGUAGE_SUPPORT_OPTIONS } from "../constants/schoolTypeCurriculum";

/**
 * Language instruction chips.
 * Future Update: enable Hindi, Regional, and Other with locale-aware curriculum packs.
 */
const LanguageSupportChips = ({ value, onChange }) => {
  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-setup-heading">Language Support</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {LANGUAGE_SUPPORT_OPTIONS.map((option) => {
          const selected = value === option.id;
          const disabled = !option.enabled;

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              title={
                disabled
                  ? "Coming soon — multilingual curriculum support"
                  : undefined
              }
              onClick={() => {
                if (!disabled) onChange(option.id);
              }}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                selected
                  ? "border-setup-primary bg-blue-50 text-setup-primary"
                  : disabled
                    ? "cursor-not-allowed border-setup-border bg-gray-50 text-gray-400"
                    : "border-setup-border bg-white text-setup-heading hover:border-blue-300"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LanguageSupportChips;
