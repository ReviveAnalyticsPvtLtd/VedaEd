// src/onboarding2/Question5.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "./components/OnboardingLayout";
import { saveSurveyData } from "../services/onboardingSurveyAPI";

const Question5 = () => {

  const navigate = useNavigate();

  const [selectedERP, setSelectedERP] =
    useState("Excel / Sheets");
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    try {
      // FINAL DATA
      const onboardingData = {
        institutionType: localStorage.getItem("institutionType"),
        studentStrength: localStorage.getItem("studentStrength"),
        branches: localStorage.getItem("branches"),
        board: localStorage.getItem("board"),
        currentSystem: selectedERP,
      };

      console.log("ONBOARDING DATA:", onboardingData);

      // Save to backend
      await saveSurveyData(onboardingData);

      // Clear localStorage after successful submission
      localStorage.removeItem("institutionType");
      localStorage.removeItem("studentStrength");
      localStorage.removeItem("branches");
      localStorage.removeItem("board");
      localStorage.removeItem("currentSystem");

      // Redirect to setup module
      navigate("/setup/start");
    } catch (error) {
      console.error("Error saving survey data:", error);
      alert("Failed to save data. Please try again.");
    } finally {
      setLoading(false);
    }
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