// src/onboarding2/components/OnboardingLayout.jsx

import React, { useEffect, useState } from "react";
import { getSchoolInformation } from "../../services/onboardingAPI";
import { buildWorkspacePreviewUrl } from "../../Onboarding-Module/utils/workspaceSlug";

const OnboardingLayout = ({
  step,
  title,
  children,
  onNext,
  onBack,
}) => {

  const progress = (step / 6) * 100;

  const [domain, setDomain] = useState(() => {
    return localStorage.getItem("workspaceDomain") || "";
  });

  useEffect(() => {
    const cached = localStorage.getItem("workspaceDomain");
    if (cached) {
      setDomain(cached);
      return;
    }
    getSchoolInformation()
      .then((data) => {
        const slug = data?.workspace?.workspaceSlug;
        if (slug) {
          const url = buildWorkspacePreviewUrl(slug);
          localStorage.setItem("workspaceDomain", url);
          setDomain(url);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-[#f5f7ff] px-4 py-3">

      {/* HEADER */}
      <div className="flex justify-between items-center px-3 mb-3">

        {/* LOGO */}
        <div className="text-[20px] font-bold text-[#0f172a]">
          VedaSchool
        </div>

        {/* DOMAIN */}
        {domain && (
          <div className="bg-white border border-gray-200 rounded-full px-5 py-2 text-sm font-semibold text-gray-600">
            {domain}
          </div>
        )}
      </div>

      {/* MAIN */}
     <div className="h-[calc(100vh-78px)] max-w-[1500px] mx-auto flex gap-5">

        {/* LEFT PANEL */}
       <div className="w-[360px] h-full shrink-0">

          <div className="bg-[#111a4b] rounded-[34px] h-full relative overflow-hidden">

            {/* GRID */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: `
                  linear-gradient(to right, white 1px, transparent 1px),
                  linear-gradient(to bottom, white 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            />
          </div>
        </div>

        {/* RIGHT PANEL */}
       <div className="flex-1 h-full overflow-y-auto max-w-[1080px]">

          <div className="bg-white rounded-[34px] min-h-full px-10 py-8">

            {/* TOP BAR */}
            <div className="flex justify-between items-start mb-8">

              {/* BADGE */}
              <div className="bg-[#f2edff] text-[#5b3df5] px-4 py-2 rounded-full text-sm font-semibold">
                Onboarding
              </div>

              {/* PROGRESS */}
              <div className="w-[220px]">

                <p className="text-right text-[13px] text-gray-500 font-medium mb-2">
                  Question {step} of 6
                </p>

                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">

                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* PAGE TITLE */}
            <h1 className="text-[30px] leading-[38px] font-bold text-[#0f172a] mb-8">
              {title}
            </h1>

            {/* PAGE CONTENT */}
            <div className="w-full">
              {children}
            </div>

            {/* FOOTER */}
            {(onBack || onNext) && (
              <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-100">

                <button
                  onClick={onBack}
                  className="px-7 py-3 rounded-2xl border border-gray-200 bg-white
                  text-[15px] text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
                  Back
                </button>

                <button
                  onClick={onNext}
                  className="px-8 py-3 rounded-2xl
                  bg-gradient-to-r from-[#6c4cff] to-[#5b3df5]
                  text-white text-[15px] font-semibold shadow-sm"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingLayout;