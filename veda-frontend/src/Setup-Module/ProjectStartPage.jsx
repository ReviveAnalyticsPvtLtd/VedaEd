import React from "react";
import SetupLogo from "./components/SetupLogo";
import SetupStartActions from "./components/SetupStartActions";
import SetupStartProgressInfo from "./components/SetupStartProgressInfo";
import { useSetupStart } from "./hooks/useSetupStart";
import { TOTAL_STEPS } from "./constants/setupWizard";
import { toastBannerClassName } from "../utils/toastMessageStyle";

const ProjectStartPage = () => {
  const {
    loading,
    actionLoading,
    hasDraft,
    progress,
    toast,
    handleStartSetup,
    handleResumeSetup,
  } = useSetupStart();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-setup-primary" />
          <p className="mt-4 text-sm font-medium text-gray-600">
            Checking setup progress...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex justify-center sm:mb-10">
          <SetupLogo size="lg" />
        </header>

        <main className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-gray-100">
          <div className="bg-gradient-to-r from-setup-primary via-blue-600 to-indigo-600 px-6 py-10 text-center text-white sm:px-10 sm:py-12">
            <span className="inline-block rounded-full bg-white/20 px-4 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm">
              Setup Initialization
            </span>
            <h1 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
              Welcome to VedaSchool Setup Wizard
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">
              Configure your school management system step by step using our
              guided {TOTAL_STEPS}-step setup process.
            </p>
          </div>

          <div className="space-y-6 px-6 py-8 sm:px-10 sm:py-10">
            {toast && (
              <p
                className={`rounded-lg border px-4 py-3 text-sm font-medium ${toastBannerClassName(toast)}`}
              >
                {toast}
              </p>
            )}

            <p className="text-center text-sm leading-relaxed text-gray-600 sm:text-base">
              This wizard helps you set up school profile, academic structure,
              roles, attendance, fees, exams, communication, and dashboards —
              all in one guided flow. Take your time; your progress is saved
              automatically.
            </p>

            <SetupStartProgressInfo progress={progress} hasDraft={hasDraft} />

            <SetupStartActions
              onStart={handleStartSetup}
              onResume={handleResumeSetup}
              showResume={hasDraft}
              loading={loading}
              actionLoading={actionLoading}
            />
          </div>
        </main>

        <p className="mt-6 text-center text-xs text-gray-500">
          Need help? Contact your VedaSchool administrator or support team.
        </p>
      </div>
    </div>
  );
};

export default ProjectStartPage;
