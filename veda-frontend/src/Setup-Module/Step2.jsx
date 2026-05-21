import React from "react";
import SetupWizardLayout from "./components/SetupWizardLayout";
import SetupProgressBar from "./components/SetupProgressBar";
import OrganizationTypeSelector from "./components/OrganizationTypeSelector";
import SetupWizardFooter from "./components/SetupWizardFooter";
import { useSetupWizardStep2 } from "./hooks/useSetupWizardStep2";
import {
  TOTAL_STEPS,
  STEP_2_NUMBER,
  STEP_2_PROGRESS,
} from "./constants/setupWizard";
import { toastBannerClassName } from "../utils/toastMessageStyle";

const Step2 = () => {
  const {
    organizationType,
    setOrganizationType,
    loading,
    saving,
    toast,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  } = useSetupWizardStep2();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-setup-page">
        <p className="text-sm font-medium text-gray-500">Loading setup wizard...</p>
      </div>
    );
  }

  return (
    <SetupWizardLayout onSaveExit={handleSaveExit} saving={saving}>
      <SetupProgressBar
        step={STEP_2_NUMBER}
        total={TOTAL_STEPS}
        progress={STEP_2_PROGRESS}
        title="Organization Type"
      />

      {toast && (
        <div className="px-6 pt-4">
          <p
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${toastBannerClassName(toast)}`}
          >
            {toast}
          </p>
        </div>
      )}

      <OrganizationTypeSelector
        value={organizationType}
        onChange={setOrganizationType}
      />

      <SetupWizardFooter
        onBack={handleBack}
        onContinue={handleSaveContinue}
        saving={saving}
      />
    </SetupWizardLayout>
  );
};

export default Step2;
