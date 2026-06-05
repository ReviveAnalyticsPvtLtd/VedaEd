import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import config from "../../../config";
import { authFetch } from "../../../services/apiClient";

export default function SuperAdminSISAttendanceClassDetail() {
  const { id } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const selectedClassName = query.get("class") || "";
  const selectedSectionName = query.get("section") || "";
  const [students, setStudents] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Fetch students from backend by classId
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        // Backend doesn't have /api/classes/:id/students route in snapshot.
        // Fallback: fetch all students then filter by class name/id if available.
        const response = await authFetch(`/students`);
        if (!response.ok) return;
        const payload = await response.json();
        const list = Array.isArray(payload?.students) ? payload.students : [];
        const mapped = list
          .filter((s) => {
            const className = String(s?.personalInfo?.class || "").toLowerCase();
            const sectionName = String(s?.personalInfo?.section || "").toLowerCase();
            const classMatch = selectedClassName
              ? className === String(selectedClassName).toLowerCase()
              : className.includes(String(id).toLowerCase());
            const sectionMatch = selectedSectionName
              ? sectionName === String(selectedSectionName).toLowerCase()
              : true;
            return classMatch && sectionMatch;
          })
          .map((s) => ({
            id: s._id,
            name: s?.personalInfo?.name || "",
            roll: s?.personalInfo?.rollNo || s?.personalInfo?.rollno || "",
            status: "Absent",
            time: "--",
          }));
        setStudents(mapped);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, [id]);

  const handleAttendanceChange = async (studentId, newStatus) => {
    const updatedStudents = students.map((s) =>
      s.id === studentId
        ? {
          ...s,
          status: newStatus,
          time:
            newStatus === "Present" || newStatus === "Late"
              ? new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
              : "--",
        }
        : s
    );
    setStudents(updatedStudents);

    // Send update to backend
    try {
      const date = new Date().toISOString();
      await authFetch(`/attendance/student/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, date }),
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
    }
  };


  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedStudents = [...students].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setStudents(sortedStudents);
  };

  const handleExport = () => {
    const header = ["Roll No", "Name", "Status", "Time"];
    const rows = students.map((s) => [s.roll, s.name, s.status, s.time]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [header, ...rows].map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `class_${id}_attendance.csv`;
    link.click();
  };

  return (
    <div className="p-0">
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/superadmin/sis/attendance/overview" className="hover:underline">
          Attendance
        </Link>{" "}
        ›{" "}
       <Link to="/superadmin/sis/attendance/by-class" className="hover:underline">
          By Class

        </Link>{" "}
        › <span className="text-gray-700 font-medium">
  {selectedClassName} {selectedSectionName}
</span>
      </nav>
      <h1 className="text-2xl font-bold text-gray-700 mb-4">
 {selectedClassName} {selectedSectionName} - Attendance
</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <p className="text-gray-500">Present</p>
          <h2 className="text-xl font-bold text-green-600">
            {students.filter((s) => s.status === "Present").length}
          </h2>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <p className="text-gray-500">Absent</p>
          <h2 className="text-xl font-bold text-red-600">
            {students.filter((s) => s.status === "Absent").length}
          </h2>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <p className="text-gray-500">Late</p>
          <h2 className="text-xl font-bold text-orange-500">
            {students.filter((s) => s.status === "Late").length}
          </h2>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg p-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">S.No</th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort("roll")}>
                Roll No
              </th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort("name")}>
                Student Name
              </th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort("status")}>
                Status
              </th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort("time")}>
                Time
              </th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, index) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{index + 1}</td>
                <td className="p-2">{s.roll}</td>
                <td className="p-2">{s.name}</td>
                <td
                  className={`p-2 font-semibold ${s.status === "Present"
                      ? "text-green-600"
                      : s.status === "Absent"
                        ? "text-red-600"
                        : "text-orange-500"
                    }`}
                >
                  {s.status}
                </td>
                <td className="p-2">{s.time}</td>
                <td className="p-2">
                  <select
                    value={s.status}
                    onChange={(e) => handleAttendanceChange(s.id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option>Present</option>
                    <option>Absent</option>
                    <option>Late</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Buttons */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => alert("Attendance saved!")}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          Save Attendance
        </button>
        <button
          onClick={handleExport}
          className="bg-gray-200 px-4 py-2 rounded shadow hover:bg-gray-300"
        >
          Export Report
        </button>
      </div>
    </div>
  );
}
