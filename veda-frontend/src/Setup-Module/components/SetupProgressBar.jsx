import React from "react";

const SetupProgressBar = ({ step, total, progress, title }) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const barWidth =
    clampedProgress === 0 ? "2%" : `${clampedProgress}%`;

  return (
    <div className="border-b border-setup-border px-6 py-4 sm:py-5">
      <div className="mb-2.5 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-setup-muted">
          Step {step} of {total}
          {title ? <span className="text-setup-muted"> &bull; {title}</span> : null}
        </span>
        <span className="text-setup-muted">
          Setup Progress: {clampedProgress}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-setup-primary transition-all duration-300"
          style={{ width: barWidth }}
        />
      </div>
    </div>
  );
};

export default SetupProgressBar;
