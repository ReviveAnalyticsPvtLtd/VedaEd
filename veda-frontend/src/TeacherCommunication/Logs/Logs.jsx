import React, { useState } from "react";
import AllLogs from "./AllLogs";
import ScheduleLogs from "./ScheduleLogs";
import HelpInfo from "../../components/HelpInfo";

export default function Logs() {
  const [activeTab, setActiveTab] = useState("all");

  const renderTab = () => {
    switch (activeTab) {
      case "all":
        return <AllLogs />;
      case "schedule":
        return <ScheduleLogs />;
      default:
        return null;
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Logs</h2>
        <HelpInfo
          title="Teacher Logs Help"
          description={`Page Description: Review all messages or notices you’ve sent. Switch between live history and scheduled batches for future sends.


8.1 All Logs Tab

Chronological record of every sent communication.

Sections:
- Log Table: Columns for title, recipient type, channels, and timestamp
- Filters/Search: Narrow results by class, recipient, or date range
- Channel Badges: Quickly see whether the message used App, Email, or SMS
- Detail Drawer: Click a row to inspect message content or delivery report


8.2 Schedule Logs Tab

List of upcoming or previously executed scheduled jobs.

Sections:
- Job Cards/Table: Show job name, target audience, scheduled date/time, and status
- Action Buttons: Pause, resume, or cancel pending jobs
- Execution Summary: Notes actual send time and success/failure counts`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        {["all", "schedule"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize pb-2 ${
              activeTab === tab
                ? "text-blue-600 font-semibold border-b-2 border-blue-600"
                : "text-gray-500 hover:text-blue-600"
            }`}
          >
            {tab === "all" ? "All Logs" : "Schedule Logs"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white p-3 rounded-lg shadow-sm border">
        {renderTab()}
      </div>
    </div>
  );
}
