// src/onboarding2/Question3.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "./components/OnboardingLayout";

const Question3 = () => {

  const navigate = useNavigate();

  const [selectedBranch, setSelectedBranch] =
    useState("2-5");

  const handleContinue = () => {

    localStorage.setItem(
      "branches",
      selectedBranch
    );

    navigate("/question4");
  };

  const options = [
    {
      title: "1",
      desc: "Single campus.",
    },
    {
      title: "2–5",
      desc: "Multi-branch school.",
    },
    {
      title: "5+",
      desc: "Chain or group institution.",
    },
  ];

  return (
    <OnboardingLayout
      step={3}
      title="Tell us about your school"
      onNext={handleContinue}
      onBack={() => navigate("/question2")}
    >
      <h2 className="text-3xl font-bold mb-8">
        How many branches or campuses do you manage?
      </h2>

      <div className="grid grid-cols-3 gap-6">

        {options.map((item) => {

          const active =
            selectedBranch === item.title;

          return (
            <div
              key={item.title}
              onClick={() =>
                setSelectedBranch(item.title)
              }
              className={`rounded-3xl p-8 cursor-pointer border-2 transition-all duration-300

              ${
                active
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 bg-white"
              }`}
            >

              <div
                className={`w-7 h-7 rounded-full mb-6 flex items-center justify-center text-white text-sm

                ${
                  active
                    ? "bg-purple-500"
                    : "border border-gray-300"
                }`}
              >
                {active && "✓"}
              </div>

              <h3 className="text-2xl font-bold mb-2">
                {item.title}
              </h3>

              <p className="text-gray-500">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
    </OnboardingLayout>
  );
};

export default Question3;