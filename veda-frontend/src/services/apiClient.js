import axios from "axios";
import config from "../config";
 
const api = axios.create({
  baseURL: config.API_BASE_URL,
});
 
api.interceptors.request.use((request) => {
  const token = localStorage.getItem("token");
  if (token) {
    request.headers = request.headers || {};
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});
 
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token is missing/expired, keep behavior predictable.
    if (error?.response?.status === 401) {
      // Avoid infinite loops; just clear stale auth.
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("permissions");
      localStorage.removeItem("platformPermissions");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);
 
export async function authFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
 
  return fetch(`${config.API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
}
 
export default api;
