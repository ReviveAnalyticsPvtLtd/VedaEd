import { NavLink, useLocation } from "react-router-dom";
import {
  FiTruck,
  FiMapPin,
  FiCreditCard,
  FiUsers,
  FiSettings,
  FiMenu,

  FiHome,
   FaUserTie ,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import SidebarProfile from "../components/common/SidebarProfile";

export default function TransportSidebar({
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
      path: "/admin/transport",
      icon: <FiHome />,
      end: true,
    },
    {
  name: "Driver Admission",
  path: "/admin/transport/driver-admission",
  icon: <FiHome />
},
    {
      name: "Fees Master",
      path: "/admin/transport/fees-master",
      icon: <FiCreditCard size={18} />,
    },
    {
      name: "Pickup Point",
      path: "/admin/transport/pickup-point",
      icon: <FiMapPin size={18} />,
    },
    {
      name: "Routes",
      path: "/admin/transport/routes",
      icon: <FiMapPin size={18} />,
    },
    {
      name: "Vehicles",
      path: "/admin/transport/vehicles",
      icon: <FiTruck size={18} />,
    },
    {
      name: "Assign Vehicle",
      path: "/admin/transport/assign-vehicle",
      icon: <FiUsers size={18} />,
    },
    {
      name: "Route Pickup Point",
      path: "/admin/transport/route-pickup-point",
      icon: <FiMapPin size={18} />,
    },
    {
      name: "Student Transport Fees",
      path: "/admin/transport/student-transport-fees",
      icon: <FiCreditCard size={18} />,
    },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-64px)] bg-white border-r shadow-sm
      transition-all duration-300 z-30 overflow-hidden
      ${isSidebarOpen ? "w-64" : "w-14"}
    `}
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
              <span className="flex w-6 justify-center">{item.icon}</span>
              {isSidebarOpen && (
                <span className="whitespace-nowrap">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </ul>

      {/* SETTINGS + USER INFO */}
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
            <NavLink className="hover:text-blue-600 block">
              Transport Settings
            </NavLink>
            <NavLink className="hover:text-blue-600 block">
              Route Configuration
            </NavLink>
          </div>
        )}

        <SidebarProfile isSidebarOpen={isSidebarOpen} role="admin" />
      </div>
    </div>
  );
}