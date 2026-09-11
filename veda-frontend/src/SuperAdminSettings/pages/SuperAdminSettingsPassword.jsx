import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Key, Eye, EyeOff } from "lucide-react";
import { authAPI } from "../../services/authAPI";

const SuperAdminSettingsPassword = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUpdatePassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Current password is required");
      return;
    }

    if (!newPassword) {
      setError("New password is required");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from your current password");
      return;
    }

    try {
      setSaving(true);
      const res = await authAPI.changePassword({ currentPassword, newPassword });
      setSuccess(res?.message || "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/superadmin/settings/security")}
        className="flex items-center gap-2 text-blue-600 font-medium"
      >
        <ArrowLeft size={18} />
        Back to Security
      </button>

      <div>
        <h1 className="text-3xl font-bold">Password Management</h1>
        <p className="text-slate-900 mt-1">
          Update and secure your account password.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-100 text-green-600 rounded-xl px-4 py-3 text-sm">
          {success}
        </div>
      )}

      <div className="bg-white border rounded-2xl p-6 space-y-5">
        <div>
          <label className="text-sm font-medium">Current Password</label>
          <input
            type={showPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            className="w-full mt-2 border rounded-xl px-4 py-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium">New Password</label>
          <input
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password (min. 8 characters)"
            className="w-full mt-2 border rounded-xl px-4 py-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Confirm Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full mt-2 border rounded-xl px-4 py-3"
          />
        </div>

        <button
          type="button"
          onClick={() =>
            setShowPassword(!showPassword)
          }
          className="flex items-center gap-2 text-blue-600"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          {showPassword ? "Hide" : "Show"} Passwords
        </button>

        <button
          type="button"
          onClick={handleUpdatePassword}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
};

export default SuperAdminSettingsPassword;