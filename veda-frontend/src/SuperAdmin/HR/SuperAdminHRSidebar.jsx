import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiCheckSquare,
  FiDollarSign,
  FiUser,
  FiSettings,
  FiMenu,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { useEffect, useState } from "react";

export default function SuperAdminHRSidebar({
  searchQuery = "",
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isSidebarOpen ? "256px" : "56px"
    );
  }, [isSidebarOpen]);

  const menuItems = [
    { name: "Dashboard", path: "/superadmin/hr/dashboard", icon: <FiHome />, end: true },
    { name: "Staff Directory", path: "/superadmin/hr/staff-directory", icon: <FiUsers /> },
    { name: "Staff Profile", path: "/superadmin/hr/staff-profile", icon: <FiUser /> },
    { name: "Attendance", path: "/superadmin/hr/attendance", icon: <FiCalendar /> },
    { name: "Leave Approval", path: "/superadmin/hr/leave-approval", icon: <FiCheckSquare /> },
    { name: "Payroll", path: "/superadmin/hr/payroll", icon: <FiDollarSign /> },
  ];

  const settingsItems = [
    { name: "HR Settings", path: "/superadmin/hr/settings/general" },
    { name: "Leave Policy", path: "/superadmin/hr/settings/leave-policy" },
    { name: "Payroll Setup", path: "/superadmin/hr/settings/payroll" },
  ];

  return (
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-64px)]
      bg-white border-r shadow-sm transition-all z-40
      ${isSidebarOpen ? "w-64" : "w-14"}`}
    >
      {/* Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-3 left-3 p-2 rounded hover:bg-gray-200"
      >
        <FiMenu />
      </button>

      {/* MENU */}
      <ul className="mt-14 space-y-1 px-3">
        {menuItems
          .filter(i =>
            i.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex h-10 items-center rounded-lg transition
                ${isSidebarOpen ? "px-3 gap-3" : "justify-center"}
                ${
                  isActive
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                }`
              }
            >
              <span className="w-6 flex justify-center">{item.icon}</span>
              {isSidebarOpen && item.name}
            </NavLink>
          ))}
      </ul>

      {/* SETTINGS */}
      <div className="absolute bottom-6 w-full px-2">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="flex h-10 w-full items-center rounded-lg px-3 gap-3
          hover:bg-gray-100 text-gray-700"
        >
          <FiSettings />
          {isSidebarOpen && (
            <>
              <span className="flex-1 text-left">Settings</span>
              {settingsOpen ? <FiChevronUp /> : <FiChevronDown />}
            </>
          )}
        </button>

        {settingsOpen && isSidebarOpen && (
          <div className="ml-6 mt-1 space-y-1">
            {settingsItems.map(s => (
              <NavLink
                key={s.path}
                to={s.path}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm transition
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-gray-100"
                  }`
                }
              >
                {s.name}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}