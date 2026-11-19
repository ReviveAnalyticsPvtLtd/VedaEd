import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../access/AuthProvider";
import { isTokenExpired } from "../services/apiClient";
import {
  clearAuthStorage,
  getAuthRole,
  getAuthToken,
  getRefreshToken,
  setAuthFlashMessage,
} from "../utils/authStorage";

const ProtectedRoute = ({ allowedRoles }) => {
  const { authReady } = useAuth();

  if (!authReady) return null;

  const token = getAuthToken();
  const refreshToken = getRefreshToken();
  const role = getAuthRole();

  if (!token || (isTokenExpired(token) && !refreshToken)) {
    if (token) {
      clearAuthStorage();
      setAuthFlashMessage("Your session has expired. Please log in again.");
    }
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
