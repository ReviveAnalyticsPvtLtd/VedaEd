import React from "react";
import { FiCreditCard } from "react-icons/fi";
import SetupWizardLayout from "./components/SetupWizardLayout";
import SetupProgressBar from "./components/SetupProgressBar";
import SetupWizardFooter from "./components/SetupWizardFooter";
import SetupStepHeader from "./components/SetupStepHeader";
import SetupFormSection from "./components/SetupFormSection";
import ModuleToggle from "./components/ModuleToggle";
import { useSetupWizardStep9 } from "./hooks/useSetupWizardStep9";
import {
  STEP_9_NUMBER,
  STEP_9_PROGRESS,
  TOTAL_STEPS,
} from "./constants/setupWizard";

const Step9 = () => {
  const {
    loading,
    saving,
    toast,
    toastBannerClassName,
    feesEnabled,
    setFeesEnabled,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  } = useSetupWizardStep9();

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
        step={STEP_9_NUMBER}
        total={TOTAL_STEPS}
        progress={STEP_9_PROGRESS}
        title="Fees & Billing"
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
        <div className="space-y-6">
          <SetupStepHeader
            badge="Financial Rules"
            title="Configure fees & billing"
            description="Set up fee structures, payment rules, and billing workflows. Detailed fee master configuration can be completed after launch."
          />

          <SetupFormSection
            title="Fees Module"
            subtitle="Enable fee collection and parent payment portal for your school."
            badge="Recommended"
          >
            <div className="flex items-center justify-between gap-4 rounded-xl border border-setup-border px-4 py-3.5">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-setup-primary">
                  <FiCreditCard className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-setup-heading">
                    Enable Fees Module
                  </p>
                  <p className="mt-0.5 text-xs text-setup-muted">
                    Collect tuition, transport, and other fees with receipts and
                    parent notifications.
                  </p>
                </div>
              </div>
              <ModuleToggle
                checked={feesEnabled}
                onChange={() => setFeesEnabled((v) => !v)}
                ariaLabel="Toggle fees module"
              />
            </div>
          </SetupFormSection>

          <section className="rounded-xl border border-dashed border-setup-border bg-gray-50/80 p-6 text-center">
            <p className="text-sm font-medium text-setup-heading">
              Fee structure wizard coming next
            </p>
            <p className="mt-2 text-sm text-setup-muted">
              Grade-wise fee heads, installments, fines, and payment gateways will
              be configured in the next setup step.
            </p>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-5 text-white shadow-lg">
            <h3 className="text-base font-bold">Fees Summary</h3>
            <p className="mt-2 text-sm leading-relaxed text-blue-100">
              Attendance rules from Step 8 feed low-attendance and parent alerts.
              Fees module links with transport and report cards.
            </p>
            <div className="mt-4 rounded-lg bg-blue-900/40 px-3 py-2.5 text-sm">
              <span className="text-blue-200">Status: </span>
              <span className="font-semibold">
                {feesEnabled ? "Fees enabled" : "Fees disabled"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-setup-border bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-setup-heading">Recommendation</h3>
            <p className="mt-2 text-sm leading-relaxed text-setup-muted">
              For K12 schools, enable fees with term-wise installments and online
              payment for parents.
            </p>
          </div>
        </aside>
      </div>

      <SetupWizardFooter
        onBack={handleBack}
        onContinue={handleSaveContinue}
        saving={saving}
      />
    </SetupWizardLayout>
  );
};

export default Step9;
