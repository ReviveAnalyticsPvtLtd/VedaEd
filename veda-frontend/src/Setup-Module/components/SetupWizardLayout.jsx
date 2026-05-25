import React from "react";

const SetupWizardLayout = ({ children, onSaveExit, saving }) => {
  return (
    <div className="min-h-screen bg-setup-page px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-setup-primary text-lg font-bold lowercase text-white">
              v
            </div>
            <div>
              <p className="text-lg font-bold leading-tight text-setup-heading">
                VedaSchool
              </p>
              <p className="text-sm text-setup-muted">School Setup Wizard</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSaveExit}
            disabled={saving}
            className="w-fit rounded-lg border border-setup-border bg-white px-5 py-2.5 text-sm font-medium text-setup-heading shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save & Exit
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-setup-border bg-white shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SetupWizardLayout;
