// src/CashierFees/CashierCollection/CashierCollection.jsx

import React, { useState } from "react";
import HelpInfo from "../../components/HelpInfo";

import CashierCollectFee from "./CashierCollectFee";
import CashierTransactions from "./CashierTransactions";
import CashierReceipts from "./CashierReceipts";
import CashierExceptions from "./CashierExceptions";
import CashierCashCounter from "./CashierCashCounter";
import CashierDayClosing from "./CashierDayClosing";

export default function CashierCollection() {
  const [activeTab, setActiveTab] = useState("collect-fee");

  const renderTab = () => {
    switch (activeTab) {
      case "collect-fee":
        return <CashierCollectFee />;
      case "transactions":
        return <CashierTransactions />;
      case "receipts":
        return <CashierReceipts />;
      case "exceptions":
        return <CashierExceptions />;
      case "cash-counter":
        return <CashierCashCounter />;
      case "day-closing":
        return <CashierDayClosing />;
      default:
        return <CashierCollectFee />;
    }
  };

  return (
    <div className="p-0 m-0">
      {/* Heading */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Cashier Collection</h2>

        <HelpInfo
          title="Cashier Collection Help"
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