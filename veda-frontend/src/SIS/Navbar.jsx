import { FiBell, FiSettings, FiHome, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar({ searchQuery, setSearchQuery }) {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);

  useEffect(() => {
    // Read both possible keys so the role badge always shows
    const savedRole =
      localStorage.getItem("role") || localStorage.getItem("veda_role");
    setRole(savedRole);
  }, []);

  const handleHome = () => {
    const r =
      localStorage.getItem("role") || localStorage.getItem("veda_role");
    if (!r) { navigate("/"); return; }
    if (r === "admin")   navigate("/admin-front");
    else if (r === "staff" || r === "teacher")   navigate("/staff-front");
    else if (r === "student") navigate("/student-front");
    else if (r === "parent")  navigate("/parent-front");
    else navigate("/");
  };

  const handleLogout = () => {
    // Clear every auth key set by Login.jsx / apiClient.js
    ["token", "role", "permissions", "platformPermissions", "user", "veda_role"].forEach((k) =>
      localStorage.removeItem(k)
    );
    navigate("/");
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b shadow-sm z-50 flex items-center px-4">

      {/* LEFT LOGO */}
      <div className="flex items-center gap-2 pl-6 w-64 select-none">
        <span className="text-blue-700 font-extrabold text-xl">RA</span>
        <h1 className="text-xl font-bold text-gray-800">VedaSchool</h1>
      </div>

      {/* SEARCH */}
      {setSearchQuery && (
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery || ""}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[55%] h-11 bg-gray-100 border rounded-xl px-4"
          />
        </div>
      )}

      {/* RIGHT */}
      <div className="flex items-center gap-3 pr-6">
        {role && (
          <span className="text-sm px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
            {role.toUpperCase()}
          </span>
        )}

        {/* Bell */}
        <button className="p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200">
          <FiBell className="w-5 h-5 text-gray-700" />
        </button>

        {/* HOME (between settings & logout) */}
        <button
          onClick={handleHome}
          title="Home"
          className="p-2.5 bg-blue-50 rounded-xl hover:bg-blue-100"
        >
          <FiHome className="w-5 h-5 text-blue-600" />
        </button>

        {/* Settings */}
        <button className="p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200">
          <FiSettings className="w-5 h-5 text-gray-700" />
        </button>

        {/* Logout */}
        {role && (
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2.5 bg-red-50 rounded-xl hover:bg-red-100"
          >
            <FiLogOut className="w-5 h-5 text-red-600" />
          </button>
        )}
      </div>
    </div>
  );
}
