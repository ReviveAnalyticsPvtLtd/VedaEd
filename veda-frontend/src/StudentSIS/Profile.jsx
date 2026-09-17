import React, { useState, useEffect } from "react";
import { FiInfo, FiCalendar, FiDollarSign, FiFileText } from "react-icons/fi";
import HelpInfo from "../components/HelpInfo";
import { studentAPI } from "../services/studentAPI";
import api from "../services/apiClient";
import ProfileAvatar, { resolveProfileImage } from "../components/ProfileAvatar";

// Card Component
const ProfileCard = ({ label, icon, children }) => (
  <div className="bg-white rounded-xl shadow-md p-6 mb-3">
    <div className="flex items-center mb-3">
      <div className="text-base text-indigo-500 mr-2">{icon}</div>
      <h3 className=" text-base font-semibold">{label}</h3>
    </div>
    <div className="space-y-2  text-gray-700">{children}</div>
  </div>
);

// Info row 
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

const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (value === 0) return value;
    if (typeof value === "string" && value.trim() !== "") return value.trim();
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
};

const formatDocSize = (size) => {
  if (size == null || Number.isNaN(Number(size)) || Number(size) <= 0) return "N/A";
  const bytes = Number(size);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDocDate = (value) => {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString();
};

// Map the nested backend response (personalInfo/parent) to the flat fields
// this component renders. Works for both SIS and Admission-sourced students.
const mapStudentProfile = (studentData = {}) => {
  const personal = studentData.personalInfo || {};
  const contactDetails = personal.contactDetails || studentData.contactInfo || {};
  const parent = studentData.parent || {};
  const parentContact = parent.contactDetails || {};
  const admissionParents = studentData.parents || {};
  const parentRole = String(parent.role || "").toLowerCase();
  const imageSource = personal.image;

  const imageValue =
    typeof imageSource === "object" && imageSource !== null
      ? imageSource.url || imageSource.path || ""
      : imageSource || "";

  return {
    _id: studentData._id,
    name: firstNonEmpty(personal.name, studentData.name),
    grade: firstNonEmpty(
      personal.class?.name,
      personal.class,
      personal.classApplied,
      studentData.grade
    ),
    section: firstNonEmpty(
      personal.section?.name,
      personal.section,
      studentData.section,
      "-"
    ),
    stdId: firstNonEmpty(personal.stdId, studentData.stdId),
    rollNo: firstNonEmpty(personal.rollNo, studentData.rollNo, "-"),
    gender: firstNonEmpty(personal.gender, studentData.gender),
    dob: firstNonEmpty(personal.DOB, personal.dateOfBirth, studentData.dob),
    age: firstNonEmpty(personal.age, studentData.age),
    bloodGroup: firstNonEmpty(personal.bloodGroup, studentData.bloodGroup),
    address: firstNonEmpty(
      personal.address,
      studentData.address,
      studentData.contactInfo?.address
    ),
    contact: firstNonEmpty(
      contactDetails.mobileNumber,
      contactDetails.phone,
      studentData.contact,
      studentData.contactInfo?.phone,
      parentContact.phone
    ),
    email: firstNonEmpty(
      contactDetails.email,
      studentData.email,
      studentData.contactInfo?.email,
      parentContact.email
    ),
    fatherName: firstNonEmpty(
      parent.fatherName,
      parentRole.includes("father") ? parent.name : "",
      admissionParents.father?.name,
      studentData.fatherName
    ),
    motherName: firstNonEmpty(
      parent.motherName,
      parentRole.includes("mother") ? parent.name : "",
      admissionParents.mother?.name,
      studentData.motherName
    ),
    parentContact: firstNonEmpty(
      parentContact.phone,
      parent.phone,
      admissionParents.father?.phone,
      admissionParents.mother?.phone,
      studentData.parentContact
    ),
    attendance: firstNonEmpty(studentData.attendance, ""),
    fee: firstNonEmpty(personal.fees, studentData.fee, "Paid"),
    photo: imageValue,
    documents: (Array.isArray(studentData.documents)
      ? studentData.documents.filter((d) => d && !d.parentProfileUpload)
      : []
    ).map((doc) => ({
      name: doc.name || "Untitled",
      date: formatDocDate(doc.uploadedAt || doc.date),
      size: formatDocSize(doc.size),
    })),
  };
};


export default function StudentProfile() {
  const [activeTab, setActiveTab] = useState("overview");
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.refId) {
          const res = await studentAPI.getStudent(user.refId);
          if (res.success) {
            const mapped = res.student ? mapStudentProfile(res.student) : null;
            let attendance = mapped ? mapped.attendance : "";
            try {
              const dashRes = await api.get(`/students/${user.refId}/dashboard-stats`);
              if (dashRes.data && dashRes.data.success && dashRes.data.stats) {
                attendance = `${dashRes.data.stats.attendance || 0}%`;
              }
            } catch (statErr) {
              // Dashboard stats unavailable — attendance falls back to profile field / blank.
            }
            setStudent(mapped ? { ...mapped, attendance } : null);
          } else {
            setError(res.message || "Failed to fetch student profile");
          }
        } else {
          setError("Session data incomplete (refId missing). Please logout and login again.");
        }
      } catch (err) {
        console.error("Error fetching student profile:", err);
        setError(err.response?.data?.message || err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-gray-600 text-xl">Loading student profile...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 gap-4 text-center px-4">
        <p className="text-red-500 text-xl font-semibold">
          {error || "Student profile not found."}
        </p>
        <p className="text-gray-500 max-w-md">
          There was an issue loading your profile details. Please try again or contact support if the issue persists.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Retry
        </button>
      </div>
    );
  } 

  const studentName = student?.name || "Student";
  const studentImage = resolveProfileImage(student, student?.photo);

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* Breadcrumb + Heading */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">My Profile</h2>

        <HelpInfo
          title="My Profile Help"
          description={`Page Description: View your complete student profile information. Use the tabbed interface to review personal details, attendance, fee status, and documents.


5.1 Profile Tabs Overview

Navigate between Overview, Attendance, Fee, and Documents tabs.
Download important files and verify personal/contact information quickly.

Sections:
- Profile Header Card: Shows student photo, name, and class-section badge
- Tab Navigation: Four pill buttons (Overview, Attendance, Fee, Documents) to switch sections
- Overview Tab Card: Displays Student ID, Roll No, Class, Section, Gender, DOB, Age, Blood Group, Address, Contact, Email, Father/Mother names, and Parent Contact
- Attendance Tab Card: Highlights overall attendance percentage
- Fee Tab Card: Shows current fee payment status (Paid/Due)
- Documents Tab Card: List of downloadable files with file name, date, size, and download action
- Card Layout: Each tab uses white cards with icons, borders, and readable spacing`}
        />
      </div>

      {/* Main container (aligned with Teacher/Admin) */}
      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
        {/* Student Header */}
        <div className="bg-white p-3 rounded-lg shadow-sm border mb-4 flex items-center gap-3">
          <ProfileAvatar
            name={studentName}
            imageSrc={studentImage}
            sizeClassName="w-20 h-20"
          />
          <div>
            <h1 className="text-lg font-semibold">{studentName}</h1>
            <p className="text-indigo-600 font-medium ">
              {student.grade} - {student.section}
            </p>
            <p className="text-gray-500 ">Student ID: {student.stdId}</p>
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
            onClick={() => setActiveTab("attendance")}
            className={`px-4 py-2 rounded-lg ${
              activeTab === "attendance"
                ? "bg-indigo-600 text-white"
                : "bg-white border"
            }`}
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveTab("fee")}
            className={`px-4 py-2 rounded-lg ${
              activeTab === "fee"
                ? "bg-indigo-600 text-white"
                : "bg-white border"
            }`}
          >
            Fee
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
          <ProfileCard label="General Information" icon={<FiInfo />}>
            <InfoDetail label="Student ID" value={student.stdId} />
            <InfoDetail label="Roll No" value={student.rollNo} />
            <InfoDetail label="Name" value={student.name} />
            <InfoDetail label="Class" value={student.grade} />
            <InfoDetail label="Section" value={student.section} />
            <InfoDetail label="Gender" value={student.gender} />
            <InfoDetail label="DOB" value={student.dob} />
            <InfoDetail label="Age" value={student.age} />
            <InfoDetail label="Blood Group" value={student.bloodGroup} />
            <InfoDetail label="Address" value={student.address} />
            <InfoDetail label="Contact" value={student.contact} />
            <InfoDetail label="Email" value={student.email} />
            <InfoDetail label="Father" value={student.fatherName} />
            <InfoDetail label="Mother" value={student.motherName} />
            <InfoDetail label="Parent Contact" value={student.parentContact} />
          </ProfileCard>
        )}

        {activeTab === "attendance" && (
          <ProfileCard label="Attendance" icon={<FiCalendar />}>
            <InfoDetail label="Attendance %" value={student.attendance} />
          </ProfileCard>
        )}

        {activeTab === "fee" && (
          <ProfileCard label="Fee Details" icon={<FiDollarSign />}>
            <InfoDetail label="Status" value={student.fee} />
          </ProfileCard>
        )}

        {activeTab === "documents" && (
          <ProfileCard label="Documents" icon={<FiFileText />}>
            <ul className="divide-y divide-gray-200">
              {(student.documents || []).length > 0 ? (
                student.documents.map((doc, idx) => (
                <li key={idx} className="py-2 flex justify-between">
                  <div>
                    <p className="">{doc.name}</p>
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
              ))
            ) : (
              <p className="text-gray-500 py-4 text-center">No documents found.</p>
            )}
            </ul>
          </ProfileCard>
        )}
      </div>
    </div>
  );
}
