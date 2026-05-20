import { NavLink, useLocation } from "react-router-dom";
import {
  FiUsers,
  FiClock,
  FiDollarSign,
  FiCheckSquare,
  FiSettings,
  FiMenu,
  FiUser,
  FiHome,
  FiUserPlus,
  FiList
} from "react-icons/fi";
import { useEffect, useState } from "react";

export default function HRSidebar({
  searchQuery = "",
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [talentOpen, setTalentOpen] = useState(true);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isSidebarOpen ? "256px" : "56px"
    );
  }, [isSidebarOpen]);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/hr/dashboard",
      icon: <FiHome />,
    },
    {
      name: "Talent Acquisition",
      isSubmenu: true,
      isOpen: talentOpen,
      toggle: () => setTalentOpen(!talentOpen),
      icon: <FiUserPlus size={18} />,
      children: [
        {
          name: "Vacancy Setup",
          path: "/hr/talent-acquisition/vacancy",
          icon: <FiCheckSquare size={16} />,
        },
        {
          name: "Candidate Application",
          path: "/hr/talent-acquisition/apply",
          icon: <FiUserPlus size={16} />,
        },
        {
          name: "Application Pipeline",
          path: "/hr/talent-acquisition/pipeline",
          icon: <FiList size={16} />,
        },
      ]
    },
    {
      name: "Staff Directory",
      path: "/hr/staff-directory",
      icon: <FiUsers size={18} />,
      end: true,
    },
    {
      name: "Staff Attendance",
      path: "/hr/staff-attendance",
      icon: <FiClock size={18} />,
    },
    {
      name: "Payroll",
      path: "/hr/payroll",
      icon: <FiDollarSign size={18} />,
    },
    {
      name: "Approve Leave",
      path: "/hr/approve-leave",
      icon: <FiCheckSquare size={18} />,
    },
    {
      name: "Support Staff",
      path: "/hr/support-staff",
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
          if (item.isSubmenu) {
            const isAnyChildActive = item.children.some(child => location.pathname.startsWith(child.path));
            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={item.toggle}
                  className={`flex items-center justify-between w-full h-10 rounded-lg transition-all px-3
                    ${isSidebarOpen ? "gap-3" : "justify-center"}
                    ${isAnyChildActive ? "bg-blue-50 text-blue-700 font-semibold" : "hover:bg-gray-100 text-gray-700"}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex w-6 justify-center">{item.icon}</span>
                    {isSidebarOpen && <span className="whitespace-nowrap font-medium">{item.name}</span>}
                  </div>
                  {isSidebarOpen && (
                    <span className="text-[10px] text-gray-500 transition-transform duration-200" style={{ display: 'inline-block', transform: item.isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                      ▼
                    </span>
                  )}
                </button>
                {item.isOpen && isSidebarOpen && (
                  <div className="pl-6 space-y-1">
                    {item.children.map(child => {
                      const isChildActive = location.pathname.startsWith(child.path);
                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={`flex items-center h-9 rounded-lg transition-all px-3 gap-2 text-sm
                            ${isChildActive ? "bg-blue-100 text-blue-700 font-medium" : "hover:bg-gray-50 text-gray-600"}
                          `}
                        >
                          <span className="flex w-4 justify-center">{child.icon}</span>
                          <span>{child.name}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

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
              Profile Settings
            </NavLink>
            <NavLink className="hover:text-blue-600 block">
              Account Settings
            </NavLink>
          </div>
        )}

        {/* USER INFO */}
        <div className="mt-4">
          {isSidebarOpen ? (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium">HR User</div>
              <div className="text-xs text-gray-500">Staff</div>
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
