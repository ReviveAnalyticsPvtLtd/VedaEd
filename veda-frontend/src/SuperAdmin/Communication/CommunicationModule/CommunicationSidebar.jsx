import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiFileText,
  FiMail,
  FiSend,
  FiMessageCircle,
  FiSettings,
  FiMenu,
  FiUser,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import SidebarProfile from "../../../components/common/SidebarProfile";

export default function CommunicationSidebar({
  searchQuery = "",
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const location = useLocation();
  const navigate = useNavigate();
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
      path: "/superadmin/communication",
      icon: <FiUser size={18} />,
      end: true,
    },
    {
      name: "Logs",
      path: "/superadmin/communication/logs",
      icon: <FiFileText size={18} />,
      end: true,
    },
    {
      name: "Notices",
      path: "/superadmin/communication/notices",
      icon: <FiMail size={18} />,
    },
    {
      name: "Messages",
      path: "/superadmin/communication/messages",
      icon: <FiSend size={18} />,
    },
    {
      name: "Complaints",
      path: "/superadmin/communication/complaints",
      icon: <FiMessageCircle size={18} />,
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

      {/* SETTINGS + USER INFO */}
      <div className="absolute bottom-4 w-full px-2">
        {/* SETTINGS */}
        {isSidebarOpen ? (
          <div className="mb-2">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`flex items-center w-full h-10 px-3 gap-3 rounded-lg transition-all
                ${
                  location.pathname.startsWith("/superadmin/communication/")
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
            >
              <span className="flex w-6 justify-center">
                <FiSettings size={18} />
              </span>
              <span className="whitespace-nowrap">Settings</span>
            </button>

            {settingsOpen && (
              <div className="ml-9 mt-1 space-y-1 text-sm">
                <button
                  onClick={() =>
                    navigate("/superadmin/settings/profile")
                  }
                  className="block w-full text-left px-2 py-1.5 rounded hover:bg-gray-100"
                >
                  Profile Settings
                </button>

                <button
                  onClick={() =>
                    navigate("/superadmin/settings/account")
                  }
                  className="block w-full text-left px-2 py-1.5 rounded hover:bg-gray-100"
                >
                  Account Settings
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate("/superadmin/settings/account")}
            className="flex justify-center w-full py-2 rounded-lg hover:bg-gray-100"
          >
            <FiSettings size={20} className="text-gray-600" />
          </button>
        )}

        <SidebarProfile isSidebarOpen={isSidebarOpen} role="superadmin" />
             </div>
           </div>
  );
}