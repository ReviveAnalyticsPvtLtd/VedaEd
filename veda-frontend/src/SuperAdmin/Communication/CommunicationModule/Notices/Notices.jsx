import React, { useState, useRef, useEffect } from "react";
import PostNotices from "./PostNotices";
import NoticeTemplates from "./NoticeTemplates";
import OthersNotices from "./OthersNotices";
import NoticesOverview from "./NoticesOverview";
import HelpInfo from "../../../../components/HelpInfo";

export default function Notices() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <NoticesOverview />;

      case "post":
        return <PostNotices />;

      case "templates":
        return <NoticeTemplates />;

      case "others":
        return <OthersNotices />;

      default:
        return null;
    }
  };

  return (
    <div className="p-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Notices</h2>

        <HelpInfo
          title="Admin Notices Help"
          description={`Page Description: Publish school-wide notices, manage reusable templates, and access other notice utilities from this single workspace.

7.1 Page Overview

Use the tab bar to move between the notice overview, composing new notices, editing templates, or using other admin tools.

Sections:
- Header: Shows the Notices page title and help information
- Tab Bar: Overview, Post Notices, Notice Templates, and Others
- Content Area: Displays the component matching the selected tab

7.2 Overview Tab

View sent and received notices in one place.

Sections:
- Notice Summary: Shows sent, received, and unread notice counts
- Search: Search notices by title, content, or sender
- Filters: Filter notices by role and status
- Notice List: Displays notice details, priority, status, type, sender, date, channels, and attachments
- Notice Actions: View details, download attachments, or edit draft notices

7.3 Post Notices Tab

Create and send a fresh notice to selected channels.

Sections:
- Notice Form
- Audience Selection
- Channel Settings
- Schedule / Send Controls
- Preview Card

7.4 Notice Templates Tab

Maintain reusable notice templates for recurring announcements.

Sections:
- Template Library
- Actions Menu
- Create Template Button
- Template Preview

7.5 Others Tab

Access miscellaneous notice utilities and archives.

Sections:
- Notice Archive
- Approval Queue
- Category Management
- Export / Download`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-300">
        {[
          "overview",
          "post",
          "templates",
          "others",
        ].map((tab) => (
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
              : tab === "templates"
              ? "Notice Templates"
              : "Others"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">{renderTab()}</div>
    </div>
  );
}