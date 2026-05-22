import React from "react";
import { CONFIGURABLE_FEATURES } from "../constants/setupWizard";

const CheckIcon = () => (
  <svg
    className="h-4 w-4 shrink-0 text-white"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const WelcomeInfoPanel = () => {
  return (
    <div className="p-8 sm:p-10">
      <div className="rounded-none bg-gradient-to-b from-setup-primary to-setup-indigo px-8 py-8 text-white sm:px-10 sm:py-10">
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          Guided School Configuration
        </span>
        <h2 className="mt-4 text-2xl font-bold leading-tight text-white sm:text-[1.75rem]">
          Welcome to VedaSchool Setup
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100 sm:text-[15px]">
          Configure your school step by step. Start quickly today and refine
          everything later from Setup Center.
        </p>
        <p className="mt-8 text-sm font-semibold text-white">
          What will be configured?
        </p>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-3">
          {CONFIGURABLE_FEATURES.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2.5 rounded-xl border border-white/30 bg-blue-950/25 px-3.5 py-3 text-sm font-medium text-white backdrop-blur-[2px]"
            >
              <CheckIcon />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WelcomeInfoPanel;
