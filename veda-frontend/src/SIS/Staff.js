import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { FiX } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/apiClient";

import { FiPlus, FiUpload, FiSearch, FiTrash2, FiEdit } from "react-icons/fi";
import HelpInfo from "../components/HelpInfo";
import { FiChevronDown, FiUser, FiDownload } from "react-icons/fi";

import config from "../config";
import { toastBannerClassName } from "../utils/toastMessageStyle";
const API_BASE_URL = config.API_BASE_URL;

export default function Staff() {
  const [selectedStudents, setSelectedStudents] = useState([]);
const [showBulkActions, setShowBulkActions] = useState(false);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const staffPerPage = 10;
  const [showOptions, setShowOptions] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const dropdownRef = useRef(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState(null);
 
  const bulkActionRef = useRef(null);
  // Department Dropdown
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const deptDropdownRef = useRef(null);
const [formData, setFormData] = useState({
  name: "",
  department: "",
  assignedClasses: "",
  email: "",
  password: "",
  role: "",
  status: "Active",
});

const [errors, setErrors] = useState({});
const [nextStaffIdPreview, setNextStaffIdPreview] = useState("");
  // Status Dropdown
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowOptions(false); // Add Staff
      }

      if (deptDropdownRef.current && !deptDropdownRef.current.contains(e.target)) {
        setShowDeptDropdown(false); // Department
      }

      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setShowStatusDropdown(false); // Status
      }

      if (bulkActionRef.current && !bulkActionRef.current.contains(e.target)) {
        setShowBulkActions(false); // Bulk Actions
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showForm) return;
    api
      .get(`/staff/next-id`)
      .then((res) => {
        if (res.data?.success) {
          setNextStaffIdPreview(res.data.staffId || "");
        }
      })
      .catch((err) => {
        console.error("Error fetching next staff ID:", err);
        setNextStaffIdPreview("");
      });
  }, [showForm]);


  const navigate = useNavigate();

  useEffect(() => {
    const updatedRaw = sessionStorage.getItem("staffProfileUpdated");
    if (!updatedRaw) return;
    try {
      const parsed = JSON.parse(updatedRaw);
      if (!parsed?.staff || parsed?.source !== "sis") return;
      const updated = parsed.staff;
      setStaff((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      setSelectedStaff((prev) => (prev && prev._id === updated._id ? updated : prev));
      sessionStorage.removeItem("staffProfileUpdated");
    } catch (err) {
      console.error("Failed to apply updated staff profile state:", err);
      sessionStorage.removeItem("staffProfileUpdated");
    }
  }, [location.key]);

  // 🔹 Fetch staff from API 
  useEffect(() => {
    api
      .get(`/staff/`)
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.staff)) {
          setStaff(res.data.staff);
        } else {
          console.error("Unexpected response format:", res.data);
        }
      })
      .catch((err) => console.error("Error fetching staff:", err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


const handleChange = (e) => {
  const { name, value } = e.target;

  const letterOnly = ["name", "department"];
  const numberOnly = [];

  // LETTER ONLY
  if (letterOnly.includes(name)) {
    if (!/^[a-zA-Z\s]*$/.test(value)) {
      setErrors((p) => ({ ...p, [name]: "Only letters allowed" }));
      return; // ⛔ update hi nahi hoga
    }
  }

  // NUMBER ONLY
  if (numberOnly.includes(name)) {
    if (!/^\d*$/.test(value)) {
      setErrors((p) => ({ ...p, [name]: "Only numbers allowed" }));
      return;
    }
  }

  // CLEAR ERROR
  setErrors((p) => ({ ...p, [name]: "" }));

  // ✅ update only valid value
  setFormData((p) => ({ ...p, [name]: value }));
};

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        setSuccessMsg("Import failed ❌: No data found in the spreadsheet.");
        setTimeout(() => setSuccessMsg(""), 4000);
        return;
      }

      try {
        const res = await api.post(`/staff/import`, data);
        if (res.data.success) {
          // Re-fetch staff to show new data
          const updatedRes = await api.get(`/staff`);
          if (updatedRes.data.success) {
            setStaff(updatedRes.data.staff);
          }
          
          const { imported = [], skipped = [], errors = [] } = res.data;
          let msg = `Import complete ✅: ${imported.length} added`;
          if (skipped.length > 0) msg += `, ${skipped.length} skipped (exists)`;
          if (errors.length > 0) msg += `, ${errors.length} errors`;
          
          setSuccessMsg(msg);
          setTimeout(() => setSuccessMsg(""), 5000);
        } else {
          setSuccessMsg(`Import failed ❌: ${res.data.message}`);
          setTimeout(() => setSuccessMsg(""), 5000);
        }
      } catch (err) {
        console.error("Error importing staff:", err);
        const errMsg = err.response?.data?.message || err.message || "Server error";
        setSuccessMsg(`Error connecting to server ❌: ${errMsg}`);
        setTimeout(() => setSuccessMsg(""), 5000);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // reset file input
  };

  const handleAddManually = async (e) => {
    e.preventDefault();
    const form = e.target;
    const assignedRaw = (form.assignedClasses?.value || "").trim();
    const newStaff = {
      personalInfo: {
        name: form.name.value.trim(),
        role: form.role.value,
        department: form.department.value.trim(),
        assignedClasses: assignedRaw
          ? assignedRaw.split(",").map((c) => c.trim())
          : [],
        email: form.email.value.trim(),
        password: form.password.value,
      },
      status: form.status.value,
    };

    try {
      const res = await api.post(`/staff/`, newStaff);
      if (res.data.success) {
        setStaff([res.data.staff, ...staff]);
        setShowForm(false);
        setFormData({
          name: "",
          department: "",
          assignedClasses: "",
          email: "",
          password: "",
          role: "",
          status: "Active",
        });
        setErrors({});
        setSuccessMsg("Staff added successfully ");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setSuccessMsg(
          res.data.message ? `Failed to add staff  ${res.data.message}` : "Failed to add staff ❌"
        );
        setTimeout(() => setSuccessMsg(""), 5000);
      }
    } catch (error) {
      console.error("Error adding staff:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      setSuccessMsg("Failed to add staff ❌");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  // Delete Staff function
  const handleDelete = async (id) => {
    try {
      if (window.confirm("Are you sure you want to delete this staff member?")) {
        await api.delete(`/staff/${id}`);
        setStaff(staff.filter((s) => s._id !== id));
        setSuccessMsg("Staff deleted ");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Error deleting staff:", err);
    }
  };

  const handleBulkSelect = () => {
    console.log("Bulk select clicked");
  };

 const handleBulkExport = () => {
  const selectedData = staff.filter((s) =>
    selectedStudents.includes(s._id)
  );

  if (selectedData.length === 0) {
    setSuccessMsg("Please select at least one staff");
    setTimeout(() => setSuccessMsg(""), 3000);
    return;
  }

  const exportData = selectedData.map((s, index) => ({
    "S. No": index + 1,
    "Staff ID": s.personalInfo?.staffId || "",
    Name: s.personalInfo?.name || "",
    Role: s.personalInfo?.role || "",
    Department: s.personalInfo?.department || "",
    Email: s.personalInfo?.email || "",
    Status: s.status || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Staff");

  XLSX.writeFile(workbook, "Selected_Staff.xlsx");

  setSuccessMsg("Excel exported successfully ");
  setTimeout(() => setSuccessMsg(""), 3000);
};

 const handleBulkDelete = async () => {
  if (selectedStudents.length === 0) {
    setSuccessMsg("Please select at least one staff");
    setTimeout(() => setSuccessMsg(""), 3000);
    return;
  }

  const confirmDelete = window.confirm(
    "Are you sure you want to delete selected staff?"
  );

  if (!confirmDelete) return;

  try {
    await Promise.all(
      selectedStudents.map((id) =>
        api.delete(`/staff/${id}`)
      )
    );

    setStaff((prev) =>
      prev.filter((s) => !selectedStudents.includes(s._id))
    );

    setSelectedStudents([]);

    setSuccessMsg("Selected staff deleted ");
    setTimeout(() => setSuccessMsg(""), 3000);
  } catch (err) {
    console.error(err);
    setSuccessMsg("Failed to delete selected staff ❌");
    setTimeout(() => setSuccessMsg(""), 3000);
  }
};

  // Update Staff Password function
  const handleUpdatePassword = async (id, newPassword) => {
    try {
      const res = await api.put(`/staff/${id}`, {
        personalInfo: {
          password: newPassword
        }
      });
      if (res.data.success) {
        setStaff(staff.map(s =>
          s._id === id ? {
            ...s,
            personalInfo: { ...s.personalInfo, password: newPassword }
          } : s
        ));
        setSuccessMsg("Password updated successfully ");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Error updating password:", err);
      setSuccessMsg("Failed to update password ❌");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const filteredStaff = staff.filter(
    (s) =>
      (s.personalInfo?.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.personalInfo?.staffId?.toLowerCase().includes(search.toLowerCase()) ||
        s.personalInfo?.role?.toLowerCase().includes(search.toLowerCase()) ||
        s.personalInfo?.department?.toLowerCase().includes(search.toLowerCase())) &&
      (filterRole ? s.personalInfo?.role === filterRole : true) &&
      (filterDept ? s.personalInfo?.department === filterDept : true) &&
      (filterStatus ? s.status === filterStatus : true)
  );

  const indexOfLast = currentPage * staffPerPage;
  const indexOfFirst = indexOfLast - staffPerPage;
  const currentStaff = filteredStaff.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredStaff.length / staffPerPage);

  const getFieldValue = (field) => {
    if (!selectedStaff) return "N/A";
    const formatReadableDate = (rawDate) => {
      if (!rawDate) return "N/A";
      const parsed = new Date(rawDate);
      if (Number.isNaN(parsed.getTime())) return "N/A";
      return parsed.toLocaleDateString("en-GB");
    };
    switch (field) {
      case "Address": return selectedStaff.personalInfo?.address || selectedStaff.address || "N/A";
      case "Mobile Number": return selectedStaff.personalInfo?.mobileNumber || selectedStaff.phone || selectedStaff.personalInfo?.phone || "N/A";
      case "Experience": return selectedStaff.experience || selectedStaff.personalInfo?.experience || "N/A";
      case "Qualification": return selectedStaff.qualification || selectedStaff.personalInfo?.qualification || "N/A";
      case "Emergency Contact": return selectedStaff.personalInfo?.emergencyContact || selectedStaff.emergencyContact || "N/A";
      case "Current Salary": return selectedStaff.salaryDetails?.salary || selectedStaff.personalInfo?.salary || selectedStaff.salary || "N/A";
      case "Last Payment Date": return selectedStaff.salaryDetails?.lastPayment || selectedStaff.personalInfo?.lastPayment || selectedStaff.lastPayment || "N/A";
      case "Payment Status": return selectedStaff.salaryDetails?.paymentStatus || selectedStaff.payStatus || "N/A";
      case "Username": return selectedStaff.personalInfo?.username || selectedStaff.username || "N/A";
      case "Password": return selectedStaff.personalInfo?.password || selectedStaff.password || "N/A";
      case "Date of Joining":
        return formatReadableDate(
          selectedStaff.joiningDate ||
            selectedStaff.personalInfo?.doj ||
            selectedStaff.doj ||
            selectedStaff.dateOfJoining
        );
      case "Gender": return selectedStaff.personalInfo?.gender || selectedStaff.gender || "N/A";
      case "Assigned Classes":
        return selectedStaff.classesAssigned?.join(", ") ||
          selectedStaff.personalInfo?.assignedClasses?.join(", ") ||
          selectedStaff.assignedClasses ||
          "N/A";
      default: return "N/A";
    }
  };

  const getRemainingFields = () => {
    if (!selectedStaff) return [];
    // Return any additional fields that might exist in the staff data
    const extraFields = [];
    Object.keys(selectedStaff).forEach(key => {
      if (!['id', '_id', 'personalInfo', 'status', 'documents', 'performance'].includes(key)) {
        const value = selectedStaff[key];
        // Only include primitive values or arrays that can be safely rendered
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ||
          (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string')) {
          extraFields.push({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: Array.isArray(value) ? value.join(', ') : value
          });
        }
      }
    });
    return extraFields;
  };

  const statusBadge = (status) => {
    if (status === "Active")
      return "bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs";
    if (status === "On Leave")
      return "bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs";
    return "bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs";
  };
  // ------- LOGIN TAB STATES -------
  const [searchLogin, setSearchLogin] = useState("");
  const loginBulkRef = useRef(null);
  const [showLoginBulk, setShowLoginBulk] = useState(false);

  // Pagination for Login Tab
  const [loginPage, setLoginPage] = useState(1);
  const loginPerPage = 20;

  const filteredLogin = staff.filter((s) =>
    (s.personalInfo?.name || "")
      .toLowerCase()
      .includes(searchLogin.toLowerCase()) ||
    (s.personalInfo?.staffId || "")
      .toLowerCase()
      .includes(searchLogin.toLowerCase())
  );


  // Pagination indexes
  const indexOfLastLogin = loginPage * loginPerPage;
  const indexOfFirstLogin = indexOfLastLogin - loginPerPage;
  const currentLoginList = filteredLogin.slice(
    indexOfFirstLogin,
    indexOfLastLogin
  );

  const totalLoginPages = Math.ceil(filteredLogin.length / loginPerPage);


  return (
    <div className="p-0 m-0 min-h-screen">

      {successMsg && (
        <div
          role="status"
          className={`mb-4 px-3 py-2 rounded-md border text-sm font-semibold ${toastBannerClassName(successMsg)}`}
        >
          {successMsg}
        </div>
      )}
      {/* Breadcrumbs */}
      <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <button
          onClick={() => setActiveTab("all")}
          className="hover:underline"
        >
          Staff
        </button>
        <span>&gt;</span>
        <span>
          {activeTab === "all" && "All Staff"}
          {activeTab === "login" && "Manage Login"}
          {activeTab === "others" && "Others"}
        </span>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Staff</h2>

        <HelpInfo
          title="Staff Module Help"
          description={`Page Description: Manage all staff members including teachers, administrators, and support staff. View staff directory, roles, departments, and contact information. Add new staff and manage assignments.

6.1 All Staff Tab
Description: View and manage the complete directory of all staff members. Display staff information including name, staff ID, role, department, assigned classes, email, phone, and employment status. Search and filter staff by role, department, name, or status. Add new staff members manually or import from Excel. Assign staff to classes and subjects. View staff schedules and workload. Manage staff contact information and employment details.
Sections:
- Staff Directory Table: Comprehensive list of all staff with key information.
- Search and Filter: Find staff by name, ID, role, department, or status.
- Staff Assignment: Assign staff to classes, subjects, and responsibilities.
- Contact Information: View and update staff contact details.
- Action Buttons: Add staff, import data, export directory, view schedules.

6.2 Manage Login Tab
Description: Manage staff login credentials and account access. View usernames, passwords, and account status. Reset passwords, activate/deactivate staff accounts, and manage login permissions. Search and filter staff by login status. Generate login credentials for new staff or bulk reset passwords. Configure staff portal access and role-based permissions.
Sections:
- Login Credentials Table: Display staff ID, name, email, username, password status, and account status.
- Search and Filter: Find staff by name, ID, email, or login status.
- Password Management: Reset individual or bulk passwords; send password reset emails.
- Account Status Management: Activate, deactivate, or suspend staff accounts.
- Role-Based Access: Configure permissions based on staff roles (admin, teacher, support staff).

6.3 Others Tab
Description: Additional staff management features and utilities. Access staff reports, manage staff categories, view performance metrics, and perform bulk operations. Generate staff ID cards, manage departments, and configure staff-related settings.
Sections:
- Reports and Analytics: Generate staff reports, attendance summaries, and performance metrics.
- Bulk Operations: Perform bulk updates, role changes, or status modifications.
- ID Card Generation: Create and print staff ID cards.
- Department Management: Organize staff by departments and manage department structures.
- Export and Import Tools: Advanced data export options and import templates.`}
        />
      </div>



      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-2 ${activeTab === "all"
            ? "text-blue-600 font-semibold border-b-2 border-blue-600"
            : "text-gray-500"
            }`}
        >
          All Staff
        </button>
        <button
          onClick={() => setActiveTab("login")}
          className={`pb-2 ${activeTab === "login"
            ? "text-blue-600 font-semibold border-b-2 border-blue-600"
            : "text-gray-500"
            }`}
        >
          Manage Login
        </button>
        <button
          onClick={() => setActiveTab("others")}
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

          <h3 className="text-lg font-semibold mb-4">Staff List</h3>

          <div className="flex items-center gap-3 mb-4 w-full">

            {/* Search */}
            <div className="flex items-center border px-3 py-2 rounded-md bg-white w-1/3 min-w-[220px]">
              <FiSearch className="text-gray-500 mr-2 text-sm" />
              <input
                type="text"
                placeholder="Search staff name or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full outline-none "
              />
            </div>

            {/* Department Dropdown */}
            <div className="relative group" ref={deptDropdownRef}>
              <button
                onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                className="border px-3 py-2 rounded-md  bg-white flex items-center gap-2 w-[120px] justify-between hover:border-blue-500"
              >
                <span>{filterDept || "Department"}</span>
                <FiChevronDown className="text-xs" />
              </button>
              {showDeptDropdown && (
                <div
                  className="absolute left-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-10 text-sm"
                >
                  <button
                    onClick={() => {
                      setFilterDept("");
                      setShowDeptDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    All Departments
                  </button>
                  {["Science", "IT", "Kindergarten"].map((dept) => (
                    <button
                      key={dept}
                      onClick={() => {
                        setFilterDept(dept);
                        setShowDeptDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative group" ref={statusDropdownRef}>
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="border px-3 py-2 rounded-md bg-white flex items-center gap-2 w-[120px] justify-between hover:border-blue-500"
              >
                <span>{filterStatus || "Status"}</span>
                <FiChevronDown className="text-xs" />
              </button>
              {showStatusDropdown && (
                <div
                  className="absolute left-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-10 text-sm"
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
                  {["Active", "On Leave"].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setFilterStatus(status);
                        setShowStatusDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative group" ref={bulkActionRef}>
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="border px-3 py-2 rounded-md  bg-white flex items-center gap-2 min-w-[120px]  hover:border-blue-500"
              >
                <span>Bulk Actions</span>
                <FiChevronDown className="text-xs" />
              </button>

              {showBulkActions && (
                <div
                  className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-10 text-sm"
                >
                  
                  <button
                   onClick={() => {
  setShowBulkActions(false);
  handleBulkExport();
}}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FiDownload className="text-sm" />
                    Export Excel
                  </button>
                  <button
                    onClick={() => {
  setShowBulkActions(false);
  handleBulkDelete();
}}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-600"
                  >
                    <FiTrash2 className="text-sm" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Add Staff */}
            <div className="ml-auto relative" ref={dropdownRef}>
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-1"
              >
                <FiPlus /> Add Staff
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




          {/* Staff Table */}
          <table className="w-full border ">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">
  <input
    type="checkbox"
    checked={
      currentStaff.length > 0 &&
      selectedStudents.length === currentStaff.length
    }
    onChange={(e) => {
      if (e.target.checked) {
        setSelectedStudents(currentStaff.map((s) => s._id));
      } else {
        setSelectedStudents([]);
      }
    }}
  />
</th>
                <th className="p-2 border">S. no.</th>
                <th className="p-2 border">Staff ID</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Role</th>
                <th className="p-2 border">Department</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>

            <tbody>
              {currentStaff.map((s, idx) => (
                <tr key={s._id || idx} className="text-center hover:bg-gray-50">
                  <td className="p-2 border">
  <input
    type="checkbox"
    checked={selectedStudents.includes(s._id)}
    onChange={(e) => {
      if (e.target.checked) {
        setSelectedStudents((prev) => [...prev, s._id]);
      } else {
        setSelectedStudents((prev) =>
          prev.filter((id) => id !== s._id)
        );
      }
    }}
  />
</td>
                  <td className="p-2 border">{indexOfFirst + idx + 1}</td>
                  <td className="p-2 border">{s.personalInfo?.staffId}</td>

                  <td className="p-2 border text-left">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-indigo-500 text-white flex items-center justify-center rounded-full">
                        {s.personalInfo?.name?.[0] || "S"}
                      </span>
                      <span>{s.personalInfo?.name}</span>
                    </div>
                  </td>

                  <td className="p-2 border">{s.personalInfo?.role}</td>
                  <td className="p-2 border">{s.personalInfo?.department}</td>
                  <td className="p-2 border">{s.personalInfo?.email}</td>

                  <td className="p-2 border">
                    <span className={statusBadge(s.status)}>{s.status}</span>
                  </td>

                  <td className="p-2 border">
                    <button
                      className="text-blue-500"
                      onClick={() => setSelectedStaff(s)}
                    >
                      <FiSearch />
                    </button>
                    <button
                      className="text-red-500 ml-2"
                      onClick={() => handleDelete(s._id)}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}

              {currentStaff.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-gray-500" colSpan={9}>
                    No staff found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between items-center text-sm text-gray-500 mt-3">
            <p>Page {currentPage} of {totalPages}</p>
            <div className="space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login / Others Tabs */}
      {activeTab === "login" && (
        <div className="bg-white p-3 rounded-lg shadow-sm border">

          {/* Heading */}
          <h3 className="text-lg font-semibold mb-4">Staff Login</h3>

          {/* Search + Filter + Bulk Actions */}
          <div className="flex items-center gap-3 mb-4 w-full">

            {/* Search */}
            <div className="flex items-center border px-3 py-2 rounded-md bg-white w-1/3 min-w-[220px]">
              <FiSearch className="text-gray-500 mr-2 text-sm" />
              <input
                type="text"
                placeholder="Search staff name or ID"
                value={searchLogin}
                onChange={(e) => setSearchLogin(e.target.value)}
                className="w-full outline-none "
              />
            </div>
            <div className="relative group" ref={bulkActionRef}>
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="border px-3 py-2 rounded-md  bg-white flex items-center gap-2 min-w-[120px]  hover:border-blue-500"
              >
                <span>Bulk Actions</span>
                <FiChevronDown className="text-xs" />
              </button>

              {showBulkActions && (
                <div
                  className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-10 text-sm"
                >
                  <button
                    onClick={() => {
                      setShowBulkActions(false);
                      // Add select functionality here
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FiUser className="text-sm" />
                    Select
                  </button>
                  <button
                    onClick={() => {
                      setShowBulkActions(false);
                      // Add export CSV functionality here
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FiDownload className="text-sm" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => {
                      setShowBulkActions(false);
                      // Add delete functionality here
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-600"
                  >
                    <FiTrash2 className="text-sm" />
                    Delete
                  </button>
                </div>
              )}
            </div>


          </div>

          {/* Login Table */}
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">S. no.</th>
                <th className="p-2 border">Staff ID</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Username</th>
                <th className="p-2 border">Password</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>

            <tbody>
              {currentLoginList.map((s, idx) => (
                <tr key={s._id || idx} className="text-center hover:bg-gray-50">
                  <td className="p-2 border">{indexOfFirstLogin + idx + 1}</td>
                  <td className="p-2 border">{s.personalInfo?.staffId || "N/A"}</td>

                  <td className="p-2 border text-left">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-indigo-500 text-white flex items-center justify-center rounded-full">
                        {s.personalInfo?.name?.[0] || "S"}
                      </span>
                      <span>{s.personalInfo?.name || "N/A"}</span>
                    </div>
                  </td>

                  <td className="p-2 border">{s.personalInfo?.username || "N/A"}</td>

                  <td className="p-2 border">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-gray-500">••••••••</span>
                      <button
                        className="text-blue-500 hover:text-blue-700 text-xs"
                        onClick={() => {
                          setEditingPassword(s);
                          setShowPasswordModal(true);
                        }}
                      >
                        Show
                      </button>
                    </div>
                  </td>

                  <td className="p-2 border">
                    <button
                      className="text-blue-500"
                      onClick={() => {
                        setEditingPassword(s);
                        setShowPasswordModal(true);
                      }}
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="text-red-500 ml-2"
                      onClick={() => handleDelete(s._id)}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}

              {currentLoginList.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-gray-500" colSpan={6}>
                    No staff found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between items-center text-sm text-gray-500 mt-3">
            <p>Page {loginPage} of {totalLoginPages}</p>
            <div className="space-x-2">
              <button
                disabled={loginPage === 1}
                onClick={() => setLoginPage(loginPage - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={loginPage === totalLoginPages}
                onClick={() => setLoginPage(loginPage + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

        </div>
      )}


      {activeTab === "others" && (
        <div className="bg-gray-200 p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Others</h3>
            <p className="text-sm text-gray-600">
              Yahan aap future me HR documents, leaves, appraisal ya training records jaisi cheezein rakh sakte ho.
            </p>
          </div>
        </div>
      )}

      {/* Add Staff Form */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
            <h3 className="text-lg font-bold mb-4">Add Staff Manually</h3>
            <form onSubmit={handleAddManually} className="space-y-3">
              <input
                value={nextStaffIdPreview || "Auto-generated (TCH-YYYY-XXX)"}
                className="border px-3 py-2 w-full rounded bg-gray-100 text-gray-500"
                readOnly
              />
             <input
  name="name"
  value={formData.name}
  onChange={handleChange}
  placeholder="Full Name"
  className={`border px-3 py-2 w-full rounded ${
    errors.name ? "border-red-500" : ""
  }`}
  required
/>
{errors.name && (
  <p className="text-xs text-red-500">{errors.name}</p>
)}
              <select name="role" className="border px-3 py-2 w-full rounded" required>
                <option value="">Select Role</option>
                <option value="Teacher">Teacher</option>
                <option value="Principal">Principal</option>
                <option value="Accountant">Accountant</option>
                <option value="Admin">Admin</option>
                <option value="HR">HR</option>
                <option value="Receptionist">Receptionist</option>
                <option value="Admission">Admission</option>
                <option value="Transport">Transport</option>
                <option value="Other">Other</option>
              </select>
              <input
  name="department"
  value={formData.department}
  onChange={handleChange}
  placeholder="Department"
  className={`border px-3 py-2 w-full rounded ${
    errors.department ? "border-red-500" : ""
  }`}
  required
/>
{errors.department && (
  <p className="text-xs text-red-500">{errors.department}</p>
)}
              <select name="status" className="border px-3 py-2 w-full rounded">
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
              </select>
              <input name="assignedClasses" placeholder="Assigned Classes (comma-separated)" className="border px-3 py-2 w-full rounded" />
              <input type="email" name="email" placeholder="Contact Email" className="border px-3 py-2 w-full rounded" required />
              <input type="password" name="password" placeholder="Password" className="border px-3 py-2 w-full rounded" required />
              <div className="flex justify-end space-x-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Add</button>
              </div>
            </form>
          </div>
        </div>

      )}

      {/* Password Update Modal */}
      {showPasswordModal && editingPassword && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
            <h3 className="text-lg font-bold mb-4">Update Password for {editingPassword.personalInfo?.name}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const newPassword = e.target.password.value;
              if (newPassword) {
                handleUpdatePassword(editingPassword._id, newPassword);
                setShowPasswordModal(false);
                setEditingPassword(null);
              }
            }} className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Current Password:</label>
                <input
                  type="text"
                  value={editingPassword.personalInfo?.password || "N/A"}
                  className="border px-3 py-2 w-full rounded bg-gray-100"
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">New Password:</label>
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

      {/* Staff Sidebar */}
      {selectedStaff && (
        <div className="fixed top-0 right-0 h-full w-[380px] bg-white border-l shadow-xl z-50 overflow-y-auto">
          <div className="flex justify-between items-start p-4 border-b">
            <div className="flex-3">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">{selectedStaff.personalInfo?.name || "N/A"}</h2>
                <button
                  onClick={() =>
                    navigate(`/admin/staff-profile/${selectedStaff._id}`, {
                      state: selectedStaff
                    })
                  }
                  className="text-sm bg-yellow-500 text-white px-4 py-1 rounded"
                >
                  View Full Profile
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Staff ID : {selectedStaff.personalInfo?.staffId || "N/A"}
              </p>
            </div>
            <button
              className="p-1 rounded hover:bg-gray-100 text-gray-500"
              onClick={() => setSelectedStaff(null)}
              aria-label="Close"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          <div className="p-4 space-y-6 text-sm">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">General Information</h3>
              <p>Staff ID : {selectedStaff.personalInfo?.staffId || "N/A"}</p>
              <p>Name : {selectedStaff.personalInfo?.name || "N/A"}</p>
              <p>Gender : {getFieldValue("Gender")}</p>
              <p>Role : {selectedStaff.personalInfo?.role || "N/A"}</p>
              <p>Department : {selectedStaff.personalInfo?.department || "N/A"}</p>
              <p>Status : {selectedStaff.status || "N/A"}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Address</h3>
              <p>Address : {getFieldValue("Address")}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Employment Details</h3>
              <p>Date of Joining : {getFieldValue("Date of Joining")}</p>
              <p>Assigned Classes : {getFieldValue("Assigned Classes")}</p>
              <p>Experience : {getFieldValue("Experience")}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Contact Information</h3>
              <p>Email : {selectedStaff.personalInfo?.email || "N/A"}</p>
              <p>Mobile Number : {getFieldValue("Mobile Number")}</p>
              <p>Emergency Contact : {getFieldValue("Emergency Contact")}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Credentials</h3>
              <p>Username : {getFieldValue("Username")}</p>
              <p>Password : {getFieldValue("Password")}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Salary Details</h3>
              <p>Current Salary : {getFieldValue("Current Salary")}</p>
              <p>Last Payment Date : {getFieldValue("Last Payment Date")}</p>
              <p>Payment Status : {getFieldValue("Payment Status")}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Other Info</h3>
              {getRemainingFields().length > 0 ? (
                getRemainingFields().map((f, i) => (
                  <p key={i}>{f.label} : {f.value || "N/A"}</p>
                ))
              ) : (
                <p className="text-gray-500 italic">No extra data</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
