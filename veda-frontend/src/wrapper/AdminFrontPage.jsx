import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { FiUsers, FiMessageCircle, FiCalendar, FiBriefcase, FiClipboard, FiBookOpen, FiArrowLeft } from "react-icons/fi";
import { filterModulesByPermission } from "../utils/adminPermissions";

const MODULES = [
  { name: "Admin SIS", path: "/admin", icon: <FiUsers /> },
  { name: "Communication", path: "/communication", icon: <FiMessageCircle /> },
  { name: "Admin Calendar", path: "/admincalendar", icon: <FiCalendar /> },
  { name: "HR Module", path: "/hr", icon: <FiBriefcase /> },
  { name: "Receptionist", path: "/receptionist", icon: <FiClipboard /> },
  { name: "Admission", path: "/admission", icon: <FiBookOpen /> },
];

export default function AdminFrontPage() {
  const navigate = useNavigate();
  const visibleModules = useMemo(() => filterModulesByPermission(MODULES), []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    localStorage.removeItem("platformPermissions");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 relative">
      <button onClick={logout} className="absolute top-6 left-6 bg-white px-4 py-2 rounded shadow flex gap-2">
        <FiArrowLeft /> Logout
      </button>

      <h1 className="text-3xl font-bold text-center mb-8 text-indigo-700">
        Admin Dashboard
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {visibleModules.map(m => (
          <div
            key={m.name}
            onClick={() => navigate(m.path)}
            className="cursor-pointer bg-white p-6 rounded-xl shadow hover:shadow-xl transition"
          >
            <div className="text-3xl text-indigo-600 mb-3">{m.icon}</div>
            <h3 className="font-semibold">{m.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
