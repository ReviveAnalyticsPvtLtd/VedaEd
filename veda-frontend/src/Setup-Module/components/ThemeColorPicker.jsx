import React, { useRef } from "react";
import { THEME_COLOR_PRESETS } from "../constants/schoolProfile";

const ThemeColorPicker = ({ value, onChange, accentColor }) => {
  const customInputRef = useRef(null);
  const isPreset = THEME_COLOR_PRESETS.some((p) => p.value === value);

  return (
    <div>
      <p className="text-sm font-semibold text-setup-heading">Primary Theme Color</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {THEME_COLOR_PRESETS.map((preset) => {
          const selected = value === preset.value;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.value)}
              aria-label={`Select ${preset.label} theme`}
              aria-pressed={selected}
              className={`h-12 w-20 rounded-xl border-2 transition-all sm:h-14 sm:w-24 ${
                selected
                  ? "scale-105 border-setup-heading shadow-md ring-2 ring-offset-2"
                  : "border-transparent opacity-90 hover:opacity-100"
              }`}
              style={{
                backgroundColor: preset.value,
                ...(selected ? { ringColor: accentColor || preset.value } : {}),
              }}
            />
          );
        })}
        <button
          type="button"
          onClick={() => customInputRef.current?.click()}
          aria-label="Choose custom theme color"
          className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dashed border-setup-border bg-gray-50 text-xl font-light text-setup-muted transition hover:border-setup-primary hover:text-setup-primary sm:h-14 sm:w-14 ${
            !isPreset ? "border-setup-primary bg-blue-50 text-setup-primary" : ""
          }`}
          style={
            !isPreset
              ? {
                  borderColor: value,
                  color: value,
                  backgroundColor: `${value}14`,
                }
              : undefined
          }
        >
          +
        </button>
        <input
          ref={customInputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          aria-hidden
        />
      </div>
    </div>
  );
};

export default ThemeColorPicker;
