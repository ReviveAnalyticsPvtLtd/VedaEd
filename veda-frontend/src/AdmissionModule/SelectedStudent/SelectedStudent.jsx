import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  FiSearch,
  FiTrash2,
  FiChevronDown,
  FiUserPlus,
  FiDownload,
  FiUpload,
} from "react-icons/fi";
import * as XLSX from "xlsx";
import HelpInfo from "../../components/HelpInfo";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../../config";

export default function SelectedStudent() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulk, setShowBulk] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
const [errors, setErrors] = useState({});
  const bulkRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    applicationId: "",
    class: "",
    section: "Pending",
    parentName: "",
    contact: "",
    email: "",
    docsVerified: false,
  });

   const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  const validateKey = (e, field) => {
  const letterOnly = ["name", "parentName"];
  const numberOnly = ["contact"];

  // LETTERS ONLY
  if (
    letterOnly.includes(field) &&
    !/^[a-zA-Z\s]$/.test(e.key) &&
    !["Backspace", "Tab"].includes(e.key)
  ) {
    e.preventDefault(); // ❌ TYPE NAHI HOGA
    setErrors((p) => ({ ...p, [field]: "Only letters allowed" }));
  }

  // NUMBERS ONLY
  if (
    numberOnly.includes(field) &&
    !/^\d$/.test(e.key) &&
    !["Backspace", "Tab"].includes(e.key)
  ) {
    e.preventDefault(); // ❌ TYPE NAHI HOGA
    setErrors((p) => ({ ...p, [field]: "Only numbers allowed" }));
  }
};
  /* ================= FETCHER ================= */
  useEffect(() => {
    fetchSelectedStudents();
  }, []);

  const fetchSelectedStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.API_BASE_URL}/admission/application/selected`);
      if (res.data.success) {
        // Transform data to match table structure
        const mappedData = res.data.data
          .filter(
            (app) =>
              (app.documentVerificationStatus || "").toLowerCase() === "verified"
          )
          .map(app => ({
            id: app._id,
            applicationId: app.applicationId || "N/A",
            name: app.personalInfo?.name || "N/A",
            class: app.personalInfo?.classApplied ||  "N/A",
            section: "Pending", // Section is usually assigned later or fetch if available
            parentName: app.parents?.father?.name || app.parents?.mother?.name || "N/A",
            contact: app.contactInfo?.phone || "N/A",
            email: app.contactInfo?.email || "N/A",
            docsVerified: (app.documentVerificationStatus || '').toLowerCase() === 'verified',
            status: "Selected"
        }));
        setStudents(mappedData);
      }
    } catch (err) {
      console.error("Error fetching selected students:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= OUTSIDE CLICK ================= */
  useEffect(() => {
    const close = (e) => {
      if (bulkRef.current && !bulkRef.current.contains(e.target)) {
        setShowBulk(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* ================= FILTER ================= */
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const searchMatch =
        (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.parentName || "").toLowerCase().includes(search.toLowerCase());
      const classMatch = classFilter ? s.class === classFilter : true;
      return searchMatch && classMatch;
    });
  }, [students, search, classFilter]);

  /* ================= CHECKBOX ================= */
  const toggleAll = (e) =>
    setSelectedIds(e.target.checked ? filteredStudents.map((s) => s.id) : []);

  const toggleOne = (id) =>
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );

  /* ================= DELETE ================= */
  const deleteOne = (id) => {
    if (window.confirm("Delete student?")) {
      setStudents((p) => p.filter((s) => s.id !== id));
      setSelectedIds((p) => p.filter((x) => x !== id));
    }
  };

  const deleteMultiple = () => {
    if (window.confirm("Delete selected students?")) {
      setStudents((p) => p.filter((s) => !selectedIds.includes(s.id)));
      setSelectedIds([]);
    }
    setShowBulk(false);
  };

  /* ================= ADD STUDENT ================= */
  const addStudent = () => {
    const { name, applicationId, class: cls, parentName, contact, email } = form;

    if (!name || !applicationId || !cls || !parentName || !contact || !email) {
      alert("Please fill all mandatory fields");
      return;
    }

    setStudents((p) => [
      ...p,
      {
        ...form,
        id: Date.now(),
        status: "Selected",
      },
    ]);

    setForm({
      name: "",
      applicationId: "",
      class: "",
      section: "Pending",
      parentName: "",
      contact: "",
      email: "",
      docsVerified: false,
    });

    setShowAdd(false);
  };

  /* ================= EXPORT ================= */
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = students.map(({ id, status, ...rest }) => rest); // exclude id/status
    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "SelectedStudents");
    XLSX.writeFile(wb, "SelectedStudents.xlsx");
  };
  const indexOfLast = currentPage * studentsPerPage;
  const indexOfFirst = indexOfLast - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage) || 1;
  /* ================= IMPORT ================= */
  const importExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const newStudents = jsonData.map((s) => ({
        ...s,
        id: Date.now() + Math.random(),
        section: s.section || "Pending",
        docsVerified: !!s.docsVerified,
        status: "Selected",
      }));

      setStudents((p) => [...p, ...newStudents]);
    };
    reader.readAsArrayBuffer(file);
  };

  return ( <div className="p-0 m-0 min-h-screen mb-14">
      <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <button className="hover:underline">Students</button>
        <span>&gt;</span>
        <span>Selected Students</span>
      </div>




       <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Selected Students</h2>
        <HelpInfo
          title="Selected Students Help"
          description={`This page shows all students who are selected.
You can search by name or parent, filter by class, add students manually, import/export Excel, and delete entries.`}
          steps={[
            "Search students using the input box",
            "Filter by class",
            "Use Bulk Actions for multiple students",
            "Add a new student manually or import via Excel",
          ]}
        />
      </div>


       <div className="mb-4 flex flex-wrap gap-2">
          <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
            Overview
          </button>
        </div>

      <div className="bg-white border rounded-lg p-4 mb-8 ">
         <h3 className="font-medium mb-3">Selected Student List</h3>
        {/* FILTER BAR */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-64">
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student / parent..."
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
            />
          </div>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">All Classes</option>
            <option value="9">Class 9</option>
            <option value="10">Class 10</option>
          </select>

          {/* BULK */}
          <div className="relative" ref={bulkRef}>
            <button
              onClick={() => setShowBulk(!showBulk)}
              className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm"
            >
              Bulk Action <FiChevronDown />
            </button>

            {showBulk && (
              <div className="absolute mt-2 w-44 bg-white border rounded shadow z-10">
                <label className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                  <FiUpload /> Import
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={importExcel}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={exportExcel}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <FiDownload /> Export
                </button>
                <button
                  onClick={deleteMultiple}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md"
          >
            <FiUserPlus /> Add Student
          </button>
        </div>

        {/* TABLE */}
        {/* TABLE */}
<div className="w-full overflow-x-auto rounded-lg border border-gray-200">
  <table className="w-full min-w-[1100px] text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 border rounded-lg">
                <input
                  type="checkbox"
                  onChange={toggleAll}
                  checked={
                    filteredStudents.length &&
                    selectedIds.length === filteredStudents.length
                  }
                />
              </th>
              <th className="p-3 border text-center">S.No</th>
              <th className="p-3 border">Application ID</th>
              <th className="p-3 border text-left">Student Name</th>
              <th className="p-3 border">Class</th>
              <th className="p-3 border">Section</th>
              <th className="p-3 border">Parent Name</th>
              <th className="p-3 border">Contact</th>
              <th className="p-3 border">Email</th>
              <th className="p-3 border">Docs</th>
              <th className="p-3 border">Action</th>
            </tr>
          </thead>

          <tbody>
           {currentStudents.map((s, index) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-3 border text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(s.id)}
                    onChange={() => toggleOne(s.id)}
                  />
                </td>
                <td className="p-3 border text-center font-medium">
  {(currentPage - 1) * studentsPerPage + index + 1}
</td>
                <td className="p-3 border text-center">{s.applicationId}</td>
                <td className="p-3 border font-medium">{s.name}</td>
                <td className="p-3 border text-center">{s.class}</td>
                <td className="p-3 border text-center">{s.section}</td>
                <td className="p-3 border text-center">{s.parentName}</td>
                <td className="p-3 border text-center">{s.contact}</td>
                <td className="p-3 border text-center">{s.email}</td>
                <td className="p-3 border text-center">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      s.docsVerified
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {s.docsVerified ? "Verified" : "Pending"}
                  </span>
                </td>
                <td className="p-3 border text-center">
                  <button
                    onClick={() => deleteOne(s.id)}
                    className="text-red-600"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
         <div className="flex justify-between items-center text-sm text-gray-500 mt-3">
  <p>Page {currentPage} of {totalPages}</p>

  <div className="space-x-2">
    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((p) => p - 1)}
      className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Previous
    </button>

    <button
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage((p) => p + 1)}
      className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Next
    </button>
  </div>
</div>
      </div>

      {/* ADD MODAL */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[420px]">
            <h3 className="font-semibold mb-4">Add Selected Student</h3>

         {[
  { k: "name", p: "Student Name" },
  { k: "applicationId", p: "Application ID" },
  { k: "class", p: "Class" },
  { k: "parentName", p: "Parent Name" },
  { k: "contact", p: "Contact Number" },
  { k: "email", p: "Email" },
].map((f) => (
  <React.Fragment key={f.k}>
    <input
      placeholder={f.p}
      value={form[f.k]}
      onKeyDown={(e) => validateKey(e, f.k)}
      onChange={(e) => {
        setErrors((p) => ({ ...p, [f.k]: "" }));
        setForm({ ...form, [f.k]: e.target.value });
      }}
      className={`w-full mb-1 px-3 py-2 border rounded text-sm ${
        errors[f.k] ? "border-red-500" : ""
      }`}
    />

    {errors[f.k] && (
      <p className="text-xs text-red-500 mb-2">
        {errors[f.k]}
      </p>
    )}
  </React.Fragment>
))}

            <label className="flex items-center gap-2 text-sm mb-4">
              <input
                type="checkbox"
                checked={form.docsVerified}
                onChange={(e) =>
                  setForm({ ...form, docsVerified: e.target.checked })
                }
              />
              Docs Verified
            </label>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)}>Cancel</button>
              <button
                onClick={addStudent}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
      {/* BOTTOM ACTION BAR */}
<div className="fixed bottom-4 left-[calc(16rem+1rem)] right-8 flex justify-between z-40">
  <button
    onClick={() => navigate("/admission/interview-list")}
    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
  >
     Back
  </button>

  <button
    onClick={() => navigate("/admission/application-offer")}
    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
  >
    Next →
  </button>
</div>
    </div>
  );
}
