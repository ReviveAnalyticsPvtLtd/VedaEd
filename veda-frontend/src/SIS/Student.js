import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { FiPlus, FiUpload, FiSearch, FiTrash2, FiEdit, FiDownload, FiChevronDown } from "react-icons/fi";
import HelpInfo from "../components/HelpInfo";
import ProfileAvatar from "../components/ProfileAvatar";

import api from "../services/apiClient";
import { isToastErrorMessage, toastBannerClassName } from "../utils/toastMessageStyle";
import { getLatestPassportPhotoUrlFromDocs } from "../utils/studentProfileMedia";

function normalizeStudentRow(s, idx = 0) {
  const imageField = s.personalInfo?.image;
  const profileFromImageField =
    (typeof imageField === "string" ? imageField : "") ||
    imageField?.url ||
    imageField?.path ||
    imageField?.fileUrl ||
    "";
  const profileFromDocuments = getLatestPassportPhotoUrlFromDocs(s.documents || []);

  return {
    ...s,
    id: s._id || idx + 1,
    _id: s._id,
    source: s.source || "SIS",
    personalInfo: {
      ...(s.personalInfo || {}),
      name: s.personalInfo?.name || "Unnamed",
      class: s.personalInfo?.class || "-",
      stdId: s.personalInfo?.stdId || "N/A",
      username: s.personalInfo?.username || "",
      rollNo: s.personalInfo?.rollNo || "-",
      section: s.personalInfo?.section || "-",
      password: s.personalInfo?.password || "default123",
      fees: s.personalInfo?.fees || "Due",
    },
    photo: s.photo || profileFromImageField || profileFromDocuments || "",
    address: s.address || s.personalInfo?.address || s.contactInfo?.address || "",
    attendance: s.attendance || "-",
  };
}

export default function Student() {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [formSections, setFormSections] = useState([]);
  const [selectedClassForForm, setSelectedClassForForm] = useState("");
const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);
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
  const [nextStudentIdPreview, setNextStudentIdPreview] = useState("");
  const [isNextStudentIdLoading, setIsNextStudentIdLoading] = useState(false);

  const dropdownRef = useRef(null);
  const bulkActionRef = useRef(null);
  const classDropdownRef = useRef(null);
  const sectionDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const studentsPerPage = 10;
  const navigate = useNavigate();

  const loadStudents = useCallback(async () => {
    try {
      const res = await api.get(`/students`);

      console.log("Fetched students:", res.data);

      if (res.data.success && Array.isArray(res.data.students)) {
        const normalized = res.data.students.map((s, idx) =>
          normalizeStudentRow(s, idx)
        );
        setStudents(normalized);
      } else {
        console.error(" Unexpected response format:", res.data);
      }
    } catch (err) {
      console.error(
        "❌ Error fetching students:",
        err.response?.data || err.message
      );
    }
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get(`/classes`);
        if (res.data.success && Array.isArray(res.data.data)) {
          setClasses(res.data.data);
        }
      } catch (err) {
        console.error(
          "❌ Error fetching classes:",
          err.response?.data || err.message
        );
      }
    };

    const fetchSections = async () => {
      try {
        const res = await api.get(`/sections`);
        if (res.data.success && Array.isArray(res.data.data)) {
          setSections(res.data.data);
        }
      } catch (err) {
        console.error(
          "❌ Error fetching sections:",
          err.response?.data || err.message
        );
      }
    };

    loadStudents();
    fetchClasses();
    fetchSections();
  }, [loadStudents]);

  useEffect(() => {
    if (activeTab !== "login") {
      setVisibleLoginPasswords({});
    }
  }, [activeTab]);

  // Fetch sections when class is selected in form
  useEffect(() => {
    const fetchSectionsForClass = async () => {
      if (!selectedClassForForm) {
        setFormSections([]);
        return;
      }

      const selectedClass = classes.find(c => c.name === selectedClassForForm);
      if (selectedClass && selectedClass._id) {
        try {
          const res = await api.get(`/sections`, { params: { classId: selectedClass._id } });
          if (res.data.success && Array.isArray(res.data.data)) {
            setFormSections(res.data.data);
          } else {
            setFormSections([]);
          }
        } catch (err) {
          console.error("Error fetching sections for class:", err);
          setFormSections([]);
        }
      } else {
        setFormSections([]);
      }
    };

    fetchSectionsForClass();
  }, [selectedClassForForm, classes]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowOptions(false);
      }
      if (bulkActionRef.current && !bulkActionRef.current.contains(e.target)) {
        setShowBulkActions(false);
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
    const fetchNextStudentId = async () => {
      if (!showForm) return;
      setIsNextStudentIdLoading(true);
      try {
        const res = await api.get(`/students/next-id`);
        if (res.data?.success && res.data?.nextStudentId) {
          setNextStudentIdPreview(res.data.nextStudentId);
        } else {
          setNextStudentIdPreview("");
        }
      } catch (err) {
        console.error("Error fetching next student ID:", err);
        setNextStudentIdPreview("");
      } finally {
        setIsNextStudentIdLoading(false);
      }
    };

    fetchNextStudentId();
  }, [showForm]);

  // Fetch sections when class filter changes
  useEffect(() => {
    const fetchSectionsForClass = async () => {
      if (!filterClass) {
        setAvailableSections([]);
        setFilterSection("");
        return;
      }

      const selectedClass = classes.find(c => c.name === filterClass);
      if (selectedClass && selectedClass._id) {
        try {
          const res = await api.get(`/sections`, { params: { classId: selectedClass._id } });
          if (res.data.success && Array.isArray(res.data.data)) {
            setAvailableSections(res.data.data);
          } else {
            setAvailableSections([]);
          }
        } catch (err) {
          console.error("Error fetching sections for class:", err);
          setAvailableSections([]);
        }
      } else {
        setAvailableSections([]);
      }
    };

    fetchSectionsForClass();
  }, [filterClass, classes]);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Reset input so the same file can be re-imported if needed
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        setSuccessMsg("Import failed ❌: The spreadsheet has no data rows.");
        setTimeout(() => setSuccessMsg(""), 4000);
        return;
      }

      // Send raw row data to the backend – NO client-side IDs.
      // The backend will auto-generate unique Student IDs and skip duplicates.
      const rows = data.map((row) => ({
        personalInfo: {
          name:     row["Name"]     || "",
          class:    row["Class"]    || "-",
          rollNo:   row["Roll"]     || "-",
          section:  row["Section"]  || "-",
          password: row["Password"] || "default123",
          fees:     row["Fee"]      || "Due",
          email:    row["Email"]    || "",
        },
        attendance: row["Attendance"] || "-",
      }));

      try {
        const res = await api.post(`/students/import`, { students: rows });

        if (res.data.success) {
          await loadStudents();
          // Build a detailed summary from backend results
          const { imported = [], skipped = [], errors = [] } = res.data;
          let msg = res.data.message || "Import complete";
          if (skipped.length > 0) {
            msg += ` | Skipped: ${skipped.map(s => s.name).join(", ")}`;
          }
          if (errors.length > 0) {
            msg += ` | Errors: ${errors.map(s => s.name || "?").join(", ")}`;
          }
          setSuccessMsg(imported.length > 0 ? `✅ ${msg}` : `⚠️ ${msg}`);
          setTimeout(() => setSuccessMsg(""), 6000);
        } else {
          setSuccessMsg(`Import failed ❌: ${res.data.message}`);
          setTimeout(() => setSuccessMsg(""), 5000);
        }
      } catch (err) {
        console.error("Error importing:", err);
        const errMsg = err.response?.data?.message || err.message || "Server error";
        setSuccessMsg(`Error connecting to server ❌: ${errMsg}`);
        setTimeout(() => setSuccessMsg(""), 5000);
      }
    };

    reader.readAsBinaryString(file);
  };
  const handleAddManually = async (e) => {
    e.preventDefault();
    const form = e.target;

    const newStudent = {
      autoGenerateStudentId: true,
      personalInfo: {
        name: form.name.value.trim(),
        class: form.cls.value.trim(),
        rollNo: form.roll.value.trim(),
        section: form.section.value.trim(),
        password: form.password.value || "default123",
        fees: form.fee.value || "Due",
      },
    };

    console.log("Sending student data:", newStudent);

    try {
      const res = await api.post(`/students`, newStudent);

      console.log("Backend response:", res.data);

      if (res.data.success && res.data.student) {
        await loadStudents();
        setShowForm(false);
        setSelectedClassForForm("");
        setNextStudentIdPreview("");
        const assignedId = res.data.student.personalInfo?.stdId;
        setSuccessMsg(
          assignedId
            ? `Student added successfully. Student ID: ${assignedId} `
            : "Student added successfully "
        );
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        const errorMsg = res.data.message || "Failed to add student";
        console.error("❌ Error creating student:", errorMsg);
        setSuccessMsg(`Failed to add student ❌: ${errorMsg}`);
        setTimeout(() => setSuccessMsg(""), 5000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to add student";
      console.error(
        "❌ Error creating student:",
        err.response?.data || err.message
      );
      setSuccessMsg(`Failed to add student : ${errorMessage}`);
      setTimeout(() => setSuccessMsg(""), 5000);
    }
  };

  const handleUpdatePassword = async (id, newPassword) => {
    try {
      const res = await api.put(`/students/${id}`, {
        personalInfo: {
          password: newPassword,
        },
      });
      if (res.data.success) {
        setStudents(
          students.map((s) =>
            s._id === id
              ? {
                ...s,
                personalInfo: { ...s.personalInfo, password: newPassword },
              }
              : s
          )
        );
        setSuccessMsg("Password updated successfully ");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Error updating password:", err);
      setSuccessMsg("Failed to update password ❌");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/students/${id}`);
      setStudents(students.filter((s) => s._id !== id));
      setSuccessMsg("Student deleted ");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error deleting student:", err);
    }
  };
const handleSelectStudent = (studentId) => {
  setSelectedStudents((prev) =>
    prev.includes(studentId)
      ? prev.filter((id) => id !== studentId)
      : [...prev, studentId]
  );
};
const handleSelectAllStudents = () => {
  const currentStudentIds = currentStudents.map((s) => s._id);

  const isAllSelected = currentStudentIds.every((id) =>
    selectedStudents.includes(id)
  );

  if (isAllSelected) {
    setSelectedStudents((prev) =>
      prev.filter((id) => !currentStudentIds.includes(id))
    );
  } else {
    setSelectedStudents((prev) => [
      ...new Set([...prev, ...currentStudentIds]),
    ]);
  }
};
const handleBulkExport = () => {
  if (selectedStudents.length === 0) {
    setSuccessMsg("Please select students first");
    setTimeout(() => setSuccessMsg(""), 3000);
    return;
  }

  const selectedData = students.filter((s) =>
    selectedStudents.includes(s._id)
  );

  const exportData = selectedData.map((s) => ({
    "Student ID": s.personalInfo?.stdId,
    Name: s.personalInfo?.name,
    Class: s.personalInfo?.class,
    Section: s.personalInfo?.section,
    Roll: s.personalInfo?.rollNo,
    Fees: s.personalInfo?.fees,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Students"
  );

  XLSX.writeFile(
    workbook,
    "Selected_Students.xlsx"
  );

  setShowBulkActions(false);
};

const handleBulkDelete = async () => {
  if (selectedStudents.length === 0) {
    setSuccessMsg("Please select students first");
    setTimeout(() => setSuccessMsg(""), 3000);
    return;
  }

  const confirmDelete = window.confirm(
    `Delete ${selectedStudents.length} selected students?`
  );

  if (!confirmDelete) return;

  try {
    await Promise.all(
      selectedStudents.map((id) =>
        api.delete(`/students/${id}`)
      )
    );

    setStudents((prev) =>
      prev.filter(
        (s) => !selectedStudents.includes(s._id)
      )
    );

    setSelectedStudents([]);

    setShowBulkActions(false);

    setSuccessMsg(
      "Selected students deleted successfully"
    );

    setTimeout(() => setSuccessMsg(""), 3000);
  } catch (err) {
    console.error(err);

    setSuccessMsg(
      "Failed to delete selected students"
    );

    setTimeout(() => setSuccessMsg(""), 3000);
  }
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

  const getFieldValue = (label) => {
    if (!selectedStudent) return "N/A";

    const personal = selectedStudent.personalInfo || {};
    const parent = selectedStudent.parent || {};
    const contact = personal.contactDetails || selectedStudent.contactInfo || {};
    const parents = selectedStudent.parents || {};
    const emergency = selectedStudent.emergencyContact || {};
    const academic = selectedStudent.earlierAcademic || {};
    const curriculum = selectedStudent.curriculum || {};

    const safeValue = (value) => {
      if (value === 0) return "0";
      if (typeof value === "string" && value.trim() !== "") return value.trim();
      if (value !== undefined && value !== null && value !== "") return String(value);
      return "N/A";
    };

    const address = personal.address || contact.address || selectedStudent.address;
    const dob = personal.DOB || personal.dateOfBirth;
    const fatherName = parent.fatherName || parents.father?.name;
    const motherName = parent.motherName || parents.mother?.name;
    const emergencyContact = emergency.phone || contact.alternatePhone || contact.phone;
    const contactNumber = contact.mobileNumber || contact.phone || parent.contactDetails?.phone;

    const fieldMap = {
      Gender: personal.gender,
      "Blood Group": personal.bloodGroup,
      "Date of Birth": dob,
      Age: personal.age,
      House: personal.house,
      "Academic Year": curriculum.academicYear || academic.academicYear,
      "Admission Type": curriculum.admissionType,
      Father: fatherName,
      Mother: motherName,
      "Emergency Contact": emergencyContact,
      Contact: contactNumber,
      "Present Days": selectedStudent.presentDays,
      "Last Present": selectedStudent.lastPresent,
      "Total Fee": selectedStudent.totalFee,
      Paid: selectedStudent.paidFee,
      Due: selectedStudent.dueFee,
      "Last Payment": selectedStudent.lastPayment,
      Address: address,
    };

    return safeValue(fieldMap[label]);
  };

  const getRemainingFields = () => {
    if (!selectedStudent) return [];
    const personal = selectedStudent.personalInfo || {};
    const contact = selectedStudent.contactInfo || {};
    const academic = selectedStudent.earlierAcademic || {};

    const extras = [
      { label: "Nationality", value: personal.nationality },
      { label: "Religion", value: personal.religion },
      { label: "Email", value: contact.email || personal.contactDetails?.email },
      { label: "Phone", value: contact.phone || personal.contactDetails?.mobileNumber },
      { label: "Previous School", value: academic.schoolName },
      { label: "Board", value: academic.board },
      { label: "Last Class", value: academic.lastClass },
    ];

    return extras.filter((item) => item.value !== undefined && item.value !== null && item.value !== "");
  };
  const handleViewFullProfile = (studentRecord) => {
    if (!studentRecord?._id) return;

    navigate(`/admin/student-profile/${studentRecord._id}`, {
      state: studentRecord,
    });
  };

  return (
    <div className="m-0 p-0 w-full max-w-full min-w-0 flex flex-col flex-1 min-h-[calc(100dvh-5.5rem)]">

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
          Students
        </button>
        <span>&gt;</span>
        <span>
          {activeTab === "all" && "All Student"}
          {activeTab === "login" && "Manage Login"}
          {activeTab === "others" && "Others"}
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start mb-4">
        <h2 className="text-2xl font-bold shrink-0">Students</h2>

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

      <div className="flex gap-4 sm:gap-6 text-sm mb-3 text-gray-600 border-b overflow-x-auto shrink-0 pb-px">
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
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border w-full max-w-full flex flex-col flex-1 min-h-0">
          <h3 className="text-lg font-semibold mb-4">Student List</h3>
          <div className="mb-4 w-full space-y-3">
            <div className="flex items-center border px-3 py-2 rounded-md bg-white w-full max-w-full min-w-0">
              <FiSearch className="text-gray-500 mr-2 text-sm shrink-0" />
              <input
                type="text"
                placeholder="Search student name or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-w-0 outline-none text-sm"
              />
            </div>

            <div className="flex w-full min-w-0 flex-row flex-nowrap items-center justify-between gap-2 overflow-x-auto pb-1">
            <div className="flex shrink-0 flex-row flex-nowrap items-center gap-2 sm:gap-3">
            <div className="relative w-[120px] shrink-0" ref={classDropdownRef}>
              <button
                onClick={() => setShowClassDropdown(!showClassDropdown)}
                className="border px-3 py-2 rounded-md bg-white flex w-full items-center gap-2 justify-between hover:border-blue-500"
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

            <div className="relative shrink-0 w-[120px]" ref={sectionDropdownRef}>
              <button
                onClick={() => filterClass && setShowSectionDropdown(!showSectionDropdown)}
                disabled={!filterClass}
                className="border px-3 py-2 rounded-md bg-white flex w-full items-center gap-2 justify-between hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>{filterSection || "Section"}</span>
                <FiChevronDown className="text-xs" />
              </button>

              {showSectionDropdown && filterClass && (
                <div
                  className="absolute left-0 mt-2 w-32 bg-white border rounded-md shadow-lg z-10 text-sm max-h-60 overflow-y-auto"
                >
                  <button
                    onClick={() => {
                      setFilterSection("");
                      setShowSectionDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    All Sections
                  </button>
                  {availableSections && availableSections.length > 0 ? (
                    availableSections.map((sec) => {
                      const sectionId = sec._id || sec;
                      const sectionName = sec.name || sec;
                      return (
                        <button
                          key={sectionId}
                          onClick={() => {
                            setFilterSection(sectionName);
                            setShowSectionDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                          {sectionName}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-2 text-gray-500 text-xs">No sections available</div>
                  )}
                </div>
              )}
            </div>

            <div className="relative shrink-0 min-w-[130px]" ref={bulkActionRef}>
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="border px-3 py-2 rounded-md bg-white flex w-full items-center gap-2 justify-between hover:border-blue-500"
              >
                <span>Bulk Actions</span>
                <FiChevronDown className="text-xs" />
              </button>

             {showBulkActions && (
  <div className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-10 text-sm">

    <button
      onClick={handleBulkExport}
      className="block w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
    >
      <FiDownload className="text-sm" />
      Export Excel
    </button>

    <button
      onClick={handleBulkDelete}
      className="block w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-600"
    >
      <FiTrash2 className="text-sm" />
      Delete
    </button>

  </div>
)}
            </div>
            </div>

            <div className="relative shrink-0 pl-1" ref={dropdownRef}>
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-1 whitespace-nowrap"
              >
                <FiPlus />
                Add Student
              </button>

              {showOptions && (
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-10 text-sm">
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setShowOptions(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    <FiPlus className="inline-block mr-2" /> Add Manually
                  </button>

                  <label className="block w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    <FiUpload className="inline-block mr-2" /> Import Excel
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 rounded-md border border-gray-100 sm:border-0">
          <table className="w-full border text-sm min-w-[720px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border w-[50px]">
  <input
    type="checkbox"
    checked={
      currentStudents.length > 0 &&
      currentStudents.every((s) =>
        selectedStudents.includes(s._id)
      )
    }
    onChange={handleSelectAllStudents}
   
  />
</th>
                <th className="p-2 border">S. no.</th>
                <th className="p-2 border">Student ID</th>
                <th className="p-2 border">Student Name</th>
                <th className="p-2 border">Roll num</th>
                <th className="p-2 border">Class</th>
                <th className="p-2 border">Section</th>
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
  <input
    type="checkbox"
    checked={selectedStudents.includes(s._id)}
    onChange={() => handleSelectStudent(s._id)}
   
  />
</td>
                  <td className="p-2 border">
                    {indexOfFirst + idx + 1}
                  </td>
                  <td className="p-2 border">
                    {s.personalInfo.stdId}
                  </td>
                  <td className="p-2 border text-left">
                    <div className="flex items-center gap-2">
                      <ProfileAvatar
                        name={s.personalInfo.name || "Student"}
                        imageSrc={s.photo || ""}
                        sizeClassName="w-8 h-8 min-w-[2rem] min-h-[2rem]"
                        textClassName="text-xs"
                        className="ring-2 ring-indigo-100 shrink-0"
                      />
                      <span>{s.personalInfo.name}</span>
                    </div>
                  </td>
                  <td className="p-2 border">
                    {s.personalInfo.rollNo}
                  </td>
                  <td className="p-2 border">
                    {s.personalInfo.class}
                  </td>
                  <td className="p-2 border">
                    {s.personalInfo.section}
                  </td>
                  <td className="p-2 border">
                    {s.personalInfo.fees === "Paid" ? (
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
                    colSpan={9}
                    className="p-4 text-center text-gray-500 text-sm"
                  >
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center text-sm text-gray-500 mt-3">
            <p>
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2 justify-end">
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
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border w-full max-w-full flex flex-col flex-1 min-h-0">
            <h3 className="text-lg font-semibold mb-4">Login Credentials</h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center mb-4 w-full">
              <div className="flex items-center border px-3 py-2 rounded-md bg-white w-full min-w-0 sm:flex-1 sm:max-w-md">
                <FiSearch className="text-gray-500 mr-2 text-sm shrink-0" />
                <input
                  type="text"
                  placeholder="Search student name or ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full min-w-0 outline-none text-sm"
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
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 rounded-md border border-gray-100 sm:border-0">
            <table className="w-full border text-sm min-w-[640px]">
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
                        <ProfileAvatar
                          name={s.personalInfo?.name || "Student"}
                          imageSrc={s.photo || ""}
                          sizeClassName="w-8 h-8 min-w-[2rem] min-h-[2rem]"
                          textClassName="text-xs"
                          className="ring-2 ring-indigo-100 shrink-0"
                        />
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

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center text-sm text-gray-500 mt-3">
              <p>
                Page {loginPage} of {loginTotalPages}
              </p>
              <div className="flex gap-2 justify-end">
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

      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Add Student Manually</h3>
            {successMsg && isToastErrorMessage(successMsg) && (
              <div
                role="alert"
                className={`mb-3 px-3 py-2 rounded-md border text-sm font-semibold ${toastBannerClassName(successMsg)}`}
              >
                {successMsg}
              </div>
            )}
            <form onSubmit={handleAddManually} className="space-y-3">
              <div className="border border-dashed border-gray-300 bg-gray-50 px-3 py-2 rounded text-sm text-gray-700">
                <span className="font-medium text-gray-800">Student ID</span>
                <p className="mt-1 text-gray-600">
                  {isNextStudentIdLoading
                    ? "Fetching next available Student ID..."
                    : `${nextStudentIdPreview || "Unavailable"}`}
                </p>
              </div>
              <input
  name="name"
  placeholder="Name"
  className={`border px-3 py-2 w-full rounded ${
    errors.name ? "border-red-500" : ""
  }`}
  onChange={(e) => {
    const val = e.target.value;

    // block wrong typing
    if (!/^[a-zA-Z\s]*$/.test(val)) {
      setErrors((p) => ({ ...p, name: "Only letters allowed" }));
      return;
    }

    setErrors((p) => ({ ...p, name: "" }));
  }}
  required
/>

{errors.name && (
  <p className="text-red-500 text-xs">{errors.name}</p>
)}
            <input
  name="roll"
  placeholder="Roll Number"
  className={`border px-3 py-2 w-full rounded ${
    errors.roll ? "border-red-500" : ""
  }`}
  onChange={(e) => {
    const val = e.target.value;

    if (!/^\d*$/.test(val)) {
      setErrors((p) => ({ ...p, roll: "Only numbers allowed" }));
      return;
    }

    setErrors((p) => ({ ...p, roll: "" }));
  }}
  required
/>
{errors.roll && <p className="text-red-500 text-xs">{errors.roll}</p>}
              <select
                name="cls"
                value={selectedClassForForm}
                onChange={(e) => {
                  setSelectedClassForForm(e.target.value);
                  // Reset section when class changes
                  const sectionSelect = document.querySelector('select[name="section"]');
                  if (sectionSelect) sectionSelect.value = "";
                }}
                className="border px-3 py-2 w-full rounded"
                required
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <select
                name="section"
                className="border px-3 py-2 w-full rounded"
                required
                disabled={!selectedClassForForm}
              >
                <option value="">Select Section</option>
                {selectedClassForForm ? (
                  (formSections.length > 0
                    ? formSections
                    : classes.find((c) => c.name === selectedClassForForm)?.sections || []
                  ).map((sec) => (
                    <option key={sec._id || sec} value={sec.name || sec}>
                      {sec.name || sec}
                    </option>
                  ))
                ) : (
                  sections.map((sec) => (
                    <option key={sec._id} value={sec.name}>
                      {sec.name}
                    </option>
                  ))
                )}
              </select>
              <input
                name="password"
                placeholder="Password"
                className="border px-3 py-2 w-full rounded"
                required
              />
              <select
                name="fee"
                className="border px-3 py-2 w-full rounded"
              >
                <option value="Paid">Paid</option>
                <option value="Due">Due</option>
              </select>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setNextStudentIdPreview("");
                  }}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedStudent && (
        <div className="fixed inset-y-0 right-0 h-full w-full max-w-[380px] bg-white border-l shadow-xl z-50 overflow-y-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start p-4 border-b">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <h2 className="text-xl font-semibold break-words">
                  {selectedStudent.personalInfo?.name || "N/A"}
                </h2>

                <button
                  onClick={() => {
                    console.log("Selected student:", selectedStudent);
                    console.log("Student _id:", selectedStudent._id);
                    handleViewFullProfile(selectedStudent);
                  }}
                  className="text-sm bg-yellow-500 text-white px-4 sm:px-8 py-2 sm:py-1 rounded shrink-0 self-start sm:self-auto"
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
              <p>House : {getFieldValue("House")}</p>
              <p>Academic Year : {getFieldValue("Academic Year")}</p>
              <p>Admission Type : {getFieldValue("Admission Type")}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                Parent / Guardian Info
              </h3>
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto">
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
    
    </div>
  );
}