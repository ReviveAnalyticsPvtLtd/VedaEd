import { Navigate, Outlet } from "react-router-dom";
import { isTokenExpired } from "../services/apiClient";

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");
  const role = localStorage.getItem("role");

  if (!token || (isTokenExpired(token) && !refreshToken)) {
    if (token) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("role");
      localStorage.removeItem("permissions");
      localStorage.removeItem("platformPermissions");
      localStorage.removeItem("user");
      sessionStorage.setItem(
        "auth_flash_message",
        "Your session has expired. Please log in again."
      );
    }
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
