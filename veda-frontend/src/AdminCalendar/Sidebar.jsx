import { NavLink, useLocation } from "react-router-dom";
import {
  FiCalendar,
  FiList,
  FiClock,
  FiSettings,
  FiMenu,
  FiUser,
} from "react-icons/fi";
import { useEffect, useState } from "react";

export default function AdminCalendarSidebar({
  searchQuery = "",
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
    {
      name: "Annual Year Setup",
      path: "/admin/calendar/year-setup",
      icon: <FiClock size={18} />,
    },
    {
      name: "Event Setup",
      path: "/admin/calendar/event-setup",
      icon: <FiList size={18} />,
    },
    
    {
      name: "Annual Calendar",
      path: "/admin/calendar/annual",
      icon: <FiCalendar size={18} />,
      end: true,
    },
    
  ];

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`
        fixed left-0 bg-white border-r shadow-sm
        transition-all duration-300 z-30 overflow-hidden
        ${isSidebarOpen ? "w-64" : "w-14"}
      `}
      style={{
        top: "64px",                      // ✅ navbar height
        height: "calc(100vh - 64px)",     // ✅ remaining screen
      }}
    >
      {/* INNER WRAPPER */}
      <div className="relative h-full flex flex-col">

        {/* TOGGLE */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-3 left-3 p-2 rounded-md hover:bg-gray-200 transition"
        >
          <FiMenu size={20} />
        </button>

        {/* MENU */}
        <ul className="mt-14 flex-1 overflow-y-auto space-y-1 px-3">
          {filteredItems.map((item) => {
            const isActive = item.end
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={`flex items-center h-10 rounded-lg transition-all
                  ${isSidebarOpen ? "px-3 gap-3" : "px-0 justify-center"}
                  ${
                    isActive
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "hover:bg-gray-100 text-gray-700"
                  }
                `}
              >
                <span className="flex w-6 justify-center">
                  {item.icon}
                </span>
                {isSidebarOpen && (
                  <span className="whitespace-nowrap">
                    {item.name}
                  </span>
                )}
              </NavLink>
            );
          })}
        </ul>

        {/* SETTINGS + USER INFO */}
        <div className="border-t p-2">
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

         {/* SETTINGS SUBMENU */}
{settingsOpen && isSidebarOpen && (
  <div className="ml-10 mt-3 space-y-2 text-sm text-gray-700">
    <NavLink
      to="/admin-front/settings/profile"
      className={({ isActive }) =>
        `block transition-colors ${
          isActive
            ? "text-blue-600 font-medium"
            : "hover:text-blue-600"
        }`
      }
    >
      Profile Settings
    </NavLink>

    <NavLink
      to="/admin-front/settings/account"
      className={({ isActive }) =>
        `block transition-colors ${
          isActive
            ? "text-blue-600 font-medium"
            : "hover:text-blue-600"
        }`
      }
    >
      Account Settings
    </NavLink>
  </div>
)}
          {/* USER INFO */}
          <div className="mt-4">
            {isSidebarOpen ? (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium">Admin User</div>
                <div className="text-xs text-gray-500">
                  Calendar Admin
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-2">
                <FiUser size={20} className="text-gray-600" />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}