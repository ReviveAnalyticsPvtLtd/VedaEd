import React, { useState } from "react";
import SuperAdminSISClassTimetable from "./SuperAdminSISClassTimetable";
import SuperAdminSISTeacherTimetable from "./SuperAdminSISTeacherTimetable";
import "../../../SIS/classes-schedules/timetableBuilder.css";

const SuperAdminSISTimetable = () => {
  const [activeTab, setActiveTab] = useState("class"); // default class

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
      {activeTab === "class" && <SuperAdminSISClassTimetable />}
      {activeTab === "teacher" && <SuperAdminSISTeacherTimetable />}
    </div>
  );
};

export default SuperAdminSISTimetable;
