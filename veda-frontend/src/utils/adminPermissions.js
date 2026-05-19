const MODULE_PERMISSION_KEYS = {
  "Admin SIS": ["sis", "students"],
  Communication: ["communication"],
  "Admin Calendar": ["calendar"],
  "HR Module": ["hr"],
  Receptionist: ["admission"],
  Admission: ["admission"],
  "Transport Module": ["transport"],
  Fees: ["fees"],
};

export const getStoredPlatformPermissions = () => {
  try {
    const raw = localStorage.getItem("platformPermissions");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const canViewModule = (moduleName, platformPermissions) => {
  const keys = MODULE_PERMISSION_KEYS[moduleName];
  if (!keys?.length) return true;

  const rows = platformPermissions || getStoredPlatformPermissions();
  if (!rows.length) return false;

  return keys.some((key) => {
    const row = rows.find(
      (p) => String(p.module || "").toLowerCase() === key
    );
    return row?.view === true;
  });
};

export const filterModulesByPermission = (modules, platformPermissions) => {
  const rows = platformPermissions || getStoredPlatformPermissions();
  if (!rows.length) return [];
  return modules.filter((mod) => canViewModule(mod.name, rows));
};
