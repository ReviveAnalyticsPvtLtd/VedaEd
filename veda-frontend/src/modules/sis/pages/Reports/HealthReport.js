//import React, { useState, useMemo, useEffect } from "react";
//import axios from "axios";
//import {
//  BarChart, Bar, XAxis, YAxis, Tooltip,
//  PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid
//} from "recharts";
//import { FiPlus, FiDownload } from "react-icons/fi";
//import * as XLSX from "xlsx";
//import jsPDF from "jspdf";
//import autoTable from "jspdf-autotable";
//import config from "../../config";
//
//const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];
//
//// Helper to map Backend Student Object -> Health Data for Report
//const mapStudentToHealth = (s) => {
//  const p = s.personalInfo || {};
//  const h = s.health || {};
//
//  // Calculate BMI
//  const height = h.height || 0;
//  const weight = h.weight || 0;
//  let bmi = 0;
//  if (height > 0 && weight > 0) {
//    bmi = (weight / ((height / 100) * (height / 100))).toFixed(1);
//  }
//
//  return {
//    id: s._id,
//    name: p.name || "Unknown",
//    class: p.class || "N/A",
//    checkup: h.notes && h.notes.toLowerCase().includes("checkup") ? "General Checkup" : (h.chronic !== "None" ? "Chronic Management" : "Regular Review"),
//    status: h.chronic !== "None" || h.allergies !== "None" ? "Needs Attention" : "Healthy",
//    bmi: Number(bmi),
//    allergies: h.allergies || "None",
//    chronic: h.chronic || "None",
//    vaccination: h.vaccination || "Unknown"
//  };
//};
//
//export default function HealthReport() {
//  const [data, setData] = useState([]);
//  const [loading, setLoading] = useState(true);
//  const [currentPage, setCurrentPage] = useState(1);
//  const [sortOrder, setSortOrder] = useState("asc");
//  const [searchTerm, setSearchTerm] = useState("");
//
//  const rowsPerPage = 10;
//
//  useEffect(() => {
//    const fetchData = async () => {
//      try {
//        setLoading(true);
//        const res = await axios.get(`${config.API_BASE_URL}/students`);
//        if (res.data.success) {
//          const mapped = res.data.students.map(mapStudentToHealth);
//          setData(mapped);
//        }
//      } catch (err) {
//        console.error("Error fetching health data:", err);
//      } finally {
//        setLoading(false);
//      }
//    };
//    fetchData();
//  }, []);
//
//  // Search + Sorting
//  const filteredData = useMemo(() => {
//    let d = data.filter((item) =>
//      (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
//      (item.class || "").toLowerCase().includes(searchTerm.toLowerCase())
//    );
//    d = d.sort((a, b) =>
//      sortOrder === "asc" ? a.bmi - b.bmi : b.bmi - a.bmi
//    );
//    return d;
//  }, [searchTerm, sortOrder, data]);
//
//  // Pagination
//  const indexOfLast = currentPage * rowsPerPage;
//  const indexOfFirst = indexOfLast - rowsPerPage;
//  const currentRows = filteredData.slice(indexOfFirst, indexOfLast);
//  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
//
//  // Charts
//  const checkupDistribution = useMemo(() => {
//    const grouped = {};
//    data.forEach((d) => {
//      const c = d.checkup || "Unknown";
//      grouped[c] = (grouped[c] || 0) + 1;
//    });
//    return Object.entries(grouped).map(([c, count]) => ({ name: c, count }));
//  }, [data]);
//
//  const statusDistribution = useMemo(() => {
//    const group = {};
//    data.forEach((d) => {
//      group[d.status] = (group[d.status] || 0) + 1;
//    });
//    return Object.entries(group).map(([status, count]) => ({ name: status, count }));
//  }, [data]);
//
//  // Export Excel
//  const exportToExcel = () => {
//    const ws = XLSX.utils.json_to_sheet(data.map(({ id, ...rest }) => rest));
//    const wb = XLSX.utils.book_new();
//    XLSX.utils.book_append_sheet(wb, ws, "Health Report");
//    XLSX.writeFile(wb, "health_report.xlsx");
//  };
//
//  // Export PDF
//  const exportToPDF = () => {
//    const doc = new jsPDF();
//    doc.text("Institutional Health Analytics Report", 14, 10);
//    autoTable(doc, {
//      head: [["Name", "Class", "Status", "BMI", "Allergies", "Vaccination"]],
//      body: data.map((row) => [row.name, row.class, row.status, row.bmi, row.allergies, row.vaccination])
//    });
//    doc.save("health_analytics_report.pdf");
//  };
//
//  if (loading) {
//    return <div className="p-10 text-center text-gray-500">Generating Health Analytics...</div>;
//  }
//
//  return (
//    <div className="p-0 m-0 min-h-screen">
//
//      {/* ------------------- CONTAINER 1: HEADER + SUMMARY CARDS ------------------- */}
//      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
//
//        {/* Header */}
//        <div className="flex items-center justify-between mb-4">
//          <h2 className="text-lg font-semibold text-blue-800">Health Analytics Dashboard</h2>
//
//          <div className="flex gap-2 text-xs">
//            <input
//              type="text"
//              placeholder="Filter by name/class..."
//              className="border px-3 py-1 rounded-md w-48"
//              value={searchTerm}
//              onChange={(e) => setSearchTerm(e.target.value)}
//            />
//
//            <button
//              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
//              className="px-3 py-1 bg-gray-100 rounded-md border"
//            >
//              Sort BMI {sortOrder === "asc" ? "↑" : "↓"}
//            </button>
//
//            <button
//              onClick={exportToExcel}
//              className="px-3 py-1 bg-green-600 text-white rounded-md flex items-center gap-1"
//            >
//              Excel
//            </button>
//
//            <button
//              onClick={exportToPDF}
//              className="px-3 py-1 bg-red-600 text-white rounded-md flex items-center gap-1"
//            >
//              PDF
//            </button>
//          </div>
//        </div>
//
//        {/* Summary cards */}
//        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//          <SummaryCard label="Total Students" value={data.length} color="text-blue-600" />
//          <SummaryCard label="Healthy Status" value={data.filter(d => d.status === "Healthy").length} color="text-green-600" />
//          <SummaryCard label="Needs Attention" value={data.filter(d => d.status !== "Healthy").length} color="text-orange-600" />
//          <SummaryCard label="Average BMI" value={
//            data.length ? (data.reduce((s, d) => s + (d.bmi || 0), 0) / data.length).toFixed(1) : "0.0"
//          } color="text-purple-600" />
//        </div>
//      </div>
//
//      {/* ------------------- CONTAINER 2: TWO CHARTS ------------------- */}
//      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
//        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//          {/* Status Pie */}
//          <div className="bg-white border rounded-lg p-4">
//            <h3 className="text-sm font-semibold mb-3 text-gray-700 uppercase tracking-wider">Health Status Distribution</h3>
//            <div style={{ height: 260 }}>
//              <ResponsiveContainer>
//                <PieChart>
//                  <Pie
//                    data={statusDistribution}
//                    dataKey="count"
//                    nameKey="name"
//                    outerRadius={80}
//                    label
//                  >
//                    {statusDistribution.map((_, i) => (
//                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
//                    ))}
//                  </Pie>
//                  <Tooltip />
//                </PieChart>
//              </ResponsiveContainer>
//            </div>
//          </div>
//
//          {/* BMI Chart */}
//          <div className="bg-white border rounded-lg p-4">
//            <h3 className="text-sm font-semibold mb-3 text-gray-700 uppercase tracking-wider">BMI Tiers (Sample Population)</h3>
//            <div style={{ height: 260 }}>
//              <ResponsiveContainer>
//                <BarChart data={filteredData.slice(0, 10)}>
//                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                  <XAxis dataKey="name" fontSize={10} />
//                  <YAxis fontSize={10} />
//                  <Tooltip />
//                  <Bar dataKey="bmi" fill="#8884d8" radius={[4, 4, 0, 0]} />
//                </BarChart>
//              </ResponsiveContainer>
//            </div>
//          </div>
//        </div>
//      </div>
//
//      {/* ------------------- CONTAINER 3: TABLE ------------------- */}
//      <div className="bg-white p-3 rounded-lg shadow-sm border">
//        <h3 className="text-lg font-semibold mb-3 text-gray-800">Consolidated Health Roster</h3>
//        <div className="overflow-x-auto shadow-sm rounded-lg border">
//          <table className="w-full text-sm">
//            <thead className="bg-gray-100 text-gray-600 font-medium">
//              <tr>
//                <th className="px-4 py-3 text-left">Student Name</th>
//                <th className="px-4 py-3 text-center">Class</th>
//                <th className="px-4 py-3 text-center">Status</th>
//                <th className="px-4 py-3 text-center">BMI</th>
//                <th className="px-4 py-3 text-left">Allergies</th>
//                <th className="px-4 py-3 text-left">Vaccination</th>
//              </tr>
//            </thead>
//            <tbody>
//              {currentRows.map((row) => (
//                <tr key={row.id} className="border-t hover:bg-gray-50 transition-colors">
//                  <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
//                  <td className="px-4 py-3 text-center text-gray-600">{row.class}</td>
//                  <td className="px-4 py-3 text-center">
//                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${row.status === "Healthy" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
//                      }`}>
//                      {row.status}
//                    </span>
//                  </td>
//                  <td className="px-4 py-3 text-center font-mono">{row.bmi}</td>
//                  <td className="px-4 py-3 text-gray-600">{row.allergies}</td>
//                  <td className="px-4 py-3 text-gray-600">{row.vaccination}</td>
//                </tr>
//              ))}
//            </tbody>
//          </table>
//        </div>
//
//        {/* Pagination */}
//        <div className="flex justify-between items-center mt-4 px-2">
//          <p className="text-xs text-gray-500">Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredData.length)} of {filteredData.length} records</p>
//          <div className="flex gap-1">
//            <button
//              disabled={currentPage === 1}
//              onClick={() => setCurrentPage((p) => p - 1)}
//              className="px-3 py-1 border rounded text-xs disabled:opacity-30 hover:bg-gray-50"
//            >
//              Prev
//            </button>
//            <button
//              disabled={currentPage === totalPages}
//              onClick={() => setCurrentPage((p) => p + 1)}
//              className="px-3 py-1 border rounded text-xs disabled:opacity-30 hover:bg-gray-50"
//            >
//              Next
//            </button>
//          </div>
//        </div>
//      </div>
//    </div>
//  );
//}
//
//function SummaryCard({ label, value, color }) {
//  return (
//    <div className="bg-white p-4 rounded-lg border shadow-sm hover:border-blue-300 transition-colors">
//      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{label}</p>
//      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
//    </div>
//  );
//}
//

export default function HealthReport() {
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
          Health Report
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
