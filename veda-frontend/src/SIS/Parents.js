import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiUpload, FiSearch, FiTrash2, FiEdit, FiDownload, FiChevronDown } from "react-icons/fi";
import HelpInfo from "../components/HelpInfo";
import { toastBannerClassName } from "../utils/toastMessageStyle";
import api from "../services/apiClient";
import ProfileAvatar from "../components/ProfileAvatar";

function formatDateTime(value) {
  if (value == null || value === "") return "N/A";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleString();
}

export default function Parents() {
  const [selectedParents, setSelectedParents] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [parents, setParents] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loginPage, setLoginPage] = useState(1);
  const [selectedParent, setSelectedParent] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState(null);
  const [nextParentId, setNextParentId] = useState("");
const [errors, setErrors] = useState({});
  const dropdownRef = useRef(null);
  const bulkActionRef = useRef(null);
  const roleDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const parentsPerPage = 10;
  const navigate = useNavigate();
const [formData, setFormData] = useState({
  name: "",
  phone: "",
});
  // Fetch parents from backend for shivam
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const res = await api.get(`/parents`, {
          params: {
            keyword: search,
            role: filterRole
          }
        });
        console.log("Fetched parents data:", JSON.stringify(res.data, null, 2));
        setParents(res.data.parents);
      } catch (err) {
        console.error("Error fetching parents:", err);
      }
    };
    fetchParents();
  }, [search, filterRole]);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowOptions(false);
      }
      if (bulkActionRef.current && !bulkActionRef.current.contains(e.target)) {
        setShowBulkActions(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setShowRoleDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showForm) {
      const fetchNextId = async () => {
        try {
          const res = await api.get("/parents/next-id");
          if (res.data.success) {
            setNextParentId(res.data.nextParentId);
          }
        } catch (err) {
          console.error("Error fetching next parent ID:", err);
        }
      };
      fetchNextId();
    }
  }, [showForm]);

  //Import Excel send to backend  for shivam
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
        const res = await api.post(`/parents/import`, data);
        if (res.data.success) {
          // Re-fetch parents to show new data
          const updatedRes = await api.get(`/parents`);
          setParents(updatedRes.data.parents);
          
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
        console.error("Error importing parents:", err);
        const errMsg = err.response?.data?.message || err.message || "Server error";
        setSuccessMsg(`Error connecting to server ❌: ${errMsg}`);
        setTimeout(() => setSuccessMsg(""), 5000);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // reset file input
  };
const handleChange = (e) => {
  const { name, value } = e.target;

  const letterOnly = ["name"];
  const numberOnly = ["phone"];

  // LETTER ONLY
  if (letterOnly.includes(name)) {
    if (!/^[a-zA-Z\s]*$/.test(value)) {
      setErrors((p) => ({ ...p, [name]: "Only letters allowed" }));
      return; // ❌ yahi rok raha hai update
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

  // ✅ VALUE UPDATE only if valid
  setFormData((prev) => ({ ...prev, [name]: value }));
};
  // Add Parent Manually send to backend shivam bro ke liye
  const handleAddManually = async (e) => {
    e.preventDefault();
    const form = e.target;
    const newParent = {
      parentId: form.parentId.value,
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      linkedStudentId: [form.studentId.value], // ✅ fix: send array
      role: form.role.value,
      status: "Active",
      password: form.password.value || "default123",
    };
if (errors.name || errors.phone) {
  setSuccessMsg("Fix errors first ❌");
  return;
}
    try {
      console.log("Sending parent data to backend:", JSON.stringify(newParent, null, 2));
      const res = await api.post(`/parents`, newParent);
      console.log("Backend response:", JSON.stringify(res.data, null, 2));
      setParents([res.data.parent, ...parents]); // changed-----------------------
      setShowForm(false);
      setSuccessMsg("Parent added successfully ");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error adding parent:", err);
      setSuccessMsg("Failed to add parent ❌");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  //  Delete Parent for backend points
  const handleDelete = async (id) => {
    try {
      if (window.confirm("Are you sure you want to delete this parent?")) {
        await api.delete(`/parents/${id}`);
        setParents(parents.filter((p) => p._id !== id));
        setSuccessMsg("Parent deleted ");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Error deleting parent:", err);
    }
  };
  const handleSelectParent = (parentId) => {
  setSelectedParents((prev) =>
    prev.includes(parentId)
      ? prev.filter((id) => id !== parentId)
      : [...prev, parentId]
  );
};

const handleSelectAllParents = () => {
  const currentParentIds = currentParents.map((p) => p._id);

  const isAllSelected = currentParentIds.every((id) =>
    selectedParents.includes(id)
  );

  if (isAllSelected) {
    setSelectedParents((prev) =>
      prev.filter((id) => !currentParentIds.includes(id))
    );
  } else {
    setSelectedParents((prev) => [
      ...new Set([...prev, ...currentParentIds]),
    ]);
  }
};

const handleBulkExport = () => {
  if (selectedParents.length === 0) {
    setSuccessMsg("Please select parents first");
    setTimeout(() => setSuccessMsg(""), 3000);
    return;
  }

  const selectedData = parents.filter((p) =>
    selectedParents.includes(p._id)
  );

  const exportData = selectedData.map((p) => ({
    "Parent ID": p.parentId,
    Name: p.name,
    Email: p.email,
    Phone: p.phone,
    "Linked Student ID":
      p.children?.length > 0
        ? p.children
            .map((c) => c.stdId || c.personalInfo?.stdId)
            .filter(Boolean)
            .join(", ")
        : "N/A",
    Role: p.role,
    Status: p.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Parents"
  );

  XLSX.writeFile(
    workbook,
    "Selected_Parents.xlsx"
  );

  setShowBulkActions(false);
};

const handleBulkDelete = async () => {
  if (selectedParents.length === 0) {
    setSuccessMsg("Please select parents first");
    setTimeout(() => setSuccessMsg(""), 3000);
    return;
  }

  const confirmDelete = window.confirm(
    `Delete ${selectedParents.length} selected parents?`
  );

  if (!confirmDelete) return;

  try {
    await Promise.all(
      selectedParents.map((id) =>
        api.delete(`/parents/${id}`)
      )
    );

    setParents((prev) =>
      prev.filter(
        (p) => !selectedParents.includes(p._id)
      )
    );

    setSelectedParents([]);

    setShowBulkActions(false);

    setSuccessMsg(
      "Selected parents deleted successfully"
    );

    setTimeout(() => setSuccessMsg(""), 3000);
  } catch (err) {
    console.error(err);

    setSuccessMsg(
      "Failed to delete selected parents"
    );

    setTimeout(() => setSuccessMsg(""), 3000);
  }
};

  // Update Parent Password function
  const handleUpdatePassword = async (id, newPassword) => {
    try {
      const res = await api.put(`/parents/${id}`, {
        password: newPassword
      });
      if (res.data.success) {
        setParents(parents.map(p => p._id === id ? { ...p, password: newPassword } : p));
        setSuccessMsg("Password updated successfully ");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Error updating password:", err);
      setSuccessMsg("Failed to update password ❌");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const filteredParents = parents.filter(
    (p) =>
      ((p.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (p.parentId?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (p.children?.map(c => c.personalInfo?.stdId || c.stdId).join(", ")?.toLowerCase() || "").includes(
          search.toLowerCase()
        )) &&
      (filterRole
        ? (p.role || "").trim().toLowerCase() === filterRole.trim().toLowerCase()
        : true)
  );

  const indexOfLast = currentPage * parentsPerPage;
  const indexOfFirst = indexOfLast - parentsPerPage;
  const currentParents = filteredParents.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredParents.length / parentsPerPage) || 1;

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
      {/* Breadcrumbs */}
      <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <button
          onClick={() => {
            setActiveTab("all");
            setLoginPage(1);
          }}
          className="hover:underline"
        >
          Parents
        </button>
        <span>&gt;</span>
        <span>
          {activeTab === "all" && "All Parents"}
          {activeTab === "login" && "Manage Login"}
          {activeTab === "others" && "Reports & Permissions"}
        </span>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

        <h2 className="text-2xl font-bold shrink-0">Parents</h2>

        <HelpInfo
          title="Parents Module Help"
          description={`Page Description: Manage parent accounts and information. View parent details, contact information, and associated students. Link parents to student records and control portal access.

4.1 All Parents Tab
Description: View and manage the complete directory of all parent accounts. Display information including name, parent ID, email, phone number, linked students, role (father/mother/guardian), and account status. Search and filter parents by name, email, student association, or status. Add new parents manually or import from Excel. Link or unlink students to parent accounts. Manage parent contact information and communication preferences.
Sections:
- Parent Directory Table: Comprehensive list of all parents with key information.
- Search and Filter: Find parents by name, email, phone, or associated student.
- Parent-Student Linking: Manage relationships between parents and students.
- Contact Information: View and update parent contact details.
- Action Buttons: Add parent, import data, export directory, send communications.

4.2 Manage Login Tab
Description: Manage parent login credentials and account access. View parent login information including usernames, passwords, and account status. Reset passwords, activate/deactivate parent accounts, and manage login permissions. Search and filter parents by login status. Generate login credentials for new parents or bulk reset passwords. Configure parent portal access and notification settings.
Sections:
- Login Credentials Table: Display parent ID, name, email, username, password status, and account status.
- Search and Filter: Find parents by name, ID, email, or login status.
- Password Management: Reset individual or bulk passwords; send password reset emails.
- Account Status Management: Activate, deactivate, or suspend parent accounts.
- Portal Access Settings: Configure what information parents can access through their portal.

4.3 Reports & Permissions Tab
Description: Manage parent permissions, access rights, and generate parent-related reports. Configure what information parents can view about their children. Generate reports on parent engagement, communication history, and account usage. Manage parent categories and permissions for different types of access.
Sections:
- Permission Settings: Configure what data parents can access (grades, attendance, fees, etc.).
- Access Reports: View parent login history and portal usage statistics.
- Communication Reports: Track parent engagement with messages and notices.
- Parent Categories: Manage different parent types and their access levels.
- Export Tools: Generate parent directory reports and permission summaries.`}
        />
      </div>


      <div className="mb-3 flex shrink-0 gap-4 overflow-x-auto border-b pb-px text-sm text-gray-600 sm:gap-6">
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
          All Parents
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
          Reports & Permissions
        </button>
      </div>

      {activeTab === "all" && (
        <div className="flex min-h-0 w-full max-w-full flex-1 flex-col rounded-lg border bg-white p-3 shadow-sm sm:p-4">
          <h3 className="mb-4 text-lg font-semibold">Parent List</h3>
          <div className="mb-4 w-full space-y-3">
            <div className="flex min-w-0 max-w-full items-center rounded-md border bg-white px-3 py-2">
              <FiSearch className="mr-2 shrink-0 text-sm text-gray-500" />
              <input
                type="text"
                placeholder="Search parent name or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-w-0 outline-none"
              />
            </div>

            <div className="flex w-full min-w-0 flex-row flex-nowrap items-center justify-between gap-2 overflow-x-auto pb-1">
            <div className="flex shrink-0 flex-row flex-nowrap items-center gap-2 sm:gap-3">
            <div className="relative w-[120px] shrink-0" ref={roleDropdownRef}>
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 hover:border-blue-500"
              >
                <span>{filterRole || "Role"}</span>
                <FiChevronDown className="text-xs" />
              </button>

              {showRoleDropdown && (
                <div
                  className="absolute left-0 mt-2 w-32 bg-white border rounded-md shadow-lg z-10 text-sm max-h-60 overflow-y-auto"
                >
                  <button
                    onClick={() => {
                      setFilterRole("");
                      setShowRoleDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    All Roles
                  </button>
                  <button
                    onClick={() => {
                      setFilterRole("Primary Guardian");
                      setShowRoleDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Primary Guardian
                  </button>
                  <button
                    onClick={() => {
                      setFilterRole("Secondary Guardian");
                      setShowRoleDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Secondary Guardian
                  </button>
                </div>
              )}
            </div>

            <div className="relative min-w-[130px] shrink-0" ref={bulkActionRef}>
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="flex w-full min-w-[120px] items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 hover:border-blue-500"
              >
                <span>Bulk Action</span>
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
                className="flex items-center justify-center gap-1 whitespace-nowrap rounded-md bg-blue-600 px-4 py-2 text-white"
              >
                <FiPlus />
                Add Parent
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

          <div className="-mx-3 overflow-x-auto rounded-md border border-gray-100 px-3 sm:mx-0 sm:border-0 sm:px-0">
          <table className="min-w-[880px] w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">
  <input
    type="checkbox"
    checked={
      currentParents.length > 0 &&
      currentParents.every((p) =>
        selectedParents.includes(p._id)
      )
    }
    onChange={handleSelectAllParents}
   
  />
</th>

                <th className="p-2 border">S. no.</th>
                <th className="p-2 border">Parent ID</th>
                <th className="p-2 border">Parent Name</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Phone</th>
                <th className="p-2 border">Linked Student ID</th>
                <th className="p-2 border">Role</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentParents.map((p, idx) => (
                <tr
                  key={p._id || idx} // ✅ use Mongo _id as key
                  className="text-center hover:bg-gray-50"
                >
                  <td className="p-2 border">
  <input
    type="checkbox"
    checked={selectedParents.includes(p._id)}
    onChange={() => handleSelectParent(p._id)}
   
  />
</td>
                  <td className="p-2 border">{indexOfFirst + idx + 1}</td>
                  <td className="p-2 border">{p.parentId}</td>
                  <td className="p-2 border text-left">
                    <div className="flex items-center gap-2 ">
                      <ProfileAvatar
                        name={p.name}
                        imageSrc={p.photo}
                        sizeClassName="w-8 h-8 min-w-[2rem] min-h-[2rem]"
                        textClassName="text-xs"
                      />
                      <span>{p.name}</span></div>
                  </td>
                  <td className="p-2 border">{p.email}</td>
                  <td className="p-2 border">{p.phone}</td>
                  <td className="p-2 border">
                    {p.children?.length > 0 ? p.children.map((c) => c.stdId || c.personalInfo?.stdId).filter(Boolean).join(", ") : "N/A"}
                  </td>
                  <td className="p-2 border">{p.role || "Parent"}</td>
                  <td className="p-2 border">{p.status}</td>
                  <td className="p-2 border">
                    <button
                      className="text-blue-500"
                      onClick={() => setSelectedParent(p)}
                      title="View"
                    >
                      <FiSearch />
                    </button>
                    <button
                      className="text-red-500 ml-2"
                      onClick={() => handleDelete(p._id)}
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
          </div>
          <div className="mt-3 flex flex-col gap-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex justify-end gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

      )}

      {/* Login Management Tab */}
      {activeTab === "login" && (() => {
        const filteredLoginParents = parents.filter(
          (p) =>
          ((p.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
            (p.parentId?.toLowerCase() || "").includes(search.toLowerCase()) ||
            (p.children?.map(c => c.personalInfo?.stdId || c.stdId).join(", ")?.toLowerCase() || "").includes(
              search.toLowerCase()
            ))
        );

        const loginIndexOfLast = loginPage * parentsPerPage;
        const loginIndexOfFirst = loginIndexOfLast - parentsPerPage;
        const currentLoginParents = filteredLoginParents.slice(loginIndexOfFirst, loginIndexOfLast);
        const loginTotalPages = Math.ceil(filteredLoginParents.length / parentsPerPage) || 1;

        return (
          <div className="flex min-h-0 w-full max-w-full flex-1 flex-col rounded-lg border bg-white p-3 shadow-sm sm:p-4">
            <h3 className="mb-4 text-lg font-semibold">Login Credentials</h3>
            <div className="mb-4 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex min-w-0 max-w-full flex-1 items-center rounded-md border bg-white px-3 py-2 sm:max-w-md">
                <FiSearch className="mr-2 shrink-0 text-sm text-gray-500" />
                <input
                  type="text"
                  placeholder="Search parent name or ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full min-w-0 outline-none"
                />
              </div>

              <div className="relative w-full shrink-0 sm:w-auto" ref={statusDropdownRef}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 hover:border-blue-500 sm:w-[120px]"
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
            <div className="-mx-3 overflow-x-auto rounded-md border border-gray-100 px-3 sm:mx-0 sm:border-0 sm:px-0">
            <table className="min-w-[720px] w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">S. no.</th>
                  <th className="p-2 border">Parent ID</th>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Username</th>
                  <th className="p-2 border">Password</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentLoginParents.map((p, idx) => (
                  <tr
                    key={p._id || idx}
                    className="text-center hover:bg-gray-50"
                  >
                    <td className="p-2 border">{loginIndexOfFirst + idx + 1}</td>
                    <td className="p-2 border">
                      {p.parentId || "N/A"}
                    </td>
                    <td className="p-2 border text-left">
                      <div className="flex items-center gap-2">
                        <ProfileAvatar
                          name={p.name}
                          imageSrc={p.photo}
                          sizeClassName="w-8 h-8 min-w-[2rem] min-h-[2rem]"
                          textClassName="text-xs"
                        />
                        <span>{p.name || "N/A"}</span>
                      </div>
                    </td>
                    <td className="p-2 border">
                      {p.email || "N/A"}
                    </td>
                    <td className="p-2 border">
                      {p.parentId || "N/A"}
                    </td>
                    <td className="p-2 border">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-gray-500">••••••••</span>
                        <button
                          className="text-blue-500 hover:text-blue-700 text-xs"
                          onClick={() => {
                            setEditingPassword(p);
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
                          setEditingPassword(p);
                          setShowPasswordModal(true);
                        }}
                        title="Edit"
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
                            handleDelete(p._id);
                          }
                        }}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
                {currentLoginParents.length === 0 && (
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

            <div className="mt-3 flex flex-col gap-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Page {loginPage} of {loginTotalPages}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  disabled={loginPage === 1}
                  onClick={() => setLoginPage(loginPage - 1)}
                  className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={loginPage === loginTotalPages}
                  onClick={() => setLoginPage(loginPage + 1)}
                  className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-4">Add Parent Manually</h3>
            <form onSubmit={handleAddManually} className="space-y-3">
              <input
                name="parentId"
                placeholder="Parent ID"
                defaultValue={nextParentId}
                className="border px-3 py-2 w-full rounded bg-gray-50"
              />
        <input
  name="name"
  value={formData.name}
  onChange={handleChange}
  className={`border px-3 py-2 w-full rounded ${
    errors.name ? "border-red-500" : ""
  }`}
  placeholder="Name"
/>
{errors.name && (
  <p className="text-xs text-red-500">{errors.name}</p>
)}
              <input
                name="email"
                placeholder="Email"
                className="border px-3 py-2 w-full rounded"
              />
           <input
  name="phone"
  value={formData.phone}
  onChange={handleChange}
  maxLength={10}
  className={`border px-3 py-2 w-full rounded ${
    errors.phone ? "border-red-500" : ""
  }`}
  placeholder="Phone"
/>
{errors.phone && (
  <p className="text-xs text-red-500">{errors.phone}</p>
)}
              <input
                name="studentId"
                placeholder="Linked Student ID"
                className="border px-3 py-2 w-full rounded"
                required
              />
              <select name="role" className="border px-3 py-2 w-full rounded">
                <option value="Primary Guardian">Primary Guardian</option>
                <option value="Secondary Guardian">Secondary Guardian</option>
              </select>
              <input
                name="password"
                placeholder="Password"
                defaultValue="default123"
                className="border px-3 py-2 w-full rounded"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
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
      {selectedParent && (
        <div className="fixed inset-y-0 right-0 z-50 h-full w-full max-w-[380px] overflow-y-auto border-l bg-white shadow-xl">
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 gap-3">
              <ProfileAvatar
                name={selectedParent.name}
                imageSrc={selectedParent.photo}
                sizeClassName="w-12 h-12 shrink-0"
                textClassName="text-lg"
              />
              <div className="flex-3 min-w-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <h2 className="text-xl font-semibold break-words">{selectedParent.name}</h2>
                <button
                  onClick={() =>
                    navigate(`/admin/parent-profile/${selectedParent._id}`, {
                      state: selectedParent,
                    })
                  }
                  className="rounded bg-yellow-500 px-4 py-2 text-sm text-white sm:px-8 sm:py-1"
                >
                  View Full Profile
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Parent ID : {selectedParent.parentId}
              </p>
            </div>
            </div>
            <button
              className="p-1 rounded hover:bg-gray-100 text-gray-500 shrink-0"
              onClick={() => setSelectedParent(null)}
            >
              <FiX className="text-xl" />
            </button>
          </div>

          <div className="p-4 space-y-6 text-sm">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                General Information
              </h3>
              <p>Email : {selectedParent.email}</p>
              <p>Phone : {selectedParent.phone}</p>
              <p>
                Children :{" "}
                {selectedParent.children
                  ?.map((c) => c.stdId || c.personalInfo?.stdId)
                  .join(", ")}
              </p>
              <p>Status : {selectedParent.status}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Account</h3>
              <p>Password : {selectedParent.password}</p>
              <p>
                Created At :{" "}
                {formatDateTime(selectedParent.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Password Update Modal */}
      {showPasswordModal && editingPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-4">Update Password for {editingPassword.name}</h3>
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
                  value={editingPassword.password}
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
    </div>
  );
}
