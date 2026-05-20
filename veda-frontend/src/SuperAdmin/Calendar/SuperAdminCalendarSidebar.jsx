import { NavLink, useLocation } from "react-router-dom";
import {
  FiHome,
  FiMenu,
  FiSettings,
  FiUser,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { useEffect, useState } from "react";

export default function SuperAdminSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isSidebarOpen ? "256px" : "56px"
    );
  }, [isSidebarOpen]);

  const menuItems = [
    { name: "Dashboard", path: "/superadmin/dashboard", icon: <FiHome /> },
  ];

  const settingsItems = [
    { name: "Profile", path: "/superadmin/settings/profile" },
    { name: "Roles & Permissions", path: "/superadmin/settings/roles" },
    { name: "System Settings", path: "/superadmin/settings/system" },
  ];

  return (
    <div
      className={`fixed top-16 left-0 z-40 h-[calc(100vh-64px)]
      bg-white border-r shadow-sm transition-all
      ${isSidebarOpen ? "w-64" : "w-14"}`}
    >
      {/* Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-3 left-3 p-2 rounded hover:bg-gray-200"
      >
        <FiMenu />
      </button>

      {/* Main Menu */}
      <ul className="mt-14 px-3 space-y-1">
        {menuItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex h-10 items-center rounded-lg transition
              ${isSidebarOpen ? "px-3 gap-3" : "justify-center"}
              ${
                active
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-100"
              }`}
            >
              {item.icon}
              {isSidebarOpen && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </ul>

      {/* ===== SETTINGS SECTION (REFERENCE STYLE) ===== */}
      <div className="absolute bottom-20 w-full px-2">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className={`flex h-10 w-full items-center rounded-lg transition
          ${isSidebarOpen ? "px-3 gap-3" : "justify-center"}
          ${
            location.pathname.includes("/settings")
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-gray-100"
          }`}
        >
          <FiSettings />
          {isSidebarOpen && (
            <>
              <span className="flex-1 text-left">Settings</span>
              {settingsOpen ? <FiChevronUp /> : <FiChevronDown />}
            </>
          )}
        </button>

        {/* Settings Submenu */}
        {settingsOpen && isSidebarOpen && (
          <div className="mt-1 ml-6 space-y-1">
            {settingsItems.map((s) => {
              const active = location.pathname === s.path;
              return (
                <NavLink
                  key={s.path}
                  to={s.path}
                  className={`block rounded-md px-3 py-2 text-sm transition
                  ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {s.name}
                </NavLink>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin User */}
      <div className="absolute bottom-4 w-full px-2">
        <div
          className={`flex items-center rounded-lg text-gray-600
          ${isSidebarOpen ? "px-3 gap-3" : "justify-center"}`}
        >
          <FiUser />
          {isSidebarOpen && <span>Super Admin</span>}
        </div>
      </div>
    </div>
  );
}