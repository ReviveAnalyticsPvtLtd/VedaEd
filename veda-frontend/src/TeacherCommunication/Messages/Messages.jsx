import React, { useState, useRef, useEffect } from "react";
import MessagesOverview from "./MessagesOverview";
import Group from "./Group";
import Individual from "./Individual";
import Class from "./Class";
import Templates from "./Templates";
import HelpInfo from "../../components/HelpInfo";
import { initialTemplates } from "./templateData";

export default function Messages() {
  const [activeTab, setActiveTab] = useState("group"); // default tab
  const [templates, setTemplates] = useState(initialTemplates);
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
        return <MessagesOverview />;
      case "group":
        return <Group templates={templates} />;
      case "individual":
        return <Individual templates={templates} />;
      case "class":
        return <Class templates={templates} />;
      case "templates":
        return <Templates templates={templates} setTemplates={setTemplates} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Teacher Messages</h2>
        <HelpInfo
          title="Teacher Messages Help"
          description={`Page Description: Let teachers communicate with cohorts, individual students/parents, full classes, or reuse saved templates from a single screen.


8.1 Overview Tab

Snapshot of recent conversations, quick actions, and delivery stats.

Sections:
- Recent Messages: Cards for latest outgoing messages with status badges
- Quick Actions: Buttons to jump directly into common workflows (Group, Individual, Class)
- Delivery Metrics: Charts/counters summarizing sent vs. scheduled items


8.2 Group Tab

Compose announcements for predefined teacher groups or subject cohorts.

Sections:
- Group Selector: Choose department/club/grade-level groups
- Message Composer: Subject/body fields with attachment uploader
- Channel Toggle: Decide whether to send via App, Email, and/or SMS
- Send/Schedule Buttons: Deliver immediately or at a future time


8.3 Individual Tab

One-to-one messaging with a student or parent.

Sections:
- Recipient Search: Lookup by name, class, or ID
- Personal Message Box: Tailor content to the selected recipient
- Channel Options: Choose the desired delivery medium
- Send Confirmation: Preview summary before dispatch


8.4 Class Tab

Notify an entire class or section at once.

Sections:
- Class & Section Dropdowns: Pick the exact student roster
- Recipient Preview: Shows total students/parents to be reached
- Message Form: Subject/body + attachment options
- Delivery Controls: Channel selection and send/schedule buttons


8.5 Templates Tab

Manage reusable teacher templates for recurring notes.

Sections:
- Template Library: Cards listing template title, usage category, and last updated
- Actions Column: Edit, duplicate, or delete templates
- Create Template Button: Opens a form to add new template content
- Preview Pane: View template body before applying it`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        {["overview", "group", "individual", "class", "templates"].map(
          (tab) => (
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
          )
        )}
      </div>

      {/* Tab Content */}
      <div className="bg-white p-3 rounded-lg shadow-sm border">
        {renderTab()}
      </div>
    </div>
  );
}
