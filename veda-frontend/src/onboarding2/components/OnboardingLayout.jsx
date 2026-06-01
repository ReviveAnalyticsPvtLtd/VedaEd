// src/onboarding2/components/OnboardingLayout.jsx

import React from "react";

const OnboardingLayout = ({
  step,
  title,
  children,
  onNext,
  onBack,
}) => {
  const progress = (step / 5) * 100;

  return (
    <div className="min-h-screen bg-[#f5f7ff] p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-3xl font-bold">
          <span className="text-blue-500"></span> VedaSchool
        </div>

        <div className="bg-white px-5 py-2 rounded-full shadow text-sm font-semibold">
          sunrise.vedaschool.ai
        </div>
      </div>

      {/* Main */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel */}
        <div className="col-span-4">
          <div className="bg-[#111a4b] rounded-[30px] h-[700px]" />
        </div>

        {/* Right Panel */}
        <div className="col-span-8 bg-white rounded-[30px] p-10">
          {/* Top */}
          <div className="flex justify-between items-center mb-10">
            <div className="bg-[#f0ebff] text-[#6c4cff] px-4 py-2 rounded-full font-semibold">
              Onboarding
            </div>

            <div className="w-[220px]">
              <p className="text-right text-sm font-semibold mb-2">
                Question {step} of 5
              </p>

              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold mb-10">
            {title}
          </h1>

          {/* Dynamic Content */}
          <div>{children}</div>

          {/* Buttons */}
          <div className="flex justify-between mt-16">
            <button
              onClick={onBack}
              className="px-8 py-4 rounded-2xl bg-gray-100 text-gray-500 font-semibold"
            >
              Back
            </button>

            <button
              onClick={onNext}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-600 text-white font-semibold shadow-lg"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingLayout;