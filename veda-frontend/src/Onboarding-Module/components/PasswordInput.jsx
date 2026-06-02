import React, { useId } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

const inputBaseClass =
  "onboarding-field-input w-full rounded-lg border bg-white px-4 py-3 pr-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:opacity-70";

export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  hasError = false,
  autoComplete = "new-password",
  showPassword,
  onToggleVisibility,
}) {
  const fallbackId = useId();
  const inputId = id || fallbackId;
  const toggleLabel = showPassword ? "Hide password" : "Show password";

  return (
    <div>
      <label htmlFor={inputId} className="text-sm font-semibold text-slate-900">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={inputId}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={hasError || undefined}
          className={`${inputBaseClass} ${
            hasError ? "border-red-300 !bg-red-50/30" : "border-gray-200"
          }`}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={disabled}
          aria-label={toggleLabel}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
        >
          {showPassword ? (
            <FiEyeOff className="h-[1.125rem] w-[1.125rem]" aria-hidden />
          ) : (
            <FiEye className="h-[1.125rem] w-[1.125rem]" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
