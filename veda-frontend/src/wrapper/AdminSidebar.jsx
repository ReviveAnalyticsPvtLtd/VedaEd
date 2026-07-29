import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { filterModulesByPermission } from "../utils/adminPermissions";

import {
  FiUsers,
  FiMessageCircle,
  FiCalendar,
  FiBriefcase,
  FiClipboard,
  FiBookOpen,
  FiChevronDown,
  FiTruck,
  FiSettings,
  FiMenu,
  FiUser,
  FiHome,
} from "react-icons/fi";

const MODULES = [
  {
    name: "Admin SIS",
    icon: <FiUsers size={18} />,
    subs: [
      { label: "Students", path: "/admin/students" },
      { label: "Staff", path: "/admin/staff" },
      { label: "Parents", path: "/admin/parents" },
      { label: "Attendance", path: "/admin/attendance" },
      { label: "Reports", path: "/admin/reports" },
    ],
  },
  {
    name: "Communication",
    icon: <FiMessageCircle size={18} />,
    subs: [
      { label: "Logs", path: "/communication/logs" },
      { label: "Notices", path: "/communication/notices" },
      { label: "Messages", path: "/communication/messages" },
      { label: "Complaints", path: "/communication/complaints" },
    ],
  },
  {
    name: "Admin Calendar",
    icon: <FiCalendar size={18} />,
    subs: [
      {
        label: "Annual Calendar",
        path: "/admin/calendar/annual",
      },
      {
        label: "Event Setup",
        path: "/admin/calendar/event-setup",
      },
      {
        label: "Annual Year Setup",
        path: "/admin/calendar/year-setup",
      },
    ],
  },
  {
    name: "HR Module",
    icon: <FiBriefcase size={18} />,
    subs: [
      {
        label: "Staff Directory",
        path: "/hr/staff-directory",
      },
      {
        label: "Attendance",
        path: "/hr/staff-attendance",
      },
      {
        label: "Payroll",
        path: "/hr/payroll",
      },
      {
        label: "Approve Leave",
        path: "/hr/approve-leave",
      },
    ],
  },
  {
    name: "Receptionist",
    icon: <FiClipboard size={18} />,
    subs: [
      {
        label: "Admission Enquiry",
        path: "/receptionist/admission-enquiry",
      },
      {
        label: "Visitor Book",
        path: "/receptionist/visitor-book",
      },
      {
        label: "Student Details",
        path: "/receptionist/student-details",
      },
    ],
  },
  {
    name: "Admission",
    icon: <FiBookOpen size={18} />,
    subs: [
      { label: "Dashboard", path: "/admission" },
      {
        label: "Applications",
        path: "/admission/application-list",
      },
      {
        label: "Status Tracking",
        path: "/admission/status-tracking",
      },
      {
        label: "Vacancy Setup",
        path: "/admission/vacancy-setup",
      },
    ],
  },
  {
    name: "Transport Module",
    icon: <FiTruck size={18} />,
    subs: [
      {
        label: "Dashboard",
        path: "/admin/transport",
      },
      {
        label: "Fees Master",
        path: "/admin/transport/fees-master",
      },
      {
        label: "Pickup Point",
        path: "/admin/transport/pickup-point",
      },
      {
        label: "Routes",
        path: "/admin/transport/routes",
      },
      {
        label: "Vehicles",
        path: "/admin/transport/vehicles",
      },
      {
        label: "Assign Vehicle",
        path: "/admin/transport/assign-vehicle",
      },
      {
        label: "Route Pickup Point",
        path: "/admin/transport/route-pickup-point",
      },
      {
        label: "Student Transport Fees",
        path: "/admin/transport/student-transport-fees",
      },
    ],
  },
];

export default function AdminSidebar() {
  const [open, setOpen] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const visibleModules = useMemo(
    () => filterModulesByPermission(MODULES),
    []
  );
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
      {/* =========================
          MENU BUTTON
      ========================= */}
      <div className="h-14 shrink-0 flex items-center px-3 bg-white">
 <button
  type="button"
  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
  className="
    p-2
    rounded-md
    hover:bg-gray-200
    transition
  "
>
  <FiMenu size={20} />
</button>
</div>

      {/* =========================
          SCROLLABLE MENU
      ========================= */}
      <div
        className="
          flex-1
          min-h-0
          overflow-y-auto
          scrollbar-none
          px-3
        "
      >
        {/* MAIN */}
        <div className="px-2 text-sm text-gray-500 font-semibold">
          Main
        </div>

        {/* DASHBOARD */}
        <div
          onClick={() => navigate("/admin-front")}
          className="
            flex
            items-center
            gap-3
            px-3
            py-2
            mt-2
            rounded-lg
            text-gray-800
            font-medium
            cursor-pointer
            hover:bg-gray-100
          "
        >
          <span className="flex w-6 justify-center">
            <FiHome size={18} />
          </span>

          {isSidebarOpen && <span>Dashboard</span>}
        </div>

        {/* MODULE HEADING */}
        {isSidebarOpen && (
  <div className="px-2 mt-4 mb-2 text-sm text-gray-500 font-semibold">
    Module
  </div>
)}

        {/* MODULES */}
        <div className="space-y-1">
          {visibleModules.map((mod) => {
            const isOpen = open === mod.name;

            return (
              <div key={mod.name}>
                {/* MODULE HEADER */}
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    px-3
                    py-3
                    rounded-lg
                    cursor-pointer
                    hover:bg-indigo-50
                    transition
                  "
                  onClick={() =>
                    setOpen(isOpen ? null : mod.name)
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className="flex w-6 justify-center">
                      {mod.icon}
                    </span>

                    {isSidebarOpen && (
  <span className="font-medium whitespace-nowrap">
    {mod.name}
  </span>
)}
                  </div>

                  {isSidebarOpen && (
  <FiChevronDown
    className={`
      transition-transform
      duration-200
      ${isOpen ? "rotate-180" : ""}
    `}
  />
)}
                </div>

                {/* SUB MENU */}
               {isSidebarOpen && isOpen && (
                  <div className="ml-9 mb-1">
                    {mod.subs.map((sub) => (
                      <div
                        key={sub.path}
                        onClick={() => navigate(sub.path)}
                        className="
                          py-2
                          px-2
                          rounded-md
                          text-sm
                          cursor-pointer
                          text-gray-600
                          hover:bg-gray-100
                          hover:text-indigo-600
                        "
                      >
                        {sub.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================
          FIXED BOTTOM SECTION
      ========================= */}
      <div className="shrink-0 bg-white border-t px-3 pb-4">
        {/* SETTINGS */}
        <button
          type="button"
          onClick={() =>
            setSettingsOpen(!settingsOpen)
          }
          className="
            flex
            items-center
            h-10
            w-full
            rounded-lg
            px-2
            gap-3
            text-gray-700
            hover:bg-gray-100
            transition-colors
            mt-2
          "
        >
          <span className="flex w-6 justify-center">
            <FiSettings size={18} />
          </span>

         {isSidebarOpen && <span>Settings</span>}
        </button>

        {/* SETTINGS DROPDOWN */}
        {isSidebarOpen && settingsOpen && (
          <div className="ml-10 mt-2 space-y-2 text-sm text-gray-700">
            <div
              onClick={() =>
                navigate("/admin-front/settings")
              }
              className="
                cursor-pointer
                hover:text-indigo-600
              "
            >
              Profile Settings
            </div>
          </div>
        )}

        {/* ADMIN CARD */}
       <div className="mt-3">
  {isSidebarOpen ? (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="text-sm font-medium">
        Admin
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