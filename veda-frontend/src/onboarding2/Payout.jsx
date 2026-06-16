// src/onboarding2/Payout.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "./components/OnboardingLayout";

const Payout = () => {

  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState("Enterprise");

  const plans = [
    {
      name: "Starter",
      desc: "Best for small schools starting their digital journey.",
      price: "₹ — / quote",
      features: [
        "Up to 300 students",
        "Single branch",
        "SIS + Attendance basics",
        "Email support",
      ],
    },
    {
      name: "Growth",
      desc: "Best for growing schools that need academics & fees.",
      price: "₹ — / quote",
      features: [
        "300–3000 students",
        "Up to 5 branches",
        "Fees + Attendance",
        "Priority onboarding",
      ],
    },
    {
      name: "Enterprise",
      desc: "Best for large schools & multi-branch institutions.",
      price: "Custom / annual",
      features: [
        "3000+ students",
        "Unlimited branches",
        "All modules available",
        "Dedicated success manager",
      ],
      recommended: true,
    },
  ];

  const handleContinue = () => {

    localStorage.setItem("selectedPlan", selectedPlan);

    navigate("/setup/start");
  };

  return (
    <OnboardingLayout
      step={6}
      title="Choose your plan"
      onNext={handleContinue}
    >

      {/* TAG */}
     

      <p className="text-[15px] leading-7 text-gray-500 mb-8 max-w-[760px]">
        All plans are visible. VedaSchool highlights the best fit
        based on your school profile.
      </p>

      {/* INFO BOXES */}
      <div className="grid grid-cols-4 gap-4 mb-8">

        <div className="border border-gray-200 rounded-2xl p-5">
          <p className="text-gray-500 text-sm mb-2">
            Institution
          </p>

          <h3 className="text-[18px] font-bold text-[#0f172a]">
            School
          </h3>
        </div>

        <div className="border border-gray-200 rounded-2xl p-5">
          <p className="text-gray-500 text-sm mb-2">
            Students
          </p>

          <h3 className="text-[18px] font-bold text-[#0f172a]">
            3000+
          </h3>
        </div>

        <div className="border border-gray-200 rounded-2xl p-5">
          <p className="text-gray-500 text-sm mb-2">
            Branches
          </p>

          <h3 className="text-[18px] font-bold text-[#0f172a]">
            5+
          </h3>
        </div>

        <div className="border border-gray-200 rounded-2xl p-5">
          <p className="text-gray-500 text-sm mb-2">
            Current System
          </p>

          <h3 className="text-[18px] font-bold text-[#0f172a]">
            Custom Software
          </h3>
        </div>
      </div>

      {/* PLAN CARDS */}
      <div className="grid grid-cols-3 gap-5 mb-8">

        {plans.map((plan) => (

          <div
            key={plan.name}
            onClick={() => setSelectedPlan(plan.name)}
            className={`relative rounded-[28px] border p-6 cursor-pointer transition-all duration-300 flex flex-col
            
            ${
              selectedPlan === plan.name
                ? "border-purple-500"
                : "border-gray-200"
            }`}
          >

            {/* RECOMMENDED */}
            {plan.recommended && (
              <div className="absolute top-4 right-4 bg-cyan-400 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                Recommended
              </div>
            )}

            <h3 className="text-[22px] font-bold text-[#0f172a] mb-4">
              {plan.name}
            </h3>

            <p className="text-[14px] leading-7 text-gray-500 mb-6 min-h-[80px]">
              {plan.desc}
            </p>

            <h4 className="text-[18px] font-bold text-[#0f172a] mb-7">
              {plan.price}
            </h4>

            {/* FEATURES */}
            <div className="space-y-4 mb-8">

              {plan.features.map((feature, index) => (

                <div
                  key={index}
                  className="flex items-start gap-3"
                >
                  <span className="text-green-500 font-bold text-sm mt-[2px]">
                    ✓
                  </span>

                  <span className="text-[15px] font-medium text-[#334155] leading-6">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* BUTTONS */}
            <div className="mt-auto">

              <button
                className="w-full py-3 rounded-2xl text-white font-semibold text-[15px]
                bg-gradient-to-r from-[#6c4cff] to-[#5b3df5] mb-3"
              >
                Start
              </button>

              <button
                className="w-full py-3 rounded-2xl border border-gray-300
                font-semibold text-[15px] bg-white text-[#0f172a]"
              >
                {plan.name === "Enterprise"
                  ? "Talk to Expert"
                  : "View Details"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FREE TRIAL */}
      <div className="rounded-[36px] bg-gradient-to-r from-[#141B5A] to-[#2F3DA8] p-10 text-white mb-8">

        <div className="flex justify-between items-center gap-10">

          {/* LEFT */}
          <div className="flex-1">

            <div className="inline-flex px-4 py-2 rounded-full border border-white/20 text-sm font-semibold mb-6">
              30-Day Free Trial
            </div>

            <h2 className="text-[36px] leading-[46px] font-bold mb-5">
              Not ready to choose a plan?
            </h2>

            <p className="text-[17px] leading-8 text-gray-200 mb-8 max-w-[700px]">
              Start free first and explore VedaSchool before
              committing. Set up your school and experience
              the platform risk-free.
            </p>

            <div className="grid grid-cols-2 gap-y-4 text-[15px] font-medium">

              <p>✓ No payment required</p>
              <p>✓ Setup your school</p>

              <p>✓ Explore core features</p>
              <p>✓ Limited onboarding support</p>
            </div>
          </div>

          {/* RIGHT CARD */}
          <div className="w-[320px] bg-white/10 border border-white/10 rounded-[30px] p-7 text-center">

            <button className="w-full py-4 rounded-2xl text-[16px] font-semibold bg-gradient-to-r from-[#6c4cff] to-[#5b3df5]">
              Start Free for 30 Days
            </button>

            <p className="text-[15px] leading-7 text-gray-200 mt-5">
              Recommended if you're still exploring options.
            </p>
          </div>
        </div>
      </div>

      {/* NOTE */}
      <div className="border border-yellow-300 bg-yellow-50 rounded-[24px] px-6 py-5 text-[15px] leading-7 text-yellow-800 mb-8">
        Recommended: Enterprise fits because this profile
        shows large-scale or chain-school needs.
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-8">

        <button
          className="px-7 py-3 rounded-2xl border border-gray-300
          bg-white text-[#0f172a] font-semibold text-[15px]"
        >
          Edit answers
        </button>

        <button
          onClick={handleContinue}
          className="px-8 py-3 rounded-2xl text-white font-semibold text-[15px]
          bg-gradient-to-r from-[#6c4cff] to-[#5b3df5]"
        >
          Continue to Setup
        </button>
      </div>

    </OnboardingLayout>
  );
};

export default Payout;