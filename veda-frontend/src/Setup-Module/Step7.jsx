import React from "react";
import SetupWizardLayout from "./components/SetupWizardLayout";
import SetupProgressBar from "./components/SetupProgressBar";
import SetupWizardFooter from "./components/SetupWizardFooter";
import RolesHrFoundationForm from "./components/RolesHrFoundationForm";
import RolesHrFoundationSidebar from "./components/RolesHrFoundationSidebar";
import { useSetupWizardStep7 } from "./hooks/useSetupWizardStep7";
import {
  SETUP_TYPES,
  TOTAL_STEPS,
  STEP_7_NUMBER,
  STEP_7_PROGRESS,
} from "./constants/setupWizard";

const Step7 = () => {
  const {
    form,
    errors,
    loading,
    saving,
    toast,
    toastBannerClassName,
    permissionMatrix,
    coreRoleCount,
    optionalRolesOnCount,
    recommendationText,
    smartCheckMessages,
    dependencyStatus,
    selectedSetupType,
    moduleDrivenRoleKeys,
    updateField,
    updatePermissionCell,
    toggleOptionalRole,
    toggleCategory,
    handleSavePermissions,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  } = useSetupWizardStep7();

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
        step={STEP_7_NUMBER}
        total={TOTAL_STEPS}
        progress={STEP_7_PROGRESS}
        title="Roles & HR Foundation"
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
        <RolesHrFoundationForm
          form={form}
          errors={errors}
          permissionMatrix={permissionMatrix}
          moduleDrivenRoleKeys={moduleDrivenRoleKeys}
          showBasicHrFoundation={selectedSetupType === SETUP_TYPES.ADVANCED}
          onFieldChange={updateField}
          onPermissionCellChange={updatePermissionCell}
          onToggleOptionalRole={toggleOptionalRole}
          onToggleCategory={toggleCategory}
          onSavePermissions={handleSavePermissions}
          saving={saving}
        />
        <RolesHrFoundationSidebar
          coreRoleCount={coreRoleCount}
          optionalRolesOnCount={optionalRolesOnCount}
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

export default Step7;
