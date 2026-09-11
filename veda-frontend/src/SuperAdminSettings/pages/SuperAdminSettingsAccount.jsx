import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import config from "../../config";
import { userSettingsAPI } from "../../services/userSettingsAPI";

export default function SuperAdminSettingsAccount() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: "",
    role: "Super Administrator",
    email: "",
    department: "",
    mobile: "",
    employeeId: "",
    registeredOn: "01 Jan 2024",
    lastLogin: "20 May 2025 10:24 AM",
    image: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const formatDate = (dateStr, fallback = "01 Jan 2024") => {
    if (!dateStr) return fallback;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return fallback;
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return fallback;
    }
  };

  const formatDateTime = (dateStr, fallback = "20 May 2025 10:24 AM") => {
    if (!dateStr) return fallback;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return fallback;
      const datePart = d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const timePart = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return `${datePart} ${timePart}`;
    } catch {
      return fallback;
    }
  };

  const getInitials = (name) => {
    if (!name || !name.trim()) return "SA";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const profile = await userSettingsAPI.getProfile();
      setFormData({
        fullName: profile.fullName || "",
        role: profile.role || "Super Administrator",
        email: profile.email || "",
        department: profile.department || "",
        mobile: profile.mobile || "",
        employeeId: profile.employeeId || "",
        registeredOn: formatDate(profile.createdAt, "01 Jan 2024"),
        lastLogin: formatDateTime(profile.lastLogin, "20 May 2025 10:24 AM"),
        image: profile.image || profile.profilePicture || "",
      });
    } catch (err) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("File size exceeds 2MB limit.");
      return;
    }

    try {
      setUploadingAvatar(true);
      setError("");
      setSuccess("");
      const res = await userSettingsAPI.uploadAvatar(file);
      const newImagePath = res.image || res.profilePicture || "";
      setFormData((prev) => ({
        ...prev,
        image: newImagePath,
      }));
      setSuccess("Profile picture updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to upload profile picture");
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await userSettingsAPI.updateProfile({
        fullName: formData.fullName,
        email: formData.email,
        department: formData.department,
        mobile: formData.mobile,
        employeeId: formData.employeeId,
      });

      // Update localStorage user record if name or email changed
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = {
          ...storedUser,
          name: formData.fullName || storedUser.name,
          email: formData.email || storedUser.email,
          ...(response?.user || {}),
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (storageErr) {
        console.error("Failed to update user in localStorage:", storageErr);
      }

      setSuccess("Changes Saved Successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = formData.image
    ? formData.image.startsWith("http")
      ? formData.image
      : `${config.SERVER_URL}${formData.image}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Account</h2>
        <p className="text-slate-900 mt-1 text-sm">
          Manage your profile information and account details
        </p>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
          Loading profile...
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-600 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-100 text-green-600 rounded-lg px-4 py-2">
          {success}
        </div>
      )}

      {/* Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Profile Section */}
          <div className="flex flex-col items-center shrink-0 w-full lg:w-48">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-indigo-50 border-4 border-white shadow-md flex items-center justify-center text-indigo-600 font-bold text-3xl overflow-hidden">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={formData.fullName || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(formData.fullName)
                )}
              </div>

              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute bottom-1 right-1 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {uploadingAvatar ? "⏳" : "📷"}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <p className="text-xs text-slate-400 mt-4 text-center">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>

          {/* Form */}
          <div className="flex-1 space-y-6">
            
            {/* Change Password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/superadmin/settings/security/password")}
                className="flex items-center gap-2 px-3 py-1.5 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-50"
              >
                🔒 Change Password
              </button>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  Full Name
                </label>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  Role
                </label>
                <input
                  value={formData.role}
                  disabled
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  Email Address
                </label>

                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 pr-24 border border-slate-200 rounded-lg"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded text-[10px] font-bold">
                    Verified
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  Department
                </label>
                <input
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  Mobile Number
                </label>

                <div className="relative">
                  <input
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full px-4 py-2 pr-24 border border-slate-200 rounded-lg"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded text-[10px] font-bold">
                    Verified
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  Registered On
                </label>
                <input
                  value={formData.registeredOn}
                  disabled
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  Employee ID
                </label>
                <input
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  Last Login
                </label>
                <input
                  value={formData.lastLogin}
                  disabled
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4 gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}