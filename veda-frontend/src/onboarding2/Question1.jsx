// src/onboarding2/Question1.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "./components/OnboardingLayout";

const Question1 = () => {

  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState("School");

  const handleContinue = () => {

    localStorage.setItem("institutionType", selectedType);

    navigate("/question2");
  };

  return (
    <OnboardingLayout
      step={1}
      title="Tell us about your school"
      onNext={handleContinue}
    >

      {/* QUESTION */}
      <h2 className="text-[24px] leading-[34px] font-bold text-[#0f172a] mb-8">
        What type of institution are you setting up?
      </h2>

      {/* OPTIONS */}
      <div className="grid grid-cols-2 gap-5">

        {/* SCHOOL */}
        <div
          onClick={() => setSelectedType("School")}
          className={`rounded-[28px] p-7 cursor-pointer transition-all duration-300 border
          
          ${
            selectedType === "School"
              ? "border-purple-500 bg-purple-50"
              : "border-gray-200 bg-white"
          }`}
        >

          {/* RADIO */}
          <div
            className={`w-6 h-6 rounded-full mb-5 flex items-center justify-center text-white text-xs
              
              ${
                selectedType === "School"
                  ? "bg-purple-500"
                  : "border border-gray-300"
              }`}
          >
            {selectedType === "School" && "✓"}
          </div>

          <h3 className="text-[20px] font-bold text-[#0f172a] mb-2">
            School
          </h3>

          <p className="text-[15px] leading-7 text-gray-500">
            K12 or regular school operations.
          </p>
        </div>

        {/* PRESCHOOL */}
        <div
          onClick={() => setSelectedType("Preschool")}
          className={`rounded-[28px] p-7 cursor-pointer transition-all duration-300 border
          
          ${
            selectedType === "Preschool"
              ? "border-purple-500 bg-purple-50"
              : "border-gray-200 bg-white"
          }`}
        >

          {/* RADIO */}
          <div
            className={`w-6 h-6 rounded-full mb-5 flex items-center justify-center text-white text-xs
              
              ${
                selectedType === "Preschool"
                  ? "bg-purple-500"
                  : "border border-gray-300"
              }`}
          >
            {selectedType === "Preschool" && "✓"}
          </div>

          <h3 className="text-[20px] font-bold text-[#0f172a] mb-2">
            Preschool
          </h3>

          <p className="text-[15px] leading-7 text-gray-500">
            Early education and daycare workflows.
          </p>
        </div>
      </div>

      {/* SELECTED VALUE */}
      <p className="mt-6 text-[15px] text-gray-500">
        Selected:
        <span className="font-semibold text-[#0f172a] ml-1">
          {selectedType}
        </span>
      </p>

    </OnboardingLayout>
  );
};

export default Question1;