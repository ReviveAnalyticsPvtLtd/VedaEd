import { NavLink, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiCheckSquare,
  FiDollarSign,
  FiUser,
  FiUserPlus,
  FiList,
  FiSettings,
  FiMenu,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import SidebarProfile from "../../components/common/SidebarProfile";

export default function SuperAdminHRSidebar({
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
    { name: "Dashboard", path: "/superadmin/hr/dashboard", icon: <FiHome />, end: true },
    {
      name: "Talent Acquisition",
      isSubmenu: true,
      isOpen: talentOpen,
      toggle: () => setTalentOpen(!talentOpen),
      icon: <FiUserPlus />,
      children: [
        {
          name: "Vacancy Setup",
          path: "/superadmin/hr/talent-acquisition/vacancy",
          icon: <FiCheckSquare />,
        },
        {
          name: "Candidate Application",
          path: "/superadmin/hr/talent-acquisition/apply",
          icon: <FiUserPlus />,
        },
        {
          name: "Application Pipeline",
          path: "/superadmin/hr/talent-acquisition/pipeline",
          icon: <FiList />,
        },
      ],
    },
    { name: "Staff Directory", path: "/superadmin/hr/staff-directory", icon: <FiUsers /> },
    { name: "Staff Profile", path: "/superadmin/hr/staff-profile", icon: <FiUser /> },
    { name: "Attendance", path: "/superadmin/hr/attendance", icon: <FiCalendar /> },
    { name: "Leave Approval", path: "/superadmin/hr/leave-approval", icon: <FiCheckSquare /> },
    { name: "Payroll", path: "/superadmin/hr/payroll", icon: <FiDollarSign /> },
  ];

  return (
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-64px)]
      bg-white border-r shadow-sm transition-all z-40 flex flex-col
      ${isSidebarOpen ? "w-64" : "w-14"}`}
    >
      {/* Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-3 left-3 p-2 rounded hover:bg-gray-200"
      >
        <FiMenu />
      </button>

      {/* MENU */}
      <ul className="mt-14 flex-1 overflow-y-auto scrollbar-none space-y-1 px-3 pb-2">
        {menuItems
          .filter(i =>
            i.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(item => {
            if (item.isSubmenu) {
              const isAnyChildActive = item.children.some(child =>
                location.pathname.startsWith(child.path)
              );

              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={item.toggle}
                    className={`flex h-10 w-full items-center rounded-lg transition
                    ${isSidebarOpen ? "px-3 gap-3 justify-between" : "justify-center"}
                    ${
                      isAnyChildActive
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <div
                      className={`flex items-center ${
                        isSidebarOpen ? "gap-3" : "justify-center"
                      }`}
                    >
                      <span className="flex w-6 justify-center">{item.icon}</span>
                      {isSidebarOpen && (
                        <span className="whitespace-nowrap">{item.name}</span>
                      )}
                    </div>

                    {isSidebarOpen && (
                      <span
                        className="text-[10px] text-gray-500 transition-transform duration-200"
                        style={{
                          display: "inline-block",
                          transform: item.isOpen
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                        }}
                      >
                        ▼
                      </span>
                    )}
                  </button>

                  {item.isOpen && isSidebarOpen && (
                    <div className="ml-6 space-y-1">
                      {item.children.map(child => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={({ isActive }) =>
                            `flex h-9 items-center gap-2 rounded-lg px-3 text-sm transition
                            ${
                              isActive
                                ? "bg-blue-100 text-blue-700 font-medium"
                                : "hover:bg-gray-50 text-gray-600"
                            }`
                          }
                        >
                          <span className="flex w-4 justify-center">
                            {child.icon}
                          </span>
                          <span className="whitespace-nowrap">{child.name}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex h-10 items-center rounded-lg transition
                  ${isSidebarOpen ? "px-3 gap-3" : "justify-center"}
                  ${
                    isActive
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "hover:bg-gray-100 text-gray-700"
                  }`
                }
              >
                <span className="w-6 flex justify-center">{item.icon}</span>
                {isSidebarOpen && item.name}
              </NavLink>
            );
          })}
      </ul>

      {/* SETTINGS + USER INFO */}
      <div className="shrink-0 border-t px-2 pb-3">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-2
          text-gray-700 transition-colors hover:bg-gray-100 mt-2"
        >
          <span className="flex w-6 justify-center">
            <FiSettings size={18} />
          </span>
          {isSidebarOpen && <span>Settings</span>}
        </button>

        {settingsOpen && isSidebarOpen && (
          <div className="ml-10 mt-2 space-y-2 text-sm text-gray-700">
            <NavLink
              to="/superadmin/settings/profile"
              className={({ isActive }) =>
                `block transition-colors ${
                  isActive ? "text-blue-600 font-medium" : "hover:text-blue-600"
                }`
              }
            >
              Profile Settings
            </NavLink>

            <NavLink
              to="/superadmin/settings/account"
              className={({ isActive }) =>
                `block transition-colors ${
                  isActive ? "text-blue-600 font-medium" : "hover:text-blue-600"
                }`
              }
            >
              Account Settings
            </NavLink>
          </div>
        )}

        <SidebarProfile isSidebarOpen={isSidebarOpen} role="superadmin" />
      </div>
    </div>
  );
}