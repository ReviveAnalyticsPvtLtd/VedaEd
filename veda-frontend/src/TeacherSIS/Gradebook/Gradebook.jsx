
/*import React, { useState } from "react";

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
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Gradebook</h2>

        <HelpInfo
          title="Gradebook Help"
          description="Manage academic performance. Class teachers can view full class results and summaries. Subject teachers can enter and update marks for their assigned subjects."
        />
      </div>

     
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

     
      {renderTab()}
    </div>
  );
}
*/
export default function Gradebook() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 17v-2m3 2v-4m3 4v-6m2 9H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v9a2 2 0 01-2 2z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 4v5h5"
            />
          </svg>
        </div>

        {/* Content */}
        <h1 className="text-2xl font-semibold text-gray-900">
          Gradebook
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          The Gradebook module is currently under development.
          <br />
          We’re working on something better for you.
        </p>

        {/* Badge */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
          Coming Soon
        </div>

      </div>
    </div>
  );
}