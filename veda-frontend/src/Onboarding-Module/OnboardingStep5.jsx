import React from "react";
import OnboardingLayout from "./components/OnboardingLayout";
import OtpInput from "./components/OtpInput";
import { useOnboardingStep5 } from "./hooks/useOnboardingStep5";
import { ONBOARDING_TOTAL_STEPS } from "./constants/onboarding";
import { formatCountdown } from "./utils/otpTimer";

const ILLUSTRATION = {
  title: "Verify your email",
  description: "Enter the OTP sent to your work email.",
};

export default function OnboardingStep5() {
  const {
    email,
    otp,
    secondsLeft,
    attemptsLocked,
    hasActiveOtpSession,
    showExpiredState,
    fieldError,
    pageMessage,
    loading,
    resendLoading,
    initialLoading,
    verifyDisabled,
    canResend,
    handleOtpChange,
    handleResend,
    handleVerify,
    handleBack,
    emailVerified,
    handleContinueToStep6,
  } = useOnboardingStep5();

  const timerLabel = formatCountdown(secondsLeft);
  const otpInputsDisabled =
    loading || initialLoading || showExpiredState || emailVerified;

  return (
    <OnboardingLayout
      currentStep={5}
      showBack
      onBack={handleBack}
      illustrationTitle={ILLUSTRATION.title}
      illustrationDescription={ILLUSTRATION.description}
    >
      <p className="text-sm font-semibold text-blue-600">
        Step 5 of {ONBOARDING_TOTAL_STEPS}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
        Verify your email
      </h1>

      {hasActiveOtpSession && (
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          We&apos;ve sent a 6-digit OTP to your email address.
          {email ? (
            <>
              {" "}
              <span className="font-semibold text-slate-700">{email}</span>
            </>
          ) : null}
        </p>
      )}

      {pageMessage?.type === "error" && (
        <div
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {pageMessage.text}
        </div>
      )}

      {emailVerified && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-900">
          <p className="font-semibold">Email verified</p>
          <p className="mt-1 text-green-800">
            {email ? `${email} is verified.` : "Your work email is verified."}
          </p>
          <button
            type="button"
            onClick={handleContinueToStep6}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Continue to workspace setup
          </button>
        </div>
      )}

      <form
        className={`mt-8 flex flex-1 flex-col ${emailVerified ? "hidden" : ""}`}
        onSubmit={(e) => {
          e.preventDefault();
          handleVerify();
        }}
        noValidate
      >
        <label htmlFor="otp-0" className="text-sm font-semibold text-slate-900">
          Enter OTP
        </label>

        <div className="mt-3">
          <OtpInput
            value={otp}
            onChange={handleOtpChange}
            disabled={otpInputsDisabled}
            hasError={Boolean(fieldError)}
            autoFocus={!initialLoading && hasActiveOtpSession}
          />
          {fieldError && (
            <p className="mt-2 text-xs text-red-600" role="alert">
              {fieldError}
            </p>
          )}
        </div>

        {hasActiveOtpSession && (
          <p
            className="mt-4 text-sm font-medium text-slate-600"
            aria-live="polite"
          >
            OTP expires in {timerLabel}
          </p>
        )}

        {showExpiredState && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-red-600" role="status">
              {attemptsLocked
                ? "Too many failed attempts. Please request a new OTP."
                : "OTP has expired."}
            </p>
            <p className="text-sm text-slate-500">
              Didn&apos;t receive the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend}
                className="font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {resendLoading ? "Sending..." : "Resend OTP"}
              </button>
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={verifyDisabled}
          className="mt-8 w-full rounded-lg bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>
      </form>
    </OnboardingLayout>
  );
}
