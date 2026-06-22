import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBookOpen,
  FiMessageCircle,
  FiCalendar,
  FiChevronDown,
  FiTruck,
  FiSettings,
} from "react-icons/fi";

const MODULES = [
  {
    name: "Teacher SIS",
    icon: <FiBookOpen />,
    subs: [
      { label: "Dashboard", path: "/teacher" },
      { label: "Classes", path: "/teacher/classes" },
      { label: "Attendance", path: "/teacher/attendance" },
      { label: "Assignments", path: "/teacher/assignment" },
      { label: "Exams", path: "/teacher/exams" },
      { label: "Gradebook", path: "/teacher/gradebook" },
      { label: "Activities", path: "/teacher/activities" },
      { label: "Profile", path: "/teacher/profile" },
    ],
  },
  {
    name: "Communication",
    icon: <FiMessageCircle />,
    subs: [
      { label: "Logs", path: "/teacher-communication/logs" },
      { label: "Notices", path: "/teacher-communication/notices" },
      { label: "Messages", path: "/teacher-communication/messages" },
      { label: "Complaints", path: "/teacher-communication/complaints" },
    ],
  },
  {
    name: "Calendar",
    icon: <FiCalendar />,
    subs: [
      { label: "My Calendar", path: "/teacher/calendar" },
    ],
  },
   /* ================= FLEET MANAGER ================= */
  {
    name: "Fleet Manager",
    icon: <FiTruck />,
    subs: [
      { label: "Dashboard", path: "/fleet" },
      { label: "Vehicles", path: "/fleet/vehicles" },
      { label: "Maintenance", path: "/fleet/maintenance" },
      { label: "Documents", path: "/fleet/documents" },
      { label: "Expenses", path: "/fleet/expenses" },
      { label: "Fueling", path: "/fleet/fueling" },
      { label: "Driver Allocation", path: "/fleet/driver-allocation" },
    ],
  },
];

export default function StaffSidebar() {
  const [open, setOpen] = useState(null);
  const navigate = useNavigate();
   const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <aside className="w-64 bg-white shadow-md overflow-y-auto pt-16">

      {/* Main Section */}
      <div className="px-4 text-sm text-gray-500 font-semibold">
        Main
      </div>

      {/* Dashboard (NOT clickable) */}
      <div className="px-6 py-2 text-gray-800 font-medium">
        Dashboard
      </div>

      {/* Module Heading */}
      <div className="px-4 mt-4 text-sm text-gray-500 font-semibold">
        Module
      </div>

      {/* Modules */}
      {MODULES.map((mod) => (
        <div key={mod.name}>
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-indigo-50"
            onClick={() => setOpen(open === mod.name ? null : mod.name)}
          >
            <div className="flex items-center gap-3">
              {mod.icon}
              <span className="font-medium">{mod.name}</span>
            </div>
            <FiChevronDown
              className={`transition ${
                open === mod.name ? "rotate-180" : ""
              }`}
            />
          </div>

          {open === mod.name && (
            <div className="ml-8">
              {mod.subs.map((s) => (
                <div
                  key={s.path}
                  onClick={() => navigate(s.path)}
                  className="py-2 text-sm cursor-pointer text-gray-600 hover:text-indigo-600"
                >
                  {s.label}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
       {/* SETTINGS + STUDENT */}
      <div className="absolute bottom-4 w-full px-3">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="flex items-center h-10 w-full rounded-lg px-2 gap-3
          text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <span className="flex w-6 justify-center">
            <FiSettings size={18} />
          </span>
      
          <span>Settings</span>
        </button>
      
        {settingsOpen && (
          <div className="ml-10 mt-3 space-y-2 text-sm text-gray-700">
            <div
              onClick={() => navigate("/teacher/settings/profile")}
              className="cursor-pointer hover:text-indigo-600"
            >
              Profile Settings
            </div>
      
            
          </div>
        )}
      
        <div className="mt-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium">
              Teacher 
            </div>
      
            <div className="text-xs text-gray-500">
              VEDAED ERP
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
