import React, { useState, useRef, useEffect } from "react";
import PostNotices from "./PostNotices";
import NoticeTemplates from "./NoticeTemplates";
import OthersNotices from "./OthersNotices";
import NoticesOverview from "./NoticesOverview";
import { FiDownload } from "react-icons/fi";
import HelpInfo from "../../components/HelpInfo";

export default function Notices() {
  const [activeTab, setActiveTab] = useState("overview"); // default tab
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Notices</h2>

        <HelpInfo
          title="Admin Notices Help"
          description={`Page Description: Publish school-wide notices, manage reusable templates, and access other notice utilities from this single workspace.


7.1 Page Overview

Use the tab bar to move between the notice overview, composing new notices, editing templates, or using other admin tools.

Sections:
- Breadcrumb & Header: Reflects the active tab so admins know which tool they’re using
- Tab Bar: Buttons for Overview, Post Notices, Notice Templates, and Others
- Dynamic Content: The component for the active tab loads in the content area below


7.2 Overview Tab

View sent and received notices in one place.

Sections:
- Notice Summary: Shows sent, received, and unread notice counts
- Search: Search notices by title, content, or sender
- Filters: Filter by role and status
- Notice List: Displays notice details, priority, status, type, sender, date, channel, and attachment


7.3 Post Notices Tab

Create and send a fresh notice to selected channels.

Sections:
- Notice Form: Fields for title, subject, body, importance level, and attachments
- Audience Selection: Choose recipient groups (students, parents, staff) or classes
- Channel Settings: Toggle SMS, Email, and App push delivery
- Schedule / Send Controls: Send immediately or pick a future date/time
- Preview Card: Optional preview of the final notice before publishing


7.4 Notice Templates Tab

Maintain reusable notice templates for recurring announcements.

Sections:
- Template Library: Lists saved templates with metadata (name, category, last updated)
- Actions Menu: Edit, duplicate, or delete individual templates
- Create Template Button: Opens a form to add a new template with merge fields
- Template Preview: Inspect a template’s body prior to applying it


7.5 Others Tab

Access miscellaneous notice utilities and archives.

Sections:
- Notice Archive: Browse historical notices, filter by date/channel
- Approval Queue: Review notices awaiting admin approval (if enabled)
- Category Management: Manage notice categories or tags
- Export / Download: Export notice history for record keeping`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-300">
        {["overview", "post", "templates", "others"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize pb-2 ${
              activeTab === tab
                ? "text-blue-600 font-semibold border-b-2 border-blue-600"
                : "text-gray-500"
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
