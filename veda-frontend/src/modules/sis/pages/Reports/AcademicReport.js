//import React, { useState, useMemo, useEffect } from "react";
//import {
//  BarChart,
//  Bar,
//  XAxis,
//  YAxis,
//  Tooltip,
//  PieChart,
//  Pie,
//  Cell,
//  ResponsiveContainer,
//  CartesianGrid,
//} from "recharts";
//
//import SmallModal from "./SmallModal";
//import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";
//import * as XLSX from "xlsx";
//import jsPDF from "jspdf";
//import autoTable from "jspdf-autotable";
//import config from "../../config";
//
//// API_BASE removed, using config.API_BASE_URL instead
//const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#d32f2f"];
//
//const calculateGrade = (marks) => {
//  const m = Number(marks);
//  if (Number.isNaN(m)) return "N/A";
//  if (m >= 90) return "A";
//  if (m >= 75) return "B";
//  if (m >= 60) return "C";
//  if (m >= 45) return "D";
//  return "E";
//};
//
//export default function AcademicReport() {
//  const [data, setData] = useState([]);
//  const [currentPage, setCurrentPage] = useState(1);
//  const [sortOrder, setSortOrder] = useState("desc");
//  const [searchTerm, setSearchTerm] = useState("");
//
//  const [modalOpen, setModalOpen] = useState(false);
//  const [editRow, setEditRow] = useState(null);
//
//  const [filterClass, setFilterClass] = useState("All");
//  const [filterSection, setFilterSection] = useState("All");
//
//  const rowsPerPage = 10;
//
//  // Load dummy + API
//  useEffect(() => {
//    const dummy = [
//      {
//        id: 1,
//        name: "Aarav Sharma",
//        class: "5",
//        section: "A",
//        subject: "Math",
//        marks: 92,
//        grade: "A",
//        prevMarks: 87,
//      },
//      {
//        id: 2,
//        name: "Priya Verma",
//        class: "5",
//        section: "B",
//        subject: "Science",
//        marks: 85,
//        grade: "B",
//        prevMarks: 78,
//      },
//      {
//        id: 3,
//        name: "Rohan Singh",
//        class: "6",
//        section: "A",
//        subject: "English",
//        marks: 78,
//        grade: "C",
//        prevMarks: 74,
//      },
//      {
//        id: 4,
//        name: "Ananya Gupta",
//        class: "6",
//        section: "A",
//        subject: "Math",
//        marks: 66,
//        grade: "D",
//        prevMarks: 69,
//      },
//      {
//        id: 5,
//        name: "Vikram Malhotra",
//        class: "7",
//        section: "C",
//        subject: "Science",
//        marks: 59,
//        grade: "E",
//        prevMarks: 61,
//      },
//      {
//        id: 6,
//        name: "Kavya Kapoor",
//        class: "5",
//        section: "A",
//        subject: "English",
//        marks: 88,
//        grade: "B",
//        prevMarks: 81,
//      },
//    ];
//
//    setData(dummy);
//
//    fetch(`${config.API_BASE_URL}/academic`)
//      .then((res) => res.json())
//      .then((json) => {
//        if (Array.isArray(json) && json.length > 0) setData(json);
//      })
//      .catch(() => { });
//  }, []);
//
//  useEffect(() => setCurrentPage(1), [
//    searchTerm,
//    filterClass,
//    filterSection,
//    sortOrder,
//  ]);
//
//  // Filter + Search + Sort
//  const filteredData = useMemo(() => {
//    let d = [...data];
//
//    if (searchTerm.trim()) {
//      d = d.filter((item) =>
//        item.name.toLowerCase().includes(searchTerm.toLowerCase())
//      );
//    }
//
//    if (filterClass !== "All") {
//      d = d.filter((i) => i.class === filterClass);
//    }
//
//    if (filterSection !== "All") {
//      d = d.filter((i) => i.section === filterSection);
//    }
//
//    d = d.sort((a, b) =>
//      sortOrder === "asc" ? a.marks - b.marks : b.marks - a.marks
//    );
//
//    return d;
//  }, [data, searchTerm, filterClass, filterSection, sortOrder]);
//
//  const indexOfLast = currentPage * rowsPerPage;
//  const indexOfFirst = indexOfLast - rowsPerPage;
//  const currentRows = filteredData.slice(indexOfFirst, indexOfLast);
//  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
//
//  // Stats
//  const subjectAvg = useMemo(() => {
//    const group = {};
//    filteredData.forEach((d) => {
//      const subj = d.subject;
//      if (!group[subj]) group[subj] = [];
//      group[subj].push(Number(d.marks));
//    });
//
//    return Object.entries(group).map(([subject, arr]) => ({
//      subject,
//      avg: (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1),
//    }));
//  }, [filteredData]);
//
//  const gradeDistribution = useMemo(() => {
//    const g = {};
//    filteredData.forEach((d) => {
//      g[d.grade] = (g[d.grade] || 0) + 1;
//    });
//    return Object.entries(g).map(([grade, count]) => ({ grade, count }));
//  }, [filteredData]);
//
//  const topPerformers = [...filteredData]
//    .sort((a, b) => b.marks - a.marks)
//    .slice(0, 5);
//
//  const passFail = useMemo(() => {
//    let pass = 0,
//      fail = 0;
//    filteredData.forEach((d) => (d.marks >= 40 ? pass++ : fail++));
//    return { pass, fail };
//  }, [filteredData]);
//
//  const overallAvg = useMemo(() => {
//    if (!filteredData.length) return "0";
//    return (
//      filteredData.reduce((a, b) => a + Number(b.marks), 0) /
//      filteredData.length
//    ).toFixed(1);
//  }, [filteredData]);
//
//  // SAVE / UPDATE / DELETE (unchanged)
//  const handleSave = async (rec) => {
//    const p = { ...rec, marks: Number(rec.marks) };
//    if (!p.grade) p.grade = calculateGrade(p.marks);
//
//    if (editRow) {
//      try {
//        await fetch(`${config.API_BASE_URL}/academic/${editRow.id}`, {
//          method: "PUT",
//          headers: { "Content-Type": "application/json" },
//          body: JSON.stringify(p),
//        });
//      } catch { }
//    } else {
//      try {
//        await fetch(`${config.API_BASE_URL}/academic`, {
//          method: "POST",
//          headers: { "Content-Type": "application/json" },
//          body: JSON.stringify(p),
//        });
//      } catch { }
//    }
//
//    try {
//      const res = await fetch(`${config.API_BASE_URL}/academic`);
//      const json = await res.json();
//      if (Array.isArray(json)) setData(json);
//    } catch {
//      if (editRow) {
//        setData((prev) =>
//          prev.map((r) => (r.id === editRow.id ? { ...r, ...p } : r))
//        );
//      } else {
//        setData((prev) => [{ id: Date.now(), ...p }, ...prev]);
//      }
//    }
//
//    setEditRow(null);
//    setModalOpen(false);
//  };
//
//  const handleDelete = async (id) => {
//    if (!window.confirm("Remove this record?")) return;
//
//    try {
//      await fetch(`${config.API_BASE_URL}/academic/${id}`, { method: "DELETE" });
//    } catch { }
//
//    setData((prev) => prev.filter((r) => r.id !== id));
//  };
//
//  const exportToExcel = () => {
//    const ws = XLSX.utils.json_to_sheet(filteredData);
//    const wb = XLSX.utils.book_new();
//    XLSX.utils.book_append_sheet(wb, ws, "Academic Report");
//    XLSX.writeFile(wb, "academic_report.xlsx");
//  };
//
//  const exportToPDF = () => {
//    const doc = new jsPDF();
//    doc.text("Academic Report", 14, 10);
//    autoTable(doc, {
//      head: [["Name", "Class", "Section", "Subject", "Marks", "Grade"]],
//      body: filteredData.map((r) => [
//        r.name,
//        r.class,
//        r.section,
//        r.subject,
//        r.marks,
//        r.grade,
//      ]),
//    });
//    doc.save("academic_report.pdf");
//  };
//
//  return (
//    <div className="p-0 m-0 min-h-screen">
//      {/* ----------------- Container 1: Header + Filters ----------------- */}
//      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
//        <div className="flex items-center justify-between mb-4">
//          <h2 className="text-lg font-semibold">Academic Report</h2>
//
//          <div className="flex items-center gap-2">
//            <button
//              onClick={exportToExcel}
//              className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
//            >
//              Export Excel
//            </button>
//
//            <button
//              onClick={exportToPDF}
//              className="bg-red-600 text-white px-3 py-1 rounded-md text-sm"
//            >
//              Export PDF
//            </button>
//
//            <button
//              onClick={() => {
//                setEditRow(null);
//                setModalOpen(true);
//              }}
//              className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-md text-sm"
//            >
//              <FiPlus /> Add Record
//            </button>
//          </div>
//        </div>
//
//        {/* Filters */}
//        <div className="flex flex-col md:flex-row md:justify-between gap-3">
//          <div className="flex gap-2">
//            <select
//              className="border px-3 py-1 rounded-md "
//              value={filterClass}
//              onChange={(e) => setFilterClass(e.target.value)}
//            >
//              <option value="All">All Classes</option>
//              <option value="5">Class 5</option>
//              <option value="6">Class 6</option>
//              <option value="7">Class 7</option>
//            </select>
//
//            <select
//              className="border px-3 py-1 rounded-md "
//              value={filterSection}
//              onChange={(e) => setFilterSection(e.target.value)}
//            >
//              <option value="All">All Sections</option>
//              <option value="A">Section A</option>
//              <option value="B">Section B</option>
//            </select>
//
//            <input
//              type="text"
//              placeholder="Search student..."
//              value={searchTerm}
//              onChange={(e) => setSearchTerm(e.target.value)}
//              className="border px-3 py-1 rounded-md "
//            />
//          </div>
//
//          <button
//            onClick={() =>
//              setSortOrder((s) => (s === "asc" ? "desc" : "asc"))
//            }
//            className="bg-gray-100 px-3 py-1 rounded-md "
//          >
//            Sort by Marks ({sortOrder === "asc" ? "↑" : "↓"})
//          </button>
//        </div>
//      </div>
//
//      {/* ----------------- Container 2: Stats + Charts ----------------- */}
//      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
//        {/* Stats Cards */}
//        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//          <div className="bg-white p-4 rounded-lg border shadow-sm">
//            <p className=" text-gray-500">Overall Average</p>
//            <p className="text-2xl font-semibold text-gray-800 mt-2">
//              {overallAvg}%
//            </p>
//          </div>
//
//          <div className="bg-white p-4 rounded-lg border shadow-sm">
//            <p className=" text-gray-500">Pass</p>
//            <p className="text-2xl font-semibold text-green-600 mt-2">
//              {passFail.pass}
//            </p>
//          </div>
//
//          <div className="bg-white p-4 rounded-lg border shadow-sm">
//            <p className=" text-gray-500">Fail</p>
//            <p className="text-2xl font-semibold text-red-600 mt-2">
//              {passFail.fail}
//            </p>
//          </div>
//
//          <div className="bg-white p-4 rounded-lg border shadow-sm">
//            <p className="text-gray-500">Top Performers</p>
//            <div className="mt-2 space-y-1">
//              {topPerformers.slice(0, 3).map((t) => (
//                <p key={t.id} className="text-sm text-gray-700">
//                  {t.name}{" "}
//                  <span className=" text-gray-400">• {t.marks}%</span>
//                </p>
//              ))}
//            </div>
//          </div>
//        </div>
//
//        {/* Charts */}
//        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//          <div className="bg-white border rounded-lg p-4 shadow-sm">
//            <h3 className="font-semibold mb-3">Subject Wise Average</h3>
//            <div style={{ height: 260 }}>
//              <ResponsiveContainer>
//                <BarChart data={subjectAvg}>
//                  <CartesianGrid strokeDasharray="3 3" />
//                  <XAxis dataKey="subject" />
//                  <YAxis />
//                  <Tooltip />
//                  <Bar dataKey="avg" fill="#3b82f6" />
//                </BarChart>
//              </ResponsiveContainer>
//            </div>
//          </div>
//
//          <div className="bg-white border rounded-lg p-4 shadow-sm">
//            <h3 className="font-semibold mb-3">Grade Distribution</h3>
//            <div style={{ height: 260 }}>
//              <ResponsiveContainer>
//                <PieChart>
//                  <Pie
//                    data={gradeDistribution}
//                    dataKey="count"
//                    nameKey="grade"
//                    outerRadius={80}
//                    label
//                  >
//                    {gradeDistribution.map((_, i) => (
//                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
//                    ))}
//                  </Pie>
//                </PieChart>
//              </ResponsiveContainer>
//            </div>
//          </div>
//        </div>
//      </div>
//
//      {/* ----------------- Container 3: Table ----------------- */}
//      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
//        <h2 className=" font-semibold mb-4">Student Marks List</h2>
//
//        <div className="overflow-x-auto">
//          <table className="w-full ">
//            <thead className="bg-gray-50 text-gray-700">
//              <tr>
//                <th className="px-4 py-3 text-left">Student</th>
//                <th className="px-4 py-3 text-center">Class</th>
//                <th className="px-4 py-3 text-center">Section</th>
//                <th className="px-4 py-3 text-left">Subject</th>
//                <th className="px-4 py-3 text-center">Marks</th>
//                <th className="px-4 py-3 text-center">Trend</th>
//                <th className="px-4 py-3 text-center">Grade</th>
//                <th className="px-4 py-3 text-center">Status</th>
//                <th className="px-4 py-3 text-center">Actions</th>
//              </tr>
//            </thead>
//
//            <tbody>
//              {currentRows.length === 0 ? (
//                <tr>
//                  <td
//                    colSpan={9}
//                    className="px-4 py-6 text-center text-gray-500"
//                  >
//                    No records found.
//                  </td>
//                </tr>
//              ) : (
//                currentRows.map((row) => {
//                  const trend = row.marks - row.prevMarks;
//                  const isTopper = row.marks === topPerformers[0]?.marks;
//
//                  return (
//                    <tr
//                      key={row.id}
//                      className={`border-t hover:bg-blue-50 ${isTopper ? "bg-blue-50/40 font-medium" : ""
//                        }`}
//                    >
//                      <td className="px-4 py-3">{row.name}</td>
//                      <td className="px-4 py-3 text-center">{row.class}</td>
//                      <td className="px-4 py-3 text-center">{row.section}</td>
//
//                      <td className="px-4 py-3">
//                        <span className="px-2 py-1 bg-gray-100 rounded-md">
//                          {row.subject}
//                        </span>
//                      </td>
//
//                      <td className="px-4 py-3 text-center">{row.marks}</td>
//
//                      <td className="px-4 py-3 text-center">
//                        {trend > 0 ? (
//                          <span className="text-green-600 font-semibold">
//                            ▲ {trend}
//                          </span>
//                        ) : trend < 0 ? (
//                          <span className="text-red-600 font-semibold">
//                            ▼ {Math.abs(trend)}
//                          </span>
//                        ) : (
//                          <span className="text-gray-400">—</span>
//                        )}
//                      </td>
//
//                      <td className="px-4 py-3 text-center">
//                        <span
//                          className={`px-2 py-1 rounded-md text-white ${row.grade === "A"
//                              ? "bg-green-600"
//                              : row.grade === "B"
//                                ? "bg-blue-600"
//                                : row.grade === "C"
//                                  ? "bg-yellow-500 text-black"
//                                  : row.grade === "D"
//                                    ? "bg-orange-500"
//                                    : "bg-red-600"
//                            }`}
//                        >
//                          {row.grade}
//                        </span>
//                      </td>
//
//                      <td className="px-4 py-3 text-center">
//                        {row.marks >= 40 ? (
//                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md">
//                            Pass
//                          </span>
//                        ) : (
//                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md">
//                            Fail
//                          </span>
//                        )}
//                      </td>
//
//                      <td className="px-4 py-3 text-center">
//                        <div className="flex justify-center gap-2">
//                          <button
//                            className="text-blue-600 hover:text-blue-800"
//                            onClick={() => {
//                              setEditRow(row);
//                              setModalOpen(true);
//                            }}
//                          >
//                            <FiEdit />
//                          </button>
//
//                          <button
//                            className="text-red-600 hover:text-red-800"
//                            onClick={() => handleDelete(row.id)}
//                          >
//                            <FiTrash2 />
//                          </button>
//                        </div>
//                      </td>
//                    </tr>
//                  );
//                })
//              )}
//            </tbody>
//          </table>
//        </div>
//
//        {/* Pagination */}
//        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
//          <p>
//            Page {currentPage} of {totalPages}
//          </p>
//
//          <div className="space-x-2">
//            <button
//              disabled={currentPage === 1}
//              onClick={() => setCurrentPage(currentPage - 1)}
//              className="px-3 py-1 border rounded disabled:opacity-50"
//            >
//              Previous
//            </button>
//
//            <button
//              disabled={currentPage === totalPages}
//              onClick={() => setCurrentPage(currentPage + 1)}
//              className="px-3 py-1 border rounded disabled:opacity-50"
//            >
//              Next
//            </button>
//          </div>
//        </div>
//      </div>
//
//      {/* Modal */}
//      <SmallModal
//        open={modalOpen}
//        onClose={() => {
//          setModalOpen(false);
//          setEditRow(null);
//        }}
//        onSave={handleSave}
//        fields={["name", "class", "section", "subject", "marks", "grade", "prevMarks"]}
//        editRow={editRow}
//        title="Academic Record"
//      />
//    </div>
//  );
//}

export default function AcademicReport() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3l8 4v5c0 4.5-3 7.8-8 9-5-1.2-8-4.5-8-9V7l8-4z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900">
          Academic Report
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          The Report module is currently under development.
          <br />
          We’re working on a better experience for you.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
          Coming Soon
        </div>
      </div>
    </div>
  );
}
