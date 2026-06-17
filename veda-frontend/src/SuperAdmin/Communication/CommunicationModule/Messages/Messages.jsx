import React, { useState, useRef, useEffect } from "react";
import Group from "./Group";
import Individual from "./Individual";
import Class from "./Class";
import Templates from "./Templates";
import HelpInfo from "../../../../components/HelpInfo";

export default function Messages() {
  const [activeTab, setActiveTab] = useState("group"); // default tab
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
      case "group":
        return <Group />;
      case "individual":
        return <Individual />;
      case "class":
        return <Class />;
      case "templates":
        return <Templates />;
      default:
        return null;
    }
  };

  return (
    <div className="p-0">
      {/* Breadcrumbs */}
      <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <button
          onClick={() => setActiveTab("group")}
          className="hover:underline"
        >
          Messages
        </button>
        <span>&gt;</span>
        <span>
          {activeTab === "group" && "Group"}
          {activeTab === "individual" && "Individual"}
          {activeTab === "class" && "Class"}
          {activeTab === "templates" && "Templates"}
        </span>
      </div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Messages</h2>

        <HelpInfo
          title="Admin Messages Help"
          description={`Page Description: Manage all outgoing messages from the admin portal. Switch between recipient types, craft announcements, and reuse saved templates to keep communication consistent.


7.1 Page Overview

Compose and send announcements from a single workspace.
Use the tab bar to jump between recipient modes and template management.

Sections:
- Breadcrumb & Header: Shows which sub-tab (Group, Individual, Class, Templates) is active above the page title
- Tab Bar: Four buttons that render the correct compose interface for each workflow
- Content Area: Displays the component (Group, Individual, Class, Templates) matching the active tab


7.2 Group Tab

Broadcast a message to predefined audience groups (e.g., all parents, all staff).

Sections:
- Audience Selector: Pick the group or segment you want to notify
- Message Composer: Subject/body inputs with rich formatting and attachment support
- Channel Options: Choose SMS, Email, or App push before sending
- Send/Schedule Controls: Send immediately or schedule for later


7.3 Individual Tab

Send personalized 1:1 messages to a specific recipient.

Sections:
- Recipient Search: Look up parent/student/staff by name or ID
- Personal Message Box: Tailor the message body for that recipient
- Channel Toggle: Decide whether to ping via SMS, Email, or App
- Delivery Confirmation: Preview summary before sending


7.4 Class Tab

Notify entire classes or sections in one action.

Sections:
- Class & Section Picker: Select class, section, academic year
- Recipient Preview: See how many recipients will receive the notice
- Compose Panel: Subject/body fields plus attachment uploader
- Channel + Send Controls: Choose delivery channels and send or schedule


7.5 Templates Tab

Manage reusable message templates for faster communication.

Sections:
- Template List: Shows saved templates with name, category, and last updated date
- Actions Dropdown: Edit, duplicate, or delete templates
- Create Template: Button to add a new template with merge fields
- Preview Pane: View template content before using it`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-300">
        {["group", "individual", "class", "templates"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize pb-2 ${
              activeTab === tab
                ? "text-blue-600 font-semibold border-b-2 border-blue-600"
                : "text-gray-500 hover:text-blue-600"
            }`}
          >
            {tab === "group"
              ? "Group"
              : tab === "individual"
              ? "Individual"
              : tab === "class"
              ? "Class"
              : "Templates"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">{renderTab()}</div>
    </div>
  );
}
