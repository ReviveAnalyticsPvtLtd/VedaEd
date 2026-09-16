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

export default function TeacherCommunicationSidebar({
  searchQuery = "",
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // CURRENT USER
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  const userName = currentUser?.name || "Teacher User";
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
      path: "/teacher-communication/dashboard",
      icon: <FiHome size={18} />,
    },
    {
      name: "Logs",
      path: "/teacher-communication/logs",
      icon: <FiFileText size={18} />,
      end: true,
    },
    {
      name: "Notices",
      path: "/teacher-communication/notices",
      icon: <FiMail size={18} />,
    },
    {
      name: "Messages",
      path: "/teacher-communication/messages",
      icon: <FiSend size={18} />,
    },
    {
      name: "Complaints",
      path: "/teacher-communication/complaints",
      icon: <FiMessageCircle size={18} />,
    },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-64px)] bg-white border-r shadow-sm
      transition-all duration-300 z-30 overflow-hidden flex flex-col
      ${isSidebarOpen ? "w-64" : "w-14"}`}
    >
      {/* TOGGLE */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-3 left-3 p-2 rounded-md hover:bg-gray-200 transition z-10"
      >
        <FiMenu size={20} />
      </button>

      {/* MENU */}
      <div className="flex-1 min-h-0 overflow-y-auto mt-14 px-3">
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
                  ${
                    isSidebarOpen
                      ? "px-3 gap-3"
                      : "px-0 justify-center"
                  }
                  ${
                    isActive
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
              >
                <span className="flex w-6 justify-center shrink-0">
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

      {/* SETTINGS + PROFILE */}
      <div className="shrink-0 border-t bg-white p-3">

        {/* SETTINGS */}
        <button
          type="button"
          onClick={() => {
            if (!isSidebarOpen) {
              setIsSidebarOpen(true);
              setSettingsOpen(true);
            } else {
              setSettingsOpen(!settingsOpen);
            }
          }}
          className={`flex items-center w-full h-10 rounded-lg transition-all
            ${
              isSidebarOpen
                ? "px-3 gap-3"
                : "px-0 justify-center"
            }
            ${
              location.pathname.startsWith("/teacher/settings")
                ? "bg-blue-100 text-blue-700 font-medium"
                : "hover:bg-gray-100 text-gray-700"
            }`}
        >
          <span className="flex w-6 justify-center shrink-0">
            <FiSettings size={18} />
          </span>

          {isSidebarOpen && (
            <>
              <span className="flex-1 text-left whitespace-nowrap">
                Settings
              </span>

              
            </>
          )}
        </button>

        {/* SETTINGS SUBMENU */}
        {settingsOpen && isSidebarOpen && (
          <div className="ml-9 mt-1 space-y-1">
            <button
              type="button"
              onClick={() =>
                navigate("/teacher/settings/profile")
              }
              className={`block w-full text-left rounded-md px-2 py-2 text-sm transition
                ${
                  location.pathname === "/teacher/settings/profile"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              Profile Settings
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/teacher/settings/account")
              }
              className={`block w-full text-left rounded-md px-2 py-2 text-sm transition
                ${
                  location.pathname === "/teacher/settings/account"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              Account Settings
            </button>
          </div>
        )}

        {/* TEACHER PROFILE / AVATAR */}
        <div className="mt-2 pt-2 ">
          {isSidebarOpen ? (
            <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
              <ProfileAvatar
                name={userName}
                imageSrc={userImage}
                sizeClassName="w-8 h-8"
                textClassName="text-xs"
                className="ring-0"
              />

              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {userName}
                </div>

                <div className="text-xs text-gray-500">
                  Teacher
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