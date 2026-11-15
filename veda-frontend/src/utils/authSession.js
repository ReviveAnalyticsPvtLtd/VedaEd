import config from "../config";
import { clearAuthStorage, getAuthRole, getAuthToken } from "./authStorage";

export {
  getAuthToken,
  getRefreshToken,
  isTokenExpired,
  getAuthRole,
  getStoredUser,
  getAuthSessionId,
  getAuthUserId,
  setAuthSession as saveAuthSession,
} from "./authStorage";

export async function clearAuthSession() {
  const token = getAuthToken();
  if (token) {
    try {
      await fetch(`${config.API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    } catch (e) {
      // Best-effort logout notification
    }
  }
  clearAuthStorage();
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
  const role = getAuthRole();
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
