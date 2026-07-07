// src/Teacher SIS/Sidebar.jsx
import { NavLink, useLocation } from "react-router-dom";
import {
  FiHome,
  FiBook,
  FiCheckSquare,
  FiClipboard,
  FiCalendar,
  FiClock,
  FiBarChart2,
  FiActivity,
  FiMessageSquare,
  FiUser,
  FiSettings,
  FiMenu,
} from "react-icons/fi";
import React, { useEffect, useState } from "react";
import ProfileAvatar, { resolveProfileImage } from "../components/ProfileAvatar";

export default function TeacherSidebar({
  searchQuery,
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
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
    { name: "Dashboard", path: "/teacher", icon: <FiHome size={18} /> },
    { name: "Classes", path: "/teacher/classes", icon: <FiBook size={18} /> },
    { name: "Attendance", path: "/teacher/attendance", icon: <FiCheckSquare size={18} /> },
    { name: "Assignment", path: "/teacher/assignment", icon: <FiClipboard size={18} /> },
    { name: "Exams", path: "/teacher/exams", icon: <FiCalendar size={18} /> },
    { name: "Timetable", path: "/teacher/timetable", icon: <FiClock size={18} /> },
    { name: "Gradebook", path: "/teacher/gradebook", icon: <FiBarChart2 size={18} /> },
    { name: "Activities", path: "/teacher/activities", icon: <FiClipboard size={18} /> },

    { name: "Disciplinary ", path: "/teacher/discipline", icon: <FiActivity size={18} /> },
    { name: "Communication", path: "/teacher/communication", icon: <FiMessageSquare size={18} /> },
    { name: "Student Health", path: "/teacher/student-health", icon: <FiActivity size={18} /> },
    { name: "Profile", path: "/teacher/profile", icon: <FiUser size={18} /> },
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
      {/* Toggle button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-3 left-3 p-2 rounded-md hover:bg-gray-200 transition"
      >
        <FiMenu size={20} />
      </button>

      {/* Entire scrollable area */}
      <div className="flex-1 overflow-y-auto scrollbar-none mt-14 px-3 space-y-1">
        {/* Menu items */}
        {filteredItems.map((item) => {
          const isActive =
            item.path === "/teacher"
              ? location.pathname === "/teacher"
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center h-10 rounded-lg transition-all
                ${isSidebarOpen ? "px-3 gap-3" : "px-0 justify-center"}
                ${
                  isActive
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
            >
              <span className="flex w-6 justify-center">{item.icon}</span>
              {isSidebarOpen && <span className="whitespace-nowrap">{item.name}</span>}
            </NavLink>
          );
        })}

        {/* Settings button */}
       
     

        {/* Teacher user info */}
        <div className="mt-4">
          {isSidebarOpen ? (
            <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
              <ProfileAvatar name={userName} imageSrc={userImage} sizeClassName="w-8 h-8" textClassName="text-xs" className="ring-0" />
              <div>
              <div className="text-sm font-medium">{userName}</div>
              <div className="text-xs text-gray-500">Teacher</div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <ProfileAvatar name={userName} imageSrc={userImage} sizeClassName="w-8 h-8" textClassName="text-xs" className="ring-0" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
