//import React, { useState, useMemo } from "react";
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
//import SmallModal from "./SmallModal";
//import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";
//import { utils, writeFile } from "xlsx";
//import jsPDF from "jspdf";
//import "jspdf-autotable";
//
//const COLORS = ["#4CAF50", "#F44336", "#FF9800", "#2196F3"];
//
//export default function AttendanceReport() {
//  const [data, setData] = useState([
//    { id: 1, name: "Aarav Sharma", class: "5", section: "A", totalDays: 26, present: 22 },
//    { id: 2, name: "Priya Verma", class: "5", section: "B", totalDays: 26, present: 24 },
//    { id: 3, name: "Rohan Singh", class: "6", section: "A", totalDays: 26, present: 18 },
//    { id: 4, name: "Neha Gupta", class: "6", section: "B", totalDays: 26, present: 25 },
//    { id: 5, name: "Aman Yadav", class: "7", section: "A", totalDays: 26, present: 20 },
//    { id: 6, name: "Simran Kaur", class: "7", section: "B", totalDays: 26, present: 23 },
//    { id: 7, name: "Kunal Mehta", class: "8", section: "A", totalDays: 26, present: 21 },
//    { id: 8, name: "Alisha Khan", class: "8", section: "B", totalDays: 26, present: 19 },
//    { id: 9, name: "Vikram Patil", class: "9", section: "A", totalDays: 26, present: 17 },
//    { id: 10, name: "Tara Nair", class: "9", section: "B", totalDays: 26, present: 26 },
//  ]);
//
//  const [searchTerm, setSearchTerm] = useState("");
//  const [classFilter, setClassFilter] = useState("All");
//  const [sectionFilter, setSectionFilter] = useState("All");
//  const [sortOrder, setSortOrder] = useState("asc");
//  const [currentPage, setCurrentPage] = useState(1);
//  const [modalOpen, setModalOpen] = useState(false);
//  const [editRow, setEditRow] = useState(null);
//
//  const rowsPerPage = 8;
//
//  const classes = useMemo(() => {
//    const cls = Array.from(new Set(data.map((d) => d.class))).sort();
//    return ["All", ...cls];
//  }, [data]);
//
//  const sections = useMemo(() => {
//    const sec = Array.from(new Set(data.map((d) => d.section))).sort();
//    return ["All", ...sec];
//  }, [data]);
//
//  // Filter Logic
//  const filteredData = useMemo(() => {
//    let filtered = data.filter((item) => {
//      const matchSearch =
//        item.name.toLowerCase().includes(searchTerm.toLowerCase());
//      const matchClass = classFilter === "All" || item.class === classFilter;
//      const matchSection = sectionFilter === "All" || item.section === sectionFilter;
//      return matchSearch && matchClass && matchSection;
//    });
//
//    filtered = filtered.sort((a, b) =>
//      sortOrder === "asc" ? a.present - b.present : b.present - a.present
//    );
//
//    return filtered;
//  }, [data, searchTerm, classFilter, sectionFilter, sortOrder]);
//
//  // Pagination
//  const indexOfLast = currentPage * rowsPerPage;
//  const indexOfFirst = indexOfLast - rowsPerPage;
//  const currentRows = filteredData.slice(indexOfFirst, indexOfLast);
//  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
//
//  // Chart Data
//  const barData = filteredData.map((d) => ({
//    name: d.name,
//    present: d.present,
//    absent: d.totalDays - d.present,
//  }));
//
//  const totalDays = filteredData.reduce((a, b) => a + b.totalDays, 0);
//  const totalPresent = filteredData.reduce((a, b) => a + b.present, 0);
//
//  const pieData = [
//    { name: "Present", value: totalPresent },
//    { name: "Absent", value: totalDays - totalPresent },
//  ];
//
//  const handleSave = (rec) => {
//    if (rec.id) {
//      setData((prev) => prev.map((d) => (d.id === rec.id ? rec : d)));
//    } else {
//      setData((prev) => [...prev, { id: Date.now(), ...rec }]);
//    }
//  };
//
//  const handleDelete = (id) => {
//    setData((prev) => prev.filter((r) => r.id !== id));
//  };
//
//  const exportExcel = () => {
//    const ws = utils.json_to_sheet(filteredData);
//    const wb = utils.book_new();
//    utils.book_append_sheet(wb, ws, "Attendance");
//    writeFile(wb, "AttendanceReport.xlsx");
//  };
//
//  const exportPDF = () => {
//    const doc = new jsPDF();
//    doc.text("Attendance Report", 14, 10);
//    doc.autoTable({
//      head: [["Name", "Class", "Section", "Total", "Present", "Absent", "%"]],
//      body: filteredData.map((r) => [
//        r.name,
//        r.class,
//        r.section,
//        r.totalDays,
//        r.present,
//        r.totalDays - r.present,
//        ((r.present / r.totalDays) * 100).toFixed(1),
//      ]),
//    });
//    doc.save("AttendanceReport.pdf");
//  };
//
//  return (
//    <div className="p-0 m-0 min-h-screen">
//
//      {/* ------------ CONTAINER 1: Header + Filters -------------- */}
//      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
//
//        <div className="flex items-center justify-between mb-4">
//          <h2 className="text-lg font-semibold">Attendance Report</h2>
//
//          <div className="flex gap-2">
//            <button onClick={exportExcel} className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm">
//              Export Excel
//            </button>
//
//            <button onClick={exportPDF} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm">
//              Export PDF
//            </button>
//
//            <button
//              onClick={() => { setEditRow(null); setModalOpen(true); }}
//              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-md text-sm"
//            >
//              <FiPlus /> Add
//            </button>
//          </div>
//        </div>
//
//        {/* Filters */}
//        <div className="flex flex-col md:flex-row md:justify-between gap-3">
//          <div className="flex gap-2">
//            <select
//              className="border px-3 py-1 rounded-md "
//              value={classFilter}
//              onChange={(e) => setClassFilter(e.target.value)}
//            >
//              <option value="All">All Classes</option>
//              {classes.map((c) => (
//                <option key={c} value={c}>Class {c}</option>
//              ))}
//            </select>
//
//            <select
//              className="border px-3 py-1 rounded-md "
//              value={sectionFilter}
//              onChange={(e) => setSectionFilter(e.target.value)}
//            >
//              <option value="All">All Sections</option>
//              {sections.map((s) => (
//                <option key={s} value={s}>Section {s}</option>
//              ))}
//            </select>
//
//            <input
//              type="text"
//              placeholder="Search student..."
//              className="border px-3 py-1 rounded-md "
//              value={searchTerm}
//              onChange={(e) => setSearchTerm(e.target.value)}
//            />
//          </div>
//
//          <button
//            onClick={() => setSortOrder((s) => (s === "asc" ? "desc" : "asc"))}
//            className="bg-gray-100 px-3 py-1 rounded-md text-sm"
//          >
//            Sort by Attendance ({sortOrder === "asc" ? "↑" : "↓"})
//          </button>
//        </div>
//      </div>
//
//      {/* ------------ CONTAINER 2: Charts -------------- */}
//      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
//
//        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//
//          {/* Bar Chart */}
//          <div className="bg-white border rounded-lg p-4 shadow-sm">
//            <h3 className="font-semibold mb-3">Student Attendance</h3>
//            <div style={{ height: 260 }}>
//              <ResponsiveContainer>
//                <BarChart data={barData}>
//                  <CartesianGrid strokeDasharray="3 3" />
//                  <XAxis dataKey="name" hide />
//                  <YAxis />
//                  <Tooltip />
//                  <Bar dataKey="present" stackId="a" fill="#4CAF50" />
//                  <Bar dataKey="absent" stackId="a" fill="#F44336" />
//                </BarChart>
//              </ResponsiveContainer>
//            </div>
//          </div>
//
//          {/* Pie Chart */}
//          <div className="bg-white border rounded-lg p-4 shadow-sm">
//            <h3 className="font-semibold mb-3">Overall Attendance</h3>
//            <div style={{ height: 260 }}>
//              <ResponsiveContainer>
//                <PieChart>
//                  <Pie
//                    data={pieData}
//                    dataKey="value"
//                    outerRadius={80}
//                    label
//                  >
//                    {pieData.map((_, i) => (
//                      <Cell key={i} fill={COLORS[i]} />
//                    ))}
//                  </Pie>
//                </PieChart>
//              </ResponsiveContainer>
//            </div>
//          </div>
//        </div>
//      </div>
//
//      {/* ------------ CONTAINER 3: Table + Pagination -------------- */}
//      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
//
//        <h2 className="text-lg font-semibold mb-4">Attendance List</h2>
//
//        <div className="overflow-x-auto">
//          <table className="w-full ">
//            <thead className="bg-gray-50 text-gray-700">
//              <tr>
//                <th className="px-4 py-3 text-left">Name</th>
//                <th className="px-4 py-3 text-center">Class</th>
//                <th className="px-4 py-3 text-center">Section</th>
//                <th className="px-4 py-3 text-center">Total Days</th>
//                <th className="px-4 py-3 text-center">Present</th>
//                <th className="px-4 py-3 text-center">Absent</th>
//                <th className="px-4 py-3 text-center">% Attendance</th>
//                <th className="px-4 py-3 text-center">Actions</th>
//              </tr>
//            </thead>
//
//            <tbody>
//              {currentRows.length === 0 ? (
//                <tr>
//                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
//                    No records available
//                  </td>
//                </tr>
//              ) : (
//                currentRows.map((row) => {
//                  const absent = row.totalDays - row.present;
//                  const percent = ((row.present / row.totalDays) * 100).toFixed(1);
//
//                  return (
//                    <tr key={row.id} className="border-t hover:bg-blue-50">
//                      <td className="px-4 py-3">{row.name}</td>
//                      <td className="px-4 py-3 text-center">{row.class}</td>
//                      <td className="px-4 py-3 text-center">{row.section}</td>
//                      <td className="px-4 py-3 text-center">{row.totalDays}</td>
//                      <td className="px-4 py-3 text-center">{row.present}</td>
//                      <td className="px-4 py-3 text-center">{absent}</td>
//                      <td className="px-4 py-3 text-center">{percent}%</td>
//                      <td className="px-4 py-3 text-center">
//                        <div className="flex justify-center gap-2">
//                          <button
//                            className="text-blue-600 hover:text-blue-800"
//                            onClick={() => { setEditRow(row); setModalOpen(true); }}
//                          >
//                            <FiEdit />
//                          </button>
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
//        {/* Pagination same as Academic */}
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
//        onClose={() => { setModalOpen(false); setEditRow(null); }}
//        onSave={handleSave}
//        onImport={() => {}}
//        editRow={editRow}
//        fields={["name", "class", "section", "totalDays", "present"]}
//        title="Attendance Record"
//      />
//    </div>
//  );
//}

export default function AttendanceReport() {
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
          Attendance Report
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
