import { useState } from "react";
import { PASSWORD_MIN_LENGTH, validatePasswordFields } from "../superadmin-front/identity-access/constants";
import { authAPI } from "../services/authAPI";
import { toastBannerClassName } from "../utils/toastMessageStyle";

export default function AdminProfile() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const passwordError = validatePasswordFields(newPassword, confirmPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (!currentPassword.trim()) {
      setError("Current password is required.");
      return;
    }

    setSaving(true);
    setError("");
    setToast("");
    try {
      const res = await authAPI.changePassword({ currentPassword, newPassword });
      setToast(res.message || "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Profile</h1>
      <p className="text-sm text-gray-600 mb-6">
        Signed in as <span className="font-medium">{user.email || user.name}</span>
      </p>

      {toast && (
        <p
          className={`mb-4 text-sm rounded-lg px-3 py-2 border font-medium ${toastBannerClassName(toast)}`}
        >
          {toast}
        </p>
      )}
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4"
      >
        <h2 className="font-semibold text-gray-900">Change password</h2>
        <p className="text-sm text-gray-500">
          Update your login password. Use the initial password from your invitation if
          you have not changed it yet.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            autoComplete="current-password"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder={`Minimum ${PASSWORD_MIN_LENGTH} characters`}
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm new password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            autoComplete="new-password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium
            hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
        >
          {saving ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
