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
      <h2 className="text-3xl font-bold mb-8">
        Which board or curriculum do you follow?
      </h2>

      <div className="grid grid-cols-3 gap-6">

        {options.map((item) => {

          const active =
            selectedBoard === item.title;

          return (
            <div
              key={item.title}
              onClick={() =>
                setSelectedBoard(item.title)
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

export default Question4;