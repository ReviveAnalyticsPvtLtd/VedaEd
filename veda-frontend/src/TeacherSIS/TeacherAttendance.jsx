import { NavLink, Outlet, useLocation } from "react-router-dom";
import HelpInfo from "../components/HelpInfo";

export default function TeacherAttendance() {
  const location = useLocation();
  const isLeave = location.pathname.includes("teacher-leave");

  return (
    <div className="p-0 m-0 min-h-screen w-full max-w-full min-w-0">
      

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-xl sm:text-2xl font-bold min-w-0">Attendance</h2>
        <HelpInfo
          title="Teacher Attendance"
          description={
            isLeave
              ? `Teacher Leave

Apply for leave, upload supporting documents when required, and track request status. Smart checks cover leave balance, date range, timetable conflict awareness, and routing for admin approval.

Tabs:
- Mark Attendance: Daily class attendance marking and exports.
- Teacher Leave: Apply for leave, view history, and mandatory-field guidance.`
              : `2.1 Teacher Attendance (Attendance Overview)

Mark and manage student attendance for assigned classes. Easily track attendance patterns, view history, and generate attendance-based reports.

Tabs:
- Mark Attendance: Select class, section, and date; mark students present or absent; save and export.
- Teacher Leave: Apply for teacher leave and view your leave request history.`
          }
          steps={
            isLeave
              ? [
                  "Review leave balances and fill the apply form",
                  "Note timetable conflict guidance when shown",
                  "Submit and track requests in My Leave Requests",
                ]
              : [
                  "Select class & date to mark attendance",
                  "Use Present/Absent toggles for each student",
                  "Save attendance record for the day",
                  "Open Teacher Leave tab if you need to apply for leave",
                ]
          }
        />
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm border-b border-gray-200 mb-4 text-gray-600">
        <NavLink
          to="/teacher/attendance/mark"
          end
          className={({ isActive }) =>
            `pb-2 shrink-0 ${
              isActive
                ? "text-blue-600 font-semibold border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`
          }
        >
          Mark Attendance
        </NavLink>
        <NavLink
          to="/teacher/attendance/teacher-leave"
          className={({ isActive }) =>
            `pb-2 shrink-0 ${
              isActive
                ? "text-blue-600 font-semibold border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`
          }
        >
          Teacher Leave
        </NavLink>
      </div>

      <Outlet />
    </div>
  );
}
