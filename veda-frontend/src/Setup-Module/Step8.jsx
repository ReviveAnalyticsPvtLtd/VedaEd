import React from "react";
import SetupWizardLayout from "./components/SetupWizardLayout";
import SetupProgressBar from "./components/SetupProgressBar";
import SetupWizardFooter from "./components/SetupWizardFooter";
import AttendanceRulesForm from "./components/AttendanceRulesForm";
import AttendanceRulesSidebar from "./components/AttendanceRulesSidebar";
import { useSetupWizardStep8 } from "./hooks/useSetupWizardStep8";
import {
  STEP_8_NUMBER,
  STEP_8_PROGRESS,
  TOTAL_STEPS,
} from "./constants/setupWizard";

const Step8AttendanceRules = () => {
  const {
    form,
    errors,
    loading,
    saving,
    toast,
    toastBannerClassName,
    summary,
    recommendationText,
    dependencyStatus,
    smartCheckMessages,
    updateField,
    toggleWorkingDay,
    toggleLeaveType,
    togglePermission,
    toggleNotification,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  } = useSetupWizardStep8();

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
        step={STEP_8_NUMBER}
        total={TOTAL_STEPS}
        progress={STEP_8_PROGRESS}
        title="Attendance Rules"
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
        <AttendanceRulesForm
          form={form}
          errors={errors}
          onFieldChange={updateField}
          onToggleWorkingDay={toggleWorkingDay}
          onToggleLeaveType={toggleLeaveType}
          onTogglePermission={togglePermission}
          onToggleNotification={toggleNotification}
        />
        <AttendanceRulesSidebar
          summary={summary}
          dependencyStatus={dependencyStatus}
          recommendationText={recommendationText}
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

export default Step8AttendanceRules;
