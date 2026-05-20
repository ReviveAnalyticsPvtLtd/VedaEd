import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FiUsers,
  FiMessageCircle,
  FiCalendar,
  FiBriefcase,
  FiClipboard,
  FiBookOpen,
  FiChevronDown,
  FiTruck,
  FiMenu,
} from "react-icons/fi";

/* ================= MODULE CONFIG ================= */

const MODULES = [
  {
    name: "SIS",
    icon: <FiUsers />,
    base: "/superadmin/sis",
    subs: [
      { label: "Dashboard", path: "/superadmin/sis/dashboard" },
      { label: "Students", path: "/superadmin/sis/students" },
      { label: "Staff", path: "/superadmin/sis/staff" },
      { label: "Parents", path: "/superadmin/sis/parents" },
      { label: "Attendance", path: "/superadmin/sis/attendance" },
      { label: "Reports", path: "/superadmin/sis/reports" },
    ],
  },
  {
    name: "Communication",
    icon: <FiMessageCircle />,
    base: "/superadmin/communication",
    subs: [
      { label: "Dashboard", path: "/superadmin/communication/dashboard" },
      { label: "Logs", path: "/superadmin/communication/logs" },
      { label: "Notices", path: "/superadmin/communication/notices" },
      { label: "Messages", path: "/superadmin/communication/messages" },
      { label: "Complaints", path: "/superadmin/communication/complaints" },
    ],
  },
  {
    name: "Calendar",
    icon: <FiCalendar />,
    base: "/superadmin/calendar",
    subs: [
      { label: "Annual Calendar", path: "/superadmin/calendar/annual" },
      { label: "Event Setup", path: "/superadmin/calendar/events" },
      { label: "Year Setup", path: "/superadmin/calendar/year-setup" },
    ],
  },
  {
    name: "HR",
    icon: <FiBriefcase />,
    base: "/superadmin/hr",
    subs: [
      { label: "Dashboard", path: "/superadmin/hr/dashboard" },
      { label: "Staff Directory", path: "/superadmin/hr/staff-directory" },
      { label: "Attendance", path: "/superadmin/hr/attendance" },
      { label: "Payroll", path: "/superadmin/hr/payroll" },
      { label: "Leave Approval", path: "/superadmin/hr/leave-approval" },
    ],
  },
  {
    name: "Admission",
    icon: <FiBookOpen />,
    base: "/superadmin/admission",
    subs: [
      { label: "Dashboard", path: "/superadmin/admission/dashboard" },
      { label: "Enquiry", path: "/superadmin/admission/enquiry" },
      { label: "Applications", path: "/superadmin/admission/applications" },
      { label: "Final Students", path: "/superadmin/admission/final-students" },
    ],
  },
  {
    name: "Transport",
    icon: <FiTruck />,
    base: "/superadmin/transport",
    subs: [
      { label: "Dashboard", path: "/superadmin/transport/dashboard" },
      { label: "Drivers", path: "/superadmin/transport/driver-admission" },
      { label: "Vehicles", path: "/superadmin/transport/vehicles" },
      { label: "Routes", path: "/superadmin/transport/routes" },
      { label: "Pickup Points", path: "/superadmin/transport/pickup-points" },
      { label: "Student Fees", path: "/superadmin/transport/student-fees" },
    ],
  },
];

export default function SuperAdminSidebar({
  searchQuery = "",
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const location = useLocation();
  const [openModule, setOpenModule] = useState(null);

  /* 🔥 AUTO-OPEN MODULE BASED ON URL */
  useEffect(() => {
    const active = MODULES.find((m) =>
      location.pathname.startsWith(m.base)
    );
    if (active) setOpenModule(active.name);
  }, [location.pathname]);

  /* sidebar width sync */
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isSidebarOpen ? "256px" : "56px"
    );
  }, [isSidebarOpen]);

  return (
    <aside
      className={`fixed top-16 left-0 h-[calc(100vh-64px)] bg-white border-r
      transition-all duration-300 z-30 overflow-y-auto
      ${isSidebarOpen ? "w-64" : "w-14"}`}
    >
      {/* TOGGLE */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-3 left-3 p-2 rounded hover:bg-gray-200"
      >
        <FiMenu />
      </button>

      <div className="mt-14 px-2">
        {MODULES.map((mod) => {
          const isOpen = openModule === mod.name;

          return (
            <div key={mod.name}>
              {/* MODULE HEADER */}
              <div
                onClick={() =>
                  setOpenModule(isOpen ? null : mod.name)
                }
                className={`flex items-center justify-between px-3 py-2
                rounded cursor-pointer hover:bg-gray-100`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 flex justify-center">
                    {mod.icon}
                  </span>
                  {isSidebarOpen && (
                    <span className="font-medium">
                      {mod.name}
                    </span>
                  )}
                </div>

                {isSidebarOpen && (
                  <FiChevronDown
                    className={`transition ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
              </div>

              {/* SUB ROUTES */}
              {isOpen && isSidebarOpen && (
                <div className="ml-8 mt-1">
                  {mod.subs.map((s) => (
                    <NavLink
                      key={s.path}
                      to={s.path}
                      className={({ isActive }) =>
                        `block py-2 text-sm rounded px-2 transition
                        ${
                          isActive
                            ? "text-blue-700 font-medium"
                            : "text-gray-600 hover:text-blue-600"
                        }`
                      }
                    >
                      {s.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}