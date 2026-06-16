import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import config from "../../../config";

function SuperAdminSISAttendanceStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Hardcoded fallback student (for UI testing before backend)
  const fallbackStudent = {
    id,
    name: "Aarav Sharma",
    grade: "10-A",
    attendanceRecords: [
      { date: "2025-08-01", status: "Present" },
      { date: "2025-08-02", status: "Absent" },
      { date: "2025-08-03", status: "Present" },
      { date: "2025-08-04", status: "Present" },
      { date: "2025-08-05", status: "Absent" },
      { date: "2025-08-06", status: "Present" },
      { date: "2025-08-07", status: "Present" },
    ],
  };

  const [student, setStudent] = useState(fallbackStudent);
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    // API call to fetch student detail
    axios
      .get(`${config.API_BASE_URL}/students/${id}/attendance`)
      .then((res) => {
        if (res.data) {
          setStudent(res.data); // Replace fallback with backend data
        }
      })
      .catch((err) => {
        console.error("Error fetching student attendance:", err);
        // Keep fallback data if API fails
      });
  }, [id]);

  const filteredRecords = filterDate
    ? student.attendanceRecords.filter((r) => r.date === filterDate)
    : student.attendanceRecords;

  const chartData = student.attendanceRecords.map((r) => ({
    date: r.date,
    present: r.status === "Present" ? 1 : 0,
  }));

  return (
    <div className="p-0 space-y-6">
      <div className="text-sm text-gray-500 mb-2">
        <span
          onClick={() =>navigate("/superadmin/sis/attendance/overview")}
          className="cursor-pointer hover:underline"
        >
          Attendance
        </span>{" "}
        / <span className="text-gray-700 font-medium">{student.name}</span>
      </div>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">
          {student.name} - {student.grade}
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Back
        </button>
      </div>
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Attendance Overview</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 1]} ticks={[0, 1]} tickFormatter={(v) => (v === 1 ? "Present" : "Absent")} />
            <Tooltip formatter={(v) => (v === 1 ? "Present" : "Absent")} />
            <Line type="monotone" dataKey="present" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Attendance Records</h3>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          />
        </div>
        <table className="w-full text-left border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2 border">{record.date}</td>
                  <td
                    className={`px-4 py-2 border font-medium ${record.status === "Present" ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {record.status}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="text-center py-4 text-gray-500">
                  No records found for selected date
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SuperAdminSISAttendanceStudentDetail;
