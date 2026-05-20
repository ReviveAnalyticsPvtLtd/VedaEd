import { NavLink, useLocation } from "react-router-dom";
import {
  FiHome,
  FiHelpCircle,
  FiList,
  FiUsers,
  FiFileText,
  FiCheckCircle,
  FiSettings,
  FiMenu,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { useEffect, useState } from "react";

export default function SuperAdminAdmissionSidebar({
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
    { name: "Dashboard", path: "/superadmin/admission/dashboard", icon: <FiHome />, end: true },
    { name: "Enquiry", path: "/superadmin/admission/enquiry", icon: <FiHelpCircle /> },
    { name: "Entrance List", path: "/superadmin/admission/entrance-list", icon: <FiList /> },
    { name: "Interview", path: "/superadmin/admission/interview", icon: <FiUsers /> },
    { name: "Documents", path: "/superadmin/admission/documents", icon: <FiFileText /> },
    { name: "Applications", path: "/superadmin/admission/applications", icon: <FiSettings /> },
    { name: "Final Students", path: "/superadmin/admission/final-students", icon: <FiCheckCircle /> },
  ];

  const settingsItems = [
    { name: "Admission Settings", path: "/superadmin/admission/settings/general" },
    { name: "Form Configuration", path: "/superadmin/admission/settings/forms" },
    { name: "Workflow Setup", path: "/superadmin/admission/settings/workflow" },
  ];

  return (
    <div
      className={`fixed top-16 left-0 z-40 h-[calc(100vh-64px)]
      bg-white border-r shadow-sm transition-all
      ${isSidebarOpen ? "w-64" : "w-14"}`}
    >
      {/* Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-3 left-3 p-2 hover:bg-gray-200 rounded"
      >
        <FiMenu />
      </button>

      {/* Main Menu */}
      <ul className="mt-14 space-y-1 px-3">
        {menuItems
          .filter(i =>
            i.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(item => {
            const active = item.end
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex h-10 items-center rounded-lg transition
                ${isSidebarOpen ? "px-3 gap-3" : "justify-center"}
                ${active ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}
              >
                <span className="w-6 flex justify-center">{item.icon}</span>
                {isSidebarOpen && item.name}
              </NavLink>
            );
          })}
      </ul>

      {/* ===== SETTINGS (REFERENCE STYLE) ===== */}
      <div className="absolute bottom-6 w-full px-2">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className={`flex h-10 w-full items-center rounded-lg transition
          ${isSidebarOpen ? "px-3 gap-3" : "justify-center"}
          ${
            location.pathname.includes("/admission/settings")
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-gray-100"
          }`}
        >
          <FiSettings />
          {isSidebarOpen && (
            <>
              <span className="flex-1 text-left">Settings</span>
              {settingsOpen ? <FiChevronUp /> : <FiChevronDown />}
            </>
          )}
        </button>

        {/* Settings Submenu */}
        {settingsOpen && isSidebarOpen && (
          <div className="mt-1 ml-6 space-y-1">
            {settingsItems.map(s => {
              const active = location.pathname === s.path;
              return (
                <NavLink
                  key={s.path}
                  to={s.path}
                  className={`block rounded-md px-3 py-2 text-sm transition
                  ${active ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100"}`}
                >
                  {s.name}
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}