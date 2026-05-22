import React from "react";

const SetupStartActions = ({
  onStart,
  onResume,
  showResume,
  loading,
  actionLoading,
}) => {
  const busy = loading || actionLoading;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
      <button
        type="button"
        onClick={onStart}
        disabled={busy}
        className="group w-full rounded-xl bg-setup-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {actionLoading ? "Starting..." : "Start Setup"}
      </button>
      {showResume && (
        <button
          type="button"
          onClick={onResume}
          disabled={busy}
          className="w-full rounded-xl border-2 border-setup-primary bg-white px-8 py-3.5 text-sm font-semibold text-setup-primary transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          Resume Previous Setup
        </button>
      )}
    </div>
  );
};

export default SetupStartActions;
