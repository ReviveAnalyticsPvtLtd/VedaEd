import React from "react";

const SetupWizardFooter = ({
  onBack,
  onContinue,
  saving,
  continueLabel = "Save & Continue",
  showBack = true,
  primaryColor,
}) => {
  const accentStyle = primaryColor
    ? { backgroundColor: primaryColor }
    : undefined;

  return (
    <div className="flex flex-col-reverse gap-3 border-t border-setup-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="w-full rounded-lg border border-setup-border bg-white px-8 py-3 text-sm font-semibold text-setup-heading shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          Back
        </button>
      ) : (
        <span className="hidden sm:block" />
      )}
      <button
        type="button"
        onClick={onContinue}
        disabled={saving}
        style={accentStyle}
        className="w-full rounded-lg bg-setup-primary px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {saving ? "Saving..." : continueLabel}
      </button>
    </div>
  );
};

export default SetupWizardFooter;
