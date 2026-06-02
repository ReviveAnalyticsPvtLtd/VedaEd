import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import {
  FiShield,
  FiArrowRight,
  FiCheckCircle,
} from "react-icons/fi";

import config from "../config";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${config.API_BASE_URL}/auth/login`, {
        email,
        password
      });

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
                placeholder="Enter your email or username"
                className="w-full rounded-lg border px-3 py-2
                           focus:ring-2 focus:ring-indigo-500 outline-none"
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
                           focus:ring-2 focus:ring-indigo-500 outline-none"
              />
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

          <p className="text-xs text-gray-400 text-center mt-5">
            Secure login • Role-based access
          </p>

          <p className="text-sm text-center mt-4 text-gray-600">
            New school?{" "}
            <button
              type="button"
              onClick={() => navigate("/onboarding/step-1")}
              className="font-semibold text-indigo-600 hover:underline"
            >
              Create your school account
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
