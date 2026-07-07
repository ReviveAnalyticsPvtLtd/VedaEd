import { NavLink, useLocation } from "react-router-dom";
import {
  FiHome,
  FiBookOpen,
  FiClipboard,
  FiCalendar,
  FiAward,
  FiUser,
  FiBook,
  FiDollarSign,
  FiMessageCircle,
  FiSettings,
  FiMenu,
  FiActivity,
  FiHeart,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import ProfileAvatar, { resolveProfileImage } from "../components/ProfileAvatar";

export default function ParentSidebar({
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
  const userName = currentUser?.name || "Parent User";
  const userImage = resolveProfileImage(currentUser);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isSidebarOpen ? "256px" : "56px"
    );
  }, [isSidebarOpen]);

  const menuItems = [
    { name: "Home", path: "/parent", icon: <FiHome size={18} />, end: true },
    { name: "My Child's Classes", path: "/parent/classes", icon: <FiBookOpen size={18} /> },
    { name: "Curriculum", path: "/parent/curriculum", icon: <FiBook size={18} /> },
    { name: "Timetable", path: "/parent/timetable", icon: <FiCalendar size={18} /> },
    { name: "Attendance", path: "/parent/attendance", icon: <FiCalendar size={18} /> },
    { name: "Assignments", path: "/parent/assignments", icon: <FiClipboard size={18} /> },
    { name: "Exams", path: "/parent/exams", icon: <FiAward size={18} /> },
    { name: "Child Activities", path: "/parent/child-activities", icon: <FiActivity size={18} /> },
    { name: "Health Record", path: "/parent/health", icon: <FiHeart size={18} /> },
    { name: "Fees", path: "/parent/fees", icon: <FiDollarSign size={18} /> },
    { name: "Activities", path: "/parent/activities", icon: <FiAward size={18} /> },
    { name: "Communication", path: "/parent/communication", icon: <FiMessageCircle size={18} /> },
    { name: "Profile", path: "/parent/profile", icon: <FiUser size={18} /> },
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
      {/* TOGGLE */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-3 left-3 p-2 rounded-md hover:bg-gray-200 transition z-40"
      >
        <FiMenu size={20} />
      </button>

      {/* ===== SCROLLABLE MENU AREA ===== */}
      <div className="flex-1 overflow-y-auto scrollbar-none mt-14 px-3 space-y-1">
        {filteredItems.map((item) => {
          const isActive = item.end
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

      
        <div className="mt-3">
          {isSidebarOpen ? (
            <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
              <ProfileAvatar name={userName} imageSrc={userImage} sizeClassName="w-8 h-8" textClassName="text-xs" className="ring-0" />
              <div>
              <div className="text-sm font-medium">{userName}</div>
              <div className="text-xs text-gray-500">Guardian</div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <ProfileAvatar name={userName} imageSrc={userImage} sizeClassName="w-8 h-8" textClassName="text-xs" className="ring-0" />
            </div>
          )}
        </div>
      </div>
   
  );
}
