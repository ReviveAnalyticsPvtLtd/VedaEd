import React, { useState, useEffect } from "react";
import {
  FiUser,
  FiPhone,
  FiMail,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiBookOpen,
  FiEdit,
  FiSave,
  FiCamera,
  FiX,
} from "react-icons/fi";
import HelpInfo from "../components/HelpInfo";

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
const InfoInput = ({ label, value, onChange }) => (
  <div className="flex items-center gap-4 border-b py-2">
    <span className="w-40 text-sm font-medium text-gray-500">{label}</span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded px-3 py-1 text-sm w-full"
    />
  </div>
);

export default function AdminProfile() {
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    setAdmin({
      personalInfo: {
        adminId: "ADM-001",
        name: "System Administrator",
        username: "admin",
        gender: "Male",
        role: "Administrator",
        email: "admin@sis.com",
        mobileNumber: "9999999999",
        address: "Head Office, SIS Campus",
      },
      joiningDate: "2019-04-01",
      experience: 10,
      qualification: "MBA, M.Tech (IT)",
      salaryDetails: {
        salary: "₹80,000",
        lastPayment: "2024-01-31",
      },
      documents: [
        { name: "ID Proof.pdf", date: "2019-03-20" },
        { name: "Appointment Letter.pdf", date: "2019-03-25" },
      ],
    });
  }, []);

  if (!admin) return null;

  return (
    <div className="p-0 min-h-screen">
      {/* Header */}
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">Admin Profile</h2>
        <HelpInfo
          title="Admin Profile"
          description="View and update administrator details, upload profile photo and manage documents."
          steps={[
            "Update profile details",
            "Upload profile photo",
            "View salary info",
            "Manage documents",
          ]}
        />
      </div>

      {/* MAIN CARD */}
      <div className="bg-white p-3 rounded-lg shadow-sm border">
        {/* TOP PROFILE */}
        <div className="flex items-center gap-4 border p-3 rounded-lg mb-4">
          <div className="relative">
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {photo ? (
                <img
                  src={photo}
                  alt="profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                admin.personalInfo.name.charAt(0)
              )}
            </div>

            {/* PHOTO UPLOAD */}
            <label className="absolute bottom-0 right-0 bg-white border rounded-full p-1 cursor-pointer">
              <FiCamera size={14} />
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) =>
                  setPhoto(URL.createObjectURL(e.target.files[0]))
                }
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
            onClick={() => setEditMode(!editMode)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            {editMode ? <FiX /> : <FiEdit />}
            {editMode ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-4">
          {["overview", "system", "salary", "documents"].map((t) => (
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
                  value={admin.personalInfo.name}
                  onChange={(v) =>
                    setAdmin({
                      ...admin,
                      personalInfo: { ...admin.personalInfo, name: v },
                    })
                  }
                />
                <InfoInput
                  label="Email"
                  value={admin.personalInfo.email}
                  onChange={(v) =>
                    setAdmin({
                      ...admin,
                      personalInfo: { ...admin.personalInfo, email: v },
                    })
                  }
                />
                <InfoInput
                  label="Mobile"
                  value={admin.personalInfo.mobileNumber}
                  onChange={(v) =>
                    setAdmin({
                      ...admin,
                      personalInfo: {
                        ...admin.personalInfo,
                        mobileNumber: v,
                      },
                    })
                  }
                />
                <button className="mt-3 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
                  <FiSave /> Save Changes
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
                <InfoDetail label="Address" value={admin.personalInfo.address} />
              </>
            )}
          </ProfileCard>
        )}

        {/* SYSTEM */}
        {activeTab === "system" && (
          <ProfileCard label="System Information" icon={<FiBookOpen />}>
            <InfoDetail
              label="Qualification"
              value={admin.qualification}
            />
            <InfoDetail
              label="Experience"
              value={`${admin.experience} years`}
            />
            <InfoDetail
              label="Joining Date"
              value={new Date(admin.joiningDate).toLocaleDateString()}
            />
          </ProfileCard>
        )}

        {/* SALARY */}
        {activeTab === "salary" && (
          <ProfileCard label="Salary Details" icon={<FiDollarSign />}>
            <InfoDetail
              label="Salary"
              value={admin.salaryDetails.salary}
            />
            <InfoDetail
              label="Last Payment"
              value={admin.salaryDetails.lastPayment}
            />
          </ProfileCard>
        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
          <ProfileCard label="Documents" icon={<FiFileText />}>
            {admin.documents.map((d, i) => (
              <div
                key={i}
                className="flex justify-between border-b py-2 text-sm"
              >
                <span>{d.name}</span>
                <span className="text-gray-500">{d.date}</span>
              </div>
            ))}
          </ProfileCard>
        )}
      </div>
    </div>
  );
}
