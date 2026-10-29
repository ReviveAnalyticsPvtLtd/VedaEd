import React, { useState } from "react";
import ClassTimetable from "./ClassTimetable";
import TeacherTimetable from "./TeacherTimetable";
import "./timetableBuilder.css";

const Timetable = () => {
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
      {activeTab === "class" && <ClassTimetable />}
      {activeTab === "teacher" && <TeacherTimetable />}
    </div>
  );
};

export default Timetable;
