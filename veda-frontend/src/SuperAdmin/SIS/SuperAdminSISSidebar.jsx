import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiUser,
  FiFileText,
  FiMenu,
  FiSettings,
} from "react-icons/fi";
import { FiBook, FiCheckSquare } from "react-icons/fi";
import { useEffect, useState } from "react";
import ProfileAvatar, {
  resolveProfileImage,
} from "../../components/ProfileAvatar";

export default function SuperAdminSISSidebar({
  searchQuery = "",
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
const navigate = useNavigate();
  // Current logged-in user
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  const userName = currentUser?.name || "Super Admin";
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
      path: "/superadmin/sis",
      icon: <FiHome size={18} />,
    },
    {
      name: "Students",
      path: "/superadmin/sis/students",
      icon: <FiUsers size={18} />,
    },
    {
      name: "Staff",
      path: "/superadmin/sis/staff",
      icon: <FiUsers size={18} />,
    },
    {
      name: "Parents",
      path: "/superadmin/sis/parents",
      icon: <FiUsers size={18} />,
    },
    {
      name: "Classes & Schedule",
      path: "/superadmin/sis/classes-schedules",
      icon: <FiBook size={18} />,
    },
    {
      name: "Attendance",
      path: "/superadmin/sis/attendance",
      icon: <FiCheckSquare size={18} />,
    },
    {
      name: "Reports",
      path: "/superadmin/sis/reports",
      icon: <FiFileText size={18} />,
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
      overflow-hidden
      flex flex-col
      ${isSidebarOpen ? "w-64" : "w-14"}`}
    >
      {/* TOGGLE */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-3 left-3 p-2 rounded-md
        hover:bg-gray-200 transition z-40"
      >
        <FiMenu size={20} />
      </button>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto mt-14 px-3">
        <ul className="space-y-1">
          {filteredItems.map((item) => {
            const isActive =
  item.path === "/superadmin/sis"
    ? location.pathname === "/superadmin/sis"
    : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center h-10 rounded-lg
                transition-all
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

      {/* SETTINGS + ADMIN */}
      <div className="shrink-0 border-t bg-white p-3">

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
            <button
  onClick={() => navigate("/superadmin/settings/profile")}
  className="block w-full text-left transition-colors hover:text-blue-600"
>
  Profile Settings
</button>

<button
  onClick={() => navigate("/superadmin/settings/account")}
  className="block w-full text-left transition-colors hover:text-blue-600"
>
  Account Settings
</button>
          </div>
        )}

        {/* SUPER ADMIN BLOCK */}
        <div className="mt-3">
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
                  Super Admin
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