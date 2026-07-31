import { NavLink, useLocation , useNavigate  } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FiHome,
  FiUsers,
  FiMessageCircle,
  FiCalendar,
  FiBriefcase,
  FiClipboard,
  FiBookOpen,
  FiChevronDown,
  FiTruck,
  FiMenu,
  FiShield,
  FiUser
} from "react-icons/fi";
import { FiSettings } from "react-icons/fi";
/* ================= MODULE CONFIG ================= */

const IDENTITY_BASE = "/superadmin-front/identity-access";

const PLATFORM_MODULES = [
  {
    name: "Identity & Access",
    icon: <FiShield />,
    base: IDENTITY_BASE,
    subs: [
      {
        label: "Admin Management",
        path: `${IDENTITY_BASE}/admins`,
      },
      {
        label: "Create Admin",
        path: `${IDENTITY_BASE}/admins/create`,
      },
    ],
  },

 
];

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
const [settingsOpen, setSettingsOpen] = useState(false);
  const allModules = [...PLATFORM_MODULES, ...MODULES];
  const navigate = useNavigate();

  /* AUTO-OPEN MODULE BASED ON URL */
  useEffect(() => {
    const active = allModules.find((m) =>
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
  className={`
    ${isSidebarOpen ? "w-64" : "w-14"}
    shrink-0
    bg-white
    shadow-md
    relative
    h-screen
    flex
    flex-col
    pt-16
    overflow-hidden
    transition-all
    duration-300
  `}
>
      {/* TOGGLE */}
     <div className="h-14 shrink-0 flex items-center px-3 bg-white">
  <button
    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
    className="p-2 rounded-md hover:bg-gray-200 transition"
  >
    <FiMenu size={20} />
  </button>
</div>

     <div
  className="
    flex-1
    min-h-0
    overflow-y-auto
    scrollbar-none
    px-3
  "
>
        {/* =========================
    MAIN
========================= */}
<div className="px-2 text-sm text-gray-500 font-semibold">
  Main
</div>

{/* =========================
    DASHBOARD
========================= */}
<div
  onClick={() => navigate("/superadmin-front")}
  className={`
    flex items-center gap-3 px-3 py-2 mt-2 rounded-lg
    font-medium cursor-pointer transition
    ${
      location.pathname === "/superadmin-front"
        ? "bg-indigo-50 text-indigo-600"
        : "text-gray-800 hover:bg-gray-100"
    }
  `}
>
  <span className="flex w-6 justify-center">
    <FiHome size={18} />
  </span>

  {isSidebarOpen && <span>Dashboard</span>}
</div>

{/* =========================
    MODULE HEADING
========================= */}
{isSidebarOpen && (
  <div className="px-2 mt-4 mb-2 text-sm text-gray-500 font-semibold">
    Module
  </div>
)}
        {allModules.map((mod) => {
          const isOpen = openModule === mod.name;

          return (
            <div key={mod.name}>
              {/* MODULE HEADER */}
              <div
                onClick={() =>
                  setOpenModule(isOpen ? null : mod.name)
                }
               className={`
flex items-center justify-between
px-3 py-3 rounded-lg cursor-pointer transition
${
  isOpen
    ? "bg-indigo-50 text-indigo-600"
    : "hover:bg-indigo-50 text-gray-800"
}
`}
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
      {/* SETTINGS + ADMIN */}
<div className="shrink-0 bg-white border-t px-3 pb-4">
  <button
    onClick={() => setSettingsOpen(!settingsOpen)}
    className="flex items-center h-10 w-full rounded-lg px-2 gap-3
    text-gray-700 hover:bg-gray-100 transition-colors"
  >
    <span className="flex w-6 justify-center">
      <FiSettings size={18} />
    </span>

    {isSidebarOpen && <span>Settings</span>}
  </button>

  {/* SETTINGS DROPDOWN */}
  {settingsOpen && isSidebarOpen && (
    <div className="ml-10 mt-3 space-y-2 text-sm text-gray-700">
      <NavLink
        to="/superadmin/settings"
        className="hover:text-blue-600 block"
      >
        Profile Settings
      </NavLink>

     
    </div>
  )}

  {/* ADMIN BLOCK */}
  <div className="mt-4">
    {isSidebarOpen ? (
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="text-sm font-medium">
          Super Admin
        </div>

        <div className="text-xs text-gray-500">
          VEDAED ERP
        </div>
      </div>
    ) : (
      <div className="flex justify-center py-2">
        <FiUser size={20} className="text-gray-600" />
      </div>
    )}
  </div>
</div>
    </aside>
  );
}