import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiFileText,
  FiMail,
  FiSend,
  FiMessageCircle,
  FiSettings,
  FiMenu,
  FiHome,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import ProfileAvatar, {
  resolveProfileImage,
} from "../components/ProfileAvatar";

export default function CommunicationStudentSidebar({
  searchQuery = "",
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  const userName =
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.username ||
    "Student";

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
      path: "/student/communication/dashboard",
      icon: <FiHome size={18} />,
    },
    {
      name: "Logs",
      path: "/student/communication/logs",
      icon: <FiFileText size={18} />,
      end: true,
    },
    {
      name: "Notices",
      path: "/student/communication/notices",
      icon: <FiMail size={18} />,
    },
    {
      name: "Messages",
      path: "/student/communication/messages",
      icon: <FiSend size={18} />,
    },
    {
      name: "Complaints",
      path: "/student/communication/complaints",
      icon: <FiMessageCircle size={18} />,
    },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProfileSettings = () => {
    navigate("/student/settings/profile");
    setSettingsOpen(false);
  };

  const handleAccountSettings = () => {
    navigate("/student/settings/account");
    setSettingsOpen(false);
  };

  return (
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-64px)]
      bg-white border-r shadow-sm
      transition-all duration-300 z-30
      overflow-hidden flex flex-col
      ${isSidebarOpen ? "w-64" : "w-14"}`}
    >
      {/* ================= TOGGLE ================= */}
      <button
        type="button"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-3 left-3 p-2 rounded-md hover:bg-gray-200 transition"
      >
        <FiMenu size={20} />
      </button>

      {/* ================= MENU ================= */}
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

      {/* ================= BOTTOM SECTION ================= */}
      <div className="shrink-0 border-t bg-white p-3">
        {/* ================= SETTINGS ================= */}
        {isSidebarOpen ? (
          <div className="mb-2">
            <button
              type="button"
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full flex items-center h-10 px-3 gap-3
              rounded-lg hover:bg-gray-100 text-gray-700 transition"
            >
              <span className="flex w-6 justify-center">
                <FiSettings size={18} />
              </span>

              <span className="flex-1 text-left text-sm">
                Settings
              </span>

              
            </button>

            {settingsOpen && (
              <div className="mt-1 ml-9 space-y-1">
                <button
                  type="button"
                  onClick={handleProfileSettings}
                  className="w-full text-left px-3 py-2 text-sm
                  rounded-md hover:bg-gray-100 text-gray-600"
                >
                  Profile Settings
                </button>

                <button
                  type="button"
                  onClick={handleAccountSettings}
                  className="w-full text-left px-3 py-2 text-sm
                  rounded-md hover:bg-gray-100 text-gray-600"
                >
                  Account Settings
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="w-full flex justify-center py-2 rounded-lg
            hover:bg-gray-100 text-gray-700 transition"
            title="Settings"
          >
            <FiSettings size={18} />
          </button>
        )}

        {/* ================= USER INFO ================= */}
        <div
          className={`${
            isSidebarOpen
              ? "p-3 bg-gray-50 rounded-lg flex items-center gap-2"
              : "flex justify-center py-2"
          }`}
        >
          <ProfileAvatar
            name={userName}
            imageSrc={userImage}
            sizeClassName="w-8 h-8"
            textClassName="text-xs"
            className="ring-0"
          />

          {isSidebarOpen && (
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {userName}
              </div>

              <div className="text-xs text-gray-500">
                Student
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}