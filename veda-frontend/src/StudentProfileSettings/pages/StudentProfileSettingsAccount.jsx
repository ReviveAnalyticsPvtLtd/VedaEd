import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import config from "../../config";
import { userSettingsAPI } from "../../services/userSettingsAPI";
import { studentAPI } from "../../services/studentAPI";

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
  if (!name || !name.trim()) return "ST";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function StudentProfileSettingsAccount() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: "",
    role: "Student",
    email: "",
    department: "",
    mobile: "",
    employeeId: "",
    registeredOn: "01 Jan 2024",
    lastLogin: "20 May 2025 10:24 AM",
    image: "",
  });
  const [role, setRole] = useState("");
  const [registeredOn, setRegisteredOn] = useState("");
  const [lastLogin, setLastLogin] = useState("");
  const [image, setImage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      let profile = null;
      try {
        profile = await userSettingsAPI.getProfile();
      } catch (e) {
        console.warn("userSettingsAPI.getProfile failed, checking fallback:", e);
      }

      // Check stored user in localStorage as supplement or fallback
      let storedUser = null;
      try {
        storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      } catch {}

      let studentDetails = null;
      const refId = profile?.refId || storedUser?.refId || storedUser?._id;
      if (refId && (!profile || !profile.employeeId || !profile.department)) {
        try {
          studentDetails = await studentAPI.getStudent(refId);
        } catch (e) {
          console.warn("studentAPI.getStudent failed:", e);
        }
      }

      const sData = studentDetails?.student || studentDetails || {};
      const sPersonal = sData.personalInfo || {};

      const fullName = profile?.fullName || sPersonal.name || storedUser?.name || "";
      const email =
        profile?.email && !profile.email.endsWith(".invalid")
          ? profile.email
          : sPersonal.contactDetails?.email ||
            sPersonal.email ||
            (storedUser?.email && !storedUser.email.endsWith(".invalid") ? storedUser.email : "");
      const mobile =
        profile?.mobile || sPersonal.contactDetails?.mobileNumber || sPersonal.mobileNumber || "";
      const employeeId = profile?.employeeId || sPersonal.stdId || "";

      let dept = profile?.department || "";
      if (!dept && (sPersonal.class || sPersonal.section)) {
        const clsName = sPersonal.class?.name || sPersonal.class || "";
        const secName = sPersonal.section?.name || sPersonal.section || "";
        if (clsName && secName) dept = `${clsName} - ${secName}`;
        else dept = clsName || (secName ? `Section ${secName}` : "");
      }

      const roleVal = profile?.role || storedUser?.role || "Student";
      const imageVal =
        profile?.image ||
        profile?.profilePicture ||
        sPersonal.image?.url ||
        sPersonal.image ||
        "";
      const regOn = formatDate(
        profile?.admissionDate ||
          profile?.createdAt ||
          sPersonal.admissionDate ||
          sData.createdAt,
        "01 Jan 2024"
      );
      const lastLog = formatDateTime(
        profile?.lastLogin || storedUser?.lastLogin,
        "20 May 2025 10:24 AM"
      );

      setFormData({
        fullName,
        role: roleVal.toLowerCase() === "student" ? "Student" : roleVal,
        email,
        department: dept,
        mobile,
        employeeId,
        registeredOn: regOn,
        lastLogin: lastLog,
        image: imageVal,
      });
      setRole(roleVal);
      setRegisteredOn(regOn);
      setLastLogin(lastLog);
      setImage(imageVal);
    } catch (err) {
      console.error("Error loading student profile:", err);
      setError(err.message || "Failed to load account settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      setImage(newImagePath);

      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = {
          ...storedUser,
          profilePicture: newImagePath,
          image: newImagePath,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("storage"));
      } catch (storageErr) {
        console.warn("Failed to update user in localStorage:", storageErr);
      }

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

      // Keep the navbar / session copy in sync with the edited profile.
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = {
          ...storedUser,
          name: formData.fullName || storedUser.name,
          email: formData.email || storedUser.email,
          ...(response?.user || {}),
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("storage"));
      } catch (storageErr) {
        console.warn("Failed to update user in localStorage:", storageErr);
      }

      setSuccess("Changes Saved Successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  const initials = (formData.fullName || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const effectiveImage = image || formData.image;
  const avatarSrc = effectiveImage
    ? effectiveImage.startsWith("http")
      ? effectiveImage
      : `${config.SERVER_URL}${effectiveImage}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Account</h2>
        <p className="text-slate-500 mt-1 text-sm">
          Manage your profile information and account details
        </p>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
          Loading profile...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          {success}
        </div>
      )}

      {/* Card */}
      {!loading && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Profile Section */}
            <div className="flex flex-col items-center shrink-0 w-full lg:w-48">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-indigo-50 border-4 border-white shadow-md flex items-center justify-center text-indigo-600 font-bold text-3xl overflow-hidden">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={formData.fullName || "Student"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials || getInitials(formData.fullName)
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  title="Change Avatar"
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
                  onClick={() => navigate("/student/settings/security/password")}
                  className="flex items-center gap-2 px-3 py-1.5 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-50 transition"
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
                    placeholder="Student Full Name"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Role
                  </label>
                  <input
                    value={role || formData.role || "Student"}
                    disabled
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed text-slate-700 font-medium"
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
                      placeholder="student@school.com"
                      className="w-full px-4 py-2 pr-24 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded text-[10px] font-bold">
                      Verified
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Class & Section
                  </label>
                  <input
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g. 10th Grade - A"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2 pr-24 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    value={registeredOn || formData.registeredOn}
                    disabled
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed text-slate-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Student ID
                  </label>
                  <input
                    name="employeeId"
                    value={formData.employeeId}
                    disabled
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed text-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Last Login
                  </label>
                  <input
                    value={lastLogin || formData.lastLogin}
                    disabled
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed text-slate-600"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-4 gap-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                >
                  {saving && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
