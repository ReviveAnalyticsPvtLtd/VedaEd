import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiCalendar,
  FiSettings,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import SidebarProfile from "../components/common/SidebarProfile";

export default function StudentCalendarSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);


  useEffect(() => {
    document.documentElement.style.setProperty(
      "--student-calendar-sidebar-width",
      isSidebarOpen ? "256px" : "56px"
    );

    return () => {
      document.documentElement.style.removeProperty(
        "--student-calendar-sidebar-width"
      );
    };
  }, [isSidebarOpen]);

  const handleProfileSettings = () => {
    navigate("/student/settings/profile");
    setSettingsOpen(false);
  };

  const handleAccountSettings = () => {
    navigate("/student/settings/account");
    setSettingsOpen(false);
  };

  return (
    <aside
      className={`
        fixed
        top-16
        left-0
        h-[calc(100vh-64px)]
        bg-white
        border-r
        border-gray-200
        shadow-sm
        z-30
        flex
        flex-col
        overflow-hidden
        transition-all
        duration-300
        ${isSidebarOpen ? "w-64" : "w-14"}
      `}
    >
      {/* ================= MENU BUTTON ================= */}
      <div className="absolute top-3 left-3">
        <button
          type="button"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="
            w-9 h-9
            flex items-center justify-center
            rounded-lg
            text-gray-600
            hover:bg-gray-100
            hover:text-gray-900
            transition
          "
          title={
            isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"
          }
        >
          <FiMenu size={21} />
        </button>
      </div>

      {/* ================= MAIN MENU ================= */}
      <div className="flex-1 overflow-y-auto mt-14 px-3">
        {isSidebarOpen && (
          <div className="px-3 mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Main
            </p>
          </div>
        )}

        <ul className="space-y-1">
          <li>
            <NavLink
              to="/student/calendar"
              className={({ isActive }) => `
                flex items-center
                ${isSidebarOpen ? "gap-3 px-3" : "justify-center"}
                py-2.5
                rounded-lg
                text-sm
                font-medium
                transition-all
                ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }
              `}
              title={!isSidebarOpen ? "Annual Calendar" : undefined}
            >
              <FiCalendar size={20} className="shrink-0" />

              {isSidebarOpen && (
                <span className="whitespace-nowrap">
                  Annual Calendar
                </span>
              )}
            </NavLink>
          </li>
        </ul>
      </div>

      {/* ================= BOTTOM SECTION ================= */}
      <div className="shrink-0 border-t border-gray-200 bg-white p-3">
        {/* ================= SETTINGS ================= */}
        {isSidebarOpen ? (
          <div className="mb-2">
            <button
              type="button"
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="
                w-full
                flex items-center
                h-10
                px-3
                gap-3
                rounded-lg
                hover:bg-gray-100
                text-gray-700
                transition
              "
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
                  className="
                    w-full
                    text-left
                    px-3
                    py-2
                    text-sm
                    rounded-md
                    hover:bg-gray-100
                    text-gray-600
                  "
                >
                  Profile Settings
                </button>

                <button
                  type="button"
                  onClick={handleAccountSettings}
                  className="
                    w-full
                    text-left
                    px-3
                    py-2
                    text-sm
                    rounded-md
                    hover:bg-gray-100
                    text-gray-600
                  "
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
            className="
              w-full
              flex justify-center
              py-2
              rounded-lg
              hover:bg-gray-100
              text-gray-700
              transition
            "
            title="Settings"
          >
            <FiSettings size={18} />
          </button>
        )}

        <SidebarProfile isSidebarOpen={isSidebarOpen} role="student" />
      </div>
    </aside>
  );
}