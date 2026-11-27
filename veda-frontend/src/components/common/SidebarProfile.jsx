import React from "react";
import { useAuth } from "../../access/AuthProvider";
import ProfileAvatar from "../ProfileAvatar";
import { resolveSidebarProfile } from "../../config/sidebarProfile";

export default function SidebarProfile({
  isSidebarOpen,
  role,
  user,
  className = "",
}) {
  const auth = useAuth();
  const activeRole = role || auth.role;
  const activeUser = user || auth.user;
  const { name, imageSrc, subtitle } = resolveSidebarProfile(
    activeUser,
    activeRole
  );

  return (
    <div className={`mt-3 ${className}`}>
      {isSidebarOpen ? (
        <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
          <ProfileAvatar
            name={name}
            imageSrc={imageSrc}
            sizeClassName="w-8 h-8"
            textClassName="text-xs"
            className="ring-0 shrink-0"
          />

          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{name}</div>
            <div className="text-xs text-gray-500 truncate">{subtitle}</div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-2">
          <ProfileAvatar
            name={name}
            imageSrc={imageSrc}
            sizeClassName="w-8 h-8"
            textClassName="text-xs"
            className="ring-0"
          />
        </div>
      )}
    </div>
  );
}
