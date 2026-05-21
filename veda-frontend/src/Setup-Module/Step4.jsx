import React from "react";
import SetupWizardLayout from "./components/SetupWizardLayout";
import SetupProgressBar from "./components/SetupProgressBar";
import SetupWizardFooter from "./components/SetupWizardFooter";
import SchoolTypeCurriculumForm from "./components/SchoolTypeCurriculumForm";
import SchoolTypeCurriculumSidebar from "./components/SchoolTypeCurriculumSidebar";
import { useSetupWizardStep4 } from "./hooks/useSetupWizardStep4";
import {
  TOTAL_STEPS,
  STEP_4_NUMBER,
  STEP_4_PROGRESS,
} from "./constants/setupWizard";
import { toastBannerClassName } from "../utils/toastMessageStyle";

const Step4 = () => {
  const {
    form,
    errors,
    loading,
    saving,
    toast,
    recommendation,
    healthItems,
    smartCheckMessages,
    updateField,
    handleInstitutionChange,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  } = useSetupWizardStep4();

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
        step={STEP_4_NUMBER}
        total={TOTAL_STEPS}
        progress={STEP_4_PROGRESS}
        title="School Type & Curriculum"
      />

      <div className="border-b border-setup-border px-6 py-5 sm:px-8">
        <h1 className="text-xl font-bold text-setup-heading sm:text-2xl">
          School Type & Curriculum
        </h1>
        <p className="mt-1 text-sm text-setup-muted sm:text-[15px]">
          Define your institution model, curriculum board, and grade range so
          VedaSchool can recommend the right academic templates.
        </p>
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

      <div
        className="grid grid-cols-1 gap-8 px-6 py-6 sm:px-8 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]"
        style={{ "--setup-theme": form.primaryThemeColor }}
      >
        <SchoolTypeCurriculumForm
          form={form}
          errors={errors}
          onInstitutionChange={handleInstitutionChange}
          onFieldChange={updateField}
        />
        <SchoolTypeCurriculumSidebar
          recommendation={recommendation}
          healthItems={healthItems}
          smartCheckMessages={smartCheckMessages}
        />
      </div>

      <SetupWizardFooter
        onBack={handleBack}
        onContinue={handleSaveContinue}
        saving={saving}
        primaryColor={form.primaryThemeColor}
      />
    </SetupWizardLayout>
  );
};

export default Step4;
