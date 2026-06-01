// src/onboarding2/Question2.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "./components/OnboardingLayout";

const Question2 = () => {

  const navigate = useNavigate();

  const [selectedStudents, setSelectedStudents] =
    useState("300-1000");

  const handleContinue = () => {

    localStorage.setItem(
      "studentStrength",
      selectedStudents
    );

    navigate("/question3");
  };

  const options = [
    {
      title: "0–300",
      desc: "Small school or early-stage institution.",
    },
    {
      title: "300–1000",
      desc: "Growing school with structured admin needs.",
    },
    {
      title: "1000–3000",
      desc: "Medium school with stronger operations.",
    },
    {
      title: "3000+",
      desc: "Large school or enterprise-scale setup.",
    },
  ];

  return (
    <OnboardingLayout
      step={2}
      title="Tell us about your school"
      onNext={handleContinue}
      onBack={() => navigate("/question1")}
    >
      <h2 className="text-3xl font-bold mb-8">
        How many students are currently enrolled?
      </h2>

      <div className="grid grid-cols-2 gap-6">

        {options.map((item) => {

          const active =
            selectedStudents === item.title;

          return (
            <div
              key={item.title}
              onClick={() =>
                setSelectedStudents(item.title)
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

export default Question2;