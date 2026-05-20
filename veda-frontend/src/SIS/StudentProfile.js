import React, { useState, useEffect, useMemo } from "react";

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiInfo, FiFileText, FiCalendar, FiDollarSign, FiBarChart, FiEdit3, FiSave, FiX } from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { authFetch } from "../services/apiClient";
import ProfileAvatar from "../components/ProfileAvatar";
import {
  getLatestPassportPhotoUrlFromDocs,
  normalizeStudentDocumentForAvatar,
} from "../utils/studentProfileMedia";
const documentAccept = ".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx";

const mockPerformance = [
  { term: "Term 1", score: 78 },
  { term: "Term 2", score: 82 },
  { term: "Term 3", score: 91 },
];

const mockDocuments = [
  { name: "Report Card.pdf", date: "2024-03-15", size: "1.2 MB" },
  { name: "Transfer Certificate.pdf", date: "2023-06-10", size: "800 KB" },
];

const ProfileCard = ({ label, children, icon }) => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden">
    <div className="p-6">
      <div className="flex items-center mb-4">
        <div className="text-indigo-500 mr-3">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
      </div>
      <div className="space-y-3 text-sm text-gray-600">{children}</div>
    </div>
  </div>
);

const InfoDetail = ({ label, value, isEditing, onChange, options, isDropdown }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2 border-b border-gray-100 last:border-b-0">
    <p className="font-medium text-gray-500">{label}</p>
    <div className="col-span-2">
      {isEditing ? (
        isDropdown && options ? (
          <select
            value={value || ""}
            onChange={onChange}
            className="w-full border rounded-md px-2 py-1 text-gray-700"
          >
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option key={option._id || option} value={option._id || option}>
                {option.name || option}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={value || ""}
            onChange={onChange}
            className="w-full border rounded-md px-2 py-1 text-gray-700"
          />
        )
      ) : (
        <p>{value || "N/A"}</p>
      )}
    </div>
  </div>
);

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

const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (value === 0) return value;
    if (typeof value === "string" && value.trim() !== "") return value.trim();
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
};

const parseAddressParts = (addressValue = "") => {
  const parts = String(addressValue)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const street = parts[0] || "";
  const city = parts[1] || "";
  const tail = parts.slice(2).join(", ");
  const state = tail.replace(/\s+\d{4,10}$/, "").trim();
  const zipMatch = tail.match(/(\d{4,10})$/);
  const zip = zipMatch ? zipMatch[1] : "";
  return { street, city, state, zip };
};

const mapSisStudentToProfile = (studentData = {}) => {
  const personal = studentData.personalInfo || {};
  const contactDetails =
  personal.contactDetails ||
  studentData.contactInfo ||
  {};
  const parent = studentData.parent || {};
  const parentContact = parent.contactDetails || {};
  const admissionContact = studentData.contactInfo || {};
  const admissionParents = studentData.parents || {};
  const earlierAcademic = studentData.earlierAcademic || {};
  const emergencyContact = studentData.emergencyContact || {};
  const derivedAddress = parseAddressParts(
    firstNonEmpty(personal.address, studentData.address, admissionContact.address)
  );
  const imageSource = personal.image;

  return {
    id: firstNonEmpty(studentData._id, studentData.id),
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
    gradeId: firstNonEmpty(personal.class?._id, studentData.gradeId),
    sectionId: firstNonEmpty(personal.section?._id, studentData.sectionId),
    gender: firstNonEmpty(personal.gender, studentData.gender),
    dob: firstNonEmpty(personal.DOB, personal.dateOfBirth, studentData.dob),
    age: firstNonEmpty(personal.age, studentData.age),
    address: firstNonEmpty(
      personal.address,
      studentData.address,
      admissionContact.address,
      [
        derivedAddress.street,
        derivedAddress.city,
        derivedAddress.state,
        derivedAddress.zip,
      ]
        .filter(Boolean)
        .join(", ")
    ),
    
    contact: firstNonEmpty(
  contactDetails.mobileNumber,
  contactDetails.phone,
  studentData.contact,
  admissionContact.phone,
  parentContact.phone
),
    email: firstNonEmpty(
  contactDetails.email,
  studentData.email,
  admissionContact.email,
  parentContact.email
),
    photo: firstNonEmpty(
      imageSource?.url,
      typeof imageSource === "string" ? imageSource : "",
      studentData.photo
    ),
    fatherName: firstNonEmpty(
      parent.fatherName,
      admissionParents.father?.name,
      studentData.fatherName
    ),
    motherName: firstNonEmpty(
      parent.motherName,
      admissionParents.mother?.name,
      studentData.motherName
    ),
    attendance: firstNonEmpty(studentData.attendance, "85%"),
    fee: firstNonEmpty(personal.fees, studentData.fee, "Paid"),
    stdId: firstNonEmpty(personal.stdId, studentData.stdId),
    rollNo: firstNonEmpty(personal.rollNo, studentData.rollNo, "-"),
    bloodGroup: firstNonEmpty(personal.bloodGroup, studentData.bloodGroup),
    nationality: firstNonEmpty(personal.nationality, studentData.nationality),
    religion: firstNonEmpty(personal.religion, studentData.religion),
    altPhone: firstNonEmpty(
      contactDetails.alternatePhone,
      admissionContact.alternatePhone,
      studentData.altPhone
    ),
    street: firstNonEmpty(admissionContact.street, derivedAddress.street),
    city: firstNonEmpty(admissionContact.city, derivedAddress.city),
    state: firstNonEmpty(admissionContact.state, derivedAddress.state),
    zip: firstNonEmpty(admissionContact.zipCode, admissionContact.zip, derivedAddress.zip),
    previousSchool: firstNonEmpty(
      earlierAcademic.schoolName,
      studentData.previousSchool,
      studentData.previousSchoolName
    ),
    board: firstNonEmpty(
      earlierAcademic.board,
      studentData.board,
      studentData.previousSchoolBoard
    ),
    lastClass: firstNonEmpty(
      earlierAcademic.lastClass,
      studentData.lastClass,
      studentData.previousClass
    ),
    academicYear: firstNonEmpty(
      earlierAcademic.academicYear,
      studentData.academicYear,
      studentData.yearOfStudy
    ),
    admissionDate: firstNonEmpty(personal.admissionDate, studentData.admissionDate),
    status: firstNonEmpty(
      personal.status,
      studentData.status,
      studentData.applicationStatus,
      "Active"
    ),
    fatherOccupation: firstNonEmpty(
      admissionParents.father?.occupation,
      studentData.fatherOccupation
    ),
    fatherPhone: firstNonEmpty(
      admissionParents.father?.phone,
      parentContact.phone,
      studentData.fatherPhone
    ),
    fatherEmail: firstNonEmpty(
      admissionParents.father?.email,
      parentContact.email,
      studentData.fatherEmail
    ),
    motherOccupation: firstNonEmpty(
      admissionParents.mother?.occupation,
      studentData.motherOccupation
    ),
    motherPhone: firstNonEmpty(
      admissionParents.mother?.phone,
      studentData.motherPhone
    ),
    motherEmail: firstNonEmpty(
      admissionParents.mother?.email,
      studentData.motherEmail
    ),
    guardianName: firstNonEmpty(
      admissionParents.guardian?.name,
      studentData.guardianName
    ),
    guardianRelation: firstNonEmpty(
      admissionParents.guardian?.relation,
      studentData.guardianRelation
    ),
    guardianPhone: firstNonEmpty(
      admissionParents.guardian?.phone,
      studentData.guardianPhone
    ),
    guardianEmail: firstNonEmpty(
      admissionParents.guardian?.email,
      studentData.guardianEmail
    ),
    emergencyName: firstNonEmpty(emergencyContact.name, studentData.emergencyName),
    emergencyRelation: firstNonEmpty(emergencyContact.relation, studentData.emergencyRelation),
    emergencyPhone: firstNonEmpty(emergencyContact.phone, studentData.emergencyPhone),
    documents: Array.isArray(studentData.documents) ? studentData.documents : [],
  };
};

const mapAdmissionStudentToProfile = (admissionData = {}, fallbackId = "") => {
  const personal = admissionData.personalInfo || {};
  const contact = admissionData.contactInfo || {};
  const parents = admissionData.parents || {};
  const earlierAcademic = admissionData.earlierAcademic || {};
  const emergencyContact = admissionData.emergencyContact || {};
  const parsedAddress = parseAddressParts(contact.address || "");

  return {
    id: firstNonEmpty(admissionData._id, fallbackId),
    name: firstNonEmpty(personal.name, admissionData.name),
    grade: firstNonEmpty(personal.classApplied, personal.class, admissionData.grade),
    section: firstNonEmpty(personal.section, admissionData.section, "-"),
    gradeId: "",
    sectionId: "",
    gender: firstNonEmpty(personal.gender, admissionData.gender),
    dob: firstNonEmpty(personal.dateOfBirth, personal.DOB, admissionData.dob),
    age: firstNonEmpty(personal.age, admissionData.age),
    address: firstNonEmpty(
      contact.address,
      admissionData.address,
      [
        parsedAddress.street,
        parsedAddress.city,
        contact.state || parsedAddress.state,
        contact.zipCode || contact.zip || parsedAddress.zip,
      ]
        .filter(Boolean)
        .join(", ")
    ),
    contact: firstNonEmpty(contact.phone, admissionData.contact),
    email: firstNonEmpty(contact.email, admissionData.email),
    photo: firstNonEmpty(
      personal.image?.url,
      typeof personal.image === "string" ? personal.image : "",
      admissionData.photo
    ),
    fatherName: firstNonEmpty(parents.father?.name, admissionData.fatherName),
    motherName: firstNonEmpty(parents.mother?.name, admissionData.motherName),
    attendance: "-",
    fee: firstNonEmpty(personal.fees, admissionData.fee, "Paid"),
    stdId: firstNonEmpty(personal.stdId, admissionData.stdId, "N/A"),
    rollNo: firstNonEmpty(personal.rollNo, admissionData.rollNo, "-"),
    bloodGroup: firstNonEmpty(personal.bloodGroup, admissionData.bloodGroup),
    nationality: firstNonEmpty(personal.nationality, admissionData.nationality),
    religion: firstNonEmpty(personal.religion, admissionData.religion),
    altPhone: firstNonEmpty(contact.alternatePhone, admissionData.altPhone),
    street: firstNonEmpty(contact.street, parsedAddress.street),
    city: firstNonEmpty(contact.city, parsedAddress.city),
    state: firstNonEmpty(contact.state, parsedAddress.state),
    zip: firstNonEmpty(contact.zipCode, contact.zip, parsedAddress.zip),
    previousSchool: firstNonEmpty(
      earlierAcademic.schoolName,
      admissionData.previousSchoolName
    ),
    board: firstNonEmpty(earlierAcademic.board, admissionData.previousSchoolBoard),
    lastClass: firstNonEmpty(earlierAcademic.lastClass, admissionData.previousClass),
    academicYear: firstNonEmpty(earlierAcademic.academicYear, admissionData.yearOfStudy),
    admissionDate: firstNonEmpty(personal.admissionDate, admissionData.admissionDate),
    status: firstNonEmpty(
      personal.status,
      admissionData.status,
      admissionData.applicationStatus,
      "Pending Enrollment"
    ),
    fatherOccupation: firstNonEmpty(parents.father?.occupation, admissionData.fatherOccupation),
    fatherPhone: firstNonEmpty(parents.father?.phone, admissionData.fatherPhone),
    fatherEmail: firstNonEmpty(parents.father?.email, admissionData.fatherEmail),
    motherOccupation: firstNonEmpty(parents.mother?.occupation, admissionData.motherOccupation),
    motherPhone: firstNonEmpty(parents.mother?.phone, admissionData.motherPhone),
    motherEmail: firstNonEmpty(parents.mother?.email, admissionData.motherEmail),
    guardianName: firstNonEmpty(parents.guardian?.name, admissionData.guardianName),
    guardianRelation: firstNonEmpty(parents.guardian?.relation, admissionData.guardianRelation),
    guardianPhone: firstNonEmpty(parents.guardian?.phone, admissionData.guardianPhone),
    guardianEmail: firstNonEmpty(parents.guardian?.email, admissionData.guardianEmail),
    emergencyName: firstNonEmpty(
      emergencyContact.name,
      admissionData.emergencyContactName
    ),
    emergencyRelation: firstNonEmpty(
      emergencyContact.relation,
      admissionData.emergencyContactRelation
    ),
    emergencyPhone: firstNonEmpty(
      emergencyContact.phone,
      admissionData.emergencyContactPhone
    ),
    documents: Array.isArray(admissionData.documents) ? admissionData.documents : []
  };
};

const mapAnyStudentToProfile = (rawData = {}, fallbackId = "") => {
  const hasAdmissionShape =
    rawData?.source === "Admission" ||
    !!rawData?.contactInfo ||
    !!rawData?.parents ||
    !!rawData?.personalInfo?.classApplied;

  return hasAdmissionShape
    ? mapAdmissionStudentToProfile(rawData, fallbackId)
    : mapSisStudentToProfile(rawData);
};

const StudentProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const studentData = location.state || null;
  const resolvedStudentId = id || studentData?._id || studentData?.id;
  const initialSource =
    studentData?.source ||
    (studentData?.contactInfo || studentData?.parents || studentData?.personalInfo?.classApplied
      ? "Admission"
      : "SIS");
  const initialMappedStudent = studentData
    ? mapAnyStudentToProfile(studentData, resolvedStudentId)
    : null;
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [student, setStudent] = useState(initialMappedStudent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [profileSource, setProfileSource] = useState(initialSource);
  const [originalStudent, setOriginalStudent] = useState(initialMappedStudent);
  const [documents, setDocuments] = useState(() =>
    (initialMappedStudent?.documents || []).map(normalizeStudentDocumentForAvatar)
  );

  // Fetch student data from backend if ID is provided
  useEffect(() => {
    const fetchStudent = async () => {
      if (!resolvedStudentId) {
        console.log("No ID provided in URL params");
        return;
      }

      console.log("Fetching student with ID:", resolvedStudentId);
      setLoading(true);
      setError(null);

      try {
        const response = await authFetch(`/students/${resolvedStudentId}`);
        if (!response.ok) {
          const admissionResponse = await authFetch(
            `/admission/application/${resolvedStudentId}`
          );
          if (admissionResponse.ok) {
            const admissionPayload = await admissionResponse.json();
            if (admissionPayload?.success && admissionPayload?.data) {
              setProfileSource("Admission");
              const mappedStudent = mapAdmissionStudentToProfile(admissionPayload.data, resolvedStudentId);
              setStudent(mappedStudent);
              setOriginalStudent(mappedStudent);
              setDocuments((admissionPayload.data.documents || []).map(normalizeStudentDocumentForAvatar));
              return;
            }
          }
          throw new Error("Student not found");
        }

        const data = await response.json();
        if (data.success && data.student) {
          setProfileSource("SIS");
          const mappedStudent = mapSisStudentToProfile(data.student);
          setStudent(mappedStudent);
          setOriginalStudent(mappedStudent);
          setDocuments((data.student.documents || []).map(normalizeStudentDocumentForAvatar));
        }
      } catch (err) {
        console.error("Error fetching student:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [resolvedStudentId]);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!resolvedStudentId || profileSource === "Admission") return;

      try {
        const response = await authFetch(`/students/documents/${resolvedStudentId}`);
        if (response.ok) {
          const docs = await response.json();
          setDocuments((docs || []).map(normalizeStudentDocumentForAvatar));
        }
      } catch (err) {
        console.error("Error fetching documents:", err);
      }
    };

    fetchDocuments();
  }, [resolvedStudentId, profileSource]);

  // Fetch classes and sections
  useEffect(() => {
    const fetchClassesAndSections = async () => {
      try {
        // Fetch classes
        const classResponse = await authFetch(`/classes`);
        if (classResponse.ok) {
          const classData = await classResponse.json();
          console.log("Classes fetched:", classData.data);
          setClasses(classData.data || []);
        }

        // Fetch sections
        const sectionResponse = await authFetch(`/sections`);
        if (sectionResponse.ok) {
          const sectionData = await sectionResponse.json();
          console.log("Sections fetched:", sectionData.data);
          setSections(sectionData.data || []);
        }
      } catch (err) {
        console.error("Error fetching classes/sections:", err);
      }
    };

    fetchClassesAndSections();
  }, []);

  const profileHeaderImageSrc = useMemo(() => {
    if (!student) return "";
    return firstNonEmpty(student.photo, getLatestPassportPhotoUrlFromDocs(documents));
  }, [student, documents]);

  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Loading Student Profile...</h2>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Error: {error}</h2>
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

  if (!student) {
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
    setStudent((prev) => ({ ...prev, [field]: value }));
  };

  // Handle dropdown changes specifically for class and section
  const handleDropdownChange = (field, value) => {
    if (field === 'grade') {
      const selectedClass = classes.find(c => c._id === value);
      setStudent((prev) => ({
        ...prev,
        gradeId: value,
        grade: selectedClass ? selectedClass.name : ""
      }));
    } else if (field === 'section') {
      const selectedSection = sections.find(s => s._id === value);
      setStudent((prev) => ({
        ...prev,
        sectionId: value,
        section: selectedSection ? selectedSection.name : ""
      }));
    } else {
      setStudent((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    if (!student.id) return;

    setLoading(true);
    setError(null);

    try {
      // Find the selected class and section names
      const selectedClass = classes.find(c => c._id === student.gradeId);
      const selectedSection = sections.find(s => s._id === student.sectionId);

      const className = selectedClass ? selectedClass.name : student.grade;
      const sectionName = selectedSection ? selectedSection.name : student.section;

      // Map frontend data back to backend structure
  const updateData = {
  personalInfo: {
    name: student.name,
    stdId: student.stdId,
    class: className,
    section: sectionName,
    DOB: student.dob,
    gender: student.gender,
    age: student.age,
    address: student.address,
    fees: student.fee,
    rollNo: student.rollNo,
    bloodGroup: student.bloodGroup,
    nationality: student.nationality,
    religion: student.religion,

    contactDetails: {
      mobileNumber: student.contact,
      email: student.email,
      alternatePhone: student.altPhone,
    },
  },

  parent: {
    fatherName: student.fatherName,
    motherName: student.motherName,

    fatherOccupation: student.fatherOccupation,
    fatherPhone: student.fatherPhone,
    fatherEmail: student.fatherEmail,

    motherOccupation: student.motherOccupation,
    motherPhone: student.motherPhone,
    motherEmail: student.motherEmail,

    guardianName: student.guardianName,
    guardianRelation: student.guardianRelation,
    guardianPhone: student.guardianPhone,
    guardianEmail: student.guardianEmail,

    contactDetails: {
      phone: student.contact,
      email: student.email,
    },
  },

  emergencyContact: {
    name: student.emergencyName,
    relation: student.emergencyRelation,
    phone: student.emergencyPhone,
  },

  earlierAcademic: {
    schoolName: student.previousSchool,
    board: student.board,
    lastClass: student.lastClass,
    academicYear: student.academicYear,
  },

  contactInfo: {
    street: student.street,
    city: student.city,
    state: student.state,
    zipCode: student.zip,
  },
};

      console.log("Selected class object:", selectedClass);
      console.log("Selected section object:", selectedSection);
      console.log("Sending class name:", className);
      console.log("Sending section name:", sectionName);
      console.log("Complete update data:", updateData);
      console.log("Student ID:", resolvedStudentId);

      const endpoint =
        profileSource === "Admission"
          ? `/admission/application/${resolvedStudentId}`
          : `/students/${resolvedStudentId}`;

      const requestBody =
        profileSource === "Admission"
          ? {
            personalInfo: {
              name: student.name,
              stdId: student.stdId,
              classApplied: student.grade,
              section: student.section,
              rollNo: student.rollNo,
              dateOfBirth: student.dob,
              age: student.age,
              gender: student.gender,
              bloodGroup: student.bloodGroup,
              fees: student.fee,
            },
            contactInfo: {
              phone: student.contact,
              email: student.email,
              address: student.address,
            },
            parents: {
              father: {
                name: student.fatherName,
              },
              mother: {
                name: student.motherName,
              },
            },
          }
          : updateData;

      const response = await authFetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend error:", errorData);
        throw new Error(errorData.message || 'Failed to update student');
      }

      const data = await response.json();
      if (data.success) {
        const updatedMappedStudent =
          profileSource === "Admission"
            ? (data.data
              ? mapAdmissionStudentToProfile(data.data, resolvedStudentId)
              : student)
            : (data.student
              ? mapSisStudentToProfile(data.student)
              : { ...student, grade: className, section: sectionName });
        setStudent(updatedMappedStudent);
        setOriginalStudent(updatedMappedStudent);
        setIsEditing(false);
        // Optionally show success message
        console.log('Student updated successfully');
      }
    } catch (err) {
      console.error("Error updating student:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshDocuments = async () => {
    if (profileSource === "Admission") return;
    const response = await authFetch(`/students/documents/${resolvedStudentId}`);
    if (response.ok) {
      const docs = await response.json();
      setDocuments((docs || []).map(normalizeStudentDocumentForAvatar));
    }
  };

  const handleUploadDocument = async (event) => {
    if (profileSource === "Admission") return;
    const file = event.target.files?.[0];
    if (!file || !resolvedStudentId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("studentId", resolvedStudentId);

    try {
      const res = await authFetch("/students/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Upload failed");
      }
      await refreshDocuments();
    } catch (err) {
      console.error("Upload failed:", err);
      alert(err.message || "Failed to upload document");
    } finally {
      event.target.value = "";
    }
  };

  const openDocument = async (doc, mode = "preview") => {
    try {
      const filename = doc?.path?.split("/").pop();
      if (!filename) return;

      const response = await authFetch(`/students/${mode}/${filename}`);
      if (!response.ok) throw new Error("Unable to open document");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      if (mode === "preview") {
        window.open(blobUrl, "_blank", "noopener,noreferrer");
      } else {
        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = doc.name || filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
    } catch (error) {
      console.error(`${mode} failed:`, error);
      alert(error.message || `${mode} failed`);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (profileSource === "Admission") return;
    if (!resolvedStudentId || !documentId) return;
    if (!window.confirm("Delete this document?")) return;

    try {
      const response = await authFetch(`/students/documents/${resolvedStudentId}/${documentId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Delete failed");
      }
      await refreshDocuments();
    } catch (error) {
      console.error("Delete failed:", error);
      alert(error.message || "Failed to delete document");
    }
  };

 const OverviewTab = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div className="lg:col-span-2 space-y-4">
      <ProfileCard label="Personal Information" icon={<FiInfo />}>
        <InfoDetail
          label="Full Name"
          value={student.name}
          isEditing={isEditing}
          onChange={(e) => handleChange("name", e.target.value)}
        />

        <InfoDetail
          label="Date of Birth"
          value={student.dob}
          isEditing={isEditing}
          onChange={(e) => handleChange("dob", e.target.value)}
        />

        <InfoDetail
          label="Gender"
          value={student.gender}
          isEditing={isEditing}
          onChange={(e) => handleChange("gender", e.target.value)}
        />

        <InfoDetail
          label="Blood Group"
          value={student.bloodGroup}
          isEditing={isEditing}
          onChange={(e) => handleChange("bloodGroup", e.target.value)}
        />

        <InfoDetail
          label="Nationality"
          value={student.nationality}
          isEditing={isEditing}
          onChange={(e) => handleChange("nationality", e.target.value)}
        />

        <InfoDetail
          label="Religion"
          value={student.religion}
          isEditing={isEditing}
          onChange={(e) => handleChange("religion", e.target.value)}
        />

        <InfoDetail
          label="Student ID"
          value={student.stdId}
          isEditing={false}
        />

        <InfoDetail
          label="Roll No"
          value={student.rollNo}
          isEditing={isEditing}
          onChange={(e) => handleChange("rollNo", e.target.value)}
        />

        <InfoDetail
          label="Class"
          value={
            isEditing
              ? (student.gradeId ||
                  classes.find((cls) => cls.name === student.grade)?._id ||
                  "")
              : student.grade
          }
          isEditing={isEditing}
          onChange={(e) => handleDropdownChange("grade", e.target.value)}
          options={classes}
          isDropdown={true}
        />

        <InfoDetail
          label="Section"
          value={
            isEditing
              ? (student.sectionId ||
                  sections.find((sec) => sec.name === student.section)?._id ||
                  "")
              : student.section
          }
          isEditing={isEditing}
          onChange={(e) => handleDropdownChange("section", e.target.value)}
          options={sections}
          isDropdown={true}
        />
      </ProfileCard>

      <ProfileCard label="Contact Information" icon={<FiInfo />}>
        <InfoDetail
          label="Email"
          value={student.email}
          isEditing={isEditing}
          onChange={(e) => handleChange("email", e.target.value)}
        />

        <InfoDetail
          label="Phone"
          value={student.contact}
          isEditing={isEditing}
          onChange={(e) => handleChange("contact", e.target.value)}
        />

        <InfoDetail
          label="Alternate Phone"
          value={student.altPhone}
          isEditing={isEditing}
          onChange={(e) => handleChange("altPhone", e.target.value)}
        />

        <InfoDetail
          label="Street"
          value={student.street}
          isEditing={isEditing}
          onChange={(e) => handleChange("street", e.target.value)}
        />

        <InfoDetail
          label="City"
          value={student.city}
          isEditing={isEditing}
          onChange={(e) => handleChange("city", e.target.value)}
        />

        <InfoDetail
          label="State"
          value={student.state}
          isEditing={isEditing}
          onChange={(e) => handleChange("state", e.target.value)}
        />

        <InfoDetail
          label="Zip Code"
          value={student.zip}
          isEditing={isEditing}
          onChange={(e) => handleChange("zip", e.target.value)}
        />

        <InfoDetail
          label="Address"
          value={student.address}
          isEditing={isEditing}
          onChange={(e) => handleChange("address", e.target.value)}
        />
      </ProfileCard>

      <ProfileCard label="Earlier Academic Information" icon={<FiInfo />}>
        <InfoDetail
          label="Previous School"
          value={student.previousSchool}
          isEditing={isEditing}
          onChange={(e) =>
            handleChange("previousSchool", e.target.value)
          }
        />

        <InfoDetail
          label="Board / University"
          value={student.board}
          isEditing={isEditing}
          onChange={(e) => handleChange("board", e.target.value)}
        />

        <InfoDetail
          label="Class Last Studied"
          value={student.lastClass}
          isEditing={isEditing}
          onChange={(e) => handleChange("lastClass", e.target.value)}
        />

        <InfoDetail
          label="Academic Year"
          value={student.academicYear}
          isEditing={isEditing}
          onChange={(e) =>
            handleChange("academicYear", e.target.value)
          }
        />
      </ProfileCard>
    </div>

    <div className="space-y-4">
      <ProfileCard
        label="Parent / Guardian Information"
        icon={<FiInfo />}
      >
        <InfoDetail
          label="Father Name"
          value={student.fatherName}
          isEditing={isEditing}
          onChange={(e) =>
            handleChange("fatherName", e.target.value)
          }
        />

        <InfoDetail
          label="Father Occupation"
          value={student.fatherOccupation}
          isEditing={isEditing}
          onChange={(e) =>
            handleChange("fatherOccupation", e.target.value)
          }
        />

        <InfoDetail
          label="Father Phone"
          value={student.fatherPhone}
          isEditing={isEditing}
          onChange={(e) =>
            handleChange("fatherPhone", e.target.value)
          }
        />

        <InfoDetail
          label="Father Email"
          value={student.fatherEmail}
          isEditing={isEditing}
          onChange={(e) =>
            handleChange("fatherEmail", e.target.value)
          }
        />

        <InfoDetail
          label="Mother Name"
          value={student.motherName}
          isEditing={isEditing}
          onChange={(e) =>
            handleChange("motherName", e.target.value)
          }
        />

        <InfoDetail
          label="Mother Occupation"
          value={student.motherOccupation}
          isEditing={isEditing}
          onChange={(e) =>
            handleChange("motherOccupation", e.target.value)
          }
        />

        <InfoDetail
          label="Mother Phone"
          value={student.motherPhone}
          isEditing={isEditing}
          onChange={(e) =>
            handleChange("motherPhone", e.target.value)
          }
        />

        <InfoDetail
          label="Mother Email"
          value={student.motherEmail}
          isEditing={isEditing}
          onChange={(e) =>
            handleChange("motherEmail", e.target.value)
          }
        />

        <InfoDetail
          label="Guardian Name"
          value={student.guardianName}
          isEditing={isEditing}
          onChange={(e) =>
            handleChange("guardianName", e.target.value)
          }
        />

        <InfoDetail
          label="Relation"
          value={student.guardianRelation}
          isEditing={isEditing}
          onChange={(e) =>
            handleChange("guardianRelation", e.target.value)
          }
        />

        <InfoDetail
          label="Guardian Phone"
          value={student.guardianPhone}
          isEditing={isEditing}
          onChange={(e) =>
            handleChange("guardianPhone", e.target.value)
          }
        />

        <InfoDetail
          label="Guardian Email"
          value={student.guardianEmail}
          isEditing={isEditing}
          onChange={(e) =>
            handleChange("guardianEmail", e.target.value)
          }
        />
      </ProfileCard>

      <ProfileCard label="Emergency Contact" icon={<FiInfo />}>
        <InfoDetail
          label="Contact Name"
          value={student.emergencyName}
          isEditing={isEditing}
          onChange={(e) =>
            handleChange("emergencyName", e.target.value)
          }
        />

        <InfoDetail
          label="Relation"
          value={student.emergencyRelation}
          isEditing={isEditing}
          onChange={(e) =>
            handleChange("emergencyRelation", e.target.value)
          }
        />

        <InfoDetail
          label="Phone"
          value={student.emergencyPhone}
          isEditing={isEditing}
          onChange={(e) =>
            handleChange("emergencyPhone", e.target.value)
          }
        />
      </ProfileCard>
    </div>
  </div>
);

  const AttendanceTab = () => (
    <ProfileCard label="Attendance" icon={<FiCalendar />}>
      <InfoDetail label="Attendance %" value={student.attendance} isEditing={isEditing} onChange={(e) => handleChange("attendance", e.target.value)} />
      <InfoDetail label="Last Present" value="2024-08-05" isEditing={false} />
    </ProfileCard>
  );

  const FeeTab = () => (
    <ProfileCard label="Fee Details" icon={<FiDollarSign />}>
      <InfoDetail label="Total Fee" value="₹50,000" isEditing={false} />
      <InfoDetail
        label="Paid"
        value={student.fee === "Paid" ? "₹50,000" : "₹25,000"}
        isEditing={false}
      />
      <InfoDetail label="Due" value={student.fee === "Paid" ? "₹0" : "₹25,000"} isEditing={false} />
      <InfoDetail label="Status" value={student.fee} isEditing={isEditing} onChange={(e) => handleChange("fee", e.target.value)} />
    </ProfileCard>
  );

  return (
    <div className="min-h-screen p-0 m-0">
      <div className="mb-4">
        <div className="mb-4">
          <button onClick={() => navigate(-1)} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
            <FiArrowLeft className="w-5 h-5 mr-2" /> Back to Student Directory
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4 flex flex-col items-center text-center gap-4 sm:flex-row sm:items-center sm:text-left sm:gap-6">
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
                    setOriginalStudent(student);
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
                    className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
                  >
                    <FiSave className="w-5 h-5 mr-2" /> Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStudent(originalStudent);
                      setIsEditing(false);
                    }}
                    className="inline-flex items-center bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600"
                  >
                    <FiX className="w-5 h-5 mr-2" /> Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <div className="bg-white rounded-xl shadow-md p-2 inline-flex space-x-2">
            <TabButton label="Overview" isActive={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<FiInfo />} />
            <TabButton label="Performance" isActive={activeTab === "performance"} onClick={() => setActiveTab("performance")} icon={<FiBarChart />} />
            <TabButton label="Attendance" isActive={activeTab === "attendance"} onClick={() => setActiveTab("attendance")} icon={<FiCalendar />} />
            <TabButton label="Fee" isActive={activeTab === "fee"} onClick={() => setActiveTab("fee")} icon={<FiDollarSign />} />
            <TabButton label="Documents" isActive={activeTab === "documents"} onClick={() => setActiveTab("documents")} icon={<FiFileText />} />
          </div>
        </div>

        {/* Tab Contents */}
        <div>
          {activeTab === "overview" && OverviewTab()}
          {activeTab === "performance" && (
            <ProfileCard label="Performance" icon={<FiBarChart />}>
              {/* <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={mockPerformance} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="term" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#4f46e5" name="Score" barSize={40} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div> */}
            </ProfileCard>
          )}
          {activeTab === "attendance" && AttendanceTab()}
          {activeTab === "fee" && FeeTab()}
          {activeTab === "documents" && (
            <ProfileCard label="Documents" icon={<FiFileText />}>
              {/* Upload Button */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Documents
                </h3>
                {profileSource !== "Admission" && (
                  <label className="bg-indigo-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-indigo-700">
                    Upload Document
                    <input
                      type="file"
                      accept={documentAccept}
                      className="hidden"
                      onChange={handleUploadDocument}
                    />
                  </label>
                )}
              </div>

              {/* Documents List */}
              <ul className="divide-y divide-gray-200">
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <li key={doc._id || doc.path} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{doc.name}</p>
                        <p className="text-gray-500">
                          {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "N/A"} - {((doc.size || 0) / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openDocument(doc, "preview")}
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => openDocument(doc, "download")}
                          className="text-indigo-600 hover:underline font-semibold"
                        >
                          Download
                        </button>
                        {profileSource !== "Admission" && (
                          <button
                            onClick={() => handleDeleteDocument(doc._id)}
                            className="text-red-600 hover:underline font-semibold"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="py-3 text-gray-500">No documents uploaded yet.</li>
                )}
              </ul>
            </ProfileCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;