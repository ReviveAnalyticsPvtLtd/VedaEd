// src/onboarding2/Question1.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "./components/OnboardingLayout";
import { saveSurveyData } from "../services/onboardingSurveyAPI";

const Question1 = () => {

  const navigate = useNavigate();

  // selected option state
  const [selectedType, setSelectedType] = useState("School");
  const [loading, setLoading] = useState(false);

  // continue handler
  const handleContinue = async () => {
    setLoading(true);
    try {
      // Get existing data from localStorage or initialize empty object
      const existingData = {
        institutionType: selectedType,
        studentStrength: localStorage.getItem("studentStrength") || "",
        branches: localStorage.getItem("branches") || "",
        board: localStorage.getItem("board") || "",
        currentSystem: localStorage.getItem("currentSystem") || "",
      };

      // Save to backend
      await saveSurveyData(existingData);

      // Also save to localStorage as backup
      localStorage.setItem("institutionType", selectedType);

      // next page
      navigate("/question2");
    } catch (error) {
      console.error("Error saving survey data:", error);
      // Fallback to localStorage if API fails
      localStorage.setItem("institutionType", selectedType);
      navigate("/question2");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      step={1}
      title="Tell us about your school"
      onNext={handleContinue}
    >
      {/* QUESTION */}
      <h2 className="text-3xl font-bold mb-8">
        What type of institution are you setting up?
      </h2>

      {/* OPTIONS */}
      <div className="grid grid-cols-2 gap-6">

        {/* SCHOOL */}
        <div
          onClick={() => setSelectedType("School")}
          className={`rounded-3xl p-8 cursor-pointer transition-all duration-300 border-2
          
          ${
            selectedType === "School"
              ? "border-purple-500 bg-purple-50"
              : "border-gray-200 bg-white"
          }`}
        >

          {/* RADIO */}
          <div
            className={`w-7 h-7 rounded-full mb-6 flex items-center justify-center text-white text-sm
              
              ${
                selectedType === "School"
                  ? "bg-purple-500"
                  : "border border-gray-300"
              }`}
          >
            {selectedType === "School" && "✓"}
          </div>

          <h3 className="text-2xl font-bold mb-2">
            School
          </h3>

          <p className="text-gray-500">
            K12 or regular school operations.
          </p>
        </div>

        {/* PRESCHOOL */}
        <div
          onClick={() => setSelectedType("Preschool")}
          className={`rounded-3xl p-8 cursor-pointer transition-all duration-300 border-2
          
          ${
            selectedType === "Preschool"
              ? "border-purple-500 bg-purple-50"
              : "border-gray-200 bg-white"
          }`}
        >

          {/* RADIO */}
          <div
            className={`w-7 h-7 rounded-full mb-6 flex items-center justify-center text-white text-sm
              
              ${
                selectedType === "Preschool"
                  ? "bg-purple-500"
                  : "border border-gray-300"
              }`}
          >
            {selectedType === "Preschool" && "✓"}
          </div>

          <h3 className="text-2xl font-bold mb-2">
            Preschool
          </h3>

          <p className="text-gray-500">
            Early education and daycare workflows.
          </p>
        </div>
      </div>

      {/* SELECTED VALUE */}
      <p className="mt-6 text-lg text-gray-600">
        Selected: <span className="font-semibold">{selectedType}</span>
      </p>
    </OnboardingLayout>
  );
};

export default Question1;