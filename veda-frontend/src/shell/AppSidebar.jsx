import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccess } from "../access/useAccess";
import { getSidebarModules } from "../config/modules";
import {
  FiHome,
  FiUsers,
  FiMessageCircle,
  FiCalendar,
  FiBriefcase,
  FiClipboard,
  FiBookOpen,
  FiChevronDown,
  FiTruck,
  FiSettings,
  FiMenu,
  FiUser,
  FiLayers,
  FiDollarSign,
  FiShield,
  FiDatabase,
} from "react-icons/fi";

const ICON_MAP = {
  FiUsers: <FiUsers size={18} />,
  FiMessageCircle: <FiMessageCircle size={18} />,
  FiCalendar: <FiCalendar size={18} />,
  FiDollarSign: <FiDollarSign size={18} />,
  FiBriefcase: <FiBriefcase size={18} />,
  FiClipboard: <FiClipboard size={18} />,
  FiBookOpen: <FiBookOpen size={18} />,
  FiTruck: <FiTruck size={18} />,
  FiLayers: <FiLayers size={18} />,
  FiShield: <FiShield size={18} />,
  FiDatabase: <FiDatabase size={18} />,
};

export default function AppSidebar({
  searchQuery = "",
  isSidebarOpen,
  setIsSidebarOpen,
  role: propRole,
}) {
  const { role: accessRole, canViewModule, isSuperAdmin } = useAccess();
  const isSuper = propRole
    ? String(propRole).toLowerCase() === "superadmin"
    : isSuperAdmin;
  const activeRole = propRole || accessRole;

  const [openModule, setOpenModule] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const modules = useMemo(() => {
    return getSidebarModules(activeRole, canViewModule);
  }, [activeRole, canViewModule]);

  // Filter modules and sub-items based on searchQuery
  const filteredModules = useMemo(() => {
    const q = String(searchQuery || "").trim().toLowerCase();
    if (!q) return modules;

    return modules
      .map((mod) => {
        const nameMatch = mod.name.toLowerCase().includes(q);
        const matchedSubs = (mod.subs || []).filter((s) =>
          s.label.toLowerCase().includes(q)
        );
        if (nameMatch || matchedSubs.length > 0) {
          return {
            ...mod,
            subs: nameMatch ? mod.subs : matchedSubs,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [modules, searchQuery]);

  // Auto-expand module accordion matching active URL
  useEffect(() => {
    const active = modules.find(
      (m) =>
        m.base && (location.pathname === m.base || location.pathname.startsWith(m.base + "/"))
    );
    if (active) {
      setOpenModule(active.name);
    }
  }, [location.pathname, modules]);

  // Sync CSS custom property for layout margin
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isSidebarOpen ? "256px" : "56px"
    );
  }, [isSidebarOpen]);

  const dashboardPath = isSuper ? "/superadmin-front/dashboard" : "/admin-front";
  const settingsPath = isSuper ? "/superadmin/settings/account" : "/admin-front/account";

  return (
    <aside
      className={`
        ${isSidebarOpen ? "w-64" : "w-14"}
        shrink-0
        bg-white
        shadow-md
        relative
        h-screen
        flex
        flex-col
        pt-16
        overflow-hidden
        transition-all
        duration-300
      `}
    >
      {/* ================= MENU TOGGLE BUTTON ================= */}
      <div className="h-14 shrink-0 flex items-center px-3 bg-white">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-md hover:bg-gray-200 transition"
          aria-label="Toggle navigation sidebar"
        >
          <FiMenu size={20} />
        </button>
      </div>

      {/* ================= SCROLLABLE MENU ITEMS ================= */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-3">
        {/* MAIN SECTION */}
        <div className="px-2 text-sm text-gray-500 font-semibold">Main</div>

        {/* DASHBOARD LINK */}
        <div
          onClick={() => navigate(dashboardPath)}
          className={`
            flex items-center gap-3 px-3 py-2 mt-2 rounded-lg font-medium cursor-pointer transition
            ${
              location.pathname === dashboardPath
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-800 hover:bg-gray-100"
            }
          `}
        >
          <span className="flex w-6 justify-center">
            <FiHome size={18} />
          </span>
          {isSidebarOpen && <span>Dashboard</span>}
        </div>

        {/* MODULE SECTION HEADER */}
        {isSidebarOpen && (
          <div className="px-2 mt-4 mb-2 text-sm text-gray-500 font-semibold">
            {isSuper ? "Administration & Modules" : "Modules"}
          </div>
        )}

        {/* MODULE LIST ACCORDION */}
        <div className="space-y-1">
          {filteredModules.map((mod) => {
            const isOpen = openModule === mod.name;
            const iconElement =
              typeof mod.icon === "string" ? ICON_MAP[mod.icon] || <FiUsers size={18} /> : mod.icon;

            return (
              <div key={mod.name}>
                {/* MODULE HEADER ROW */}
                <div
                  className={`
                    flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition
                    ${isOpen ? "bg-indigo-50/50 text-indigo-700" : "hover:bg-indigo-50 text-gray-800"}
                  `}
                  onClick={() => setOpenModule(isOpen ? null : mod.name)}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex w-6 justify-center text-gray-600">
                      {iconElement}
                    </span>
                    {isSidebarOpen && (
                      <span className="font-medium whitespace-nowrap text-sm">
                        {mod.name}
                      </span>
                    )}
                  </div>

                  {isSidebarOpen && (
                    <FiChevronDown
                      size={16}
                      className={`
                        text-gray-400 transition-transform duration-200
                        ${isOpen ? "rotate-180 text-indigo-600" : ""}
                      `}
                    />
                  )}
                </div>

                {/* SUB-MENU ITEMS */}
                {isSidebarOpen && isOpen && mod.subs && (
                  <div className="ml-9 mb-1 space-y-0.5 border-l-2 border-indigo-100 pl-2">
                    {mod.subs.map((sub) => {
                      const isActive =
                        location.pathname === sub.path ||
                        location.pathname.startsWith(sub.path + "/");

                      return (
                        <div
                          key={sub.path}
                          onClick={() => navigate(sub.path)}
                          className={`
                            py-1.5 px-2 rounded-md text-sm cursor-pointer transition
                            ${
                              isActive
                                ? "bg-indigo-50 font-semibold text-indigo-600"
                                : "text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
                            }
                          `}
                        >
                          {sub.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= FIXED BOTTOM SECTION ================= */}
      <div className="shrink-0 bg-white border-t px-3 pb-4">
        {/* SETTINGS BUTTON */}
        <button
          type="button"
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="flex items-center h-10 w-full rounded-lg px-2 gap-3 text-gray-700 hover:bg-gray-100 transition-colors mt-2"
        >
          <span className="flex w-6 justify-center text-gray-600">
            <FiSettings size={18} />
          </span>
          {isSidebarOpen && <span className="text-sm font-medium">Settings</span>}
        </button>

        {/* SETTINGS DROPDOWN */}
        {isSidebarOpen && settingsOpen && (
          <div className="ml-10 mt-1 space-y-1 text-sm text-gray-700">
            <div
              onClick={() => navigate(settingsPath)}
              className="py-1 px-2 rounded cursor-pointer hover:text-indigo-600 hover:bg-gray-50"
            >
              Account & Profile
            </div>
            {isSuper && (
              <div
                onClick={() => navigate("/superadmin/settings/manage-plan")}
                className="py-1 px-2 rounded cursor-pointer hover:text-indigo-600 hover:bg-gray-50"
              >
                Plan & Billing
              </div>
            )}
          </div>
        )}

        {/* ROLE BADGE CARD */}
        <div className="mt-3">
          {isSidebarOpen ? (
            <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  {isSuper ? "Super Admin" : "School Admin"}
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  VEDAED ERP
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active Session" />
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <FiUser size={20} className="text-gray-600" />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

