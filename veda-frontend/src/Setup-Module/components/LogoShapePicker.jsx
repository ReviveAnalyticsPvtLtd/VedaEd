import React from "react";
import { LOGO_FRAME_SHAPES } from "../constants/schoolProfile";
import LogoPreview from "./LogoPreview";

const LogoShapePicker = ({ value, onChange, logoUrl, accentColor }) => {
  return (
    <div>
      <p className="text-sm font-semibold text-setup-heading">Logo frame shape</p>
      <p className="mt-0.5 text-xs text-setup-muted">
        Choose how your logo appears in the branding preview.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {LOGO_FRAME_SHAPES.map((shape) => {
          const selected = value === shape.id;
          return (
            <button
              key={shape.id}
              type="button"
              onClick={() => onChange(shape.id)}
              aria-label={`Select ${shape.label} frame`}
              aria-pressed={selected}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-3 transition-all ${
                selected
                  ? "border-setup-primary bg-blue-50/60 shadow-sm ring-2 ring-offset-1"
                  : "border-setup-border bg-white hover:border-setup-primary/50"
              }`}
              style={selected ? { ringColor: accentColor || "#2563EB" } : undefined}
            >
              <LogoPreview
                src={logoUrl}
                frameShape={shape.id}
                size="sm"
                placeholder="◆"
                backgroundColor="#f8fafc"
              />
              <span
                className={`text-xs font-medium ${
                  selected ? "text-setup-primary" : "text-setup-muted"
                }`}
              >
                {shape.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LogoShapePicker;
