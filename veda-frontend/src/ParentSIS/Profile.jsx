import React, { useState, useEffect, useRef } from "react";
import { FiInfo, FiEye, FiEyeOff } from "react-icons/fi";
import HelpInfo from "../components/HelpInfo";
import { parentAPI } from "../services/parentAPI";
import ProfileAvatar, { resolveProfileImage } from "../components/ProfileAvatar";

const Section = ({ title, children }) => (
  <div className="bg-white p-3 rounded-lg shadow-sm border mb-3">
    <div className="flex items-center mb-3">
      <div className="text-indigo-500 mr-2">
        <FiInfo />
      </div>
      <h3 className=" font-semibold">{title}</h3>
    </div>
    <div className="space-y-2  text-gray-700">{children}</div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-start gap-4">
    <span className="w-40  font-medium text-gray-500">
      {label}
    </span>
    <span className=" text-gray-800">
      {value || "N/A"}
    </span>
  </div>
);

export default function ParentProfile() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showPassword, setShowPassword] = useState(false);
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);
  const profilePhotoInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.refId) {
          const res = await parentAPI.getParentById(user.refId);
          if (res.success) {
            setParent(res.parent);
          } else {
            console.error("Failed to fetch parent profile");
          }
        }
      } catch (err) {
        console.error("Error fetching parent profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfilePhotoSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !(parent._id || parent.id)) return;
    setPhotoUploading(true);
    try {
      const data = await parentAPI.uploadProfilePhoto(parent._id || parent.id, file);
      if (!data.success) throw new Error(data.message || "Upload failed");
      setParent((prev) => (prev ? { ...prev, photo: data.photo } : prev));
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to upload photo");
    } finally {
      setPhotoUploading(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-gray-600 text-xl">Loading parent profile...</p>
      </div>
    );

  if (!parent)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-gray-600 text-xl text-red-500">Parent profile not found. Please contact administrator.</p>
      </div>
    );

  const parentName = parent.name || parent.fatherName || parent.motherName || "Parent";
  const parentImage = resolveProfileImage(parent);

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Profile</h2>
<HelpInfo
  title="Profile Help"
  description={`1.1 Overview

This section displays complete parent profile information at the top, including:
• Parent Name – Registered parent/guardian name  
• Parent ID – Unique parent identity code  
• Contact Details – Email address and phone number  
• Profile Photo – Parent profile image (can be updated if allowed)

Below this, detailed parent information is shown in separate cards:

• Father Details – Name, contact number, and occupation  
• Mother Details – Name, contact number, and occupation  
• Address Details – Residential address and communication details  
• Additional Info – Any extra details provided by the school or parent

2.1 Children

This tab lists all children linked to the parent account.  
For each child, the following is displayed:
• Student Name  
• Class & Section  
• Admission Number  
• Child Profile Link – View complete student details

Parents can quickly switch between children using this section.

3.1 Credentials

This tab shows the login credentials assigned to the parent:
• Username / Registered Email  
• Option to reset password (if enabled)  
• Security info and account status

This helps parents manage their login access securely.
`}
  steps={[
    "Check parent personal details in the Overview section.",
    "Use the Children tab to view and manage all linked student profiles.",
            "Open the Credentials tab to update or manage login access.",
  ]}
/>
</div>

      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
          {/* Header */}
        <div className="flex items-center gap-4 mb-4">
            <div className="flex flex-col items-center gap-2 shrink-0">
            <ProfileAvatar
              name={parentName}
              imageSrc={parentImage}
              sizeClassName="w-20 h-20"
            />
            <input
              ref={profilePhotoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              className="hidden"
              onChange={handleProfilePhotoSelected}
            />
            <button
              type="button"
              disabled={photoUploading}
              onClick={() => profilePhotoInputRef.current?.click()}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
            >
              {photoUploading ? "Uploading…" : "Change photo"}
            </button>
            </div>
            <div className="min-w-0">
            <h1 className=" font-semibold">{parentName}</h1>
            <p className="text-indigo-600 font-medium">
              Parent ID: {parent.parentId}
            </p>
            <p className=" text-gray-500">
                {parent.email} • {parent.phone || parent.fatherNumber}
              </p>
            </div>
          </div>

          {/* Tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-lg ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white"
                : "bg-white border"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("children")}
              className={`px-4 py-2 rounded-lg ${
              activeTab === "children"
                ? "bg-indigo-600 text-white"
                : "bg-white border"
              }`}
            >
              Children
            </button>
            <button
              onClick={() => setActiveTab("credentials")}
              className={`px-4 py-2 rounded-lg ${
              activeTab === "credentials"
                ? "bg-indigo-600 text-white"
                : "bg-white border"
              }`}
            >
              Credentials
            </button>
          </div>

          {/* ================= OVERVIEW ================= */}
          {activeTab === "overview" && (
          <>
              <Section title="Father Details">
                <InfoRow label="Father's Name" value={parent.fatherName} />
                <InfoRow label="Occupation" value={parent.fatherOccupation} />
                <InfoRow label="Contact Number" value={parent.fatherNumber} />
              </Section>

              <Section title="Mother Details">
                <InfoRow label="Mother's Name" value={parent.motherName} />
                <InfoRow label="Occupation" value={parent.motherOccupation} />
                <InfoRow label="Contact Number" value={parent.motherNumber} />
              </Section>

              <Section title="Contact Details">
                <InfoRow label="Primary Email" value={parent.email} />
              <InfoRow
                label="Emergency Contact"
                value={parent.emergencyContact}
              />
              </Section>

              <Section title="Address Details">
              <div>
                <div className="font-medium text-gray-500 mb-1">
                  Permanent Address
                </div>
                <div>
                  {parent.permanentAddress.line1},{" "}
                  {parent.permanentAddress.line2},{" "}
                  {parent.permanentAddress.city},{" "}
                  {parent.permanentAddress.state} -{" "}
                    {parent.permanentAddress.pincode}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-500 mb-1">
                  Current Address
                </div>
                <div>
                    {parent.currentAddress.line1}, {parent.currentAddress.line2},{" "}
                    {parent.currentAddress.city}, {parent.currentAddress.state} -{" "}
                    {parent.currentAddress.pincode}
                </div>
                </div>
              </Section>
          </>
          )}

          {/* ================= CHILDREN ================= */}
          {activeTab === "children" && (
            <Section title="Children Details">
              {parent.childDetails.map((child, index) => (
              <div
                key={index}
                className="flex justify-between border-b border-gray-200 py-1 last:border-b-0"
              >
                <div>
                  <div className="font-medium text-gray-700">
                    {child.name} — Class {child.class} ({child.section})
                  </div>
                  <div className=" text-gray-500">
                    Roll No: {child.rollNo} | Attendance: {child.attendance} |
                    Fee Status: {child.feeStatus}
                  </div>
                  </div>
                </div>
              ))}
            </Section>
          )}

          {/* ================= CREDENTIALS ================= */}
          {activeTab === "credentials" && (
            <Section title="Login Credentials">
              <InfoRow label="Username" value={parent.username} />
              <div>
              <div className="font-medium text-gray-500 mb-1">Password</div>
                <div className="flex items-center gap-2">
                <span className="font-mono">
                    {showPassword ? parent.password : "••••••••"}
                  </span>
                  <button
                    onClick={() => setShowPassword((s) => !s)}
                    className="px-2 py-1 border rounded-md "
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
            <div className=" text-gray-500 mt-2">
                (Note: Passwords are shown here only for demo purpose)
              </div>
            </Section>
          )}
      </div>
    </div>
  );
}
