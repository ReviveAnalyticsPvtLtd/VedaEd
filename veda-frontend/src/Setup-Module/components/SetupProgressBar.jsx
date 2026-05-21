import React from "react";

const SetupProgressBar = ({ step, total, progress, title }) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5">
      <div className="mb-2 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-gray-700">
          Step {step} of {total}
          {title ? (
            <span className="text-gray-400"> &bull; {title}</span>
          ) : null}
        </span>
        <span className="text-gray-500">Setup Progress: {clampedProgress}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default SetupProgressBar;
