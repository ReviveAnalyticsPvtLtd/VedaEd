import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiHelpCircle,
  FiCheckCircle,
  FiSettings,
  FiMenu,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import ProfileAvatar, {
  resolveProfileImage,
} from "../../components/ProfileAvatar";

export default function SuperAdminAdmissionSidebar({
  searchQuery = "",
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Current user
  const currentUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const userName = currentUser?.name || "Super Admin";
  const userImage = resolveProfileImage(currentUser);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isSidebarOpen ? "256px" : "56px"
    );
  }, [isSidebarOpen]);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/superadmin/admission",
      icon: <FiHome size={18} />,
      end: true,
    },
    {
      name: "Enquiry",
      path: "/superadmin/admission/enquiry",
      icon: <FiHelpCircle size={18} />,
    },
    {
      name: "Status Tracking",
      path: "/superadmin/admission/status-tracking",
      icon: <FiSettings size={18} />,
    },
    {
      name: "Final Students",
      path: "/superadmin/admission/final-students",
      icon: <FiCheckCircle size={18} />,
    },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-64px)]
      bg-white border-r shadow-sm transition-all duration-300
      z-40 overflow-hidden flex flex-col
      ${isSidebarOpen ? "w-64" : "w-14"}`}
    >
      {/* TOGGLE */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-3 left-3 p-2 rounded-md
        hover:bg-gray-200 transition z-10"
      >
        <FiMenu size={20} />
      </button>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto mt-14 px-3">
        <ul className="space-y-1">
          {filteredItems.map((item) => {
            const active = item.end
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={`flex items-center h-10 rounded-lg
                transition-all
                ${
                  isSidebarOpen
                    ? "px-3 gap-3"
                    : "px-0 justify-center"
                }
                ${
                  active
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <span className="flex w-6 justify-center">
                  {item.icon}
                </span>

                {isSidebarOpen && (
                  <span className="whitespace-nowrap">
                    {item.name}
                  </span>
                )}
              </NavLink>
            );
          })}
        </ul>
      </div>

      {/* BOTTOM SECTION */}
      <div className="shrink-0 border-t bg-white p-3">

        {/* SETTINGS */}
        <button
          onClick={() => {
            if (!isSidebarOpen) {
              setIsSidebarOpen(true);
              setSettingsOpen(true);
            } else {
              setSettingsOpen(!settingsOpen);
            }
          }}
          className={`flex items-center w-full h-10 rounded-lg
          transition-all
          ${
            isSidebarOpen
              ? "px-3 gap-3"
              : "px-0 justify-center"
          }
          ${
            location.pathname.startsWith("/superadmin/settings")
              ? "bg-blue-100 text-blue-700 font-medium"
              : "hover:bg-gray-100 text-gray-700"
          }`}
        >
          <span className="flex w-6 justify-center">
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
              onClick={() =>
                navigate("/superadmin/settings/profile")
              }
              className={`block w-full text-left rounded-md
              px-2 py-2 text-sm transition
              ${
                location.pathname ===
                "/superadmin/settings/profile"
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Profile Settings
            </button>

            <button
              onClick={() =>
                navigate("/superadmin/settings/account")
              }
              className={`block w-full text-left rounded-md
              px-2 py-2 text-sm transition
              ${
                location.pathname ===
                "/superadmin/settings/account"
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Account Settings
            </button>
          </div>
        )}

        {/* SUPER ADMIN BLOCK */}
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
                       <div className="text-sm font-medium">
                         {userName}
                       </div>
       
                       <div className="text-xs text-gray-500">
                         Super Admin
                       </div>
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