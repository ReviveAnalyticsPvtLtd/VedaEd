// src/onboarding2/Question5.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "./components/OnboardingLayout";

const Question5 = () => {

  const navigate = useNavigate();

  const [selectedERP, setSelectedERP] =
    useState("Excel / Sheets");

  const handleFinish = () => {

    localStorage.setItem(
      "currentSystem",
      selectedERP
    );

    // FINAL DATA
    const onboardingData = {
      institutionType:
        localStorage.getItem("institutionType"),

      studentStrength:
        localStorage.getItem("studentStrength"),

      branches:
        localStorage.getItem("branches"),

      board:
        localStorage.getItem("board"),

      currentSystem: selectedERP,
    };

    console.log("ONBOARDING DATA:", onboardingData);

    alert("Onboarding Completed 🚀");

    // redirect if needed
    // navigate("/dashboard");
  };

  const options = [
    {
      title: "Excel / Sheets",
      desc: "Manual files and registers.",
    },
    {
      title: "No ERP",
      desc: "Mostly offline or paper-based.",
    },
    {
      title: "Existing ERP",
      desc: "Planning to switch or upgrade.",
    },
    {
      title: "Custom Software",
      desc: "Internal or vendor-built solution.",
    },
  ];

  return (
    <OnboardingLayout
      step={5}
      title="Tell us about your school"
      onNext={handleFinish}
      onBack={() => navigate("/question4")}
    >
      <h2 className="text-3xl font-bold mb-8">
        What are you currently using to manage school operations?
      </h2>

      <div className="grid grid-cols-2 gap-6">

        {options.map((item) => {

          const active =
            selectedERP === item.title;

          return (
            <div
              key={item.title}
              onClick={() =>
                setSelectedERP(item.title)
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

export default Question5;