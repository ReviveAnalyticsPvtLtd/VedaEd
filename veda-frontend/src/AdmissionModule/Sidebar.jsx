import { NavLink, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUserPlus,
  FiClipboard,
  FiFileText,
  FiList,
  FiBookOpen,
  FiCheckSquare,
  FiMail,
  FiDollarSign,
  FiSettings,
  FiMenu,
  FiUser,
} from "react-icons/fi";
import { useEffect, useState } from "react";

export default function AdmissionSidebar({
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
    { name: "Dashboard", path: "/admission", icon: <FiHome size={18} />, end: true },
    { name: "Admission Enquiry", path: "/admission/admission-enquiry", icon: <FiUserPlus size={18} /> },
    { name: "Vacancy Setup", path: "/admission/vacancy-setup", icon: <FiClipboard size={18} /> },
    { name: "Admission Form", path: "/admission/admission-form", icon: <FiList size={18} /> },
    { name: "Application List", path: "/admission/application-list", icon: <FiFileText size={18} /> },
    { name: "Entrance Exam", path: "/admission/entrance-list", icon: <FiClipboard size={18} /> },
    { name: "Interview List", path: "/admission/interview-list", icon: <FiFileText size={18} /> },
    { name: "Docs Verification", path: "/admission/Document-Verification", icon: <FiBookOpen size={18} /> },
    { name: "Selected Student", path: "/admission/selected-student", icon: <FiUser size={18} /> },
    { name: "Application Offer", path: "/admission/application-offer", icon: <FiMail size={18} /> },
    { name: "Fees Confirmation", path: "/admission/registration-fees", icon: <FiDollarSign size={18} /> },
    { name: "Status Tracking", path: "/admission/status-tracking", icon: <FiCheckSquare size={18} /> },
    { name: "Final Student List", path: "/admission/final-students", icon: <FiUser size={18} /> },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-64px)] bg-white border-r shadow-sm
      transition-all duration-300 z-30
      ${isSidebarOpen ? "w-64" : "w-14"}
      flex flex-col`}
    >
      {/* TOGGLE BUTTON */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-3 left-3 p-2 rounded-md hover:bg-gray-200 transition z-40"
      >
        <FiMenu size={20} />
      </button>

      {/* ===== SCROLLABLE MENU AREA ===== */}
      <div className="flex-1 overflow-y-auto scrollbar-none mt-14 px-3 space-y-1">
        {filteredItems.map((item) => {
         const isActive =
  item.path === "/admission/final-students"
    ? location.pathname.startsWith("/admission/final-student") ||
      location.pathname.startsWith("/admission/final-students")
    : item.end
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
      </div>

      {/* ===== FIXED BOTTOM SECTION ===== */}
      <div className="px-2 pb-3 border-t">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="flex items-center h-10 w-full rounded-lg px-2 gap-3
          text-gray-700 hover:bg-gray-100 transition-colors mt-2"
        >
          <span className="flex w-6 justify-center">
            <FiSettings size={18} />
          </span>
          {isSidebarOpen && <span>Settings</span>}
        </button>

        {/* SETTINGS SUBMENU */}
{settingsOpen && isSidebarOpen && (
  <div className="ml-10 mt-2 space-y-2 text-sm text-gray-700">
    <NavLink
      to="/admin-front/settings/profile"
      className={({ isActive }) =>
        `block transition-colors ${
          isActive
            ? "text-blue-600 font-medium"
            : "hover:text-blue-600"
        }`
      }
    >
      Profile Settings
    </NavLink>

    <NavLink
      to="/admin-front/settings/account"
      className={({ isActive }) =>
        `block transition-colors ${
          isActive
            ? "text-blue-600 font-medium"
            : "hover:text-blue-600"
        }`
      }
    >
      Account Settings
    </NavLink>
  </div>
)}

        {/* USER INFO */}
        <div className="mt-3">
          {isSidebarOpen ? (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium">Admission User</div>
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
