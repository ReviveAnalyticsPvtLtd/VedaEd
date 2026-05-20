import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiMessageCircle,
  FiCalendar,
  FiBriefcase,
  FiTruck,
  FiDollarSign,
  FiClipboard,
  FiArrowLeft,
} from "react-icons/fi";

const MODULES = [
  {
    name: "SIS",
    path: "/superadmin/sis/dashboard",
    icon: <FiUsers />,
  },
  {
    name: "HR",
    path: "/superadmin/hr/dashboard",
    icon: <FiBriefcase />,
  },
  {
    name: "Fees",
    path: "/superadmin/fees/dashboard",
    icon: <FiDollarSign />,
  },
  {
    name: "Transport",
    path: "/superadmin/transport/dashboard",
    icon: <FiTruck />,
  },
  {
    name: "Fleet",
    path: "/superadmin/fleet/dashboard",
    icon: <FiTruck />,
  },
  {
    name: "Admission",
    path: "/superadmin/admission/dashboard",
    icon: <FiClipboard />,
  },
  {
    name: "Communication",
    path: "/superadmin/communication/dashboard",
    icon: <FiMessageCircle />,
  },
  {
    name: "Calendar",
    path: "/superadmin/calendar/annual",
    icon: <FiCalendar />,
  },
];

export default function SuperAdminFrontPage() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("veda_role");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 relative">
      {/* LOGOUT */}
      <button
        onClick={logout}
        className="absolute top-6 left-6 bg-white px-4 py-2 rounded shadow flex gap-2 items-center"
      >
        <FiArrowLeft /> Logout
      </button>

      <h1 className="text-3xl font-bold text-center mb-10 text-indigo-700">
        Super Admin Dashboard
      </h1>

      {/* MODULE CARDS */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {MODULES.map((m) => (
          <div
            key={m.name}
            onClick={() => navigate(m.path)}
            className="cursor-pointer bg-white p-6 rounded-xl shadow
              hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            <div className="text-3xl text-indigo-600 mb-3">{m.icon}</div>
            <h3 className="font-semibold text-gray-800">{m.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}