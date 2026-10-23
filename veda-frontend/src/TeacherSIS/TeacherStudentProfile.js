// src/TeacherSIS/TeacherStudentProfile.js
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiInfo, FiFileText, FiCalendar, FiDollarSign, FiBarChart, FiEdit3, FiSave, FiX } from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../services/apiClient";
import ProfileAvatar from "../components/ProfileAvatar";
import {
  getLatestPassportPhotoUrlFromDocs,
  normalizeStudentDocumentForAvatar,
} from "../utils/studentProfileMedia";

const mockPerformance = [
  { term: "Term 1", score: 78 },
  { term: "Term 2", score: 82 },
  { term: "Term 3", score: 91 },
];

const mockDocuments = [
  { name: "Report Card.pdf", date: "2024-03-15", size: "1.2 MB" },
  { name: "Transfer Certificate.pdf", date: "2023-06-10", size: "800 KB" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;
const BLOOD_GROUP_RE = /^(A|B|AB|O)(\+|-)?$/i;
const STD_ID_RE = /^[A-Za-z0-9/-]{1,30}$/;
const ROLL_NO_RE = /^[1-9]\d*$/;
const GENDER_VALUES = ["male", "female", "other"];
const GENDER_OPTIONS = ["Male", "Female"];
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const FEE_RE = /^(Paid|Due)$/;
const PHONE_FIELDS = ["contact"];

const DATE_PATTERNS = [
  [/^(\d{4})-(\d{2})-(\d{2})$/, "ymd"],
  [/^(\d{4})\/(\d{2})\/(\d{2})$/, "ymd"],
  [/^(\d{2})\/(\d{2})\/(\d{4})$/, "dmy"],
  [/^(\d{2})-(\d{2})-(\d{4})$/, "dmy"],
];

const parseFlexibleDate = (value) => {
  const text = String(value).trim();
  let matchedPattern = false;

  for (const [pattern, order] of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    matchedPattern = true;

    const [year, month, day] = order === "ymd"
      ? [Number(match[1]), Number(match[2]), Number(match[3])]
      : [Number(match[3]), Number(match[2]), Number(match[1])];

    const date = new Date(year, month - 1, day);
    const isRealDate =
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;
    if (isRealDate) return date;
  }

  // A matched-but-impossible date must not reach the lenient Date fallback.
  if (matchedPattern) return null;

  const fallback = new Date(text);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

/** Converts any parseable DOB into the YYYY-MM-DD string a native date input requires. */
const toDateInputValue = (value) => {
  const parsed = parseFlexibleDate(value);
  if (!parsed) return "";
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${parsed.getFullYear()}-${month}-${day}`;
};

/** Inline rules for every editable field on this page. Optional fields only validate when present. */
const FIELD_RULES = {
  stdId: { label: "Student ID", required: true, validate: STD_ID_RE, message: "Student ID may contain letters, numbers, / and - only (max 30)" },
  name: { label: "Name", required: true, maxLength: 100 },
  rollNo: { label: "Roll No", validate: ROLL_NO_RE, message: "Roll No must be a positive whole number" },
  gender: { label: "Gender", oneOf: GENDER_VALUES, message: "Gender must be one of Male, Female, Other" },
  dob: { label: "Date of Birth", date: true },
  age: { label: "Age", integerRange: [1, 120] },
  bloodGroup: { label: "Blood Group", validate: BLOOD_GROUP_RE, message: "Use a valid blood group (e.g. A+, O-)" },
  address: { label: "Address", maxLength: 250 },
  contact: { label: "Mobile", validate: PHONE_RE, message: "Mobile must be exactly 10 digits" },
  email: { label: "Email", validate: EMAIL_RE, message: "Enter a valid email address" },
  attendance: { label: "Attendance %", allowNA: true, integerRange: [0, 100] },
  fee: { label: "Fee Status", validate: FEE_RE, message: "Fee status must be Paid or Due" },
  fatherName: { label: "Father Name", maxLength: 100 },
  motherName: { label: "Mother Name", maxLength: 100 },
};

/** Returns the error message for a single field, or "" when it passes. */
const validateFieldValue = (field, raw) => {
  const rule = FIELD_RULES[field];
  if (!rule) return "";

  const value = typeof raw === "string" ? raw.trim() : "";

  if (rule.required && !value) return `${rule.label} is required`;
  if (!value) return "";
  if (rule.allowNA && value.toUpperCase() === "N/A") return "";

  if (rule.maxLength && value.length > rule.maxLength) {
    return `${rule.label} must be ${rule.maxLength} characters or fewer`;
  }
  if (rule.integerRange) {
    const [min, max] = rule.integerRange;
    if (!/^\d+$/.test(value) || Number(value) < min || Number(value) > max) {
      return `${rule.label} must be a whole number between ${min} and ${max}`;
    }
  }
  if (rule.validate && !rule.validate.test(value)) return rule.message;
  if (rule.oneOf && !rule.oneOf.includes(value.toLowerCase())) {
    return rule.message || `${rule.label} must be one of ${rule.oneOf.join(", ")}`;
  }
  if (rule.date) {
    const parsed = parseFlexibleDate(value);
    if (!parsed) return `${rule.label} is not a valid date`;
    if (parsed.getTime() > Date.now()) return `${rule.label} cannot be in the future`;
  }

  return "";
};

/** Returns { field: message } for every rule the student state violates. */
const validateStudentFields = (values) => {
  const errors = {};

  Object.keys(FIELD_RULES).forEach((field) => {
    const message = validateFieldValue(field, values?.[field]);
    if (message) errors[field] = message;
  });

  return errors;
};

const ProfileCard = ({ label, children, icon }) => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden">
    <div className="p-4">
      <div className="flex items-center mb-4">
        <div className="text-indigo-500 mr-3">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
      </div>
      <div className="space-y-3 text-sm text-gray-600">{children}</div>
    </div>
  </div>
);

const InfoDetail = ({ label, value, isEditing, onChange, error, maxLength, isDropdown, options = [], inputType = "text", disabled = false, hint = "" }) => {
  const inputClassName = `w-full border rounded-md px-2 py-1 text-gray-700 ${error ? "border-red-500 focus:border-red-500 focus:outline-none" : ""} ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2 border-b border-gray-100 last:border-b-0">
      <p className="font-medium text-gray-500">{label}</p>
      <div className="col-span-2">
        {isEditing ? (
          <>
            {isDropdown ? (
              <select
                value={value}
                onChange={onChange}
                disabled={disabled}
                aria-invalid={error ? "true" : undefined}
                className={inputClassName}
              >
                <option value="">Select</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={inputType}
                value={value}
                onChange={onChange}
                maxLength={maxLength}
                disabled={disabled}
                aria-invalid={error ? "true" : undefined}
                className={inputClassName}
              />
            )}
            {error ? (
              <p className="mt-1 text-xs text-red-600">{error}</p>
            ) : hint ? (
              <p className="mt-1 text-xs text-gray-500">{hint}</p>
            ) : null}
          </>
        ) : (
          <p>{value || "N/A"}</p>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ label, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive ? "bg-indigo-600 text-white shadow" : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
      }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const TeacherStudentProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: routeStudentId } = useParams();
  const studentData = location.state || null;
  const resolvedMongoId = routeStudentId || studentData?._id || studentData?.id || null;
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [student, setStudent] = useState(studentData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [parentSnapshot, setParentSnapshot] = useState(() => ({
    fatherName: studentData?.fatherName || "",
    motherName: studentData?.motherName || "",
  }));
  const [documents, setDocuments] = useState(() =>
    (studentData?.documents || []).map(normalizeStudentDocumentForAvatar)
  );

  // Fetch student data from backend when MongoDB id is available
  useEffect(() => {
    const fetchStudent = async () => {
      if (!resolvedMongoId) {
        return;
      }

      console.log("Fetching student with ID:", resolvedMongoId);
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/students/${resolvedMongoId}`);
        if (response.data.success && response.data.student) {
          const s = response.data.student;
          const imageField = s.personalInfo?.image;

          // Transform backend data to frontend format
          const transformedStudent = {
            id: s._id,
            _id: s._id,
            name: s.personalInfo?.name || "",
            stdId: s.personalInfo?.stdId || "",
            grade: s.personalInfo?.class || "",
            section: s.personalInfo?.section || "",
            rollNo: s.personalInfo?.rollNo || "",
            gender: s.personalInfo?.gender || "",
            dob: s.personalInfo?.DOB || "",
            age: s.personalInfo?.age || "",
            address: s.personalInfo?.address || "",
            bloodGroup: s.personalInfo?.bloodGroup || "",
            contact: s.personalInfo?.contactDetails?.mobileNumber || "",
            email: s.personalInfo?.contactDetails?.email || "",
            fee: s.personalInfo?.fees || "Due",
            attendance: s.attendance || "N/A",
            photo:
              (typeof imageField === "string" ? imageField : imageField?.url) ||
              s.photo ||
              "",
            fatherName: s.parent?.fatherName || "",
            motherName: s.parent?.motherName || "",
            hasParent: Boolean(s.parent?._id),
          };

          setStudent(transformedStudent);
          setParentSnapshot({
            fatherName: transformedStudent.fatherName,
            motherName: transformedStudent.motherName,
          });
          setDocuments((s.documents || []).map(normalizeStudentDocumentForAvatar));
        }
      } catch (err) {
        console.error("Error fetching student:", err.response?.data || err.message);
        setError("Failed to load student data");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [resolvedMongoId]);

  // Synchronize human-readable Student ID with breadcrumb
  useEffect(() => {
    const stdId = student?.stdId;
    if (resolvedMongoId && stdId && stdId !== "N/A") {
      try {
        sessionStorage.setItem("breadcrumb_label_" + resolvedMongoId, stdId);
      } catch (_) {}
      window.dispatchEvent(
        new CustomEvent("breadcrumb:update-label", {
          detail: { segment: resolvedMongoId, label: stdId },
        })
      );
    }
  }, [resolvedMongoId, student?.stdId]);

  const profileHeaderImageSrc = useMemo(() => {
    if (!student) return "";
    const fromDocs = getLatestPassportPhotoUrlFromDocs(documents);
    return (student.photo || fromDocs || "").trim();
  }, [student, documents]);

  if (!student && !loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Student Not Found</h2>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700"
          >
            <FiArrowLeft className="w-5 h-5 mr-2" /> Back
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (field, value) => {
    // Phone fields accept digits only, so invalid characters cannot be typed in.
    const nextValue = PHONE_FIELDS.includes(field)
      ? String(value).replace(/\D/g, "")
      : value;
    setStudent((prev) => ({ ...prev, [field]: nextValue }));
    // Validate the edited field immediately so errors surface inline, not only on save.
    setErrors((prev) => {
      const message = validateFieldValue(field, nextValue);
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  };

  const handleSave = async () => {
    if (!student.id) return;

    // Safety net for untouched legacy values; the primary feedback is inline per field.
    const validationErrors = validateStudentFields(student);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setError("Please fix the highlighted fields before saving.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Map frontend data back to backend structure
      const updateData = {
        personalInfo: {
          name: student.name,
          stdId: student.stdId,
          DOB: student.dob,
          gender: student.gender,
          age: student.age,
          address: student.address,
          bloodGroup: student.bloodGroup,
          contactDetails: {
            mobileNumber: student.contact,
            email: student.email
          },
          fees: student.fee,
          rollNo: student.rollNo
        }
      };

      // Parent info lives on the linked Parent document; only send it when the
      // student has one and the values actually changed, otherwise the backend
      // rejects the save for students with no linked parent.
      const parentInfoChanged =
        student.fatherName !== parentSnapshot.fatherName ||
        student.motherName !== parentSnapshot.motherName;

      if (student.hasParent !== false) {
        updateData.parent = {
          fatherName: student.fatherName,
          motherName: student.motherName,
          infoChanged: parentInfoChanged,
        };
      }

      console.log("Sending update data:", updateData);
      console.log("Student ID:", student.id);

      const response = await api.put(`/students/${student.id}`, updateData);

      if (response.data.success) {
        setParentSnapshot({
          fatherName: student.fatherName,
          motherName: student.motherName,
        });
        setIsEditing(false);
        console.log('Student updated successfully');
      }
    } catch (err) {
      console.error("Error updating student:", err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  const OverviewTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="lg:col-span-2 space-y-8">
        <ProfileCard label="General Information" icon={<FiInfo />}>
          <InfoDetail label="Student ID" value={student.stdId} isEditing={isEditing} onChange={(e) => handleChange("stdId", e.target.value)} maxLength={30} error={errors.stdId} />
          <InfoDetail label="Name" value={student.name} isEditing={isEditing} onChange={(e) => handleChange("name", e.target.value)} maxLength={100} error={errors.name} />
          <InfoDetail label="Class" value={student.grade} isEditing={false} />
          <InfoDetail label="Section" value={student.section} isEditing={false} />
          <InfoDetail label="Roll No" value={student.rollNo} isEditing={isEditing} onChange={(e) => handleChange("rollNo", e.target.value)} error={errors.rollNo} />
          <InfoDetail
            label="Gender"
            value={student.gender}
            isEditing={isEditing}
            onChange={(e) => handleChange("gender", e.target.value)}
            isDropdown
            options={[...new Set([...GENDER_OPTIONS, student.gender].filter(Boolean))]}
            error={errors.gender}
          />
          <InfoDetail
            label="DOB"
            value={isEditing ? toDateInputValue(student.dob) : student.dob}
            isEditing={isEditing}
            onChange={(e) => handleChange("dob", e.target.value)}
            inputType="date"
            error={errors.dob}
          />
          <InfoDetail label="Age" value={student.age} isEditing={isEditing} onChange={(e) => handleChange("age", e.target.value)} error={errors.age} />
          <InfoDetail
            label="Blood Group"
            value={student.bloodGroup}
            isEditing={isEditing}
            onChange={(e) => handleChange("bloodGroup", e.target.value)}
            isDropdown
            options={[...new Set([...BLOOD_GROUP_OPTIONS, student.bloodGroup].filter(Boolean))]}
            error={errors.bloodGroup}
          />
          <InfoDetail label="Address" value={student.address} isEditing={isEditing} onChange={(e) => handleChange("address", e.target.value)} maxLength={250} error={errors.address} />
        </ProfileCard>
      </div>
      <div className="space-y-4">
        <ProfileCard label="Contact Information" icon={<FiInfo />}>
          <InfoDetail label="Mobile" value={student.contact} isEditing={isEditing} onChange={(e) => handleChange("contact", e.target.value)} maxLength={10} error={errors.contact} />
          <InfoDetail label="Email" value={student.email} isEditing={isEditing} onChange={(e) => handleChange("email", e.target.value)} error={errors.email} />
        </ProfileCard>
        <ProfileCard label="Parent Info" icon={<FiInfo />}>
          <InfoDetail
            label="Father"
            value={student.fatherName}
            isEditing={isEditing}
            onChange={(e) => handleChange("fatherName", e.target.value)}
            maxLength={100}
            error={errors.fatherName}
            disabled={student.hasParent === false}
            hint={student.hasParent === false ? "No parent linked to this student." : ""}
          />
          <InfoDetail
            label="Mother"
            value={student.motherName}
            isEditing={isEditing}
            onChange={(e) => handleChange("motherName", e.target.value)}
            maxLength={100}
            error={errors.motherName}
            disabled={student.hasParent === false}
            hint={student.hasParent === false ? "No parent linked to this student." : ""}
          />
        </ProfileCard>
      </div>
    </div>
  );

  const AttendanceTab = () => (
    <ProfileCard label="Attendance" icon={<FiCalendar />}>
      <InfoDetail label="Attendance %" value={student.attendance} isEditing={isEditing} onChange={(e) => handleChange("attendance", e.target.value)} error={errors.attendance} />
      <InfoDetail label="Last Present" value="2024-08-05" isEditing={false} />
    </ProfileCard>
  );

  const FeeTab = () => (
    <ProfileCard label="Fee Details" icon={<FiDollarSign />}>
      <InfoDetail label="Total Fee" value="₹50,000" isEditing={false} />
      <InfoDetail
        label="Paid"
        value={student.fee === "Paid" ? "₹50,000" : "₹25,000"}
        isEditing={isEditing}
        onChange={(e) => handleChange("fee", e.target.value)}
        error={errors.fee}
      />
      <InfoDetail label="Due" value={student.fee === "Paid" ? "₹0" : "₹25,000"} isEditing={false} />
      <InfoDetail label="Status" value={student.fee} isEditing={isEditing} onChange={(e) => handleChange("fee", e.target.value)} error={errors.fee} />
    </ProfileCard>
  );

  if (loading && !student) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="text-gray-500">Loading student data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-0">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <div className="mb-6">
          <button onClick={() => navigate(-1)} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
            <FiArrowLeft className="w-5 h-5 mr-2" /> Back to Class Directory
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-3 flex flex-col items-center text-center gap-4 sm:flex-row sm:items-center sm:text-left sm:gap-6">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <ProfileAvatar
              name={student.name || "Student"}
              imageSrc={profileHeaderImageSrc}
              sizeClassName="w-32 h-32 sm:w-36 sm:h-36"
              textClassName="text-3xl"
              className="ring-4 ring-indigo-200"
            />
          </div>
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
              <p className="text-lg text-indigo-600 font-medium">
                {student.grade} - {student.section}
              </p>
              {student.stdId ? (
                <p className="text-sm text-gray-500 font-medium">Student ID: {student.stdId}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:justify-end shrink-0">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    setErrors({});
                    setIsEditing(true);
                  }}
                  className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700"
                >
                  <FiEdit3 className="w-5 h-5 mr-2" /> Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    <FiSave className="w-5 h-5 mr-2" /> {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrors({});
                      setIsEditing(false);
                    }}
                    disabled={loading}
                    className="inline-flex items-center bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 disabled:opacity-50"
                  >
                    <FiX className="w-5 h-5 mr-2" /> Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mb-3">
          <div className="bg-white rounded-xl shadow-md p-2 inline-flex space-x-2">
            <TabButton label="Overview" isActive={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<FiInfo />} />
            <TabButton label="Performance" isActive={activeTab === "performance"} onClick={() => setActiveTab("performance")} icon={<FiBarChart />} />
            <TabButton label="Attendance" isActive={activeTab === "attendance"} onClick={() => setActiveTab("attendance")} icon={<FiCalendar />} />
            <TabButton label="Fee" isActive={activeTab === "fee"} onClick={() => setActiveTab("fee")} icon={<FiDollarSign />} />
            <TabButton label="Documents" isActive={activeTab === "documents"} onClick={() => setActiveTab("documents")} icon={<FiFileText />} />
          </div>
        </div>

        <div>
          {activeTab === "overview" && OverviewTab()}
          {activeTab === "performance" && (
            <ProfileCard label="Performance" icon={<FiBarChart />}>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={mockPerformance} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="term" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#4f46e5" name="Score" barSize={40} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ProfileCard>
          )}
          {activeTab === "attendance" && AttendanceTab()}
          {activeTab === "fee" && FeeTab()}
          {activeTab === "documents" && (
            <ProfileCard label="Documents" icon={<FiFileText />}>
              <ul className="divide-y divide-gray-200">
                {mockDocuments.map((doc) => (
                  <li key={doc.name} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800">{doc.name}</p>
                      <p className="text-gray-500">{doc.date} - {doc.size}</p>
                    </div>
                    <button
                      type="button"
                      className="text-indigo-600 hover:underline font-semibold bg-transparent border-none p-0 cursor-pointer"
                      onClick={() => console.log("Download logic to be implemented")}
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
    </div>
  );
};

export default TeacherStudentProfile;
