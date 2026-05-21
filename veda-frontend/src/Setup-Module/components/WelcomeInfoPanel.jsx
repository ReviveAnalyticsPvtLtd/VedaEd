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
    <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white sm:p-8 lg:rounded-none lg:rounded-l-xl">
      <span className="inline-block rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
        Guided School Configuration
      </span>
      <h2 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">
        Welcome to VedaSchool Setup
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-blue-100 sm:text-base">
        Configure your school step by step. Start quickly today and refine
        everything later from Setup Center.
      </p>
      <p className="mt-6 text-sm font-semibold text-white">
        What will be configured?
      </p>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {CONFIGURABLE_FEATURES.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
              <CheckIcon />
            </span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WelcomeInfoPanel;
