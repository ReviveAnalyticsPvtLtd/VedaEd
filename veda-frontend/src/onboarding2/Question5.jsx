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
      institutionType:
        localStorage.getItem("institutionType"),

<<<<<<< HEAD
      // Redirect to setup module
      navigate("/setup/start");
    } catch (error) {
      console.error("Error saving survey data:", error);
      alert("Failed to save data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
=======
      studentStrength:
        localStorage.getItem("studentStrength"),

      branches:
        localStorage.getItem("branches"),

      board:
        localStorage.getItem("board"),

      currentSystem: selectedERP,
    };

    console.log(
      "ONBOARDING DATA:",
      onboardingData
    );

    // SAVE TO BACKEND
    await saveSurveyData(onboardingData);

    // SAVE CURRENT SYSTEM
    localStorage.setItem(
      "currentSystem",
      selectedERP
    );

    // CLEAR STORAGE
    localStorage.removeItem("institutionType");
    localStorage.removeItem("studentStrength");
    localStorage.removeItem("branches");
    localStorage.removeItem("board");
    localStorage.removeItem("currentSystem");

    // NAVIGATE TO PAYOUT
    navigate("/payout");

  } catch (error) {

    console.error(
      "Error saving survey data:",
      error
    );

    alert(
      "Failed to save data. Please try again."
    );

  } finally {

    setLoading(false);
  }
};
>>>>>>> b72f0ad4a21cf48abf57ce697de0a5ff36fe4091

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

      {/* QUESTION */}
      <h2 className="text-[24px] leading-[34px] font-bold text-[#0f172a] mb-8">
        What are you currently using to manage school operations?
      </h2>

      {/* OPTIONS */}
      <div className="grid grid-cols-2 gap-5">

        {options.map((item) => {

          const active =
            selectedERP === item.title;

          return (
            <div
              key={item.title}
              onClick={() =>
                setSelectedERP(item.title)
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

export default Question5;