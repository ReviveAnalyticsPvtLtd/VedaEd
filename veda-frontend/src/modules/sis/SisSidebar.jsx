import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FiMenu, FiSettings } from "react-icons/fi";
import ProfileAvatar, {
  resolveProfileImage,
} from "../../components/ProfileAvatar";
import useAccess from "../../access/useAccess";
import sisModule from "./module.config";
import sisNav from "./nav";

/**
 * Shared SIS sidebar used by both the admin and superadmin SIS layouts.
 *
 * It resolves every nav path against the current role's module base path, so
 * there is only one menu definition in `nav.js`.
 */
export default function SisSidebar({
  searchQuery = "",
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const { role, basePath } = useAccess();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const moduleBasePath = basePath(sisModule.id);
  const settingsBasePath =
    sisModule.settingsPaths?.[role] || sisModule.settingsPaths?.admin || "";

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  const userName =
    currentUser?.name ||
    (role === "superadmin" ? "Super Admin" : "Admin User");
  const userImage = resolveProfileImage(currentUser);
  const userSubtitle = role === "superadmin" ? "Super Admin" : "Administrator";

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isSidebarOpen ? "256px" : "56px"
    );
  }, [isSidebarOpen]);

  const visibleItems = useMemo(() => {
    const query = String(searchQuery || "").toLowerCase();
    return sisNav
      .filter((item) => !item.roles || item.roles.includes(role))
      .filter((item) => item.label.toLowerCase().includes(query));
  }, [role, searchQuery]);

  const resolveHref = (path) =>
    path ? `${moduleBasePath}/${path}` : moduleBasePath;

  const isItemActive = (item) => {
    const href = resolveHref(item.path);
    if (!item.path) {
      return (
        location.pathname === href || location.pathname === `${href}/`
      );
    }
    return (
      location.pathname === href ||
      location.pathname.startsWith(`${href}/`)
    );
  };

  return (
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-64px)]
      bg-white border-r shadow-sm
      transition-all duration-300 z-30
      flex flex-col
      ${isSidebarOpen ? "w-64" : "w-14"}`}
    >
      {/* TOGGLE BUTTON */}
      <button
        type="button"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-3 left-3 p-2 rounded-md hover:bg-gray-200 transition"
        aria-label="Toggle SIS sidebar"
      >
        <FiMenu size={20} />
      </button>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto mt-14 px-3">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <NavLink
                  to={resolveHref(item.path)}
                  className={`flex items-center h-10 rounded-lg transition-all
                    ${isSidebarOpen ? "px-3 gap-3" : "px-0 justify-center"}
                    ${
                      isItemActive(item)
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }
                  `}
                >
                  <span className="flex w-6 justify-center">
                    <Icon size={18} />
                  </span>
                  {isSidebarOpen && (
                    <span className="whitespace-nowrap">{item.label}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      {/* SETTINGS + USER */}
      <div className="shrink-0 border-t bg-white p-3">
        <button
          type="button"
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="flex items-center h-10 w-full rounded-lg
          px-2 gap-3 text-gray-700 hover:bg-gray-100
          transition-colors"
        >
          <span className="flex w-6 justify-center">
            <FiSettings size={18} />
          </span>
          {isSidebarOpen && <span>Settings</span>}
        </button>

        {settingsOpen && isSidebarOpen && (
          <div className="ml-10 mt-2 space-y-2 text-sm text-gray-700">
            <NavLink
              to={`${settingsBasePath}/profile`}
              className={({ isActive }) =>
                `block ${
                  isActive ? "text-blue-600 font-medium" : "hover:text-blue-600"
                }`
              }
            >
              Profile Settings
            </NavLink>
            <NavLink
              to={`${settingsBasePath}/account`}
              className={({ isActive }) =>
                `block ${
                  isActive ? "text-blue-600 font-medium" : "hover:text-blue-600"
                }`
              }
            >
              Account Settings
            </NavLink>
          </div>
        )}

        {/* USER BLOCK */}
        <div className="mt-3">
          {isSidebarOpen ? (
            <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
              <ProfileAvatar
                name={userName}
                imageSrc={userImage}
                sizeClassName="w-8 h-8"
                textClassName="text-xs"
                className="ring-0"
              />
              <div>
                <div className="text-sm font-medium">{userName}</div>
                <div className="text-xs text-gray-500">{userSubtitle}</div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <ProfileAvatar
                name={userName}
                imageSrc={userImage}
                sizeClassName="w-8 h-8"
                textClassName="text-xs"
                className="ring-0"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
