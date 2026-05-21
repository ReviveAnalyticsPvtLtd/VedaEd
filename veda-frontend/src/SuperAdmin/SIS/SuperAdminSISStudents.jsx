import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import {
  FiPlus,
  FiUpload,
  FiSearch,
  FiTrash2,
  FiEdit,
  FiUser,
  FiDownload,
  FiChevronDown,
} from "react-icons/fi";



/* =========================
   Utility
========================= */
function normalizeStudentRow(s, idx = 0) {
  return {
    ...s,
    id: s._id || idx + 1,
    _id: s._id || `temp-${idx}`,
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
    photo:
      s.photo ||
      s.personalInfo?.image?.url ||
      "https://via.placeholder.com/80",
    address:
      s.address ||
      s.personalInfo?.address ||
      s.contactInfo?.address ||
      "",
    attendance: s.attendance || "-",
  };
}

/* =========================
   COMPONENT
========================= */
export default function SuperAdminSISStudents() {
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

  /* =========================
     DATA LOADERS (API REMOVED)
  ========================= */
  const loadStudents = useCallback(async () => {
    // 🔴 API REMOVED FOR SUPERADMIN
    // Placeholder static data (can be empty)
    const dummy = [];
    setStudents(dummy.map((s, i) => normalizeStudentRow(s, i)));
  }, []);

  useEffect(() => {
    // 🔴 API REMOVED
    setClasses([]);
    setSections([]);
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (activeTab !== "login") {
      setVisibleLoginPasswords({});
    }
  }, [activeTab]);

  /* =========================
     CLICK OUTSIDE HANDLER
  ========================= */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowOptions(false);
      if (bulkActionRef.current && !bulkActionRef.current.contains(e.target))
        setShowBulkActions(false);
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target))
        setShowClassDropdown(false);
      if (
        sectionDropdownRef.current &&
        !sectionDropdownRef.current.contains(e.target)
      )
        setShowSectionDropdown(false);
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(e.target)
      )
        setShowStatusDropdown(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* =========================
     FILTERS & PAGINATION
  ========================= */
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
  const currentStudents = filteredStudents.slice(
    indexOfFirst,
    indexOfLast
  );
  const totalPages =
    Math.ceil(filteredStudents.length / studentsPerPage) || 1;

  /* =========================
     NAVIGATION
  ========================= */
  const handleViewFullProfile = (studentRecord) => {
    if (!studentRecord?._id) return;

    navigate(`/superadmin/student-profile/${studentRecord._id}`, {
      state: studentRecord,
    });
  };

 

const handleSelectStudent = (id) => {
  setSelectedStudents((prev) =>
    prev.includes(id)
      ? prev.filter((x) => x !== id)
      : [...prev, id]
  );
};

const handleSelectAllStudents = (e) => {
  if (e.target.checked) {
    setSelectedStudents(currentStudents.map((s) => s._id));
  } else {
    setSelectedStudents([]);
  }
};

const handleBulkExport = () => {
  alert("Bulk export disabled for SuperAdmin (API removed)");
};

const handleBulkDelete = () => {
  if (selectedStudents.length === 0) {
    alert("No students selected");
    return;
  }
  setStudents((prev) =>
    prev.filter((s) => !selectedStudents.includes(s._id))
  );
  setSelectedStudents([]);
};

const handleDelete = (id) => {
  if (!window.confirm("Are you sure you want to delete?")) return;
  setStudents((prev) => prev.filter((s) => s._id !== id));
};
  return (
    <div className="p-0 m-0 min-h-screen">
      {successMsg && (
        <div
          role="status"
          className={`mb-4 px-3 py-2 rounded-md border text-sm font-semibold ${(
            successMsg
          )}`}
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

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Students</h2>

 
      </div>

      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        <button
          onClick={() => {
            setActiveTab("all");
            setLoginPage(1);
          }}
          className={`pb-2 ${
            activeTab === "all"
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
          className={`pb-2 ${
            activeTab === "login"
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
          className={`pb-2 ${
            activeTab === "others"
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

          {/* 🔍 Filters */}
          <div className="flex items-center gap-3 mb-4 w-full">
            <div className="flex items-center border px-3 py-2 rounded-md bg-white w-1/3 min-w-[220px]">
              <FiSearch className="text-gray-500 mr-2 text-sm" />
              <input
                type="text"
                placeholder="Search student name or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full outline-none text-sm"
              />
            </div>

            {/* Class Filter */}
            <div className="relative" ref={classDropdownRef}>
              <button
                onClick={() => setShowClassDropdown(!showClassDropdown)}
                className="border px-3 py-2 rounded-md bg-white flex items-center gap-2 w-[120px] justify-between"
              >
                <span>{filterClass || "Class"}</span>
                <FiChevronDown className="text-xs" />
              </button>

              {showClassDropdown && (
                <div className="absolute mt-2 w-32 bg-white border rounded-md shadow-lg z-10 text-sm">
                  <button
                    onClick={() => {
                      setFilterClass("");
                      setFilterSection("");
                      setShowClassDropdown(false);
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
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      {cls.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bulk Actions */}
            <div className="relative" ref={bulkActionRef}>
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="border px-3 py-2 rounded-md bg-white flex items-center gap-2"
              >
                Bulk Actions
                <FiChevronDown className="text-xs" />
              </button>

              {showBulkActions && (
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-10 text-sm">
                  <button
                    onClick={handleBulkExport}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Export Excel
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Add Student */}
            <div className="ml-auto relative" ref={dropdownRef}>
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-1"
              >
                <FiPlus /> Add Student
              </button>
            </div>
          </div>

          {/* 📋 TABLE */}
          <table className="w-full border">
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
                <tr key={s._id} className="text-center hover:bg-gray-50">
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
                  <td className="p-2 border">{s.personalInfo.stdId}</td>
                  <td className="p-2 border text-left">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-orange-500 text-white flex items-center justify-center rounded-full">
                        {s.personalInfo.name[0]}
                      </span>
                      {s.personalInfo.name}
                    </div>
                  </td>
                  <td className="p-2 border">{s.personalInfo.rollNo}</td>
                  <td className="p-2 border">{s.personalInfo.class}</td>
                  <td className="p-2 border">{s.personalInfo.section}</td>
                  <td className="p-2 border">
                    {s.personalInfo.fees === "Paid" ? (
                      <span className="text-green-600 text-xs font-semibold">
                        ● Paid
                      </span>
                    ) : (
                      <span className="text-red-600 text-xs font-semibold">
                        ● Due
                      </span>
                    )}
                  </td>
                  <td className="p-2 border">
                    <button
                      className="text-blue-500"
                      onClick={() => setSelectedStudent(s)}
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
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between items-center text-sm text-gray-500 mt-3">
            <p>
              Page {currentPage} of {totalPages}
            </p>
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
      )}{activeTab === "login" && (() => {
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
  const currentLoginStudents = filteredLoginStudents.slice(
    loginIndexOfFirst,
    loginIndexOfLast
  );
  const loginTotalPages =
    Math.ceil(filteredLoginStudents.length / studentsPerPage) || 1;

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Login Credentials</h3>

      <div className="flex items-center gap-3 mb-4 w-full">
        <div className="flex items-center border px-3 py-2 rounded-md bg-white w-1/3 min-w-[220px]">
          <FiSearch className="text-gray-500 mr-2 text-sm" />
          <input
            type="text"
            placeholder="Search student name or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none"
          />
        </div>

        <div className="relative group" ref={statusDropdownRef}>
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="border px-3 py-2 rounded-md bg-white flex items-center gap-2 w-[120px] justify-between hover:border-blue-500"
          >
            <span>{filterStatus || "Status"}</span>
            <FiChevronDown className="text-xs" />
          </button>

          {showStatusDropdown && (
            <div className="absolute left-0 mt-2 w-32 bg-white border rounded-md shadow-lg z-10 text-sm">
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

      <table className="w-full border">
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
            <tr key={s.id || idx} className="text-center hover:bg-gray-50">
              <td className="p-2 border">
                {loginIndexOfFirst + idx + 1}
              </td>
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
                    <div className="flex items-center justify-center gap-2">
                      <span>
                        {revealed
                          ? s.personalInfo?.password || "N/A"
                          : "••••••••"}
                      </span>
                      <button
                        onClick={() =>
                          setVisibleLoginPasswords((prev) => ({
                            ...prev,
                            [pwKey]: !prev[pwKey],
                          }))
                        }
                        className="text-blue-500 text-xs"
                      >
                        {revealed ? "Hide" : "Show"}
                      </button>
                    </div>
                  );
                })()}
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
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete this login?"
                      )
                    ) {
                      handleDelete(s._id);
                    }
                  }}
                >
                  <FiTrash2 />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center text-sm text-gray-500 mt-3">
        <p>
          Page {loginPage} of {loginTotalPages}
        </p>
        <div className="space-x-2">
          <button
            disabled={loginPage === 1}
            onClick={() => setLoginPage(loginPage - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            disabled={loginPage === loginTotalPages}
            onClick={() => setLoginPage(loginPage + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
})()}
    </div>
  );
}