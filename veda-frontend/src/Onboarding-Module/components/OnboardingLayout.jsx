import React from "react";
import OnboardingIllustration from "./OnboardingIllustration";
import OnboardingStepDots from "./OnboardingStepDots";

function BackButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Go back"
      className="fixed left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-100 bg-white text-slate-700 shadow-md transition hover:bg-gray-50 disabled:opacity-60 sm:left-6 sm:top-6"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}

export default function OnboardingLayout({
  children,
  currentStep = 1,
  showDots = true,
  showBack = false,
  onBack,
  illustrationTitle,
  illustrationDescription,
}) {
  return (
    <div className="min-h-screen bg-white">
      {showBack && onBack && <BackButton onClick={onBack} />}

      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <aside className="order-2 flex flex-col justify-end bg-[#e8f4fc] lg:order-1 lg:justify-center">
          <OnboardingIllustration
            title={illustrationTitle}
            description={illustrationDescription}
          />
        </aside>

        <main className="order-1 flex flex-col px-6 py-8 sm:px-10 lg:order-2 lg:px-14 lg:py-12">
          <div className="mb-8 flex justify-end">
            <span className="text-sm font-bold tracking-wide text-blue-600 sm:text-base">
              VEDASCHOOL
            </span>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
            {children}
            {showDots && <OnboardingStepDots currentStep={currentStep} />}
          </div>
        </main>
      </div>
    </div>
  );
}
