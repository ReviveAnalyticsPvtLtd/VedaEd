/**
 * SIS module configuration.
 *
 * Keep this file data-only (no JSX / React imports) so routing, navigation and
 * access helpers can consume it without creating circular imports.
 */
const SIS_MODULE = {
  id: "sis",
  label: "SIS",
  permissionKey: "SIS",
  roles: ["admin", "staff", "superadmin"],
  basePaths: {
    admin: "/admin",
    superadmin: "/superadmin/sis",
  },
  settingsPaths: {
    admin: "/admin-front/settings",
    superadmin: "/superadmin/settings",
  },
};

export default SIS_MODULE;
