// src/onboarding2/Question3.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "./components/OnboardingLayout";
import { saveSurveyData } from "../services/onboardingSurveyAPI";

const Question3 = () => {

  const navigate = useNavigate();

  const [selectedBranch, setSelectedBranch] =
    useState("2-5");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      const existingData = {
        institutionType: localStorage.getItem("institutionType") || "",
        studentStrength: localStorage.getItem("studentStrength") || "",
        branches: selectedBranch,
        board: localStorage.getItem("board") || "",
        currentSystem: localStorage.getItem("currentSystem") || "",
      };

      await saveSurveyData(existingData);
      localStorage.setItem("branches", selectedBranch);
      navigate("/question4");
    } catch (error) {
      console.error("Error saving survey data:", error);
      localStorage.setItem("branches", selectedBranch);
      navigate("/question4");
    } finally {
      setLoading(false);
    }
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

      {/* QUESTION */}
      <h2 className="text-[24px] leading-[34px] font-bold text-[#0f172a] mb-8">
        How many branches or campuses do you manage?
      </h2>

      {/* OPTIONS */}
      <div className="grid grid-cols-3 gap-5">

        {options.map((item) => {

          const active =
            selectedBranch === item.title;

          return (
            <div
              key={item.title}
              onClick={() =>
                setSelectedBranch(item.title)
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

export default Question3;