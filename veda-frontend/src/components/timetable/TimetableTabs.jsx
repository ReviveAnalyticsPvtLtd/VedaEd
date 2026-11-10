import React, { useState } from "react";

const TimetableTabs = ({
  classView,
  teacherView,
  defaultTab = "class",
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* Tabs */}
      <div className="ttb ttb-tabs">
        <div className="view-tabs">
          <button
            onClick={() => setActiveTab("class")}
            className={`btn ${activeTab === "class" ? "active" : ""}`}
          >
            Class Timetable
          </button>
          <button
            onClick={() => setActiveTab("teacher")}
            className={`btn ${activeTab === "teacher" ? "active" : ""}`}
          >
            Teacher Timetable
          </button>
        </div>
      </div>

      {/* Render Tabs */}
      {activeTab === "class" && classView}
      {activeTab === "teacher" && teacherView}
    </div>
  );
};

export default TimetableTabs;
