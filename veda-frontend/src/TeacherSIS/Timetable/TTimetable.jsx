
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import HelpInfo from "../../components/HelpInfo";
export default function TTimetable() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;

  return (
    <div className="p-0 m-0 min-h-screen">
       
<div className="flex items-center justify-between mb-4">
  <h2 className="text-2xl font-bold">Timetable</h2>

  <HelpInfo
  title="Timetable Management"
  description={`3.1 My Timetable (Personal Teaching Schedule)

View personal weekly teaching schedule showing all assigned classes, subjects, and time slots.

Sections:
- Weekly Schedule: Complete timetable displaying all assigned periods
- Period Details: Shows time slots, class & section, subject name, and room number
- Free Periods: Highlights time slots without classes
- Schedule Summary: Total weekly periods and workload distribution
- Print Option: Download or print personal timetable


3.2 Class Timetable (Assigned Class Schedules)

View the timetables for all classes assigned to the teacher to plan lessons and manage time effectively.

Sections:
- Class Selection: Choose a class to view its complete timetable
- Timetable Display: Weekly schedule for selected class showing all subjects and teachers
- Period Information: Includes time slots, subject details, and room numbers
- Teacher Schedule: See when other teachers teach the same class
- Planning Tools: Use timetable for lesson planning and preparation
`}
  steps={[
    "Check your personal timetable for classes and subjects",
    "View and analyze class-wise timetables",
    "Identify free periods for planning and preparation",
    "Coordinate with other teachers using class timetable details",
    "Download or print timetables as needed"
  ]}
/>

</div>
  

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        <button
          onClick={() => navigate("/teacher/timetable/my")}
          className={`pb-2 ${
            currentPath.includes("/my")
              ? "text-blue-600 font-semibold border-b-2 border-blue-600"
    : "text-gray-500"
          }`}
        >
          My Timetable
        </button>
        <button
          onClick={() => navigate("/teacher/timetable/class")}
          className={`pb-2 ${
            currentPath.includes("/class")
               ? "text-blue-600 font-semibold border-b-2 border-blue-600"
    : "text-gray-500"
          }`}
        >
          Class Timetable
        </button>
      </div>

      {/* Render active tab */}
      <Outlet />
    </div>
     
  );
}
