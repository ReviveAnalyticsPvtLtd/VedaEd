import React from "react";
import OnboardingLayout from "./components/OnboardingLayout";
import { useOnboardingStep6 } from "./hooks/useOnboardingStep6";
import { ONBOARDING_TOTAL_STEPS } from "./constants/onboarding";
import { toastBannerClassName } from "../utils/toastMessageStyle";

const ILLUSTRATION = {
  title: "Workspace ready",
  description: "Your school workspace is ready to set up.",
};

function SchoolIcon() {
  return (
    <span className="text-lg" aria-hidden>
      🏫
    </span>
  );
}

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

export default function OnboardingStep6() {
  const {
    workspacePreviewUrl,
    loading,
    initialLoading,
    error,
    copyToast,
    handleCopyUrl,
    handleGoToDashboard,
    handleBack,
  } = useOnboardingStep6();

  return (
    <OnboardingLayout
      currentStep={6}
      showBack
      onBack={handleBack}
      illustrationTitle={ILLUSTRATION.title}
      illustrationDescription={ILLUSTRATION.description}
    >
      <p className="text-sm font-semibold text-blue-600">
        Step 6 of {ONBOARDING_TOTAL_STEPS}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
        Your school workspace is ready!
      </h1>
      <p className="mt-2 text-sm text-slate-500 sm:text-base">
        Your account has been created successfully. You&apos;re all set to get
        started.
      </p>

      {error && (
        <div
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {copyToast && (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm font-medium ${toastBannerClassName(copyToast)}`}
          role="status"
        >
          {copyToast}
        </div>
      )}

      <div className="mt-8 flex flex-1 flex-col">
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
          <SchoolIcon />
          <p className="min-w-0 flex-1 break-all text-sm font-semibold text-blue-600 sm:text-base">
            {initialLoading
              ? "Loading workspace URL..."
              : workspacePreviewUrl || "—"}
          </p>
          <button
            type="button"
            onClick={handleCopyUrl}
            disabled={initialLoading || !workspacePreviewUrl}
            aria-label="Copy workspace URL"
            className="shrink-0 rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CopyIcon />
          </button>
        </div>

        <button
          type="button"
          onClick={handleGoToDashboard}
          disabled={loading || initialLoading || !workspacePreviewUrl}
          className="mt-8 w-full rounded-lg bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing you in..." : "Go to Dashboard"}
        </button>
      </div>
    </OnboardingLayout>
  );
}
