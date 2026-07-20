// src/CashierFees/CashierFeeMaster/CashierFeeMaster.jsx

import React, { useState, useEffect } from "react";
import HelpInfo from "../../components/HelpInfo";

import CashierAcademicYear from "./CashierAcademicYear";
import CashierFeeCategories from "./CashierFeeCategories";
import CashierGradeAssignment from "./CashierGradeAssignment";
import CashierInstallmentPlans from "./CashierInstallmentPlans";
import CashierLateFeePolicies from "./CashierLateFeePolicies";
import CashierDiscounts from "./CashierDiscounts";
import CashierFinesPenalties from "./CashierFinesPenalties";

import axios from "axios";
import config from "../../config";

export default function CashierFeeMaster() {
  const [activeTab, setActiveTab] = useState("academic-year");
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  const fetchYears = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/academic-years`);
      if (Array.isArray(res.data)) {
        setYears(res.data);
        const active = res.data.find((y) => y.isActive);
        if (active) setSelectedYear(active.label);
        else if (res.data.length > 0) setSelectedYear(res.data[0].label);
      }
    } catch (err) {
      console.error("Error fetching years in CashierFeeMaster", err);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const renderTab = () => {
    const props = { selectedYear, onYearChange: fetchYears };

    switch (activeTab) {
      case "academic-year":
        return <CashierAcademicYear {...props} />;

      case "fee-categories":
        return <CashierFeeCategories {...props} />;

      case "grade-assignment":
        return <CashierGradeAssignment {...props} />;

      case "installment-plans":
        return <CashierInstallmentPlans {...props} />;

      case "late-fee-policies":
        return <CashierLateFeePolicies {...props} />;

      case "discounts":
        return <CashierDiscounts {...props} />;

      case "fines-penalties":
        return <CashierFinesPenalties {...props} />;

      default:
        return null;
    }
  };

  return (
    <div className="p-0 m-0">

      {/* Breadcrumb */}
      <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <span>Fees</span>
        <span>&gt;</span>
        <span>Cashier Fee Master</span>
      </div>

      {/* Heading + Help */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Cashier Fee Master</h2>

          {/* Year Selector */}
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Session:
            </span>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-sm font-bold text-blue-800 outline-none cursor-pointer"
            >
              {years.map((y) => (
                <option key={y._id} value={y.label}>
                  {y.label} {y.isActive && "(Active)"}
                </option>
              ))}

              {years.length === 0 && (
                <option value="">No Session Data</option>
              )}
            </select>
          </div>
        </div>

        <HelpInfo
          title="Cashier Fee Master Help"
          description={`Fee Master allows you to configure all fee-related settings.

• Academic Year setup
• Fee Categories & structure
• Grade-wise fee assignment
• Installment & payment rules
• Late fee policies
• Discounts & penalties

Each tab controls a specific fee configuration module.`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b overflow-x-auto">
        {[
          ["academic-year", "Academic Year"],
          ["fee-categories", "Fee Categories"],
          ["grade-assignment", "Grade Assignment"],
          ["installment-plans", "Installment Plans"],
          ["late-fee-policies", "Late Fee Policies"],
          ["discounts", "Discounts"],
          ["fines-penalties", "Fines & Penalties"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-2 whitespace-nowrap ${
              activeTab === key
                ? "text-blue-600 font-semibold border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTab()}
    </div>
  );
}