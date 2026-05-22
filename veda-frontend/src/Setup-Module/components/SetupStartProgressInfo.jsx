import React from "react";
import { TOTAL_STEPS } from "../constants/setupWizard";

const SetupStartProgressInfo = ({ progress, hasDraft }) => {
  const currentStep = progress?.currentStep ?? 1;
  const percent = progress?.progressPercentage ?? 0;

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
      <h3 className="text-sm font-semibold text-gray-900">Setup overview</h3>
      <ul className="mt-3 space-y-2 text-sm text-gray-600">
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-setup-primary" />
          <span>
            <strong className="font-medium text-gray-800">{TOTAL_STEPS} guided steps</strong>{" "}
            to configure your school profile, academics, fees, and more.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-setup-success" />
          <span>Save anytime and continue later from this page.</span>
        </li>
        {hasDraft && (
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            <span>
              Draft in progress — Step {currentStep} of {TOTAL_STEPS} ({percent}% complete).
            </span>
          </li>
        )}
      </ul>
      {hasDraft && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs font-medium text-gray-600">
            <span>Progress</span>
            <span>{percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-setup-primary to-blue-400 transition-all duration-500"
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupStartProgressInfo;
