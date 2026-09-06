/**
 * Persists auth session consistently with the main Login page.
 */
export function saveAuthSession({
  token,
  refreshToken,
  role,
  permissions,
  platformPermissions,
  user,
}) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
  localStorage.setItem("permissions", JSON.stringify(permissions || []));
  localStorage.setItem("user", JSON.stringify(user));

  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }

  if (role === "admin" && platformPermissions) {
    localStorage.setItem("platformPermissions", JSON.stringify(platformPermissions));
  } else {
    localStorage.removeItem("platformPermissions");
  }
}

export function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("role");
  localStorage.removeItem("permissions");
  localStorage.removeItem("platformPermissions");
  localStorage.removeItem("user");
}

export function getAuthToken() {
  return localStorage.getItem("token");
}

export function navigateAfterRoleLogin(role, navigate) {
  if (role === "superadmin") navigate("/superadmin-front/dashboard");
  else if (role === "admin") navigate("/admin-front");
  else if (role === "teacher") navigate("/staff-front");
  else if (role === "parent") navigate("/parent-front");
  else if (role === "staff") navigate("/staff-front");
  else if (role === "student") navigate("/student-front");
  else if (role === "hr") navigate("/hr");
  else if (role === "receptionist") navigate("/receptionist");
  else if (role === "admission") navigate("/admission");
  else if (role === "transport") navigate("/admin/transport");
  else navigate("/");
}

export function getRoleDashboardPath() {
  const role = localStorage.getItem("role");
  if (role === "superadmin") return "/superadmin-front/dashboard";
  if (role === "admin") return "/admin-front";
  if (role === "teacher") return "/teacher";
  if (role === "parent") return "/parent-front";
  if (role === "staff") return "/staff-front";
  if (role === "student") return "/student-front";
  if (role === "hr") return "/hr";
  if (role === "receptionist") return "/receptionist";
  if (role === "admission") return "/admission";
  if (role === "transport") return "/admin/transport";
  return "/";
}
