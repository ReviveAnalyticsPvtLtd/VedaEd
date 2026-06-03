// src/onboarding2/Question4.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "./components/OnboardingLayout";

const Question4 = () => {

  const navigate = useNavigate();

  const [selectedBoard, setSelectedBoard] =
    useState("Other");

  const handleContinue = () => {

    localStorage.setItem(
      "board",
      selectedBoard
    );

    navigate("/question5");
  };

  const options = [
    {
      title: "CBSE",
      desc: "Central Board.",
    },
    {
      title: "ICSE",
      desc: "ICSE / ISC.",
    },
    {
      title: "State Board",
      desc: "Regional curriculum.",
    },
    {
      title: "IB",
      desc: "International Baccalaureate.",
    },
    {
      title: "Cambridge",
      desc: "IGCSE / A Levels.",
    },
    {
      title: "Other",
      desc: "Custom curriculum.",
    },
  ];

  return (
    <OnboardingLayout
      step={4}
      title="Tell us about your school"
      onNext={handleContinue}
      onBack={() => navigate("/question3")}
    >

      {/* QUESTION */}
      <h2 className="text-[24px] leading-[34px] font-bold text-[#0f172a] mb-8">
        Which board or curriculum do you follow?
      </h2>

      {/* OPTIONS */}
      <div className="grid grid-cols-3 gap-5">

        {options.map((item) => {

          const active =
            selectedBoard === item.title;

          return (
            <div
              key={item.title}
              onClick={() =>
                setSelectedBoard(item.title)
              }
              className={`rounded-[28px] p-7 cursor-pointer border transition-all duration-300

              ${
                active
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 bg-white"
              }`}
            >

              {/* RADIO */}
              <div
                className={`w-6 h-6 rounded-full mb-5 flex items-center justify-center text-white text-xs

                ${
                  active
                    ? "bg-purple-500"
                    : "border border-gray-300"
                }`}
              >
                {active && "✓"}
              </div>

              {/* TITLE */}
              <h3 className="text-[20px] font-bold text-[#0f172a] mb-2">
                {item.title}
              </h3>

              {/* DESC */}
              <p className="text-[15px] leading-7 text-gray-500">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>

    </OnboardingLayout>
  );
};

export default Question4;