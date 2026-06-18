import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMessageCircle,
  FiCalendar,
  FiChevronDown,
  FiTruck,
  FiSettings,
} from "react-icons/fi";

const MODULES = [
  {
    name: "Child Overview",
    icon: <FiUser />,
    subs: [
      { label: "Dashboard", path: "/parent" },
      { label: "Attendance", path: "/parent/attendance" },
      { label: "Assignments", path: "/parent/assignments" },
      { label: "Results", path: "/parent/results" },
      { label: "Fees", path: "/parent/fees" },
      { label: "Profile", path: "/parent/profile" },
    ],
  },
  {
    name: "Communication",
    icon: <FiMessageCircle />,
    subs: [
      { label: "Notices", path: "/parent/communication/notices" },
      { label: "Messages", path: "/parent/communication/messages" },
      { label: "Complaints", path: "/parent/communication/complaints" },
    ],
  },
  {
    name: "Calendar",
    icon: <FiCalendar />,
    subs: [
      { label: "School Calendar", path: "/parent-calendar" },
    ],
  },
  {
    name: "Transport",
    icon: <FiTruck />,
    subs: [
      { label: "Transport Route", path: "/parent/transport" },
      {
        label: "Request Change Route",
        path: "/parent/transport/request-change-route",
      },
    ],
  },
   {
    name: "Fees",
    icon: <FiCalendar />,
    subs: [
      { label: "Student Fees", path: "/parent/fees" },
    ],
  },
];

export default function ParentSidebar() {
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
      {/* SETTINGS + PARENT */}
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
  onClick={() => navigate("/parent/profile-settings")}
  className="cursor-pointer hover:text-indigo-600"
>
  Profile Settings
</div>

<div
  onClick={() => navigate("/parent/account-settings")}
  className="cursor-pointer hover:text-indigo-600"
>
  Account Settings
</div>
    </div>
  )}

  <div className="mt-4">
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="text-sm font-medium">
        Parent
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
