import React from "react";
import OnboardingLayout from "./components/OnboardingLayout";
import { useOnboardingStep2 } from "./hooks/useOnboardingStep2";
import { ONBOARDING_TOTAL_STEPS } from "./constants/onboarding";

const ILLUSTRATION = {
  title: "Add school information",
  description: "Your workspace URL is created from your school name.",
};

export default function OnboardingStep2() {
  const {
    schoolName,
    workspacePreviewUrl,
    loading,
    initialLoading,
    error,
    fieldError,
    availabilityHint,
    handleSchoolNameChange,
    handleContinue,
    handleBack,
  } = useOnboardingStep2();

  const showPreview = Boolean(workspacePreviewUrl);

  return (
    <OnboardingLayout
      currentStep={2}
      showBack
      onBack={handleBack}
      illustrationTitle={ILLUSTRATION.title}
      illustrationDescription={ILLUSTRATION.description}
    >
      <p className="text-sm font-semibold text-blue-600">
        Step 2 of {ONBOARDING_TOTAL_STEPS}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
        Add your school information
      </h1>
      <p className="mt-2 text-sm text-slate-500 sm:text-base">
        This will be used to create your unique workspace.
      </p>

      {(error || fieldError) && (
        <div
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {fieldError || error}
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
        <label htmlFor="schoolName" className="text-sm font-semibold text-slate-900">
          School Name
        </label>
        <input
          id="schoolName"
          name="schoolName"
          type="text"
          autoComplete="organization"
          placeholder="e.g. Veda School"
          value={schoolName}
          onChange={(e) => handleSchoolNameChange(e.target.value)}
          disabled={loading || initialLoading}
          className={`mt-2 w-full rounded-lg border px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:opacity-70 ${
            fieldError || availabilityHint
              ? "border-red-300"
              : "border-gray-200"
          }`}
        />
        <p className="mt-1.5 text-xs text-slate-400">
          Use your official school name.
        </p>
        {availabilityHint && !fieldError && (
          <p className="mt-1 text-xs text-amber-600" role="status">
            {availabilityHint}
          </p>
        )}

        <div className="mt-6 rounded-lg border border-gray-200 bg-slate-50 px-4 py-4">
          <p className="text-xs font-medium text-slate-500">Workspace Preview</p>
          <p
            className={`mt-1 break-all text-base font-bold sm:text-lg ${
              showPreview ? "text-blue-600" : "text-slate-400"
            }`}
            aria-live="polite"
          >
            {showPreview ? workspacePreviewUrl : "your-school.vedaschool.ai"}
          </p>
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
