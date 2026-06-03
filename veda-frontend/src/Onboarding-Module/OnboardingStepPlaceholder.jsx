import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "./components/OnboardingLayout";
import { advanceOnboardingStep } from "../services/onboardingAPI";
import {
  ONBOARDING_ROUTES,
  ONBOARDING_TOTAL_STEPS,
  stepPath,
} from "./constants/onboarding";
import { getPostOnboardingDestination } from "./utils/onboardingNavigation";

const STEP_COPY = {
  2: {
    title: "School profile",
    description: "Tell us about your school. This step will collect basic institution details.",
  },
  3: {
    title: "Your role",
    description: "Confirm who will manage the account and primary contacts.",
  },
  5: {
    title: "Review",
    description: "Review your account details before continuing.",
  },
  6: {
    title: "You're almost done",
    description: "Finish onboarding and continue to the school setup wizard.",
  },
};

export default function OnboardingStepPlaceholder({ stepNumber }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const copy = STEP_COPY[stepNumber] || {
    title: `Step ${stepNumber}`,
    description: "Continue onboarding.",
  };

  const handleContinue = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await advanceOnboardingStep(stepNumber);
      const onboarding = data?.onboarding;

      if (onboarding?.isCompleted || stepNumber >= ONBOARDING_TOTAL_STEPS) {
        navigate(getPostOnboardingDestination(onboarding), { replace: true });
        return;
      }

      const nextStep = onboarding?.currentStep || stepNumber + 1;
      navigate(stepPath(nextStep), { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Could not save progress. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (stepNumber <= 2) {
      navigate(ONBOARDING_ROUTES.step1);
      return;
    }
    navigate(stepPath(stepNumber - 1));
  };

  return (
    <OnboardingLayout currentStep={stepNumber}>
      <p className="text-sm font-semibold text-blue-600">
        Step {stepNumber} of {ONBOARDING_TOTAL_STEPS}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{copy.title}</h1>
      <p className="mt-2 text-sm text-slate-500">{copy.description}</p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleBack}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-gray-50 disabled:opacity-60"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading
            ? "Saving..."
            : stepNumber >= ONBOARDING_TOTAL_STEPS
              ? "Continue to school setup"
              : "Continue"}
        </button>
      </div>
    </OnboardingLayout>
  );
}
