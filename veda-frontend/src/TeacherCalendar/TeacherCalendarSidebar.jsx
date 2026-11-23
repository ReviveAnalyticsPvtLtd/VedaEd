import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiCalendar,
  FiSettings,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

import SidebarProfile from "../components/common/SidebarProfile";

export default function TeacherCalendarSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // =========================
  // CURRENT USER
  // =========================
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
        transition-all
        duration-300
        z-30
        flex
        flex-col
        overflow-hidden
        ${isSidebarOpen ? "w-64" : "w-14"}
      `}
    >
      {/* =========================
          TOGGLE BUTTON
      ========================= */}
      <button
        type="button"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="
          absolute
          top-3
          left-3
          p-2
          rounded-md
          hover:bg-gray-100
          transition
          z-10
        "
        title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        <FiMenu size={20} />
      </button>

      {/* =========================
          MENU
      ========================= */}
      <div className="flex-1 min-h-0 overflow-y-auto mt-14 px-3">
        {isSidebarOpen && (
          <div className="px-2 mb-2 text-sm text-gray-500 font-semibold">
            Main
          </div>
        )}

        <div
          className={`
            flex
            items-center
            h-10
            rounded-lg
            bg-blue-100
            text-blue-700
            font-medium
            transition-all
            ${
              isSidebarOpen
                ? "px-3 gap-3"
                : "justify-center"
            }
          `}
        >
          <span className="flex w-6 justify-center shrink-0">
            <FiCalendar size={18} />
          </span>

          {isSidebarOpen && (
            <span className="whitespace-nowrap">
              Annual Calendar
            </span>
          )}
        </div>
      </div>

      {/* =========================
          SETTINGS + TEACHER PROFILE
      ========================= */}
      <div className="shrink-0 border-t border-gray-200 bg-white p-3">

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
          className={`
            flex
            items-center
            w-full
            h-10
            rounded-lg
            transition-all
            ${
              isSidebarOpen
                ? "px-3 gap-3"
                : "px-0 justify-center"
            }
            ${
              window.location.pathname.startsWith(
                "/teacher/settings"
              )
                ? "bg-blue-100 text-blue-700 font-medium"
                : "hover:bg-gray-100 text-gray-700"
            }
          `}
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
              className={`
                block
                w-full
                text-left
                rounded-md
                px-2
                py-2
                text-sm
                transition
                ${
                  window.location.pathname ===
                  "/teacher/settings/profile"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }
              `}
            >
              Profile Settings
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/teacher/settings/account")
              }
              className={`
                block
                w-full
                text-left
                rounded-md
                px-2
                py-2
                text-sm
                transition
                ${
                  window.location.pathname ===
                  "/teacher/settings/account"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }
              `}
            >
              Account Settings
            </button>

          </div>
        )}

        <SidebarProfile isSidebarOpen={isSidebarOpen} role="teacher" />
      </div>
    </aside>
  );
}