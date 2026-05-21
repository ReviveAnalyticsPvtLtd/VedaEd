import React from "react";
import SetupWizardLayout from "./components/SetupWizardLayout";
import SetupProgressBar from "./components/SetupProgressBar";
import SetupWizardFooter from "./components/SetupWizardFooter";
import SchoolProfileForm from "./components/SchoolProfileForm";
import SchoolProfileSidebar from "./components/SchoolProfileSidebar";
import { useSetupWizardStep3 } from "./hooks/useSetupWizardStep3";
import {
  TOTAL_STEPS,
  STEP_3_NUMBER,
  STEP_3_PROGRESS,
} from "./constants/setupWizard";
import { toastBannerClassName } from "../utils/toastMessageStyle";

const Step3 = () => {
  const {
    form,
    errors,
    loading,
    saving,
    logoUploading,
    logoError,
    toast,
    healthItems,
    localization,
    updateField,
    handleCountryChange,
    handleLogoSelect,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  } = useSetupWizardStep3();

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
        step={STEP_3_NUMBER}
        total={TOTAL_STEPS}
        progress={STEP_3_PROGRESS}
        title="School Profile"
      />

      <div className="border-b border-setup-border px-6 py-5 sm:px-8">
        <h1 className="text-xl font-bold text-setup-heading sm:text-2xl">
          School Profile Setup
        </h1>
        <p className="mt-1 text-sm text-setup-muted sm:text-[15px]">
          Provide your school&apos;s basic information, branding, and contact details
          to personalize your workspace.
        </p>
      </div>

      {toast && (
        <div className="px-6 pt-4 sm:px-8">
          <p
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${toastBannerClassName(toast)}`}
          >
            {toast}
          </p>
        </div>
      )}

      <div
        className="grid grid-cols-1 gap-8 px-6 py-6 sm:px-8 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]"
        style={{ "--setup-theme": form.primaryThemeColor }}
      >
        <SchoolProfileForm
          form={form}
          errors={errors}
          onChange={updateField}
          onCountryChange={handleCountryChange}
          onLogoSelect={handleLogoSelect}
          logoUploading={logoUploading}
          logoError={logoError}
          localization={localization}
        />
        <SchoolProfileSidebar
          form={form}
          healthItems={healthItems}
          showCountryTip={!form.country}
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

export default Step3;
