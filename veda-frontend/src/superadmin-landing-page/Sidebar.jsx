import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUser,
  FiSettings,
  FiMenu,
} from "react-icons/fi";
import SidebarProfile from "../components/common/SidebarProfile";

/* ================= TOOLTIP ================= */
const Tooltip = ({ label, show, children }) => {
  if (!show) return children;

  return (
    <div className="relative group flex justify-center">
      {children}
      <div
        className="absolute left-14 top-1/2 -translate-y-1/2
        bg-gray-900 text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50"
      >
        {label}
      </div>
    </div>
  );
};

/* ================= SIDEBAR ================= */
export default function SuperAdminSidebar({
  searchQuery,
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  /* Sidebar width */
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isSidebarOpen ? "256px" : "56px"
    );
  }, [isSidebarOpen]);

  /* Auto open settings on route */
  useEffect(() => {
    if (location.pathname.startsWith("/superadmin/settings")) {
      setSettingsOpen(true);
    }
  }, [location.pathname]);

  const isSettingsActive =
    location.pathname.startsWith("/superadmin/settings");

  const menuItems = [
    {
      name: "Dashboard",
      path: "/superadmin/dashboard",
      icon: <FiHome size={18} />,
    },
    {
      name: "Profile",
      path: "/superadmin/profile",
      icon: <FiUser size={18} />,
    },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-64px)] bg-white border-r shadow-sm
      transition-all duration-300 z-30 overflow-hidden
      ${isSidebarOpen ? "w-64" : "w-14"}`}
    >
      {/* Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-3 left-3 p-2 rounded-md hover:bg-gray-200"
      >
        <FiMenu size={20} />
      </button>

      {/* MENU */}
      <div className="mt-14 px-3 space-y-1">
        {filteredItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + "/");

          return (
            <Tooltip
              key={item.path}
              label={item.name}
              show={!isSidebarOpen}
            >
              <NavLink
                to={item.path}
                className={`flex items-center h-10 rounded-lg transition-all
                  ${isSidebarOpen ? "px-3 gap-3" : "justify-center"}
                  ${
                    isActive
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
              >
                <span className="flex w-6 justify-center">{item.icon}</span>
                {isSidebarOpen && <span>{item.name}</span>}
              </NavLink>
            </Tooltip>
          );
        })}
      </div>

      {/* ================= BOTTOM ================= */}
      <div className="absolute bottom-0 left-0 w-full px-3 pb-3 bg-white">
        {/* SETTINGS */}
        <Tooltip label="Settings" show={!isSidebarOpen}>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`flex items-center h-10 w-full rounded-lg px-2 gap-3 transition-colors
              ${
                isSettingsActive
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
          >
            <span className="flex w-6 justify-center">
              <FiSettings size={18} />
            </span>
            {isSidebarOpen && <span>Settings</span>}
          </button>
        </Tooltip>

        {/* SETTINGS DROPDOWN */}
        <div
          className={`ml-10 mt-2 space-y-2 text-sm overflow-hidden transition-all duration-300
            ${
              settingsOpen && isSidebarOpen
                ? "max-h-40 opacity-100"
                : "max-h-0 opacity-0"
            }`}
        >
          <NavLink
            to="/superadmin/settings/profile"
            className={({ isActive }) =>
              `block px-2 py-1 rounded ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "hover:text-blue-600"
              }`
            }
          >
            Profile Settings
          </NavLink>

          <NavLink
            to="/superadmin/settings/account"
            className={({ isActive }) =>
              `block px-2 py-1 rounded ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "hover:text-blue-600"
              }`
            }
          >
            Account Settings
          </NavLink>

          <NavLink
            to="/superadmin/settings/preferences"
            className={({ isActive }) =>
              `block px-2 py-1 rounded ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "hover:text-blue-600"
              }`
            }
          >
            Preferences
          </NavLink>
        </div>

        <SidebarProfile isSidebarOpen={isSidebarOpen} role="superadmin" />
      </div>
    </div>
  );
}