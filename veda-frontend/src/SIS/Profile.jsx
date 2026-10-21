import React, { useState, useEffect } from "react";
import {
  FiUser,
  FiCalendar,
  FiEdit,
  FiSave,
  FiCamera,
  FiX,
} from "react-icons/fi";
import HelpInfo from "../components/HelpInfo";
import { userSettingsAPI } from "../services/userSettingsAPI";
import config from "../config";

/* ================= CARD ================= */
const ProfileCard = ({ label, icon, children }) => (
  <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
    <div className="flex items-center mb-3">
      <div className="text-indigo-500 mr-2">{icon}</div>
      <h3 className="font-semibold">{label}</h3>
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

/* ================= INFO ROW ================= */
const InfoDetail = ({ label, value }) => (
  <div className="flex items-start border-b border-gray-200 py-2 last:border-b-0">
    <span className="w-40 text-sm font-medium text-gray-500">{label}</span>
    <span className="text-sm text-gray-800">{value || "N/A"}</span>
  </div>
);

/* ================= INPUT ROW ================= */
const InfoInput = ({
  label,
  value,
  onChange,
  error = "",
  required = false,
  ...rest
}) => (
  <div className="flex flex-col border-b py-2">
    <div className="flex items-center gap-4">
      <span className="w-40 text-sm font-medium text-gray-500">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? "true" : undefined}
        className={`border rounded px-3 py-1 text-sm w-full ${
          error ? "border-red-400 bg-red-50" : ""
        }`}
        {...rest}
      />
    </div>
    {error ? (
      <p className="ml-44 mt-1 text-xs text-red-600" role="alert">
        {error}
      </p>
    ) : null}
  </div>
);

/* ================= VALIDATION ================= */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_RULES = {
  name: { label: "Name", required: true, maxLength: 100 },
  email: {
    label: "Email",
    required: true,
    maxLength: 100,
    validate: EMAIL_RE,
    message: "Enter a valid email address",
  },
  mobileNumber: {
    label: "Mobile",
    validate: /^\d{7,15}$/,
    message: "Enter a valid phone number (7-15 digits)",
  },
};

/** Character filters applied while typing, before the value reaches state. */
const ENTRY_FILTERS = {
  name: {
    sanitize: (v) => v.replace(/[^A-Za-z\s]/g, ""),
    message: "Only letters are allowed",
  },
  mobileNumber: {
    sanitize: (v) => v.replace(/\D/g, ""),
    message: "Only digits are allowed",
  },
};

/** Format checks evaluated live on values that cannot be character-filtered. */
const LIVE_FORMATS = {
  email: { validate: EMAIL_RE, message: "Enter a valid email address" },
};

/** Returns { field: message } for every rule the current values violate. */
const validateProfileFields = (values) => {
  const found = {};
  Object.entries(FIELD_RULES).forEach(([field, rule]) => {
    const raw = values?.[field];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (rule.required && !value) {
      found[field] = `${rule.label} is required`;
      return;
    }
    if (!value) return;
    if (rule.maxLength && value.length > rule.maxLength) {
      found[field] = `${rule.label} must be ${rule.maxLength} characters or fewer`;
      return;
    }
    if (rule.validate && !rule.validate.test(value)) {
      found[field] = rule.message;
    }
  });
  return found;
};

/** Per-field input attributes (maxLength also comes from FIELD_RULES). */
const INPUT_META = {
  email: { inputMode: "email" },
  mobileNumber: { inputMode: "numeric", maxLength: 15 },
};

/* ================= DATE HELPERS ================= */
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return `${formatDate(dateStr)} ${d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
};

export default function AdminProfile() {
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const profile = await userSettingsAPI.getProfile();
        if (cancelled) return;
        setAdmin({
          personalInfo: {
            adminId: profile.employeeId || "",
            name: profile.fullName || "",
            role: profile.role || "Administrator",
            email: profile.email || "",
            mobileNumber: profile.mobile || "",
            department: profile.department || "",
          },
          status: profile.status || "",
          createdAt: profile.createdAt || null,
          lastLogin: profile.lastLogin || null,
        });
        setPhoto(profile.image || profile.profilePicture || "");
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.message || "Failed to load profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  // Live input restrictions: rejected characters are stripped immediately and
  // the matching message is shown while typing instead of waiting for Save.
  const handleChange = (field, rawValue) => {
    const rule = FIELD_RULES[field];
    const filter = ENTRY_FILTERS[field];
    const value = filter ? filter.sanitize(String(rawValue)) : String(rawValue);

    setAdmin((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));

    let nextError = "";
    if (filter && value !== rawValue) {
      nextError = filter.message;
    } else if (rule?.required && !value.trim()) {
      nextError = `${rule.label} is required`;
    } else {
      const live = LIVE_FORMATS[field];
      if (live && value.trim() && !live.validate.test(value.trim())) {
        nextError = live.message;
      }
    }

    setErrors((prev) => {
      if (!nextError && !prev[field]) return prev;
      const next = { ...prev };
      if (nextError) next[field] = nextError;
      else delete next[field];
      return next;
    });
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">Loading profile…</div>
    );
  }

  if (loadError) {
    return (
      <div
        className="p-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg"
        role="alert"
      >
        {loadError}
      </div>
    );
  }

  if (!admin) return null;

  const handleSave = async () => {
    // Block the request while any field is invalid.
    const validationErrors = validateProfileFields(admin.personalInfo);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setSaveError("Please fix the highlighted fields before saving.");
      setSaveSuccess("");
      return;
    }

    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    const { name, email, mobileNumber } = admin.personalInfo;

    try {
      const response = await userSettingsAPI.updateProfile({
        fullName: name,
        email,
        mobile: mobileNumber,
      });

      const updated = response?.user || {};
      const nextName = updated.fullName || name;
      const nextEmail = updated.email || email;
      const nextMobile = updated.mobile ?? mobileNumber;

      setAdmin((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          name: nextName,
          email: nextEmail,
          mobileNumber: nextMobile,
        },
      }));

      // Keep the cached session copy in sync so the sidebar/header reflect the change.
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(
          "user",
          JSON.stringify({ ...storedUser, name: nextName, email: nextEmail })
        );
      } catch (storageErr) {
        console.error("Failed to update user in localStorage:", storageErr);
      }

      setSaveSuccess("Changes saved successfully");
      setErrors({});
      setEditMode(false);
    } catch (err) {
      setSaveError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setSaveError("");
    setSaveSuccess("");

    if (!/^image\/(jpe?g|png|gif|webp)$/i.test(file.type)) {
      setSaveError("Only JPG, PNG, GIF or WebP images are allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSaveError("Image must be 2MB or smaller");
      return;
    }

    setUploading(true);
    try {
      const res = await userSettingsAPI.uploadAvatar(file);
      const savedPath = res?.image || res?.profilePicture || "";
      setPhoto(savedPath || URL.createObjectURL(file));
      setSaveSuccess("Profile photo updated successfully");
    } catch (err) {
      setSaveError(err.message || "Failed to upload profile photo");
    } finally {
      setUploading(false);
    }
  };

  const avatarSrc = photo
    ? photo.startsWith("blob:") || photo.startsWith("http")
      ? photo
      : `${config.SERVER_URL}${photo}`
    : null;

  return (
    <div className="p-0 min-h-screen">
      {/* Header */}
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">Admin Profile</h2>
        <HelpInfo
          title="Admin Profile"
          description="View and update your administrator details and upload a profile photo."
          steps={[
            "Update profile details",
            "Upload profile photo",
            "View account information",
          ]}
        />
      </div>

      {/* MAIN CARD */}
      <div className="bg-white p-3 rounded-lg shadow-sm border">
        {saveSuccess ? (
          <div
            className="mb-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800"
            role="status"
          >
            {saveSuccess}
          </div>
        ) : null}
        {saveError ? (
          <div
            className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800"
            role="alert"
          >
            {saveError}
          </div>
        ) : null}
        {/* TOP PROFILE */}
        <div className="flex items-center gap-4 border p-3 rounded-lg mb-4">
          <div className="relative">
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                (admin.personalInfo.name || "A").charAt(0).toUpperCase()
              )}
              {uploading ? (
                <div className="absolute inset-0 rounded-full bg-black/50 text-xs text-white flex items-center justify-center">
                  Uploading…
                </div>
              ) : null}
            </div>

            {/* PHOTO UPLOAD */}
            <label
              className={`absolute bottom-0 right-0 bg-white border rounded-full p-1 cursor-pointer ${
                uploading ? "opacity-50 pointer-events-none" : ""
              }`}
              title="Upload profile photo"
            >
              <FiCamera size={14} />
              <input
                type="file"
                hidden
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                disabled={uploading}
                onChange={handlePhotoSelected}
              />
            </label>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              {admin.personalInfo.name}
            </h3>
            <p className="text-indigo-600 font-medium">
              {admin.personalInfo.role}
            </p>
            <p className="text-sm text-gray-500">
              Admin ID: {admin.personalInfo.adminId}
            </p>
          </div>

          {/* EDIT BUTTON */}
          <button
            onClick={() => {
              setEditMode(!editMode);
              setSaveError("");
              setSaveSuccess("");
              setErrors({});
            }}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            {editMode ? <FiX /> : <FiEdit />}
            {editMode ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-4">
          {["overview", "system"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg ${
                activeTab === t
                  ? "bg-indigo-600 text-white"
                  : "border bg-white"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <ProfileCard label="Personal Information" icon={<FiUser />}>
            {editMode ? (
              <>
                <InfoInput
                  label="Name"
                  required
                  value={admin.personalInfo.name}
                  onChange={(v) => handleChange("name", v)}
                  maxLength={FIELD_RULES.name.maxLength}
                  error={errors.name}
                />
                <InfoInput
                  label="Email"
                  required
                  value={admin.personalInfo.email}
                  onChange={(v) => handleChange("email", v)}
                  maxLength={FIELD_RULES.email.maxLength}
                  inputMode={INPUT_META.email.inputMode}
                  error={errors.email}
                />
                <InfoInput
                  label="Mobile"
                  value={admin.personalInfo.mobileNumber}
                  onChange={(v) => handleChange("mobileNumber", v)}
                  maxLength={INPUT_META.mobileNumber.maxLength}
                  inputMode={INPUT_META.mobileNumber.inputMode}
                  error={errors.mobileNumber}
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FiSave /> {saving ? "Saving…" : "Save Changes"}
                </button>
              </>
            ) : (
              <>
                <InfoDetail label="Name" value={admin.personalInfo.name} />
                <InfoDetail label="Email" value={admin.personalInfo.email} />
                <InfoDetail
                  label="Mobile"
                  value={admin.personalInfo.mobileNumber}
                />
              </>
            )}
          </ProfileCard>
        )}

        {/* SYSTEM */}
        {activeTab === "system" && (
          <ProfileCard label="Account Information" icon={<FiCalendar />}>
            <InfoDetail label="Role" value={admin.personalInfo.role} />
            <InfoDetail
              label="Department"
              value={admin.personalInfo.department}
            />
            <InfoDetail label="Status" value={admin.status} />
            <InfoDetail label="Joined On" value={formatDate(admin.createdAt)} />
            <InfoDetail
              label="Last Login"
              value={formatDateTime(admin.lastLogin)}
            />
          </ProfileCard>
        )}
      </div>
    </div>
  );
}
