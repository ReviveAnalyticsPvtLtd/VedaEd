//import React, { useState, useMemo, useEffect } from "react";
//import axios from "axios";
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
//import * as XLSX from "xlsx";
//import jsPDF from "jspdf";
//import autoTable from "jspdf-autotable";
//import config from "../../config";
//
//const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#d32f2f"];
//
//export default function ProgressReport() {
//  const [data, setData] = useState([]);
//  const [currentPage, setCurrentPage] = useState(1);
//  const [sortOrder, setSortOrder] = useState("asc");
//  const [searchTerm, setSearchTerm] = useState("");
//  const [modalOpen, setModalOpen] = useState(false);
//  const [editRow, setEditRow] = useState(null);
//
//  const rowsPerPage = 10;
//
//  // Dummy data for demonstration
//  const dummyProgressData = [
//    { id: 1, name: "John Smith", activity: "Mathematics", progress: 85, status: "Excellent" },
//    { id: 2, name: "Sarah Johnson", activity: "Science", progress: 92, status: "Excellent" },
//    { id: 3, name: "Michael Brown", activity: "English", progress: 78, status: "Good" },
//    { id: 4, name: "Emily Davis", activity: "Mathematics", progress: 88, status: "Excellent" },
//    { id: 5, name: "David Wilson", activity: "Physical Education", progress: 95, status: "Excellent" },
//    { id: 6, name: "Jessica Martinez", activity: "Science", progress: 72, status: "Good" },
//    { id: 7, name: "Christopher Lee", activity: "English", progress: 81, status: "Good" },
//    { id: 8, name: "Amanda Taylor", activity: "Mathematics", progress: 90, status: "Excellent" },
//    { id: 9, name: "James Anderson", activity: "Art", progress: 65, status: "Average" },
//    { id: 10, name: "Lisa Thomas", activity: "Science", progress: 87, status: "Excellent" },
//    { id: 11, name: "Robert Jackson", activity: "Physical Education", progress: 79, status: "Good" },
//    { id: 12, name: "Michelle White", activity: "English", progress: 83, status: "Good" },
//    { id: 13, name: "Daniel Harris", activity: "Mathematics", progress: 76, status: "Good" },
//    { id: 14, name: "Jennifer Clark", activity: "Art", progress: 88, status: "Excellent" },
//    { id: 15, name: "Matthew Lewis", activity: "Science", progress: 74, status: "Good" },
//  ];
//
//  // ✅ Fetch data from API
//  useEffect(() => {
//    fetchData();
//  }, []);
//
//  const fetchData = async () => {
//    try {
//      const res = await axios.get(`${config.API_BASE_URL}/progress`);
//      if (res.data && res.data.length > 0) {
//        setData(res.data);
//      } else {
//        // Use dummy data if API returns empty
//        setData(dummyProgressData);
//      }
//    } catch (err) {
//      console.error("Error fetching progress report:", err);
//      // Use dummy data on error
//      setData(dummyProgressData);
//    }
//  };
//
//  const filteredData = useMemo(() => {
//    let d = data.filter((item) =>
//      (item.name || "").toLowerCase().includes((searchTerm || "").toLowerCase())
//    );
//    d = d.sort((a, b) =>
//      sortOrder === "asc"
//        ? (a.progress || 0) - (b.progress || 0)
//        : (b.progress || 0) - (a.progress || 0)
//    );
//    return d;
//  }, [sortOrder, searchTerm, data]);
//
//  const indexOfLastRow = currentPage * rowsPerPage;
//  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
//  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
//  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
//
//  const activityAvg = useMemo(() => {
//    const grouped = {};
//    data.forEach((d) => {
//      const act = d.activity || "Unknown";
//      if (!grouped[act]) grouped[act] = [];
//      grouped[act].push(Number(d.progress) || 0);
//    });
//    return Object.entries(grouped).map(([activity, progress]) => ({
//      activity,
//      avg: (progress.reduce((a, b) => a + b, 0) / progress.length).toFixed(1),
//    }));
//  }, [data]);
//
//  const statusDistribution = useMemo(() => {
//    const grouped = {};
//    data.forEach((d) => {
//      const s = d.status || "NA";
//      grouped[s] = (grouped[s] || 0) + 1;
//    });
//    return Object.entries(grouped).map(([status, count]) => ({
//      status,
//      count,
//    }));
//  }, [data]);
//
//  // ✅ Save (Add / Update API)
//  const handleSave = async (record) => {
//    try {
//      if (editRow) {
//        const res = await axios.put(
//          `${config.API_BASE_URL}/progress/${editRow.id}`,
//          record
//        );
//        setData((prev) =>
//          prev.map((r) => (r.id === editRow.id ? res.data : r))
//        );
//      } else {
//        const res = await axios.post(`${config.API_BASE_URL}/progress`, record);
//        setData((prev) => [...prev, res.data]);
//      }
//    } catch (err) {
//      console.error("Error saving record:", err);
//    }
//  };
//
//  // ✅ Import Excel Data via API
//  const handleImport = async (records) => {
//    try {
//      const res = await axios.post(`${config.API_BASE_URL}/progress/bulk`, {
//        records,
//      });
//      setData((prev) => [...prev, ...res.data]);
//    } catch (err) {
//      console.error("Error importing records:", err);
//    }
//  };
//
//  // ✅ Delete Record API
//  const handleDelete = async (id) => {
//    try {
//      await axios.delete(`${config.API_BASE_URL}/progress/${id}`);
//      setData((prev) => prev.filter((r) => r.id !== id));
//    } catch (err) {
//      console.error("Error deleting record:", err);
//    }
//  };
//
//  // ✅ Export to Excel
//  const exportToExcel = () => {
//    const ws = XLSX.utils.json_to_sheet(data);
//    const wb = XLSX.utils.book_new();
//    XLSX.utils.book_append_sheet(wb, ws, "Progress Report");
//    XLSX.writeFile(wb, "progress_report.xlsx");
//  };
//
//  // ✅ Export to PDF
//  const exportToPDF = () => {
//    const doc = new jsPDF();
//    doc.text("Progress Report", 14, 10);
//    autoTable(doc, {
//      head: [["Name", "Activity", "Progress", "Status"]],
//      body: data.map((row) => [
//        row.name,
//        row.activity,
//        row.progress,
//        row.status,
//      ]),
//    });
//    doc.save("progress_report.pdf");
//  };
//
//  return (
//    <div className="p-0 m-0 min-h-screen">
//      {/* Header + Filters */}
//      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
//        <div className="flex justify-between items-center mb-4">
//          <h2 className="text-sm font-semibold mt-0">Progress Report</h2>
//          <div className="flex gap-2">
//            <button
//              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
//              className="bg-gray-200 px-3 py-1 rounded-md text-sm"
//            >
//              Sort by Progress ({sortOrder === "asc" ? "↑" : "↓"})
//            </button>
//
//            <button
//              onClick={() => {
//                setEditRow(null);
//                setModalOpen(true);
//              }}
//              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-md text-sm"
//            >
//              <FiPlus /> Add Record
//            </button>
//            <button
//              onClick={exportToExcel}
//              className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm"
//            >
//              Export Excel
//            </button>
//            <button
//              onClick={exportToPDF}
//              className="bg-red-500 text-white px-3 py-1 rounded-md text-sm"
//            >
//              Export PDF
//            </button>
//          </div>
//        </div>
//        <input
//          type="text"
//          placeholder="Search by student..."
//          value={searchTerm}
//          onChange={(e) => setSearchTerm(e.target.value)}
//          className="border px-3 py-2 rounded-md text-sm w-full"
//        />
//      </div>
//
//      {/* 🔹 Summary Cards */}
//      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
//        <div className="grid grid-cols-4 gap-4">
//          <div className="bg-gray-50 rounded-md p-4">
//            <h3 className="text-sm text-gray-600 mb-1">Total Records</h3>
//            <p className="text-2xl font-bold text-blue-600">{data.length}</p>
//          </div>
//          <div className="bg-gray-50 rounded-md p-4">
//            <h3 className="text-sm text-gray-600 mb-1">Average Progress</h3>
//            <p className="text-2xl font-bold text-green-600">
//              {data.length > 0
//                ? (data.reduce((sum, d) => sum + (parseFloat(d.progress) || 0), 0) / data.length).toFixed(1)
//                : "0.0"}%
//            </p>
//          </div>
//          <div className="bg-gray-50 rounded-md p-4">
//            <h3 className="text-sm text-gray-600 mb-1">Excellent</h3>
//            <p className="text-2xl font-bold text-purple-600">
//              {data.filter(d => d.status === "Excellent").length}
//            </p>
//          </div>
//          <div className="bg-gray-50 rounded-md p-4">
//            <h3 className="text-sm text-gray-600 mb-1">Activities</h3>
//            <p className="text-2xl font-bold text-orange-600">
//              {new Set(data.map(d => d.activity)).size}
//            </p>
//          </div>
//        </div>
//      </div>
//
//      {/* 🔹 Charts */}
//      <div className="grid grid-cols-2 gap-4 mb-4">
//        <div className="bg-white p-3 rounded-lg shadow-sm border">
//          <h3 className="font-semibold mb-2 mt-0">Activity Wise Average Progress</h3>
//          {activityAvg.length > 0 ? (
//            <ResponsiveContainer width="100%" height={250}>
//              <BarChart data={activityAvg}>
//                <CartesianGrid strokeDasharray="3 3" />
//                <XAxis dataKey="activity" />
//                <YAxis />
//                <Tooltip />
//                <Bar dataKey="avg" fill="#3b82f6" />
//              </BarChart>
//            </ResponsiveContainer>
//          ) : (
//            <div className="h-[250px] flex items-center justify-center text-gray-400">
//              No data available
//            </div>
//          )}
//        </div>
//
//        <div className="bg-white p-3 rounded-lg shadow-sm border">
//          <h3 className="font-semibold mb-2 mt-0">Status Distribution</h3>
//          {statusDistribution.length > 0 ? (
//            <ResponsiveContainer width="100%" height={250}>
//              <PieChart>
//                <Pie
//                  data={statusDistribution}
//                  dataKey="count"
//                  nameKey="status"
//                  cx="50%"
//                  cy="50%"
//                  outerRadius={80}
//                  label
//                >
//                  {statusDistribution.map((_, index) => (
//                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
//                  ))}
//                </Pie>
//                <Tooltip />
//              </PieChart>
//            </ResponsiveContainer>
//          ) : (
//            <div className="h-[250px] flex items-center justify-center text-gray-400">
//              No data available
//            </div>
//          )}
//        </div>
//      </div>
//
//      {/* 🔹 Progress Trend Chart */}
//      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
//        <h3 className="font-semibold mb-2 mt-0">Progress Range Distribution</h3>
//        {data.length > 0 ? (
//          <ResponsiveContainer width="100%" height={300}>
//            <BarChart data={[
//              { range: "0-60", count: data.filter(d => (parseFloat(d.progress) || 0) < 60).length },
//              { range: "60-70", count: data.filter(d => (parseFloat(d.progress) || 0) >= 60 && (parseFloat(d.progress) || 0) < 70).length },
//              { range: "70-80", count: data.filter(d => (parseFloat(d.progress) || 0) >= 70 && (parseFloat(d.progress) || 0) < 80).length },
//              { range: "80-90", count: data.filter(d => (parseFloat(d.progress) || 0) >= 80 && (parseFloat(d.progress) || 0) < 90).length },
//              { range: "90-100", count: data.filter(d => (parseFloat(d.progress) || 0) >= 90).length },
//            ]}>
//              <CartesianGrid strokeDasharray="3 3" />
//              <XAxis dataKey="range" />
//              <YAxis />
//              <Tooltip />
//              <Bar dataKey="count" fill="#00C49F" />
//            </BarChart>
//          </ResponsiveContainer>
//        ) : (
//          <div className="h-[300px] flex items-center justify-center text-gray-400">
//            No data available
//          </div>
//        )}
//      </div>
//
//      {/* Table */}
//      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
//        <table className="w-full border">
//          <thead className="bg-gray-100">
//            <tr>
//              <th className="border px-2 py-1">Name</th>
//              <th className="border px-2 py-1">Activity</th>
//              <th className="border px-2 py-1">Progress</th>
//              <th className="border px-2 py-1">Status</th>
//              <th className="border px-2 py-1">Actions</th>
//            </tr>
//          </thead>
//          <tbody>
//            {currentRows.map((row) => (
//              <tr key={row.id}>
//                <td className="border px-2 py-1">{row.name || ""}</td>
//                <td className="border px-2 py-1">{row.activity || ""}</td>
//                <td className="border px-2 py-1">{row.progress || 0}</td>
//                <td className="border px-2 py-1">{row.status || ""}</td>
//                <td className="border px-2 py-1 text-center">
//                  <button
//                    className="p-1 text-blue-600"
//                    onClick={() => {
//                      setEditRow(row);
//                      setModalOpen(true);
//                    }}
//                  >
//                    <FiEdit />
//                  </button>
//                  <button
//                    className="p-1 text-red-600"
//                    onClick={() => handleDelete(row.id)}
//                  >
//                    <FiTrash2 />
//                  </button>
//                </td>
//              </tr>
//            ))}
//          </tbody>
//        </table>
//
//        <div className="flex justify-between mt-2">
//          <button
//            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
//            disabled={currentPage === 1}
//            className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50"
//          >
//            Prev
//          </button>
//          <span>
//            Page {currentPage} of {totalPages}
//          </span>
//          <button
//            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
//            disabled={currentPage === totalPages}
//            className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50"
//          >
//            Next
//          </button>
//        </div>
//      </div>
//
//      <SmallModal
//        open={modalOpen}
//        onClose={() => setModalOpen(false)}
//        onSave={handleSave}
//        onImport={handleImport}
//        title="Progress Report"
//        fields={["name", "activity", "progress", "status"]}
//        editRow={editRow}
//      />
//    </div>
//  );
//}

export default function ProgressReport() {
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
          Progress Report
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
