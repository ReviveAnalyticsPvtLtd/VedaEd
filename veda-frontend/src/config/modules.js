/**
 * Central Modules & Navigation Configuration
 * Defines canonical module definitions, sub-items, routes, and role mappings.
 */

export const IDENTITY_BASE = "/superadmin-front/identity-access";
export const SETUP_PROFILE_BASE = "/superadmin-front/setup-profile";

/**
 * SuperAdmin-only Platform Modules
 */
export const PLATFORM_MODULES = [
  {
    key: "identity_access",
    name: "Identity & Access",
    icon: "FiShield",
    base: IDENTITY_BASE,
    platformOnly: true,
    subs: [
      {
        label: "Admin Management",
        path: `${IDENTITY_BASE}/admins`,
      },
      {
        label: "Create Admin",
        path: `${IDENTITY_BASE}/admins/create`,
      },
    ],
  },
  {
    key: "institution_setup",
    name: "Institution Setup",
    icon: "FiDatabase",
    base: SETUP_PROFILE_BASE,
    platformOnly: true,
    subs: [
      {
        label: "View Setup Profile",
        path: `${SETUP_PROFILE_BASE}`,
      },
      {
        label: "Edit Setup Profile",
        path: `${SETUP_PROFILE_BASE}/edit`,
      },
    ],
  },
];

/**
 * Common Operational Modules (Used by both Admin and SuperAdmin)
 */
export const OPERATIONAL_MODULES = [
  {
    key: "sis",
    name: "SIS",
    adminName: "Admin SIS",
    icon: "FiUsers",
    adminBase: "/admin",
    superadminBase: "/superadmin/sis",
    subs: [
      {
        label: "Students",
        adminPath: "/admin/students",
        superadminPath: "/superadmin/sis/students",
      },
      {
        label: "Staff",
        adminPath: "/admin/staff",
        superadminPath: "/superadmin/sis/staff",
      },
      {
        label: "Parents",
        adminPath: "/admin/parents",
        superadminPath: "/superadmin/sis/parents",
      },
      {
        label: "Classes & Schedules",
        adminPath: "/admin/classes-schedules",
        superadminPath: "/superadmin/sis/classes-schedules",
      },
      {
        label: "Attendance",
        adminPath: "/admin/attendance",
        superadminPath: "/superadmin/sis/attendance",
      },
      {
        label: "Reports",
        adminPath: "/admin/reports",
        superadminPath: "/superadmin/sis/reports",
      },
    ],
  },
  {
    key: "communication",
    name: "Communication",
    adminName: "Communication",
    icon: "FiMessageCircle",
    adminBase: "/communication",
    superadminBase: "/superadmin/communication",
    subs: [
      {
        label: "Logs",
        adminPath: "/communication/logs",
        superadminPath: "/superadmin/communication/logs",
      },
      {
        label: "Notices",
        adminPath: "/communication/notices",
        superadminPath: "/superadmin/communication/notices",
      },
      {
        label: "Messages",
        adminPath: "/communication/messages",
        superadminPath: "/superadmin/communication/messages",
      },
      {
        label: "Complaints",
        adminPath: "/communication/complaints",
        superadminPath: "/superadmin/communication/complaints",
      },
    ],
  },
  {
    key: "calendar",
    name: "Calendar",
    adminName: "Admin Calendar",
    icon: "FiCalendar",
    adminBase: "/admin/calendar",
    superadminBase: "/superadmin/calendar",
    subs: [
      {
        label: "Annual Calendar",
        adminPath: "/admin/calendar/annual",
        superadminPath: "/superadmin/calendar/annual",
      },
      {
        label: "Event Setup",
        adminPath: "/admin/calendar/event-setup",
        superadminPath: "/superadmin/calendar/event-setup",
      },
      {
        label: "Annual Year Setup",
        adminPath: "/admin/calendar/year-setup",
        superadminPath: "/superadmin/calendar/year-setup",
      },
    ],
  },
  {
    key: "fees",
    name: "Fees",
    adminName: "Admin Fees",
    icon: "FiDollarSign",
    adminBase: "/admin/fees",
    superadminBase: "/superadmin/fees",
    subs: [
      {
        label: "Fees Dashboard",
        adminPath: "/admin/fees",
        superadminPath: "/superadmin/fees",
      },
      {
        label: "Collect Fees",
        adminPath: "/admin/fees/collect-fees",
        superadminPath: "/superadmin/fees/collect",
      },
      {
        label: "Fee Master",
        adminPath: "/admin/fees/fee-master",
        superadminPath: "/superadmin/fees/fee-master",
      },
      {
        label: "Search Due",
        adminPath: "/admin/fees/search-due",
        superadminPath: "/superadmin/fees/search-due",
      },
      {
        label: "Search Payment",
        adminPath: "/admin/fees/search-payment",
        superadminPath: "/superadmin/fees/search-payment",
      },
      {
        label: "Fee Reminder",
        adminPath: "/admin/fees/reminder",
        superadminPath: "/superadmin/fees/reminder",
      },
    ],
  },
  {
    key: "hr",
    name: "HR",
    adminName: "HR Module",
    icon: "FiBriefcase",
    adminBase: "/hr",
    superadminBase: "/superadmin/hr",
    subs: [
      {
        label: "Staff Directory",
        adminPath: "/hr/staff-directory",
        superadminPath: "/superadmin/hr/staff-directory",
      },
      {
        label: "Attendance",
        adminPath: "/hr/staff-attendance",
        superadminPath: "/superadmin/hr/attendance",
      },
      {
        label: "Payroll",
        adminPath: "/hr/payroll",
        superadminPath: "/superadmin/hr/payroll",
      },
      {
        label: "Approve Leave",
        adminPath: "/hr/approve-leave",
        superadminPath: "/superadmin/hr/leave-approval",
      },
    ],
  },
  {
    key: "admission",
    name: "Admission",
    adminName: "Admission",
    icon: "FiBookOpen",
    adminBase: "/admission",
    superadminBase: "/superadmin/admission",
    subs: [
      {
        label: "Dashboard",
        adminPath: "/admission",
        superadminPath: "/superadmin/admission",
      },
      {
        label: "Enquiry",
        adminPath: "/admission/admission-enquiry",
        superadminPath: "/superadmin/admission/enquiry",
      },
      {
        label: "Applications",
        adminPath: "/admission/application-list",
        superadminPath: "/superadmin/admission/applications",
      },
      {
        label: "Status Tracking",
        adminPath: "/admission/status-tracking",
        superadminPath: "/superadmin/admission/status-tracking",
      },
      {
        label: "Final Students",
        adminPath: "/admission/final-students",
        superadminPath: "/superadmin/admission/final-students",
      },
      {
        label: "Vacancy Setup",
        adminPath: "/admission/vacancy-setup",
        superadminPath: "/superadmin/admission/vacancy-setup",
      },
    ],
  },
  {
    key: "transport",
    name: "Transport",
    adminName: "Transport Module",
    icon: "FiTruck",
    adminBase: "/admin/transport",
    superadminBase: "/superadmin/transport",
    subs: [
      {
        label: "Dashboard",
        adminPath: "/admin/transport",
        superadminPath: "/superadmin/transport",
      },
      {
        label: "Drivers",
        adminPath: "/admin/transport/driver-admission",
        superadminPath: "/superadmin/transport/driver-admission",
      },
      {
        label: "Vehicles",
        adminPath: "/admin/transport/vehicles",
        superadminPath: "/superadmin/transport/vehicles",
      },
      {
        label: "Routes",
        adminPath: "/admin/transport/routes",
        superadminPath: "/superadmin/transport/routes",
      },
      {
        label: "Pickup Points",
        adminPath: "/admin/transport/pickup-point",
        superadminPath: "/superadmin/transport/pickup-points",
      },
      {
        label: "Assign Vehicle",
        adminPath: "/admin/transport/assign-vehicle",
        superadminPath: "/superadmin/transport/assign-vehicle",
      },
      {
        label: "Student Transport Fees",
        adminPath: "/admin/transport/student-transport-fees",
        superadminPath: "/superadmin/transport/student-fees",
      },
    ],
  },
  {
    key: "fleet",
    name: "Fleet",
    adminName: "Fleet Management",
    icon: "FiTruck",
    adminBase: "/fleet",
    superadminBase: "/superadmin/fleet",
    subs: [
      {
        label: "Dashboard",
        adminPath: "/fleet",
        superadminPath: "/superadmin/fleet",
      },
      {
        label: "Vehicles",
        adminPath: "/fleet/vehicles",
        superadminPath: "/superadmin/fleet/vehicles",
      },
      {
        label: "Maintenance",
        adminPath: "/fleet/maintenance",
        superadminPath: "/superadmin/fleet/maintenance",
      },
      {
        label: "Documents",
        adminPath: "/fleet/documents",
        superadminPath: "/superadmin/fleet/documents",
      },
      {
        label: "Expenses",
        adminPath: "/fleet/expenses",
        superadminPath: "/superadmin/fleet/expenses",
      },
      {
        label: "Fueling",
        adminPath: "/fleet/fueling",
        superadminPath: "/superadmin/fleet/fueling",
      },
    ],
  },
  {
    key: "receptionist",
    name: "Receptionist",
    adminName: "Receptionist",
    icon: "FiClipboard",
    adminOnly: true,
    adminBase: "/receptionist",
    superadminBase: null,
    subs: [
      {
        label: "Admission Enquiry",
        adminPath: "/receptionist/admission-enquiry",
      },
      {
        label: "Visitor Book",
        adminPath: "/receptionist/visitor-book",
      },
      {
        label: "Student Details",
        adminPath: "/receptionist/student-details",
      },
    ],
  },
  {
    key: "integrations",
    name: "Integrations",
    adminName: "App Marketplace",
    icon: "FiLayers",
    adminBase: "/admin-front/integrations",
    superadminBase: "/superadmin-front/integrations",
    subs: [
      {
        label: "Discover Apps",
        adminPath: "/admin-front/integrations",
        superadminPath: "/superadmin-front/integrations",
      },
      {
        label: "Connected Apps",
        adminPath: "/admin-front/integrations",
        superadminPath: "/superadmin-front/integrations",
      },
    ],
  },
];

/**
 * Returns the filtered list of modules to display in the sidebar for the active role.
 */
export function getSidebarModules(role, canViewModule) {
  const isSuperAdmin = String(role || "").toLowerCase() === "superadmin";

  if (isSuperAdmin) {
    // SuperAdmin gets Platform Modules at top, followed by operational modules
    const operational = OPERATIONAL_MODULES.filter((mod) => !mod.adminOnly).map((mod) => ({
      key: mod.key,
      name: mod.name,
      icon: mod.icon,
      base: mod.superadminBase || mod.adminBase,
      subs: mod.subs.map((sub) => ({
        label: sub.label,
        path: sub.superadminPath || sub.adminPath,
      })),
    }));

    return [...PLATFORM_MODULES, ...operational];
  }

  // Admin role: operational modules filtered by canViewModule()
  return OPERATIONAL_MODULES.filter((mod) => canViewModule(mod.adminName || mod.name)).map((mod) => ({
    key: mod.key,
    name: mod.adminName || mod.name,
    icon: mod.icon,
    base: mod.adminBase,
    subs: mod.subs.map((sub) => ({
      label: sub.label,
      path: sub.adminPath,
    })),
  }));
}

