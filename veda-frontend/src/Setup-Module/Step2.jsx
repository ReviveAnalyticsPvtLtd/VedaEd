import React from "react";
import { useNavigate } from "react-router-dom";
import SetupWizardLayout from "./components/SetupWizardLayout";
import SetupProgressBar from "./components/SetupProgressBar";
import { TOTAL_STEPS } from "./constants/setupWizard";

/** Placeholder for Step 2 — extend when implementing next wizard step */
const Step2 = () => {
  const navigate = useNavigate();
  const stepProgress = Math.round((2 / TOTAL_STEPS) * 100);

  return (
    <SetupWizardLayout onSaveExit={() => navigate("/")} saving={false}>
      <SetupProgressBar
        step={2}
        total={TOTAL_STEPS}
        progress={stepProgress}
        title="School Profile"
      />
      <div className="px-6 py-12 text-center">
        <h2 className="text-xl font-bold text-gray-900">Step 2 — Coming soon</h2>
        <p className="mt-2 text-gray-500">
          School profile configuration will be implemented in the next phase.
        </p>
        <button
          type="button"
          onClick={() => navigate("/setup/step-1")}
          className="mt-6 text-sm font-medium text-blue-600 hover:underline"
        >
          Back to Step 1
        </button>
      </div>
    </SetupWizardLayout>
  );
};

export default Step2;
