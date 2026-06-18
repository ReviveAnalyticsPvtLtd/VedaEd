import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  FiShield,
  FiArrowRight,
  FiCheckCircle,
  FiUser,
  FiUsers,
  FiBook,
  FiDollarSign,
  FiPhone,
  FiArchive,
  FiChevronDown,
  FiKey,
  FiGlobe,
  FiUserPlus,
} from "react-icons/fi";

import config from "../config";

const ADMIN_ROLES = [
  { key: "superadmin", label: "Super Admin", icon: FiShield },
  { key: "admin", label: "Admin", icon: FiUser },
  { key: "teacher", label: "Teacher", icon: FiBook },
  { key: "staff", label: "Accountant", icon: FiDollarSign },
  { key: "receptionist", label: "Receptionist", icon: FiPhone },
  { key: "admission", label: "Librarian", icon: FiArchive },
];

const USER_ROLES = [
  { key: "student", label: "Student", icon: FiUser },
  { key: "parent", label: "Parent", icon: FiUsers },
];

const ROLE_PLACEHOLDER = {
  superadmin: "Enter Super Admin email or username",
  admin: "Enter Admin email or username",
  teacher: "Enter Teacher email or username",
  staff: "Enter Accountant email or username",
  receptionist: "Enter Receptionist email or username",
  admission: "Enter Librarian email or username",
  student: "Enter Student email or username",
  parent: "Enter Parent email or username",
  default: "Enter your email or username",
};

export default function Login() {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState("admin"); // "admin" | "user"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const roleOptions = loginType === "admin" ? ADMIN_ROLES : USER_ROLES;

  const filteredRoles = roleOptions.filter((r) =>
    r.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedRoleObj = roleOptions.find((r) => r.key === selectedRole);

  const emailPlaceholder = selectedRole
    ? ROLE_PLACEHOLDER[selectedRole] ?? ROLE_PLACEHOLDER.default
    : ROLE_PLACEHOLDER.default;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLoginTypeSwitch = (type) => {
    if (type === loginType) return;
    setLoginType(type);
    setSelectedRole(null);
    setSearch("");
    setError("");
  };

  const handleRoleSelect = (key) => {
    setSelectedRole(key);
    setDropdownOpen(false);
    setSearch("");
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const body = { email, password };
      if (selectedRole) body.role = selectedRole;

      const response = await axios.post(`${config.API_BASE_URL}/auth/login`, body);

      const { token, role, permissions, platformPermissions, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("permissions", JSON.stringify(permissions || []));
      localStorage.setItem("user", JSON.stringify(user));

      if (role === "admin" && platformPermissions) {
        localStorage.setItem("platformPermissions", JSON.stringify(platformPermissions));
      } else {
        localStorage.removeItem("platformPermissions");
      }

      if (role === "superadmin") navigate("/superadmin-front/dashboard");
      else if (role === "admin") navigate("/admin-front");
      else if (role === "teacher") navigate("/teacher");
      else if (role === "parent") navigate("/parent-front");
      else if (role === "staff") navigate("/staff-front");
      else if (role === "student") navigate("/student-front");
      else if (role === "hr") navigate("/hr");
      else if (role === "receptionist") navigate("/receptionist");
      else if (role === "admission") navigate("/admission");
      else if (role === "transport") navigate("/admin/transport");
      else navigate("/");

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* ================= LEFT BRAND ================= */}
      <div className="hidden lg:flex flex-col justify-center px-16
                      bg-gradient-to-br from-indigo-700 via-blue-600 to-purple-700
                      text-white">
        <h1 className="text-4xl font-extrabold mb-4">
          VedaSchool
        </h1>

        <p className="text-lg text-indigo-100 mb-8 max-w-md">
          A complete digital ecosystem for modern schools —
          administration, academics, communication & growth.
        </p>

        <div className="space-y-4 text-indigo-100">
          {[
            "Admin, Teacher, Student & Parent Dashboards",
            "Integrated Communication & Calendar",
            "Secure, Scalable & Cloud Ready",
          ].map((text) => (
            <div key={text} className="flex items-center gap-3">
              <FiCheckCircle className="text-xl text-white" />
              <span>{text}</span>
            </div>
          ))}
        </div>

        <div className="mt-12 text-sm text-indigo-200">
          © {new Date().getFullYear()} VedaSchool
        </div>
      </div>

      {/* ================= RIGHT LOGIN ================= */}
      <div className="flex items-center justify-center bg-gray-50 p-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md bg-white rounded-2xl
                     shadow-xl p-8"
        >
          {/* HEADER */}
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-extrabold text-indigo-700">
              Welcome Back
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Login to your dashboard
            </p>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* INPUTS */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email or Username</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={emailPlaceholder}
                className="w-full rounded-lg border px-3 py-2
                           placeholder-gray-300
                           focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border px-3 py-2
                           placeholder-gray-300
                           focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            </div>

            {/* ---- ROLE SEARCHABLE DROPDOWN ---- */}
            <div ref={dropdownRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                className={`w-full flex items-center justify-between rounded-lg border px-3 py-2
                            text-left transition outline-none
                            ${dropdownOpen ? "border-indigo-500 ring-2 ring-indigo-500" : "border-gray-300 hover:border-indigo-300"}`}
              >
                <span className="flex items-center gap-2 truncate">
                  {selectedRoleObj ? (
                    <>
                      <selectedRoleObj.icon className="text-indigo-600 flex-shrink-0" />
                      <span className="text-gray-800">{selectedRoleObj.label}</span>
                    </>
                  ) : (
                    <>
                      <FiShield className="text-gray-300 flex-shrink-0" />
                      <span className="text-gray-300">Select your role</span>
                    </>
                  )}
                </span>
                <FiChevronDown
                  className={`text-gray-400 transition-transform flex-shrink-0 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      autoFocus
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search role…"
                      className="w-full text-sm rounded-md border border-gray-200 px-2.5 py-1.5
                                 placeholder-gray-300 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
                    />
                  </div>
                  <ul className="max-h-56 overflow-y-auto py-1">
                    {filteredRoles.length === 0 && (
                      <li className="px-3 py-2 text-sm text-gray-400">No roles found</li>
                    )}
                    {filteredRoles.map(({ key, label, icon: Icon }) => {
                      const isActive = selectedRole === key;
                      return (
                        <li key={key}>
                          <button
                            type="button"
                            onClick={() => handleRoleSelect(key)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition
                                        ${isActive ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                          >
                            <Icon className={isActive ? "text-indigo-600" : "text-gray-400"} />
                            {label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full flex items-center justify-center gap-2
                       bg-indigo-600 hover:bg-indigo-700
                       text-white py-2.5 rounded-lg font-semibold
                       transition disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Login"}
            {!loading && <FiArrowRight />}
          </button>

          {/* ---- LOGIN TYPE SWITCH ---- */}
          <div className="mt-4 grid grid-cols-2 rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => handleLoginTypeSwitch("admin")}
              className={`flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition
                          ${loginType === "admin" ? "bg-indigo-50 text-indigo-700" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              <FiUser className="flex-shrink-0" />
              Admin Login
            </button>
            <button
              type="button"
              onClick={() => handleLoginTypeSwitch("user")}
              className={`flex items-center justify-center gap-1.5 py-2 text-sm font-medium border-l border-gray-200 transition
                          ${loginType === "user" ? "bg-indigo-50 text-indigo-700" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              <FiUsers className="flex-shrink-0" />
              User Login
            </button>
          </div>

         

          {/* ---- FOOTER LINKS ---- */}
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] sm:text-xs whitespace-nowrap">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="flex items-center gap-1 text-indigo-600 hover:underline flex-shrink-0"
            >
              <FiKey className="text-sm" />
              Forgot Password?
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-1 text-indigo-600 hover:underline flex-shrink-0"
            >
              <FiGlobe className="text-sm" />
              Front Site
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => navigate("/onboarding/step-1")}
              className="flex items-center gap-1 text-indigo-600 hover:underline flex-shrink-0"
            >
              <FiUserPlus className="text-sm" />
              Create School Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
