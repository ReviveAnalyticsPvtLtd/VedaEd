import React from "react";
import { useNavigate } from "react-router-dom";
import SetupWizardLayout from "./components/SetupWizardLayout";
import SetupProgressBar from "./components/SetupProgressBar";
import SetupWizardFooter from "./components/SetupWizardFooter";
import {
  TOTAL_STEPS,
  STEP_3_NUMBER,
  STEP_3_PROGRESS,
  SETUP_ROUTES,
} from "./constants/setupWizard";

/** Placeholder for Step 3 — prevents route crash until implemented */
const Step3 = () => {
  const navigate = useNavigate();

  return (
    <SetupWizardLayout onSaveExit={() => navigate(SETUP_ROUTES.START)} saving={false}>
      <SetupProgressBar
        step={STEP_3_NUMBER}
        total={TOTAL_STEPS}
        progress={STEP_3_PROGRESS}
        title="School Profile"
      />
      <div className="px-6 py-12 text-center sm:px-10">
        <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-setup-primary">
          Foundation Setup
        </span>
        <h2 className="mt-4 text-2xl font-bold text-setup-heading">
          Step 3 — Coming soon
        </h2>
        <p className="mt-2 text-sm text-setup-muted">
          School profile configuration will be implemented in the next phase.
        </p>
      </div>
      <SetupWizardFooter
        onBack={() => navigate(SETUP_ROUTES.step(2))}
        onContinue={() => navigate(SETUP_ROUTES.step(4))}
        saving={false}
        continueLabel="Continue"
      />
    </SetupWizardLayout>
  );
};

export default Step3;
