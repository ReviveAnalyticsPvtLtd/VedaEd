import React, { useState } from "react";
import ClassTeacherView from "./ClassTeacherView";
import SubjectTeacherView from "./SubjectTeacherView";
import HelpInfo from "../../components/HelpInfo";

export default function Gradebook() {
  const [activeTab, setActiveTab] = useState("class-teacher");

  const renderTab = () => {
    switch (activeTab) {
      case "class-teacher":
        return <ClassTeacherView />;
      case "subject-teacher":
        return <SubjectTeacherView />;
      default:
        return null;
    }
  };

  return (
    <div className="p-0 m-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Gradebook</h2>

        <HelpInfo
          title="Gradebook Help"
          description="Manage academic performance. Class teachers can view full class results and summaries. Subject teachers can enter and update marks for their assigned subjects."
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        <button
          onClick={() => setActiveTab("class-teacher")}
          className={`pb-2 ${
            activeTab === "class-teacher"
              ? "text-blue-600 font-semibold border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
        >
          Class Teacher
        </button>

        <button
          onClick={() => setActiveTab("subject-teacher")}
          className={`pb-2 ${
            activeTab === "subject-teacher"
              ? "text-blue-600 font-semibold border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
        >
          Subject Teacher
        </button>
      </div>

      {/* Tab Content */}
      {renderTab()}
    </div>
  );
}
