
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import HelpInfo from "../../../components/HelpInfo";

export default function SuperAdminSISAttendance() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Update activeTab based on current route
  useEffect(() => {
    if (location.pathname.includes("by-class")) setActiveTab("by-class");
    else if (location.pathname.includes("by-student"))
      setActiveTab("by-student");
    else setActiveTab("overview");
  }, [location.pathname]);

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* Breadcrumbs */}
      <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <button
          onClick={() => {
            setActiveTab("overview");
            navigate("/superadmin/sis/attendance/overview"); // ✅ navigate to overview route
          }}
          className="hover:underline"
        >
          Attendance
        </button>
        <span>&gt;</span>
        <span>
          {activeTab === "overview" && "Overview"}
          {activeTab === "by-class" && "By Class"}
          {activeTab === "by-student" && "By Student"}
        </span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          {activeTab === "overview"
            ? "Overview"
            : activeTab === "by-class"
            ? "By Class"
            : "By Student"}
        </h2>

        <HelpInfo
          title="Attendance Help"
          description={`Page Description: Access school-wide attendance statistics and drill down by class or student to monitor patterns and take action.

8.1 Attendance Overview (/attendance/overview)
Sections:
- Overall Statistics: Total students, present count, absent count, and attendance percentage.
- Daily Attendance Summary: Today's attendance breakdown by class and section.
- Weekly Trends: Attendance trends over the past week with charts.
- Monthly Reports: Monthly attendance summaries and comparisons.
- Attendance Charts: Visual representation of attendance patterns.
- Quick Actions: Mark attendance, generate reports, export data.
- Alerts and Notifications: Low attendance alerts and important notices.


9.1 Attendance by Class (/attendance/by-class)
Sections:
- Class Selection: Dropdown/list to select class and section.
- Date Range Filter: Choose date range for viewing records.
- Class Attendance Summary: Present/absent counts and percentage for selected class.
- Daily Attendance Table: Day-by-day attendance for each student.
- Attendance Statistics: Class-wise trends and patterns.
- Export Options: Download class attendance reports.
- Quick Actions: Mark attendance or open detailed reports.

10.1 Attendance by Student (/attendance/by-student)
Sections:
- Student Search: Find student by name, ID, or class.
- Date Range Filter: Select period for viewing history.
- Student Attendance Summary: Overall percentage, total present/absent days.
- Detailed Attendance History: Day-by-day records with status.
- Attendance Trends: Charts showing patterns over time.
- Absence Reasons: Track reasons if recorded.
- Export Options: Download individual student attendance reports.`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm border-b mb-3 text-gray-600">
        <NavLink
         to="/superadmin/sis/attendance/overview"
          className={({ isActive }) =>
            `pb-2 ${
              isActive
                ? "text-blue-600 font-semibold border-b-2 border-blue-600" : "text-gray-500"
            }`
          }
        >
          Overview
        </NavLink>
        <NavLink
         to="/superadmin/sis/attendance/by-class"
          className={({ isActive }) =>
            `pb-2  ${
              isActive
                ? "text-blue-600 font-semibold border-b-2 border-blue-600" : "text-gray-500"
            }`
          }
        >
          By Class
        </NavLink>
        <NavLink
     to="/superadmin/sis/attendance/by-student"
          className={({ isActive }) =>
            `pb-2  ${
              isActive
                ? "text-blue-600 font-semibold border-b-2 border-blue-600" : "text-gray-500"
            }`
          }
        >
          By Student
        </NavLink>
      </div>

      <Outlet />
    </div>
  );
}
