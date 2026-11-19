import { getStoredUser } from "../utils/authStorage";
import React, { useState, useEffect } from "react";
import {
  FiInfo,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiUser,
  FiBookOpen,
  FiPhone,
  FiMail,
} from "react-icons/fi";
import HelpInfo from "../components/HelpInfo";
import staffAPI from "../services/staffAPI";
import ProfileAvatar, { resolveProfileImage } from "../components/ProfileAvatar";

// Card Component
const ProfileCard = ({ label, icon, children }) => (
  <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
    <div className="flex items-center mb-3">
      <div className="text-indigo-500 mr-2">{icon}</div>
      <h3 className=" font-semibold">{label}</h3>
    </div>
    <div className="space-y-2 text-gray-700">{children}</div>
  </div>
);

// Info row (FIXED ALIGNMENT)
const InfoDetail = ({ label, value }) => (
  <div className="flex items-start border-b border-gray-200 py-2 last:border-b-0">
    <span className="w-40 text-sm font-medium text-gray-500">
      {label}
    </span>
    <span className="text-sm text-gray-800">
      {value || "N/A"}
    </span>
  </div>
);


export default function TeacherProfile() {
  const [activeTab, setActiveTab] = useState("overview");
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setError("");
        const user = getStoredUser();
        const staffId = user?.refId || user?._id;
        if (!staffId) {
          setError("Unable to identify logged-in staff profile.");
          return;
        }

        const res = await staffAPI.getStaffById(staffId);
        if (res?.success && res?.staff) {
          setTeacher(res.staff);
        } else {
          setError("Failed to load teacher profile.");
        }
      } catch (err) {
        console.error("Error fetching teacher profile:", err);
        setError(
          err?.response?.data?.message ||
            "Unable to load teacher profile. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-gray-600 text-xl">Loading teacher profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-red-600 text-base">{error}</p>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-gray-600 text-base">No profile data found.</p>
      </div>
    );
  }

  const personalInfo = teacher.personalInfo || {};
  const classesAssigned = Array.isArray(teacher.classesAssigned)
    ? teacher.classesAssigned
    : [];
  const documents = Array.isArray(teacher.documents) ? teacher.documents : [];
  const salaryDetails = teacher.salaryDetails || {};
  const safeName = personalInfo.name || "Teacher";
  const teacherImage = resolveProfileImage(teacher, personalInfo?.profileImage);
  const joiningDate = teacher.joiningDate
    ? new Date(teacher.joiningDate).toLocaleDateString()
    : "N/A";

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* Breadcrumb + Header (match Gradebook) */}
      <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <span>Teacher</span>
        <span>&gt;</span>
        <span>Profile</span>
      </div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Teacher Profile</h2>
        <HelpInfo
          title="Teacher Profile"
          description={`3.1 Teacher Profile (Personal & Professional Information)

View and update your personal and professional details, manage account settings, and review your assigned subjects.

Sections:
- Personal Information: View and edit name, email, phone number, address, and profile photo
- Professional Details: Add or update qualifications, certifications, and teaching experience
- Assigned Classes and Subjects: See the list of classes and subjects currently assigned
- Account Settings: Manage password, security options, and notification preferences
- Profile Photo: Upload, change, or remove your profile picture
`}
          steps={[
            "View your personal and professional details",
            "Update qualifications and contact details",
            "Check assigned classes and subjects",
            "Manage password and notification preferences",
            "Upload or update your profile photo",
          ]}
        />
      </div>

      {/* Main container */}
      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
        {/* Teacher Header */}
        <div className="bg-white p-3 rounded-lg shadow-sm border mb-4 flex items-center gap-4">
          <ProfileAvatar
            name={safeName}
            imageSrc={teacherImage}
            sizeClassName="w-20 h-20"
          />
          <div>
            <h1 className="text-lg font-semibold">
              {safeName}
            </h1>
            <p className="text-indigo-600 font-medium ">
              {personalInfo.role || "N/A"} - {personalInfo.department || "N/A"}
            </p>
            <p className="text-gray-500 text-">
              Staff ID: {personalInfo.staffId || "N/A"}
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
            onClick={() => setActiveTab("academic")}
            className={`px-4 py-2 rounded-lg ${
              activeTab === "academic"
                ? "bg-indigo-600 text-white"
                : "bg-white border"
            }`}
          >
            Academic
          </button>
          <button
            onClick={() => setActiveTab("salary")}
            className={`px-4 py-2 rounded-lg ${
              activeTab === "salary"
                ? "bg-indigo-600 text-white"
                : "bg-white border"
            }`}
          >
            Salary
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-2 rounded-lg ${
              activeTab === "documents"
                ? "bg-indigo-600 text-white"
                : "bg-white border"
            }`}
          >
            Documents
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <>
            <ProfileCard label="Personal Information" icon={<FiUser />}>
              <InfoDetail
                label="Staff ID"
                value={personalInfo.staffId}
              />
              <InfoDetail label="Name" value={safeName} />
              <InfoDetail
                label="Username"
                value={personalInfo.username}
              />
              <InfoDetail label="Gender" value={personalInfo.gender} />
              <InfoDetail label="Role" value={personalInfo.role} />
              <InfoDetail
                label="Department"
                value={personalInfo.department}
              />
              <InfoDetail label="Status" value={teacher.status} />
              <InfoDetail
                label="Address"
                value={personalInfo.address}
              />
            </ProfileCard>

            <ProfileCard label="Contact Information" icon={<FiPhone />}>
              <InfoDetail label="Email" value={personalInfo.email} />
              <InfoDetail
                label="Mobile Number"
                value={personalInfo.mobileNumber}
              />
              <InfoDetail
                label="Emergency Contact"
                value={personalInfo.emergencyContact}
              />
            </ProfileCard>

            <ProfileCard label="Employment Details" icon={<FiCalendar />}>
              <InfoDetail
                label="Date of Joining"
                value={joiningDate}
              />
              <InfoDetail
                label="Experience"
                value={`${teacher.experience} years`}
              />
              <InfoDetail
                label="Assigned Classes"
                value={classesAssigned.join(", ")}
              />
            </ProfileCard>
          </>
        )}

        {activeTab === "academic" && (
          <ProfileCard label="Academic Information" icon={<FiBookOpen />}>
            <InfoDetail label="Qualification" value={teacher.qualification} />
            <InfoDetail
              label="Experience"
              value={`${teacher.experience} years`}
            />
            <InfoDetail
              label="Department"
              value={personalInfo.department}
            />
            <InfoDetail
              label="Assigned Classes"
              value={classesAssigned.join(", ")}
            />
            <InfoDetail label="Role" value={personalInfo.role} />
            <InfoDetail
              label="Date of Joining"
              value={joiningDate}
            />
          </ProfileCard>
        )}

        {activeTab === "salary" && (
          <ProfileCard label="Salary Details" icon={<FiDollarSign />}>
            <InfoDetail
              label="Current Salary"
              value={salaryDetails.salary}
            />
            <InfoDetail
              label="Last Payment Date"
              value={salaryDetails.lastPayment}
            />
            <InfoDetail label="Payment Status" value="Up to Date" />
            <InfoDetail
              label="Experience"
              value={`${teacher.experience} years`}
            />
            <InfoDetail
              label="Department"
              value={personalInfo.department}
            />
          </ProfileCard>
        )}

        {activeTab === "documents" && (
          <ProfileCard label="Documents" icon={<FiFileText />}>
            <ul className="divide-y divide-gray-200">
              {documents.map((doc, idx) => (
                <li key={idx} className="py-2 flex justify-between">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-gray-500 ">
                      {doc.date} - {doc.size}
                    </p>
                  </div>
                  <button
                    className="text-indigo-600 hover:underline font-semibold"
                    onClick={() => console.log("Download document", doc.name)}
                  >
                    Download
                  </button>
                </li>
              ))}
            </ul>
          </ProfileCard>
        )}
      </div>
    </div>
  );
}
