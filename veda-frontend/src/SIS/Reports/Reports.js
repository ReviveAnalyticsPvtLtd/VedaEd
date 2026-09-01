import React, { useState, useEffect, useRef } from "react";
import { FiDownload } from "react-icons/fi";
import AcademicReport from "./AcademicReport";
import AttendanceReport from "./AttendanceReport";
import DisciplineReport from "./DisciplineReport";
import HealthRecords from "../HealthRecords";
import ActivitiesReport from "./ActivitiesReport";
import HelpInfo from "../../components/HelpInfo";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("academic");
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
      case "academic": return <AcademicReport />;
      case "attendance": return <AttendanceReport />;
      case "discipline": return <DisciplineReport />;
      case "health": return <HealthRecords />;
      case "activities": return <ActivitiesReport />;

      // ⭐ NEW TAB (BLANK PAGE)
      case "ai-automation": 
        return (
          <div className="p-6 text-center text-gray-600">
            <h3 className="text-xl font-semibold mb-2">AI Automation</h3>
            <p>This section will contain AI-generated automated insights.</p>
          </div>
        );

      default: 
        return null;
    }
  };

  return (
    <div className="p-0 m-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Reports</h2>
      
        <HelpInfo
          title="Report Module Help"
          description={`Page Description: Manage all staff members including teachers, administrators, and support staff. View staff directory, roles, departments, and contact information. Add new staff and manage assignments.
      
      6.1 All Staff Tab
      Description: View and manage the complete directory of all staff members. Display staff information including name, staff ID, role, department, assigned classes, email, phone, and employment status. Search and filter staff by role, department, name, or status. Add new staff members manually or import from Excel. Assign staff to classes and subjects. View staff schedules and workload. Manage staff contact information and employment details.
      Sections:
      - Staff Directory Table: Comprehensive list of all staff with key information.
      - Search and Filter: Find staff by name, ID, role, department, or status.
      - Staff Assignment: Assign staff to classes, subjects, and responsibilities.
      - Contact Information: View and update staff contact details.
      - Action Buttons: Add staff, import data, export directory, view schedules.
      
      6.2 Manage Login Tab
      Description: Manage staff login credentials and account access. View usernames, passwords, and account status. Reset passwords, activate/deactivate staff accounts, and manage login permissions. Search and filter staff by login status. Generate login credentials for new staff or bulk reset passwords. Configure staff portal access and role-based permissions.
      Sections:
      - Login Credentials Table: Display staff ID, name, email, username, password status, and account status.
      - Search and Filter: Find staff by name, ID, email, or login status.
      - Password Management: Reset individual or bulk passwords; send password reset emails.
      - Account Status Management: Activate, deactivate, or suspend staff accounts.
      - Role-Based Access: Configure permissions based on staff roles (admin, teacher, support staff).
      
      6.3 Others Tab
      Description: Additional staff management features and utilities. Access staff reports, manage staff categories, view performance metrics, and perform bulk operations. Generate staff ID cards, manage departments, and configure staff-related settings.
      Sections:
      - Reports and Analytics: Generate staff reports, attendance summaries, and performance metrics.
      - Bulk Operations: Perform bulk updates, role changes, or status modifications.
      - ID Card Generation: Create and print staff ID cards.
      - Department Management: Organize staff by departments and manage department structures.
      - Export and Import Tools: Advanced data export options and import templates.`}
        />
      </div>

      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        <button
          onClick={() => setActiveTab("academic")}
          className={`pb-2 ${
            activeTab === "academic"
              ? "text-blue-600 font-semibold border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
        >
          Academic
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`pb-2 ${
            activeTab === "attendance"
              ? "text-blue-600 font-semibold border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
        >
          Attendance
        </button>

        <button
          onClick={() => setActiveTab("discipline")}
          className={`pb-2 ${
            activeTab === "discipline"
              ? "text-blue-600 font-semibold border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
        >
          Discipline
        </button>

        <button
          onClick={() => setActiveTab("health")}
          className={`pb-2 ${
            activeTab === "health"
              ? "text-blue-600 font-semibold border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
        >
          Health
        </button>

        <button
          onClick={() => setActiveTab("activities")}
          className={`pb-2 ${
            activeTab === "activities"
              ? "text-blue-600 font-semibold border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
        >
          Activities
        </button>

        <button
          onClick={() => setActiveTab("ai-automation")}
          className={`pb-2 ${
            activeTab === "ai-automation"
              ? "text-blue-600 font-semibold border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
        >
          AI Automation
        </button>
      </div>

      {renderTab()}
    </div>
  );
}
