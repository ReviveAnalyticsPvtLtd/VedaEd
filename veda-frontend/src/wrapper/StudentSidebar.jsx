import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBookOpen,
  FiMessageCircle,
  FiCalendar,
  FiTruck,
  FiChevronDown,
  FiSettings,
} from "react-icons/fi";

const MODULES = [
  {
    name: "Student SIS",
    icon: <FiBookOpen />,
    subs: [
      { label: "Dashboard", path: "/student" },
      { label: "My Classes", path: "/student/classes" },
      { label: "Attendance", path: "/student/attendance" },
      { label: "Assignments", path: "/student/assignments" },
      { label: "Exams", path: "/student/exams" },
      { label: "Results", path: "/student/results" },
      { label: "Profile", path: "/student/profile" },
    ],
  },
  {
    name: "Communication",
    icon: <FiMessageCircle />,
    subs: [
      { label: "Notices", path: "/student/communication/notices" },
      { label: "Messages", path: "/student/communication/messages" },
      { label: "Complaints", path: "/student/communication/complaints" },
    ],
  },
  {
    name: "Calendar",
    icon: <FiCalendar />,
    subs: [
      { label: "Academic Calendar", path: "/student/calendar" },
    ],
  },
  {
    /* ✅ NEW: STUDENT TRANSPORT */
    name: "Transport",
    icon: <FiTruck />,
    subs: [
      { label: "Transport Route", path: "/student/transport" },
    ],
  },
];

export default function StudentSidebar() {
  const [open, setOpen] = useState(null);
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <aside className="w-64 bg-white shadow-md overflow-y-auto pt-16 relative">

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
        onClick={() => navigate("/student/profile-settings")}
        className="cursor-pointer hover:text-indigo-600"
      >
        Profile Settings
      </div>

      <div
        onClick={() => navigate("/student/account-settings")}
        className="cursor-pointer hover:text-indigo-600"
      >
        Account Settings
      </div>
    </div>
  )}

  <div className="mt-4">
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="text-sm font-medium">
        Student
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