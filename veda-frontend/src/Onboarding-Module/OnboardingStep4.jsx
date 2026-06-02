import React from "react";
import OnboardingLayout from "./components/OnboardingLayout";
import PasswordInput from "./components/PasswordInput";
import PasswordStrengthChecklist from "./components/PasswordStrengthChecklist";
import { useOnboardingStep4 } from "./hooks/useOnboardingStep4";
import { ONBOARDING_TOTAL_STEPS } from "./constants/onboarding";

const ILLUSTRATION = {
  title: "Secure your account",
  description: "Choose a strong password to protect your admin account.",
};

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-red-600" role="alert">
      {message}
    </p>
  );
}

export default function OnboardingStep4() {
  const {
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    fieldErrors,
    formError,
    loading,
    initialLoading,
    handlePasswordChange,
    handleConfirmPasswordChange,
    toggleShowPassword,
    toggleShowConfirmPassword,
    passwordAlreadySet,
    handleContinue,
    handleBack,
  } = useOnboardingStep4();

  return (
    <OnboardingLayout
      currentStep={4}
      showBack
      onBack={handleBack}
      illustrationTitle={ILLUSTRATION.title}
      illustrationDescription={ILLUSTRATION.description}
    >
      <p className="text-sm font-semibold text-blue-600">
        Step 4 of {ONBOARDING_TOTAL_STEPS}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
        Secure your account
      </h1>
      <p className="mt-2 text-sm text-slate-500 sm:text-base">
        Create a password for your main school admin account. You&apos;ll use this
        to sign in after onboarding.
      </p>

      {formError && !Object.keys(fieldErrors).length && (
        <div
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {formError}
        </div>
      )}

      {passwordAlreadySet && (
        <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-900">
          Your password is already set. Continue to email verification.
        </div>
      )}

      <form
        className="mt-8 flex flex-1 flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          handleContinue();
        }}
        noValidate
      >
        {!passwordAlreadySet && (
          <>
            <div>
              <PasswordInput
                id="password"
                label="Password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Create password"
                disabled={loading || initialLoading}
                hasError={Boolean(fieldErrors.password)}
                showPassword={showPassword}
                onToggleVisibility={toggleShowPassword}
              />
              <PasswordStrengthChecklist password={password} />
              <FieldError message={fieldErrors.password} />
            </div>

            <div className="mt-6">
              <PasswordInput
                id="confirmPassword"
                label="Confirm Password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm password"
                disabled={loading || initialLoading}
                hasError={Boolean(fieldErrors.confirmPassword)}
                showPassword={showConfirmPassword}
                onToggleVisibility={toggleShowConfirmPassword}
                autoComplete="new-password"
              />
              <FieldError message={fieldErrors.confirmPassword} />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading || initialLoading}
          className="mt-8 w-full rounded-lg bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Saving..."
            : passwordAlreadySet
              ? "Continue to verification"
              : "Continue"}
        </button>
      </form>
    </OnboardingLayout>
  );
}
