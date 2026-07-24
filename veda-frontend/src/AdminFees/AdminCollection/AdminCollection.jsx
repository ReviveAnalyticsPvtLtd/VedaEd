// src/AdminFees/AdminCollection/AdminCollection.jsx

import React, { useState } from "react";
import HelpInfo from "../../components/HelpInfo";

import CollectFee from "./CollectFee";
import Transactions from "./Transactions";
import Receipts from "./Receipts";
import Exceptions from "./Exceptions";
import CashCounter from "./CashCounter";
import DayClosing from "./DayClosing";

export default function AdminCollection() {
  const [activeTab, setActiveTab] = useState("collect-fee");

  const renderTab = () => {
    switch (activeTab) {
      case "collect-fee":
        return <CollectFee />;
      case "transactions":
        return <Transactions />;
      case "receipts":
        return <Receipts />;
      case "exceptions":
        return <Exceptions />;
      case "cash-counter":
        return <CashCounter />;
      case "day-closing":
        return <DayClosing />;
      default:
        return <CollectFee />;
    }
  };

  return (
    <div className="p-0 m-0">

      {/* Breadcrumb */}
      <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <span>Fees</span>
        <span>&gt;</span>
        <span>Admin Collection</span>
      </div>

      {/* Heading */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Admin Collection</h2>

        <HelpInfo
          title="Admin Collection Help"
          description={`Manage complete fee collection operations.

• Collect Fee
• Transactions
• Receipts
• Exceptions
• Cash Counter
• Day Closing

Use the tabs below to access each collection module.`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-4 text-gray-600 border-b overflow-x-auto">
        {[
          ["collect-fee", "Collect Fee"],
          ["transactions", "Transactions"],
          ["receipts", "Receipts"],
          ["exceptions", "Exceptions"],
          ["cash-counter", "Cash Counter"],
          ["day-closing", "Day Closing"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-2 whitespace-nowrap ${activeTab === key
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