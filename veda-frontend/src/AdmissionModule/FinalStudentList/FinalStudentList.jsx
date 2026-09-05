import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../../config";


import { FiPlus, FiUpload, FiSearch, FiTrash2, FiEdit, FiUser, FiDownload, FiChevronDown } from "react-icons/fi";
import HelpInfo from "../../components/HelpInfo";


import { isToastErrorMessage, toastBannerClassName } from "../../utils/toastMessageStyle";
function generateUsernameFromNameDob(name, dob) {
  const firstName = String(name || "").trim().split(/\s+/)[0] || "";
  const firstPart = firstName.toLowerCase().replace(/[^a-z]/g, "").slice(0, 4).padEnd(4, "x");
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return firstPart;

  
  const dd = String(parsed.getDate()).padStart(2, "0");
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const yy = String(parsed.getFullYear()).slice(-2);
  return `${firstPart}${dd}${mm}${yy}`;
}

/** Label for who holds the shared Parent ID (matches admission form / backend parentAccountUtils). */
function getParentAccountHolderLabel(parents = {}) {
  const raw = String(parents.parentIdAccountHolder || "").toLowerCase().trim();
  const allowed = ["father", "mother", "guardian"];
  let h = allowed.includes(raw) ? raw : "";
  if (!h) {
    if (String(parents.father?.name || "").trim()) h = "father";
    else if (String(parents.mother?.name || "").trim()) h = "mother";
    else if (String(parents.guardian?.name || "").trim()) h = "guardian";
    else h = "father";
  }
  if (h === "father") return "Father";
  if (h === "mother") return "Mother";
  const rel = String(parents.guardian?.relation || "").trim();
  return rel || "Guardian";
}

/** Maps admission `admissionFee` + fee status into drawer Fee Summary fields. */
function buildAdmissionFeeSummary(s) {
  const af = s.admissionFee || {};
  const rawAmount = af.amount;
  const hasAmount =
    rawAmount !== null &&
    rawAmount !== undefined &&
    rawAmount !== "" &&
    !Number.isNaN(Number(rawAmount));
  const amountNum = hasAmount ? Number(rawAmount) : null;

  const isPaid =
    String(s.personalInfo?.fees || "").toLowerCase() === "paid" ||
    String(af.status || "").toLowerCase() === "paid";

  const formatInr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

  let totalFee = "N/A";
  let paidFee = "N/A";
  let dueFee = "N/A";
  let lastPaymentDate = "N/A";

  if (hasAmount) {
    totalFee = formatInr(amountNum);
    if (isPaid) {
      paidFee = formatInr(amountNum);
      dueFee = formatInr(0);
    } else {
      paidFee = formatInr(0);
      dueFee = formatInr(amountNum);
    }
  } else if (isPaid) {
    paidFee = "Paid";
    dueFee = formatInr(0);
  }

  const pd = af.paymentDate;
  if (pd != null && String(pd).trim() !== "") {
    lastPaymentDate = String(pd).trim();
  }

  return { totalFee, paidFee, dueFee, lastPaymentDate };
}

function normalizeStudentRow(s, idx = 0) {
  const section = s.personalInfo?.section || s.academicInfo?.section || "-";
  const studentClass = s.personalInfo?.classApplied || s.personalInfo?.class || "-";
  const dob = s.personalInfo?.dateOfBirth || s.personalInfo?.DOB || "";
  const generatedUsername = generateUsernameFromNameDob(s.personalInfo?.name, dob);
  const fullAddress =
    s.contactInfo?.address ||
    [s.contactInfo?.city, s.contactInfo?.state, s.contactInfo?.zip]
      .filter(Boolean)
      .join(", ");

  const feeSummary = buildAdmissionFeeSummary(s);

  return {
    id: s._id || idx + 1,
    _id: s._id,
    applicationId: s.applicationId || "-",
    personalInfo: {
      name: s.personalInfo?.name || "Unnamed",
      class: studentClass,
      stdId: s.personalInfo?.stdId || "N/A",
      username: s.personalInfo?.username || generatedUsername || "",
      rollNo: s.personalInfo?.rollNo || "-",
      section,
      password: s.personalInfo?.password || "default123",
      fees: s.personalInfo?.fees || "Due",
      dateOfBirth: dob,
      gender: s.personalInfo?.gender || "",
      bloodGroup: s.personalInfo?.bloodGroup || "",
      nationality: s.personalInfo?.nationality || "",
      religion: s.personalInfo?.religion || "",
    },
    contactInfo: {
      email: s.contactInfo?.email || "",
      phone: s.contactInfo?.phone || "",
      alternatePhone: s.contactInfo?.alternatePhone || "",
      address: fullAddress || "",
    },
    earlierAcademic: s.earlierAcademic || {},
    parents: s.parents || {},
    emergencyContact: s.emergencyContact || {},
    documents: s.documents || [],
    transportRequired: s.transportRequired || "",
    medicalConditions: s.medicalConditions || "",
    specialNeeds: s.specialNeeds || "",
    photo: s.photo || "https://via.placeholder.com/80",
    address: fullAddress || "",
    attendance: s.attendance || "-",
    totalFee: feeSummary.totalFee,
    paidFee: feeSummary.paidFee,
    dueFee: feeSummary.dueFee,
    lastPaymentDate: feeSummary.lastPaymentDate,
  };
}

export default function FinalStudentList() {
  const [activeTab, setActiveTab] = useState("all");
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
 
 

  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loginPage, setLoginPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState(null);
  /** Manage Login: per-row password visibility (Show/Hide); never used for updates */
  const [visibleLoginPasswords, setVisibleLoginPasswords] = useState({});
  const [availableSections, setAvailableSections] = useState([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);


  const dropdownRef = useRef(null);
 
  const classDropdownRef = useRef(null);
  const sectionDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const studentsPerPage = 10;
  const navigate = useNavigate();

  const loadStudents = useCallback(async () => {
    try {
      const res = await axios.get(
        `${config.API_BASE_URL}/admission/application/selected`
      );

      if (!res.data?.success) {
        setStudents([]);
        setClasses([]);
        setSections([]);
        return;
      }

      const paidApplications = (res.data.data || []).filter(
        (app) => String(app?.personalInfo?.fees || "").toLowerCase() === "paid"
      );

      const mapped = paidApplications.map((app, idx) => normalizeStudentRow(app, idx));

      setStudents(mapped);

      const classOptions = [
        ...new Set(
          mapped
            .map((student) => student.personalInfo?.class)
            .filter((value) => value && value !== "-")
        ),
      ].map((name, idx) => ({ _id: `cls-${idx + 1}`, name }));
      setClasses(classOptions);

      const sectionMap = new Map();
      mapped.forEach((student) => {
        const name = student.personalInfo?.section;
        const studentClass = student.personalInfo?.class;
        if (!name || name === "-" || !studentClass || studentClass === "-") return;
        const key = `${studentClass}__${name}`;
        if (!sectionMap.has(key)) {
          sectionMap.set(key, { _id: `sec-${sectionMap.size + 1}`, name, class: studentClass });
        }
      });
      const sectionOptions = Array.from(sectionMap.values());
      setSections(sectionOptions);
    } catch (error) {
      console.error("Failed to fetch final student list:", error);
      setStudents([]);
      setClasses([]);
      setSections([]);
    }
  }, []);

  
useEffect(() => {
  loadStudents();
}, [loadStudents]);

  useEffect(() => {
    if (activeTab !== "login") {
      setVisibleLoginPasswords({});
    }
  }, [activeTab]);

 

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowOptions(false);
      }
      
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target)) {
        setShowClassDropdown(false);
      }
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(e.target)) {
        setShowSectionDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



 useEffect(() => {
  if (!filterClass) {
    setAvailableSections([]);
    setFilterSection("");
    return;
  }

  setAvailableSections(
    sections.filter((s) => s.class === filterClass)
  );
}, [filterClass, sections]);
    


 

 const handleUpdatePassword = (id, newPassword) => {
  setStudents((prev) =>
    prev.map((s) =>
      s._id === id
        ? {
            ...s,
            personalInfo: {
              ...s.personalInfo,
              password: newPassword,
            },
          }
        : s
    )
  );

  setSuccessMsg("Password updated successfully ");
  setTimeout(() => setSuccessMsg(""), 3000);
};

const handleDelete = (id) => {
  setStudents((prev) => prev.filter((s) => s._id !== id));
  setSuccessMsg("Student deleted ");
  setTimeout(() => setSuccessMsg(""), 3000);
};

  const filteredStudents = students.filter(
    (s) =>
      ((s.personalInfo?.name?.toLowerCase() || "").includes(
        search.toLowerCase()
      ) ||
        (s.personalInfo?.stdId?.toLowerCase() || "").includes(
          search.toLowerCase()
        ) ||
        (s.personalInfo?.class?.toLowerCase() || "").includes(
          search.toLowerCase()
        )) &&
      (filterClass ? s.personalInfo?.class === filterClass : true) &&
      (filterSection ? s.personalInfo?.section === filterSection : true)
  );

  const indexOfLast = currentPage * studentsPerPage;
  const indexOfFirst = indexOfLast - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage) || 1;

  const toDisplay = (value) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? trimmed : "N/A";
    }
    return String(value);
  };

  const getAgeFromDob = (dob) => {
    if (!dob) return "N/A";

    const parsed = new Date(dob);
    if (Number.isNaN(parsed.getTime())) return "N/A";

    const today = new Date();
    let age = today.getFullYear() - parsed.getFullYear();
    const monthDiff = today.getMonth() - parsed.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
      age -= 1;
    }

    return age >= 0 ? String(age) : "N/A";
  };

  const getFieldValue = (fieldLabel) => {
    if (!selectedStudent) return "N/A";

    const personal = selectedStudent.personalInfo || {};
    const academic = selectedStudent.earlierAcademic || {};
    const parents = selectedStudent.parents || {};
    const emergency = selectedStudent.emergencyContact || {};

    const fieldMap = {
      Gender: personal.gender,
      "Blood Group": personal.bloodGroup,
      "Date of Birth": personal.dateOfBirth,
      Age: getAgeFromDob(personal.dateOfBirth),
      "Academic Year": academic.academicYear,
      "Parent ID": parents.parentId || selectedStudent.parent?.parentId,
      "Parent account holder": getParentAccountHolderLabel(parents),
      Father: parents.father?.name,
      Mother: parents.mother?.name,
      "Emergency Contact": emergency.name,
      Contact:
        emergency.phone ||
        parents.father?.phone ||
        parents.mother?.phone ||
        selectedStudent.contactInfo?.phone,
      "Present Days": selectedStudent.presentDays,
      "Last Present": selectedStudent.lastPresentDate,
      "Total Fee": selectedStudent.totalFee,
      Paid: selectedStudent.paidFee,
      Due: selectedStudent.dueFee,
      "Last Payment": selectedStudent.lastPaymentDate,
    };

    return toDisplay(fieldMap[fieldLabel]);
  };

  const getRemainingFields = () => {
    if (!selectedStudent) return [];

    return [
      {
        label: "Email",
        value: toDisplay(selectedStudent.contactInfo?.email),
      },
      {
        label: "Phone",
        value: toDisplay(selectedStudent.contactInfo?.phone),
      },
      {
        label: "Alternate Phone",
        value: toDisplay(selectedStudent.contactInfo?.alternatePhone),
      },
      {
        label: "Nationality",
        value: toDisplay(selectedStudent.personalInfo?.nationality),
      },
      {
        label: "Religion",
        value: toDisplay(selectedStudent.personalInfo?.religion),
      },
      {
        label: "Transport Required",
        value: toDisplay(selectedStudent.transportRequired),
      },
      {
        label: "Medical Conditions",
        value: toDisplay(selectedStudent.medicalConditions),
      },
      {
        label: "Special Needs",
        value: toDisplay(selectedStudent.specialNeeds),
      },
    ];
  };

  return (
    <div className="p-0 m-0 min-h-screen mb-14">



      {successMsg && (
        <div
          role="status"
          className={`mb-4 px-3 py-2 rounded-md border text-sm font-semibold ${toastBannerClassName(successMsg)}`}
        >
          {successMsg}
        </div>
      )}

      <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <button
          onClick={() => {
            setActiveTab("all");
            setLoginPage(1);
          }}
          className="hover:underline"
        >
          Admission 
        </button>
        <span>&gt;</span>
        <span>
          {activeTab === "all" && "All Student"}
          {activeTab === "login" && "Manage Login"}
          {activeTab === "others" && "Others"}
        </span>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h2 className="text-2xl font-bold">Students</h2>

        <HelpInfo
          title="Students Page Help"
          description={`2.1 All Students Tab

View and manage complete list of all enrolled students.
Display student information including name, student ID, class, section, roll number, photo, and status.
Search and filter students by class, section, or name.
Access quick actions like view profile, edit details, or delete student records.
Import students from Excel files or add new students manually.
Export student data for reporting purposes.

Sections:
- Search and Filter Bar: Search students by name, ID, or class. Filter by class, section, or status.
- Student Table: Comprehensive table showing student details with sorting and pagination.
- Action Buttons: Add new student, import from Excel, export data.
- Student Cards/List: Visual representation of students with photos and key information.


2.2 Manage Login Tab

Manage student login credentials and account access.
View login information including usernames, passwords, and account status.
Reset passwords, activate or deactivate accounts, and manage login permissions.
Search and filter students by login status (active/inactive).
Generate login credentials for new students or bulk reset passwords.

Sections:
- Login Credentials Table: Displays student ID, name, username, password status, and account status.
- Search and Filter: Find students by name, ID, or login status.
- Password Management: Reset individual or bulk passwords.
- Account Status Management: Activate, deactivate, or suspend accounts.
- Security Settings: Configure password policies and access controls.


2.3 Others Tab

Additional student management tools and utilities.
Access reports, generate ID cards, manage categories, and perform bulk operations.
View student statistics and export/import data.

Sections:
- Reports & Analytics: Generate reports, attendance summaries, and performance analytics.
- Bulk Operations: Perform bulk updates, transfers, or status changes.
- ID Card Generation: Create and print student ID cards.
- Student Categories: Manage groups and classifications.
- Export & Import Tools: Advanced export options and import templates.
`}
          steps={[
            "Use Search to find students",
            "Filter by class using dropdown",
            "Click Add Student to register new student",
            "Use action buttons for profile, attendance and fees",
          ]}
        />
      </div>

      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        <button
          onClick={() => {
            setActiveTab("all");
            setLoginPage(1);
          }}
          className={`pb-2 ${activeTab === "all"
            ? "text-blue-600 font-semibold border-b-2 border-blue-600"
            : "text-gray-500"
            }`}
        >
          All Student
        </button>

        <button
          onClick={() => {
            setActiveTab("login");
            setLoginPage(1);
          }}
          className={`pb-2 ${activeTab === "login"
            ? "text-blue-600 font-semibold border-b-2 border-blue-600"
            : "text-gray-500"
            }`}
        >
          Manage Login
        </button>

        <button
          onClick={() => {
            setActiveTab("others");
            setLoginPage(1);
          }}
          className={`pb-2 ${activeTab === "others"
            ? "text-blue-600 font-semibold border-b-2 border-blue-600"
            : "text-gray-500"
            }`}
        >
          Others
        </button>
      </div>

      {activeTab === "all" && (
        <div className="bg-white p-3 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Student List</h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 w-full">
            <div className="flex items-center border px-3 py-2 rounded-md bg-white w-full sm:w-1/3 min-w-[220px]">
              <FiSearch className="text-gray-500 mr-2 text-sm" />
              <input
                type="text"
                placeholder="Search student name or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full outline-none text-sm"
              />
            </div>

            <div className="relative group w-full sm:w-auto" ref={classDropdownRef}>
              <button
                onClick={() => setShowClassDropdown(!showClassDropdown)}
                className="border px-3 py-2 rounded-md bg-white flex items-center gap-2 w-full sm:w-[120px] justify-between hover:border-blue-500"
              >
                <span>{filterClass || "Class"}</span>
                <FiChevronDown className="text-xs" />
              </button>

              {showClassDropdown && (
                <div
                  className="absolute left-0 mt-2 w-32 bg-white border rounded-md shadow-lg z-10 text-sm max-h-60 overflow-y-auto"
                >
                  <button
                    onClick={() => {
                      setFilterClass("");
                      setFilterSection("");
                      setShowClassDropdown(false);
                      setShowSectionDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    All Classes
                  </button>
                  {classes.map((cls) => (
                    <button
                      key={cls._id}
                      onClick={() => {
                        setFilterClass(cls.name);
                        setFilterSection("");
                        setShowClassDropdown(false);
                        setShowSectionDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      {cls.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

         
           

            
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">S. no.</th>
                <th className="p-2 border">Student ID</th>
                <th className="p-2 border">Student Name</th>
                <th className="p-2 border">Class</th>
                <th className="p-2 border">Parent account holder</th>
                <th className="p-2 border">Fees</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentStudents.map((s, idx) => (
                <tr
                  key={s.id}
                  className="text-center hover:bg-gray-50"
                >
                  <td className="p-2 border">
                    {indexOfFirst + idx + 1}
                  </td>
                  <td className="p-2 border">
                    {s.personalInfo.stdId}
                  </td>
                  <td className="p-2 border text-left">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-orange-500 text-white flex items-center justify-center rounded-full">
                        {s.personalInfo.name[0]}
                      </span>
                      <span>{s.personalInfo.name}</span>
                    </div>
                  </td>
                  <td className="p-2 border">
                    {s.personalInfo.class}
                  </td>
                  <td className="p-2 border text-sm">
                    {getParentAccountHolderLabel(s.parents)}
                  </td>
                  <td className="p-2 border">
                    {String(s.personalInfo?.fees || "").toLowerCase() === "paid" ? (
                      <span className="text-green-600 font-semibold text-xs inline-flex items-center gap-1">
                        ● Paid
                      </span>
                    ) : (
                      <span className="text-red-600 font-semibold text-xs inline-flex items-center gap-1">
                        ● Due
                      </span>
                    )}
                  </td>
                  <td className="p-2 border">
                    <button
                      className="text-blue-500"
                      onClick={() => setSelectedStudent(s)}
                      title="View"
                    >
                      <FiSearch />
                    </button>
                    <button
                      className="text-red-500 ml-2"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this student?"
                          )
                        ) {
                          handleDelete(s._id);
                        }
                      }}
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {currentStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-4 text-center text-gray-500 text-sm"
                  >
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-500 mt-3">
            <p>
              Page {currentPage} of {totalPages}
            </p>
            <div className="space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "login" && (() => {
        const filteredLoginStudents = students.filter(
          (s) =>
          ((s.personalInfo?.name?.toLowerCase() || "").includes(
            search.toLowerCase()
          ) ||
            (s.personalInfo?.stdId?.toLowerCase() || "").includes(
              search.toLowerCase()
            ) ||
            (s.personalInfo?.class?.toLowerCase() || "").includes(
              search.toLowerCase()
            ))
        );

        const loginIndexOfLast = loginPage * studentsPerPage;
        const loginIndexOfFirst = loginIndexOfLast - studentsPerPage;
        const currentLoginStudents = filteredLoginStudents.slice(loginIndexOfFirst, loginIndexOfLast);
        const loginTotalPages = Math.ceil(filteredLoginStudents.length / studentsPerPage) || 1;

        return (
          <div className="bg-white p-3 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Login Credentials</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 w-full">
              <div className="flex items-center border px-3 py-2 rounded-md bg-white w-full sm:w-1/3 min-w-[220px]">
                <FiSearch className="text-gray-500 mr-2 text-sm" />
                <input
                  type="text"
                  placeholder="Search student name or ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full outline-none "
                />
              </div>

              <div className="relative group w-full sm:w-auto" ref={statusDropdownRef}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="border px-3 py-2 rounded-md bg-white flex items-center gap-2 w-full sm:w-[120px] justify-between hover:border-blue-500"
                >
                  <span>{filterStatus || "Status"}</span>
                  <FiChevronDown className="text-xs" />
                </button>

                {showStatusDropdown && (
                  <div
                    className="absolute left-0 mt-2 w-32 bg-white border rounded-md shadow-lg z-10 text-sm max-h-60 overflow-y-auto"
                  >
                    <button
                      onClick={() => {
                        setFilterStatus("");
                        setShowStatusDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      All Status
                    </button>
                    <button
                      onClick={() => {
                        setFilterStatus("active");
                        setShowStatusDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Active
                    </button>
                    <button
                      onClick={() => {
                        setFilterStatus("inactive");
                        setShowStatusDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Inactive
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">S. no.</th>
                  <th className="p-2 border">Student ID</th>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Class</th>
                  <th className="p-2 border">Username</th>
                  <th className="p-2 border">Password</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentLoginStudents.map((s, idx) => (
                  <tr
                    key={s.id || idx}
                    className="text-center hover:bg-gray-50"
                  >
                    <td className="p-2 border">{loginIndexOfFirst + idx + 1}</td>
                    <td className="p-2 border">
                      {s.personalInfo?.stdId || "N/A"}
                    </td>
                    <td className="p-2 border text-left">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-orange-500 text-white flex items-center justify-center rounded-full">
                          {s.personalInfo?.name?.[0] || "?"}
                        </span>
                        <span>{s.personalInfo?.name || "N/A"}</span>
                      </div>
                    </td>
                    <td className="p-2 border">
                      {s.personalInfo?.class || "N/A"}
                    </td>
                    <td className="p-2 border">
                      {s.personalInfo?.username ||
                        s.personalInfo?.stdId ||
                        "N/A"}
                    </td>
                    <td className="p-2 border">
                      {(() => {
                        const pwKey = String(s._id ?? s.id ?? idx);
                        const revealed = !!visibleLoginPasswords[pwKey];
                        return (
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <span
                              className={
                                revealed
                                  ? "text-gray-800 font-mono text-xs max-w-[160px] break-all text-left"
                                  : "text-gray-500"
                              }
                            >
                              {revealed
                                ? s.personalInfo?.password || "N/A"
                                : "••••••••"}
                            </span>
                            <button
                              type="button"
                              className="text-blue-500 hover:text-blue-700 text-xs shrink-0"
                              onClick={() =>
                                setVisibleLoginPasswords((prev) => ({
                                  ...prev,
                                  [pwKey]: !prev[pwKey],
                                }))
                              }
                            >
                              {revealed ? "Hide" : "Show"}
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-2 border">
                      <button
                        type="button"
                        className="text-blue-500"
                        onClick={() => {
                          setEditingPassword(s);
                          setShowPasswordModal(true);
                        }}
                        title="Edit password"
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="text-red-500 ml-2"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this login?"
                            )
                          ) {
                            handleDelete(s._id);
                          }
                        }}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
                {currentLoginStudents.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-4 text-center text-gray-500 text-sm"
                    >
                      No login data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-500 mt-3">
              <p>
                Page {loginPage} of {loginTotalPages}
              </p>
              <div className="space-x-2">
                <button
                  disabled={loginPage === 1}
                  onClick={() => setLoginPage(loginPage - 1)}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  disabled={loginPage === loginTotalPages}
                  onClick={() => setLoginPage(loginPage + 1)}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );
      })()}

     
    
                 
             

      {selectedStudent && (
        <div className="fixed top-0 h-full w-[380px] bg-white border-l shadow-xl z-50 overflow-y-auto" style={{ left: 'calc(100% - 380px - 36px)' }}>
          <div className="flex justify-between items-start p-4 border-b">
            <div className="flex-3">
              <div className="flex items-center gap-7">
                <h2 className="text-xl font-semibold">
                  {selectedStudent.personalInfo?.name || "N/A"}
                </h2>

                <button
                  onClick={() => {
                    console.log("Selected student:", selectedStudent);
                    console.log("Student _id:", selectedStudent._id);
                  navigate(
  `/admission/final-student-profile/${selectedStudent._id}`,
  {
    state: selectedStudent,
  }
);
                  }}
                  className="text-sm bg-yellow-500 text-white px-8 py-1 rounded"
                >
                  View Full Profile
                </button>
              </div>

              <p className="text-sm text-gray-500">
                Student ID : {selectedStudent.personalInfo?.stdId || "N/A"}
              </p>
            </div>

            <button
              className="p-1 rounded hover:bg-gray-100 text-gray-500"
              onClick={() => setSelectedStudent(null)}
            >
              <FiX className="text-xl" />
            </button>
          </div>

          <div className="p-4 space-y-6 text-sm">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                General Information
              </h3>
              <p>Gender : {getFieldValue("Gender")}</p>
              <p>Blood Group : {getFieldValue("Blood Group")}</p>
              <p>Address : {selectedStudent.address || "N/A"}</p>
              <p>Date of Birth : {getFieldValue("Date of Birth")}</p>
              <p>Age : {getFieldValue("Age")}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                Academic Information
              </h3>
              <p>Class : {selectedStudent.personalInfo?.class || "N/A"}</p>
              <p>Section : {selectedStudent.personalInfo?.section || "N/A"}</p>
              <p>Academic Year : {getFieldValue("Academic Year")}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                Parent / Guardian Info
              </h3>
              <p>Parent account holder : {getFieldValue("Parent account holder")}</p>
              <p>Parent ID : {getFieldValue("Parent ID")}</p>
              <p>Father : {getFieldValue("Father")}</p>
              <p>Mother : {getFieldValue("Mother")}</p>
              <p>Emergency Contact : {getFieldValue("Emergency Contact")}</p>
              <p>Contact : {getFieldValue("Contact")}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                Attendance Information
              </h3>
              <p>Present Days : {getFieldValue("Present Days")}</p>
              <p>Attendance % : {selectedStudent.attendance || "N/A"}</p>
              <p>Last Present : {getFieldValue("Last Present")}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                Fee Summary
              </h3>
              <p>Total Fee : {getFieldValue("Total Fee")}</p>
              <p>Paid : {getFieldValue("Paid")}</p>
              <p>Due : {getFieldValue("Due")}</p>
              <p>Last Payment : {getFieldValue("Last Payment")}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Other Info</h3>
              {getRemainingFields().length > 0 ? (
                getRemainingFields().map((f, i) => (
                  <p key={i}>
                    {f.label} : {f.value || "N/A"}
                  </p>
                ))
              ) : (
                <p className="text-gray-500 italic">No extra data</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && editingPassword && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
            <h3 className="text-lg font-bold mb-4">
              Update Password for {editingPassword.personalInfo?.name}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newPassword = e.target.password.value;
                if (newPassword) {
                  handleUpdatePassword(editingPassword._id, newPassword);
                  setShowPasswordModal(false);
                  setEditingPassword(null);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Current Password:
                </label>
                <input
                  type="text"
                  value={editingPassword.personalInfo?.password || "N/A"}
                  className="border px-3 py-2 w-full rounded bg-gray-100"
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  New Password:
                </label>
                <input
                  name="password"
                  type="text"
                  placeholder="Enter new password"
                  className="border px-3 py-2 w-full rounded"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setEditingPassword(null);
                  }}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* BACK BUTTON – Status Tracking */}
<div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 z-40">
  <button
    onClick={() => navigate("/admission/status-tracking")}
    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 w-full sm:w-auto"
  >
     Back
  </button>
</div>
    </div>
  );
}