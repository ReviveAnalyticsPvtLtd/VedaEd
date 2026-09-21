import React, { useState, useRef, useEffect } from "react";
import Group from "./Group";
import Individual from "./Individual";
import Class from "./Class";
import Templates from "./Templates";
import MessagesOverview from "./MessagesOverview";
import HelpInfo from "../../../../components/HelpInfo";

export default function Messages() {
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
        return <MessagesOverview />;

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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Messages</h2>

        <HelpInfo
          title="Admin Messages Help"
          description={`Page Description: Manage all outgoing messages from the admin portal. Switch between recipient types, craft announcements, and reuse saved templates to keep communication consistent.

7.1 Page Overview

Compose and send announcements from a single workspace.

Use the tab bar to jump between the message overview, recipient modes, and template management.

Sections:
- Header: Shows the Messages page title and help information
- Tab Bar: Overview, Group, Individual, Class, and Templates
- Content Area: Displays the component matching the selected tab

7.2 Overview Tab

View sent and received messages in one place.

Sections:
- Message Summary: Shows sent, received, and unread message counts
- Search: Search messages by subject, content, or sender
- Filters: Filter by message type, channel, and direction
- Message List: Displays message details, priority, type, direction, sender/recipient, date, and channel
- View Details: Opens the selected message details

7.3 Group Tab

Broadcast a message to predefined audience groups.

Sections:
- Audience Selector
- Message Composer
- Channel Options
- Send/Schedule Controls

7.4 Individual Tab

Send personalized 1:1 messages to a specific recipient.

Sections:
- Recipient Search
- Personal Message Box
- Channel Toggle
- Delivery Confirmation

7.5 Class Tab

Notify entire classes or sections in one action.

Sections:
- Class & Section Picker
- Recipient Preview
- Compose Panel
- Channel + Send Controls

7.6 Templates Tab

Manage reusable message templates.

Sections:
- Template List
- Actions Dropdown
- Create Template
- Preview Pane`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-300">
        {[
          "overview",
          "group",
          "individual",
          "class",
          "templates",
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
              : tab === "group"
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