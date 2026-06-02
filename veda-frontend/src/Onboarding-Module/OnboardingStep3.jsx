import React from "react";
import OnboardingLayout from "./components/OnboardingLayout";
import { useOnboardingStep3 } from "./hooks/useOnboardingStep3";
import CountryCodeSelect from "./components/CountryCodeSelect";
import { ONBOARDING_TOTAL_STEPS } from "./constants/onboarding";

const ILLUSTRATION = {
  title: "Your admin details",
  description: "We will use this to create the main admin account.",
};

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

export default function OnboardingStep3() {
  const {
    fullName,
    email,
    countryCode,
    mobileNumber,
    fieldErrors,
    formError,
    loading,
    initialLoading,
    handleFullNameChange,
    handleEmailChange,
    handleCountryCodeChange,
    handleMobileNumberChange,
    handleContinue,
    handleBack,
  } = useOnboardingStep3();

  const inputErrorClass = (field) =>
    fieldErrors[field] ? "border-red-300 !bg-red-50/30" : "border-gray-200";

  return (
    <OnboardingLayout
      currentStep={3}
      showBack
      onBack={handleBack}
      illustrationTitle={ILLUSTRATION.title}
      illustrationDescription={ILLUSTRATION.description}
    >
      <p className="text-sm font-semibold text-blue-600">
        Step 3 of {ONBOARDING_TOTAL_STEPS}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
        Your details
      </h1>
      <p className="mt-2 text-sm text-slate-500 sm:text-base">
        We&apos;ll use this to create your admin account and keep you updated.
      </p>

      {formError && !Object.keys(fieldErrors).length && (
        <div
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {formError}
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
        <div>
          <label htmlFor="fullName" className="text-sm font-semibold text-slate-900">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => handleFullNameChange(e.target.value)}
            disabled={loading || initialLoading}
            className={`mt-2 ${inputBaseClass} ${inputErrorClass("fullName")}`}
          />
          <p className="mt-1.5 text-xs text-slate-400">Enter your real name.</p>
          <FieldError message={fieldErrors.fullName} />
        </div>

        <div className="mt-6">
          <label htmlFor="workEmail" className="text-sm font-semibold text-slate-900">
            Work Email
          </label>
          <input
            id="workEmail"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter work email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            disabled={loading || initialLoading}
            className={`mt-2 ${inputBaseClass} ${inputErrorClass("email")}`}
          />
          <p className="mt-1.5 text-xs text-slate-400">
            We&apos;ll send an OTP to this email for verification.
          </p>
          <FieldError message={fieldErrors.email} />
        </div>

        <div className="mt-6">
          <label htmlFor="mobileNumber" className="text-sm font-semibold text-slate-900">
            Mobile Number
          </label>
          <div className="mt-2 flex gap-2">
            <div className="w-[7.5rem] shrink-0 sm:w-32">
              <CountryCodeSelect
                id="countryCode"
                value={countryCode}
                onChange={handleCountryCodeChange}
                disabled={loading || initialLoading}
                hasError={Boolean(fieldErrors.mobileNumber)}
              />
            </div>
            <input
              id="mobileNumber"
              name="mobileNumber"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="Enter mobile number"
              value={mobileNumber}
              onChange={(e) => handleMobileNumberChange(e.target.value)}
              disabled={loading || initialLoading}
              className={`min-w-0 flex-1 ${inputBaseClass} ${inputErrorClass("mobileNumber")}`}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            We may use this to send important updates.
          </p>
          <FieldError message={fieldErrors.mobileNumber} />
        </div>

        <button
          type="submit"
          disabled={loading || initialLoading}
          className="mt-8 w-full rounded-lg bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>
    </OnboardingLayout>
  );
}
