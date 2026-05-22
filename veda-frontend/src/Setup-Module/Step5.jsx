import React from "react";
import SetupWizardLayout from "./components/SetupWizardLayout";
import SetupProgressBar from "./components/SetupProgressBar";
import SetupStepHeader from "./components/SetupStepHeader";
import SetupWizardFooter from "./components/SetupWizardFooter";
import ModuleSelectionForm from "./components/ModuleSelectionForm";
import ModuleSelectionSidebar from "./components/ModuleSelectionSidebar";
import { useSetupWizardStep5 } from "./hooks/useSetupWizardStep5";
import {
  TOTAL_STEPS,
  STEP_5_NUMBER,
  STEP_5_PROGRESS,
} from "./constants/setupWizard";
import { toastBannerClassName } from "../utils/toastMessageStyle";

const Step5 = () => {
  const {
    loading,
    saving,
    toast,
    enabledOptional,
    requiredCount,
    optionalEnabledCount,
    recommendations,
    recommendationSubtitle,
    dependencyWarnings,
    dependencyGuidance,
    autoEnabledNotice,
    handleToggleOptional,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  } = useSetupWizardStep5();

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
        step={STEP_5_NUMBER}
        total={TOTAL_STEPS}
        progress={STEP_5_PROGRESS}
        title="Module Selection"
      />

      <div className="border-b border-setup-border px-6 py-6 sm:px-8">
        <SetupStepHeader
          badge="Hybrid Module Setup"
          title="Select the modules your school needs"
          description="Required modules are locked for a safe school setup. Optional modules can be enabled now or later from Setup Center."
        />
      </div>

      {toast ? (
        <div className="px-6 pt-4 sm:px-8">
          <p
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${toastBannerClassName(toast)}`}
          >
            {toast}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 px-6 py-6 sm:px-8 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
        <ModuleSelectionForm
          enabledOptional={enabledOptional}
          onToggleOptional={handleToggleOptional}
        />
        <ModuleSelectionSidebar
          requiredCount={requiredCount}
          optionalEnabledCount={optionalEnabledCount}
          recommendations={recommendations}
          recommendationSubtitle={recommendationSubtitle}
          dependencyWarnings={dependencyWarnings}
          dependencyGuidance={dependencyGuidance}
          autoEnabledNotice={autoEnabledNotice}
        />
      </div>

      <SetupWizardFooter
        onBack={handleBack}
        onContinue={handleSaveContinue}
        saving={saving}
      />
    </SetupWizardLayout>
  );
};

export default Step5;
