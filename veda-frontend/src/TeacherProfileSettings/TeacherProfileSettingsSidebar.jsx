import { NavLink, useLocation } from "react-router-dom";
import {
  FiMenu,
  FiArrowLeft,
  FiUser,
  FiBell,
  FiShield,
  FiSettings,
  FiHelpCircle,
  FiMail,
  FiMessageSquare,
} from "react-icons/fi";
import { useEffect } from "react";

export default function TeacherProfileSettingsSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const location = useLocation();

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isSidebarOpen ? "256px" : "56px"
    );
  }, [isSidebarOpen]);

  const menuItems = [
    {
      section: "GENERAL",
      items: [
        {
          name: "Profile",
          path: "/teacher/settings/profile",
          icon: <FiUser size={18} />,
        },
        {
          name: "Account",
          path: "/teacher/settings/account",
          icon: <FiUser size={18} />,
        },
        {
          name: "Preferences",
          path: "/teacher/settings/preferences",
          icon: <FiSettings size={18} />,
        },
        {
          name: "Notifications",
          path: "/teacher/settings/notifications",
          icon: <FiBell size={18} />,
        },
      ],
    },
    {
      section: "SECURITY",
      items: [
        {
          name: "Security",
          path: "/teacher/settings/security",
          icon: <FiShield size={18} />,
        },
      ],
    },
    {
      section: "SUPPORT",
      items: [
        {
          name: "Help Center",
          path: "/teacher/settings/help-center",
          icon: <FiHelpCircle size={18} />,
        },
        {
          name: "Contact Support",
          path: "/teacher/settings/contact-support",
          icon: <FiMail size={18} />,
        },
        {
          name: "Feedback",
          path: "/teacher/settings/feedback",
          icon: <FiMessageSquare size={18} />,
        },
      ],
    },
  ];

  return (
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-64px)]
      bg-white border-r shadow-sm z-30
      ${isSidebarOpen ? "w-64" : "w-14"}`}
    >
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-3 left-3 p-2 rounded-md hover:bg-gray-200"
      >
        <FiMenu size={20} />
      </button>

      <div className="mt-14 px-3">
        <NavLink
          to="/teacher"
          className={`flex items-center h-10 rounded-lg
          ${isSidebarOpen ? "px-3 gap-3" : "justify-center"}
          hover:bg-gray-100`}
        >
          <FiArrowLeft size={18} />
          {isSidebarOpen && (
            <span className="font-medium">Home</span>
          )}
        </NavLink>

        <div className="border-b my-4" />

        {menuItems.map((section) => (
          <div key={section.section} className="mb-6">
            {isSidebarOpen && (
              <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">
                {section.section}
              </div>
            )}

            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center h-10 rounded-lg
                ${isSidebarOpen ? "px-3 gap-3" : "justify-center"}
                ${
                  location.pathname === item.path
                    ? "bg-blue-100 text-blue-700"
                    : "hover:bg-gray-100"
                }`}
              >
                {item.icon}
                {isSidebarOpen && <span>{item.name}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}