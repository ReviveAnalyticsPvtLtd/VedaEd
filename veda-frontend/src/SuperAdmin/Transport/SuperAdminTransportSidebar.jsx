import { NavLink, useLocation } from "react-router-dom";
import {
  FiTruck,
  FiUserPlus,
  FiMap,
  FiMapPin,
  FiUsers,
  FiClipboard,
  FiSettings,
  FiMenu,
  FiUser,
  FiHome,
} from "react-icons/fi";
import { useEffect, useState } from "react";

export default function SuperAdminTransportSidebar({
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
      name: "Dashboard",
      path: "/superadmin/transport/dashboard",
      icon: <FiHome size={18} />,
      isDashboard: true,
    },
    {
      name: "Driver Admission",
      path: "/superadmin/transport/driver-admission",
      icon: <FiUserPlus size={18} />,
    },
    {
      name: "Vehicles",
      path: "/superadmin/transport/vehicles",
      icon: <FiTruck size={18} />,
    },
    {
      name: "Routes",
      path: "/superadmin/transport/routes",
      icon: <FiMap size={18} />,
    },
    {
      name: "Pickup Points",
      path: "/superadmin/transport/pickup-points",
      icon: <FiMapPin size={18} />,
    },
    {
      name: "Assign Vehicle",
      path: "/superadmin/transport/assign-vehicle",
      icon: <FiClipboard size={18} />,
    },
    {
      name: "Student Transport Fees",
      path: "/superadmin/transport/student-fees",
      icon: <FiUsers size={18} />,
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
      {/* TOGGLE */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-3 left-3 p-2 rounded-md hover:bg-gray-200 transition"
      >
        <FiMenu size={20} />
      </button>

      {/* MENU */}
      <ul className="mt-14 space-y-1 px-3">
        {filteredItems.map((item) => {
          const isActive = item.isDashboard
            ? location.pathname === "/superadmin/transport" ||
              location.pathname.startsWith("/superadmin/transport/dashboard")
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center h-10 rounded-lg transition-all
                ${isSidebarOpen ? "px-3 gap-3" : "px-0 justify-center"}
                ${
                  isActive
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
            >
              <span className="flex w-6 justify-center">{item.icon}</span>
              {isSidebarOpen && (
                <span className="whitespace-nowrap">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </ul>

      {/* SETTINGS + ADMIN (REFERENCE SAME) */}
      <div className="absolute bottom-4 w-full px-2">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="flex items-center h-10 w-full rounded-lg px-2 gap-3
          text-gray-700 hover:bg-gray-100 transition-colors mt-4"
        >
          <span className="flex w-6 justify-center">
            <FiSettings size={18} />
          </span>
          {isSidebarOpen && <span>Settings</span>}
        </button>

        {settingsOpen && isSidebarOpen && (
          <div className="ml-10 mt-3 space-y-2 text-sm text-gray-700">
            <NavLink
              to="/superadmin/transport/settings/profile"
              className="hover:text-blue-600 block"
            >
              Profile Settings
            </NavLink>
            <NavLink
              to="/superadmin/transport/settings/account"
              className="hover:text-blue-600 block"
            >
              Account Settings
            </NavLink>
          </div>
        )}

        {/* ADMIN INFO */}
        <div className="mt-4">
          {isSidebarOpen ? (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium">Transport Admin</div>
              <div className="text-xs text-gray-500">Super Admin</div>
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <FiUser size={20} className="text-gray-600" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}