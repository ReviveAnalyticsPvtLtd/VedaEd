import { NavLink, useLocation } from "react-router-dom";
import {
  FiMenu,
  FiArrowLeft,
  FiUser,
  FiBell,
  FiShield,
  FiCreditCard,
  FiFileText,
  FiSettings,
  FiHelpCircle,
  FiMail,
  FiMessageSquare,
} from "react-icons/fi";
import { useEffect } from "react";

export default function SuperAdminSettingsSidebar({
  searchQuery = "",
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
          name: "Account",
          path: "/superadmin/settings/account",
          icon: <FiUser size={18} />,
        },
        {
          name: "Preferences",
          path: "/superadmin/settings/preferences",
          icon: <FiSettings size={18} />,
        },
        {
          name: "Notifications",
          path: "/superadmin/settings/notifications",
          icon: <FiBell size={18} />,
        },
      ],
    },
    {
      section: "SECURITY",
      items: [
        {
          name: "Security",
          path: "/superadmin/settings/security",
          icon: <FiShield size={18} />,
        },
      ],
    },
    {
      section: "BILLING",
      items: [
        {
          name: "Manage Plan",
          path: "/superadmin/settings/manage-plan",
          icon: <FiCreditCard size={18} />,
        },
        {
          name: "Billing Details",
          path: "/superadmin/settings/billing-details",
          icon: <FiFileText size={18} />,
        },
        {
          name: "Billing Settings",
          path: "/superadmin/settings/billing-settings",
          icon: <FiSettings size={18} />,
        },
      ],
    },
    {
      section: "SUPPORT",
      items: [
        {
          name: "Help Center",
          path: "/superadmin/settings/help-center",
          icon: <FiHelpCircle size={18} />,
        },
        {
          name: "Contact Support",
          path: "/superadmin/settings/contact-support",
          icon: <FiMail size={18} />,
        },
        {
          name: "Feedback",
          path: "/superadmin/settings/feedback",
          icon: <FiMessageSquare size={18} />,
        },
      ],
    },
  ];

  return (
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-64px)]
      bg-white border-r shadow-sm transition-all duration-300
      z-30 overflow-y-auto
      ${isSidebarOpen ? "w-64" : "w-14"}`}
    >
      {/* Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-3 left-3 p-2 rounded-md hover:bg-gray-200 transition"
      >
        <FiMenu size={20} />
      </button>

      <div className="mt-14 px-3">
        {/* HOME */}
        <NavLink
          to="/superadmin-front/dashboard"
          className={`flex items-center h-10 rounded-lg transition-all
          ${isSidebarOpen ? "px-3 gap-3" : "justify-center"}
          hover:bg-gray-100 text-gray-800`}
        >
          <span className="flex w-6 justify-center">
            <FiArrowLeft size={18} />
          </span>

          {isSidebarOpen && (
            <span className="font-medium">Home</span>
          )}
        </NavLink>

        <div className="border-b my-4" />

        {/* Sections */}
        {menuItems.map((section) => (
          <div key={section.section} className="mb-6">
            {isSidebarOpen && (
              <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">
                {section.section}
              </div>
            )}

            {section.items.map((item) => {
              const isActive =
                location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center h-10 rounded-lg transition-all
                  ${isSidebarOpen ? "px-3 gap-3" : "justify-center"}
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
                    <span>{item.name}</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}