import React from "react";

const SetupWizardLayout = ({ children, onSaveExit, saving }) => {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Top bar — logo + Save & Exit */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
              V
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">VedaSchool</p>
              <p className="text-sm text-gray-500">Complete Setup Wizard</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSaveExit}
            disabled={saving}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save & Exit
          </button>
        </div>

        {/* Main card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SetupWizardLayout;
