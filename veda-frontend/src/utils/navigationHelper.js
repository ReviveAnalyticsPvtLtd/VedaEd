/**
 * Role-Aware Navigation Helper
 *
 * Allows shared components to dynamically route to role-appropriate URLs
 * without hardcoding '/admin/...' or '/superadmin/...'.
 */

export function isSuperAdminPath(pathname = window.location.pathname) {
  return String(pathname).startsWith("/superadmin");
}

export function getStudentProfilePath(studentId, pathname = window.location.pathname) {
  if (isSuperAdminPath(pathname)) {
    return `/superadmin/sis/students/${studentId}`;
  }
  return `/admin/student-profile/${studentId}`;
}

export function getStaffProfilePath(staffId, pathname = window.location.pathname) {
  if (isSuperAdminPath(pathname)) {
    return `/superadmin/sis/staff-profile/${staffId}`;
  }
  return `/admin/staff-profile/${staffId}`;
}

export function getParentProfilePath(parentId, pathname = window.location.pathname) {
  if (isSuperAdminPath(pathname)) {
    return `/superadmin/sis/parents/${parentId}`;
  }
  return `/admin/parent-profile/${parentId}`;
}

export function getAttendanceDetailPath(type, id, pathname = window.location.pathname) {
  if (isSuperAdminPath(pathname)) {
    return `/superadmin/sis/attendance/by-${type}/${id}`;
  }
  return `/admin/attendance/by-${type}/${id}`;
}

export function getFeesCollectProfilePath(id, pathname = window.location.pathname) {
  if (isSuperAdminPath(pathname)) {
    return `/superadmin/fees/collect/${id}`;
  }
  return `/admin/fees/collect-fees/${id}`;
}

export function getAdmissionReviewPath(id, pathname = window.location.pathname) {
  if (isSuperAdminPath(pathname)) {
    return `/superadmin/admission/review/${id}`;
  }
  return `/admission/review/${id}`;
}

export function getModuleBasePath(moduleKey, pathname = window.location.pathname) {
  const isSuper = isSuperAdminPath(pathname);
  switch (moduleKey) {
    case "sis":
      return isSuper ? "/superadmin/sis" : "/admin";
    case "fees":
      return isSuper ? "/superadmin/fees" : "/admin/fees";
    case "transport":
      return isSuper ? "/superadmin/transport" : "/admin/transport";
    case "fleet":
      return isSuper ? "/superadmin/fleet" : "/fleet";
    case "hr":
      return isSuper ? "/superadmin/hr" : "/hr";
    case "admission":
      return isSuper ? "/superadmin/admission" : "/admission";
    case "communication":
      return isSuper ? "/superadmin/communication" : "/communication";
    case "calendar":
      return isSuper ? "/superadmin/calendar" : "/admin/calendar";
    case "settings":
      return isSuper ? "/superadmin/settings" : "/admin-front";
    default:
      return isSuper ? "/superadmin" : "/admin";
  }
}

