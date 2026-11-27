import { resolveProfileImage } from "../components/ProfileAvatar";

export const SIDEBAR_PROFILE_ROLES = {
  superadmin: { fallbackName: "Super Admin", subtitle: "Super Admin" },
  admin: { fallbackName: "Admin User", subtitle: "Administrator" },
  parent: { fallbackName: "Parent", subtitle: "Guardian" },
  student: { fallbackName: "Student", subtitle: "Student" },
  teacher: { fallbackName: "Teacher", subtitle: "Teacher" },
  receptionist: { fallbackName: "Receptionist", subtitle: "Front Office" },
  cashier: { fallbackName: "Cashier", subtitle: "Fees Panel" },
  hr: { fallbackName: "HR User", subtitle: "HR" },
  fleet: { fallbackName: "Fleet Manager", subtitle: "Fleet" },
};

const ROLE_ALIASES = {
  super_admin: "superadmin",
  "super-admin": "superadmin",
  school_admin: "admin",
  "school-admin": "admin",
  administrator: "admin",
  guardian: "parent",
  faculty: "teacher",
  staff: "teacher",
  transport: "fleet",
  admission: "admin",
};

export function normalizeSidebarRole(role) {
  const normalized = String(role || "").trim().toLowerCase().replace(/\s+/g, "_");
  return ROLE_ALIASES[normalized] || normalized;
}

export function resolveSidebarProfile(user, role) {
  const config =
    SIDEBAR_PROFILE_ROLES[normalizeSidebarRole(role)] ||
    SIDEBAR_PROFILE_ROLES.admin;

  return {
    name:
      user?.name ||
      user?.fullName ||
      user?.username ||
      config.fallbackName,
    imageSrc: resolveProfileImage(user || {}),
    subtitle: config.subtitle,
  };
}
