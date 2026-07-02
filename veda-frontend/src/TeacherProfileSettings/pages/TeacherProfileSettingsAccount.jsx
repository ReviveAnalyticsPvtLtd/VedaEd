import { useState, useEffect } from "react";
import { userSettingsAPI } from "../../services/userSettingsAPI";

export default function TeacherPorfileSettingsAccount() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    department: "",
    mobile: "",
    employeeId: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profile = await userSettingsAPI.getProfile();
      setFormData({
        fullName: profile.fullName || "",
        email: profile.email || "",
        department: profile.department || "",
        mobile: profile.mobile || "",
        employeeId: profile.employeeId || "",
      });
    } catch (err) {
      setError(err.message);
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

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      
      await userSettingsAPI.updateProfile({
        fullName: formData.fullName,
        email: formData.email,
        department: formData.department,
        mobile: formData.mobile,
        employeeId: formData.employeeId,
      });
      
      setSuccess("Changes Saved Successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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
              <div className="w-28 h-28 rounded-full bg-blue-50 border-4 border-white shadow-md flex items-center justify-center text-indigo-600 font-bold text-3xl">
                SA
              </div>

              <button className="absolute bottom-1 right-1 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition">
                📷
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-4 text-center">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>

          {/* Form */}
          <div className="flex-1 space-y-6">
            
            {/* Change Password */}
            <div className="flex justify-end">
              <button className="flex items-center gap-2 px-3 py-1.5 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-50">
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
                  value="Super Administrator"
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
                  value="01 Jan 2024"
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
                  value="20 May 2025 10:24 AM"
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
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
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