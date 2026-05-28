import React from "react";
import SetupWizardLayout from "./components/SetupWizardLayout";
import SetupProgressBar from "./components/SetupProgressBar";
import SetupWizardFooter from "./components/SetupWizardFooter";
import AcademicStructureForm from "./components/AcademicStructureForm";
import AcademicStructureSidebar from "./components/AcademicStructureSidebar";
import { useSetupWizardStep6 } from "./hooks/useSetupWizardStep6";
import {
  TOTAL_STEPS,
  STEP_6_NUMBER,
  STEP_6_PROGRESS,
} from "./constants/setupWizard";
import { toastBannerClassName } from "../utils/toastMessageStyle";

const Step6 = () => {
  const {
    form,
    errors,
    loading,
    saving,
    toast,
    estimatedSections,
    showStreams,
    gradeRangeLabel,
    lockedGradeRange,
    recommendationText,
    dependencyStatus,
    smartCheckMessages,
    summarySubtitle,
    streamOptions,
    updateField,
    handlePatternChange,
    handleTermSelect,
    handleSectionModeSelect,
    handleSubjectFrameworkSelect,
    toggleStream,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  } = useSetupWizardStep6();

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
        step={STEP_6_NUMBER}
        total={TOTAL_STEPS}
        progress={STEP_6_PROGRESS}
        title="Academic Structure"
      />

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
        <AcademicStructureForm
          form={form}
          errors={errors}
          estimatedSections={estimatedSections}
          showStreams={showStreams}
          streamOptions={streamOptions}
          lockedGradeRange={lockedGradeRange}
          onFieldChange={updateField}
          onPatternChange={handlePatternChange}
          onTermSelect={handleTermSelect}
          onSectionModeSelect={handleSectionModeSelect}
          onSubjectFrameworkSelect={handleSubjectFrameworkSelect}
          onToggleStream={toggleStream}
        />
        <AcademicStructureSidebar
          form={form}
          estimatedSections={estimatedSections}
          gradeRangeLabel={gradeRangeLabel}
          summarySubtitle={summarySubtitle}
          recommendationText={recommendationText}
          dependencyStatus={dependencyStatus}
          smartCheckMessages={smartCheckMessages}
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

export default Step6;
