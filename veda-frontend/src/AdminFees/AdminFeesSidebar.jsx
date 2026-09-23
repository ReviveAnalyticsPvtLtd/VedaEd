import { NavLink, useLocation } from "react-router-dom";
import {
  FiHome,
  FiMenu,
  FiSettings,
  FiUser,
  FiDollarSign,
  FiSearch,
  FiLayers,
  FiTag,
  FiBell,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import ProfileAvatar, { resolveProfileImage } from "../components/ProfileAvatar";

export default function AdminFeesSidebar({
  searchQuery = "",
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  const userName = currentUser?.name || "Admin User";
  const userImage = resolveProfileImage(currentUser);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isSidebarOpen ? "256px" : "56px"
    );
  }, [isSidebarOpen]);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/fees",
      icon: <FiHome size={18} />,
      end: true,
    },
    {
      name: "Collect Fees",
      path: "/admin/fees/collect-fees",
      icon: <FiDollarSign size={18} />,
    },
    {
      name: "Collection Fees",
      path: "/admin/fees/admin-collection",
      icon: <FiDollarSign size={18} />,
    },
    {
      name: "Search Payment",
      path: "/admin/fees/search-payment",
      icon: <FiSearch size={18} />,
    },
    {
      name: "Search Due",
      path: "/admin/fees/search-due",
      icon: <FiSearch size={18} />,
    },
    {
      name: "Fee Master",
      path: "/admin/fees/fee-master",
      icon: <FiLayers size={18} />,
    },
    {
      name: "Fee Group",
      path: "/admin/fees/fee-group",
      icon: <FiLayers size={18} />,
    },
    {
      name: "Fee Type",
      path: "/admin/fees/fee-type",
      icon: <FiTag size={18} />,
    },
    {
      name: "Carry Forward",
      path: "/admin/fees/carry-forward",
      icon: <FiLayers size={18} />,
    },
    {
      name: "Reminder",
      path: "/admin/fees/reminder",
      icon: <FiBell size={18} />,
    },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-64px)]
      bg-white border-r shadow-sm
      transition-all duration-300 z-30
      flex flex-col
      ${isSidebarOpen ? "w-64" : "w-14"}`}
    >
      {/* TOGGLE BUTTON */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-3 left-3 p-2 rounded-md hover:bg-gray-200 transition"
      >
        <FiMenu size={20} />
      </button>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto mt-14 px-3">
        <ul className="space-y-1">
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
      </div>

      {/* SETTINGS + USER */}
      <div>
        {/* SETTINGS */}
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="flex items-center h-10 w-full rounded-lg
          px-2 gap-3 text-gray-700 hover:bg-gray-100
          transition-colors"
        >
          <span className="flex w-6 justify-center">
            <FiSettings size={18} />
          </span>

          {isSidebarOpen && <span>Settings</span>}
        </button>

        {/* SETTINGS SUBMENU */}
        {settingsOpen && isSidebarOpen && (
          <div className="ml-10 mt-2 space-y-2 text-sm text-gray-700">
            <NavLink
              to="/admin-front/settings/profile"
              className={({ isActive }) =>
                `block ${
                  isActive
                    ? "text-blue-600 font-medium"
                    : "hover:text-blue-600"
                }`
              }
            >
              Fees Settings
            </NavLink>

            <NavLink
              to="/admin-front/settings/profile"
              className={({ isActive }) =>
                `block ${
                  isActive
                    ? "text-blue-600 font-medium"
                    : "hover:text-blue-600"
                }`
              }
            >
              Payment Config
            </NavLink>
          </div>
        )}

        {/* ADMIN BLOCK */}
        <div className="shrink-0 border-t bg-white p-3 mt-1">
          {isSidebarOpen ? (
            <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
              <ProfileAvatar
                name={userName}
                imageSrc={userImage}
                sizeClassName="w-8 h-8"
                textClassName="text-xs"
                className="ring-0"
              />

              <div>
                <div className="text-sm font-medium">
                  {userName}
                </div>

                <div className="text-xs text-gray-500">
                  Administrator
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <ProfileAvatar
                name={userName}
                imageSrc={userImage}
                sizeClassName="w-8 h-8"
                textClassName="text-xs"
                className="ring-0"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}