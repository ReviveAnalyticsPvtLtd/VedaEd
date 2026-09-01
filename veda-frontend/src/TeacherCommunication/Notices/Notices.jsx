import React, { useState, useRef, useEffect } from "react";
import NoticesOverview from "./NoticesOverview";
import PostNotices from "./PostNotices";
import HelpInfo from "../../components/HelpInfo";

export default function Notices() {
  const [activeTab, setActiveTab] = useState("post"); // default Post Notices
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <NoticesOverview />;
      case "post":
        return <PostNotices />;
      default:
        return null;
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Notices</h2>
        <HelpInfo
          title="Teacher Notices Help"
          description={`Page Description: Draft and publish notices from a teacher account or review notice analytics to stay informed about prior sends.


8.1 Overview Tab

High-level snapshot of notices you’ve already sent.

Sections:
- Recent Notices List: Displays title, recipients, status (Draft/Sent), and time
- Status Chips: Visual badges for scheduled, sent, or failed notices
- Quick Filters: Narrow the list by class, date, or channel
- Insight Cards: Counters showing total notices sent, scheduled, or awaiting approval


8.2 Post Notices Tab

Composer for creating a new teacher notice.

Sections:
- Notice Form: Inputs for title, subject, body, importance, and attachments
- Audience Selection: Choose which class/section or student groups to notify
- Channel Settings: Toggle App, Email, or SMS delivery
- Schedule Controls: Send immediately or schedule with date/time picker
- Preview & Send Buttons: Review the notice and publish when ready`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        {["overview", "post"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize pb-2 ${
              activeTab === tab
                ? "text-blue-600 font-semibold border-b-2 border-blue-600"
                : "text-gray-500 hover:text-blue-600"
            }`}
          >
            {tab === "overview"
              ? "Overview"
              : tab === "post"
              ? "Post Notices"
              : tab}
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
