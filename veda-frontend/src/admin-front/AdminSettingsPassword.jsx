import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Key, Eye, EyeOff } from "lucide-react";

const AdminSettingsPassword = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/admin-front/settings")}
        className="flex items-center gap-2 text-blue-600 font-medium"
      >
        <ArrowLeft size={18} />
        Back to Security
      </button>

      <div>
        <h1 className="text-3xl font-bold">Password Management</h1>
        <p className="text-slate-500 mt-1">
          Update and secure your account password.
        </p>
      </div>

      <div className="bg-white border rounded-2xl p-6 space-y-5">
        <div>
          <label className="text-sm font-medium">Current Password</label>
          <input
            type={showPassword ? "text" : "password"}
            className="w-full mt-2 border rounded-xl px-4 py-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium">New Password</label>
          <input
            type={showPassword ? "text" : "password"}
            className="w-full mt-2 border rounded-xl px-4 py-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Confirm Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            className="w-full mt-2 border rounded-xl px-4 py-3"
          />
        </div>

        <button
          onClick={() =>
            setShowPassword(!showPassword)
          }
          className="flex items-center gap-2 text-blue-600"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          {showPassword ? "Hide" : "Show"} Passwords
        </button>

        <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold">
          Update Password
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsPassword;