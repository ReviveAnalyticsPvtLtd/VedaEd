import React from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "./components/OnboardingLayout";
import GoogleSignInButton from "./components/GoogleSignInButton";
import Step1EmailAuth from "./components/Step1EmailAuth";
import { useGoogleOnboarding } from "./hooks/useGoogleOnboarding";
import { ONBOARDING_TOTAL_STEPS } from "./constants/onboarding";

export default function OnboardingStep1() {
  const navigate = useNavigate();
  const {
    loading,
    error,
    handleGoogleSuccess,
    handleGoogleError,
  } = useGoogleOnboarding();

  return (
    <OnboardingLayout
      currentStep={1}
      showBack
      onBack={() => navigate("/")}
    >
      <p className="text-sm font-semibold text-blue-600">Step 1 of {ONBOARDING_TOTAL_STEPS}</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
        Create your school account
      </h1>
      <p className="mt-2 text-sm text-slate-500 sm:text-base">
        Start with Google or use email. You can complete school setup after account creation.
      </p>

      {error && (
        <div
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="mt-8 w-full">
        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          loading={loading}
          disabled={loading}
        />
      </div>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-3 text-gray-500">or</span>
        </div>
      </div>

      <Step1EmailAuth disabled={loading} />
    </OnboardingLayout>
  );
}
