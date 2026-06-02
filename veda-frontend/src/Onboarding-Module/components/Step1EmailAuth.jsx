import React from "react";
import { FiChevronDown, FiChevronUp, FiEye, FiEyeOff } from "react-icons/fi";
import PasswordStrengthChecklist from "./PasswordStrengthChecklist";
import { useStep1EmailAuth } from "../hooks/useStep1EmailAuth";

const inputBaseClass =
  "onboarding-field-input w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:opacity-70";

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-red-600" role="alert">
      {message}
    </p>
  );
}

export default function Step1EmailAuth({ disabled: parentDisabled = false }) {
  const {
    expanded,
    toggleExpanded,
    email,
    password,
    showPassword,
    fieldErrors,
    formError,
    loading,
    mode,
    handleEmailChange,
    handlePasswordChange,
    toggleShowPassword,
    handleCreateAccount,
    handleSignIn,
  } = useStep1EmailAuth();

  const disabled = parentDisabled || loading;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={toggleExpanded}
        disabled={parentDisabled}
        className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700 disabled:opacity-60"
        aria-expanded={expanded}
      >
        Create account with Email
        {expanded ? (
          <FiChevronUp className="h-4 w-4" aria-hidden />
        ) : (
          <FiChevronDown className="h-4 w-4" aria-hidden />
        )}
      </button>

      {expanded && (
        <div className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-slate-50/50 p-5">
          {formError && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {formError}
            </div>
          )}

          <div>
            <label htmlFor="step1-email" className="text-sm font-semibold text-slate-900">
              Email Address
            </label>
            <input
              id="step1-email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              disabled={disabled}
              className={`mt-2 ${inputBaseClass} ${
                fieldErrors.email ? "border-red-300 !bg-red-50/30" : "border-gray-200"
              }`}
            />
            <FieldError message={fieldErrors.email} />
          </div>

          <div>
            <label htmlFor="step1-password" className="text-sm font-semibold text-slate-900">
              Password
            </label>
            <div className="relative mt-2">
              <input
                id="step1-password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                disabled={disabled}
                className={`${inputBaseClass} pr-11 ${
                  fieldErrors.password ? "border-red-300 !bg-red-50/30" : "border-gray-200"
                }`}
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                disabled={disabled}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:text-slate-700"
              >
                {showPassword ? <FiEyeOff aria-hidden /> : <FiEye aria-hidden />}
              </button>
            </div>
            <PasswordStrengthChecklist password={password} />
            <FieldError message={fieldErrors.password} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleCreateAccount}
              disabled={disabled}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && mode === "register" ? "Creating..." : "Create Account"}
            </button>
            <button
              type="button"
              onClick={handleSignIn}
              disabled={disabled}
              className="flex-1 rounded-lg border border-blue-600 bg-white px-4 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && mode === "login" ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
