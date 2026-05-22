import React from "react";

const ModuleToggle = ({
  checked,
  disabled = false,
  onChange,
  ariaLabel,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && onChange) onChange();
      }}
      className={`relative h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-setup-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
        checked ? "bg-setup-primary" : "bg-gray-300"
      } ${disabled ? "opacity-70" : ""}`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ease-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
};

export default ModuleToggle;
