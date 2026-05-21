import React from "react";
import SetupWizardLayout from "./components/SetupWizardLayout";
import SetupProgressBar from "./components/SetupProgressBar";
import WelcomeInfoPanel from "./components/WelcomeInfoPanel";
import SetupExperienceSelector from "./components/SetupExperienceSelector";
import { useSetupWizardStep1 } from "./hooks/useSetupWizardStep1";
import { TOTAL_STEPS, STEP_1_NUMBER, STEP_1_PROGRESS } from "./constants/setupWizard";
import { toastBannerClassName } from "../utils/toastMessageStyle";

const Step1 = () => {
  const {
    selectedSetupType,
    setSelectedSetupType,
    loading,
    saving,
    toast,
    handleSaveContinue,
    handleSaveExit,
  } = useSetupWizardStep1();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm font-medium text-gray-500">Loading setup wizard...</p>
      </div>
    );
  }

  return (
    <SetupWizardLayout onSaveExit={handleSaveExit} saving={saving}>
      <SetupProgressBar
        step={STEP_1_NUMBER}
        total={TOTAL_STEPS}
        progress={STEP_1_PROGRESS}
        title="Welcome"
      />

      {toast && (
        <div className="px-4 pt-4 sm:px-6">
          <p
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${toastBannerClassName(toast)}`}
          >
            {toast}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2">
        <WelcomeInfoPanel />
        <SetupExperienceSelector
          value={selectedSetupType}
          onChange={setSelectedSetupType}
          progress={STEP_1_PROGRESS}
        />
      </div>

      <div className="flex justify-end border-t border-gray-100 px-4 py-5 sm:px-6 sm:py-6">
        <button
          type="button"
          onClick={handleSaveContinue}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save & Continue"}
        </button>
      </div>
    </SetupWizardLayout>
  );
};

export default Step1;
