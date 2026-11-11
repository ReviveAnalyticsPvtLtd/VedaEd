/**
 * Centralized Permission Definitions & Normalization Utilities
 *
 * Reconciles PlatformAdmin.permissions (module-level { view, create, edit, delete })
 * with system RolePermission entries and role hierarchies.
 */

// Mapping of module names/aliases to canonical keys
export const MODULE_KEY_MAP = {
  "admin sis": "sis",
  "sis": "sis",
  "students": "sis",
  "student": "sis",
  "staff": "sis",
  "parents": "sis",
  "attendance": "sis",
  "classes": "sis",
  "timetable": "sis",
  "reports": "sis",
  "communication": "communication",
  "messages": "communication",
  "notices": "communication",
  "logs": "communication",
  "complaints": "communication",
  "admin calendar": "calendar",
  "calendar": "calendar",
  "admin fees": "fees",
  "fees": "fees",
  "cashier": "fees",
  "hr module": "hr",
  "hr": "hr",
  "receptionist": "receptionist",
  "admission": "admission",
  "transport module": "transport",
  "transport": "transport",
  "fleet": "transport",
  "integrations": "integrations",
  "app marketplace": "integrations",
  "settings": "settings",
  "dashboard": "dashboard",
  "identity & access": "identity_access",
  "identity-access": "identity_access",
  "institution setup": "institution_setup",
  "setup-profile": "institution_setup",
};

/**
 * Normalizes any module name or key to its canonical identifier.
 */
export function normalizeModuleKey(name) {
  if (!name) return "";
  const key = String(name).trim().toLowerCase();
  return MODULE_KEY_MAP[key] || key.replace(/\s+/g, "_");
}

/**
 * Safely reads stored platform permissions from localStorage.
 */
export function getStoredPlatformPermissions() {
  try {
    const raw = localStorage.getItem("platformPermissions");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Safely reads stored discrete permissions from localStorage.
 */
export function getStoredPermissions() {
  try {
    const raw = localStorage.getItem("permissions");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Checks if the user has permission to VIEW an entire module.
 *
 * Rules:
 * - SuperAdmin: Granted view access to platform modules and operational school modules.
 * - Admin: STRICTLY evaluated against platformPermissions. If platformPermissions are
 *   missing or the module's `view` flag is false, access is DENIED.
 * - Specialized roles (hr, admission, receptionist, transport): Granted access if their role
 *   corresponds to that operational domain or has explicit view permissions.
 */
export function checkModuleViewAccess({ role, platformPermissions, permissions }, moduleName) {
  const normRole = String(role || "").toLowerCase();
  const canonicalKey = normalizeModuleKey(moduleName);

  // Settings and Dashboard are universal for authorized sessions
  if (canonicalKey === "dashboard" || canonicalKey === "settings") {
    return true;
  }

  // SuperAdmin has view access to all institutional modules and platform modules
  if (normRole === "superadmin") {
    // Receptionist is front-office desk workflow for school staff, but Superadmin can oversee if needed.
    return true;
  }

  // School Admin: MUST have explicit view permission in platformPermissions
  if (normRole === "admin") {
    const rows = platformPermissions || getStoredPlatformPermissions();
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      // Missing permission data is NEVER treated as unrestricted access
      return false;
    }

    const row = rows.find((p) => normalizeModuleKey(p.module) === canonicalKey);
    return row?.view === true;
  }

  // Domain-specific roles
  if (normRole === "hr" && canonicalKey === "hr") return true;
  if (normRole === "receptionist" && (canonicalKey === "receptionist" || canonicalKey === "admission")) return true;
  if (normRole === "admission" && canonicalKey === "admission") return true;
  if (normRole === "transport" && canonicalKey === "transport") return true;
  if (normRole === "staff" && (canonicalKey === "fees" || canonicalKey === "sis")) return true;

  // Fallback check against discrete permission array e.g. "view_student", "view_fees"
  const discreteList = permissions || getStoredPermissions();
  if (Array.isArray(discreteList)) {
    if (discreteList.includes(`view_${canonicalKey}`)) return true;
  }

  return false;
}

/**
 * Checks if the user has permission to perform a specific action on a module or resource.
 *
 * Action: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'import' | 'manage' | 'approve'
 */
export function checkActionAccess({ role, platformPermissions, permissions }, action, resource) {
  const normRole = String(role || "").toLowerCase();
  const normAction = String(action || "").toLowerCase();
  const canonicalResource = normalizeModuleKey(resource);

  if (normRole === "superadmin") {
    return true;
  }

  // Admin role: Check platformPermissions row for create, edit, delete, view
  if (normRole === "admin") {
    const rows = platformPermissions || getStoredPlatformPermissions();
    if (rows && Array.isArray(rows) && rows.length > 0) {
      const row = rows.find((p) => normalizeModuleKey(p.module) === canonicalResource);
      if (row) {
        if (normAction === "view") return row.view === true;
        if (normAction === "create") return row.create === true;
        if (normAction === "edit") return row.edit === true;
        if (normAction === "delete") return row.delete === true;
        if (normAction === "import") return row.create === true;
        if (normAction === "export") return row.view === true;
        if (normAction === "manage") return row.create === true && row.edit === true;
        if (normAction === "approve") return row.edit === true;
      }
    }
  }

  // Check discrete permission string e.g. 'delete_student', 'edit_staff', 'approve_leave'
  const discreteList = permissions || getStoredPermissions();
  if (Array.isArray(discreteList)) {
    const directKey = `${normAction}_${canonicalResource}`;
    if (discreteList.includes(directKey)) return true;
  }

  return false;
}

