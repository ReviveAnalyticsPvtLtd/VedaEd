import React from "react";
import { ONBOARDING_TOTAL_STEPS } from "../constants/onboarding";

export default function OnboardingStepDots({ currentStep }) {
  return (
    <div
      className="flex items-center justify-center gap-2 pt-8"
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={ONBOARDING_TOTAL_STEPS}
      aria-label={`Step ${currentStep} of ${ONBOARDING_TOTAL_STEPS}`}
    >
      {Array.from({ length: ONBOARDING_TOTAL_STEPS }, (_, index) => {
        const step = index + 1;
        const isCompleted = step <= currentStep;
        return (
          <span
            key={step}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              isCompleted ? "bg-blue-600" : "bg-gray-300"
            }`}
          />
        );
      })}
    </div>
  );
}
