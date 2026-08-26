import React, { useState, useEffect } from "react";
import api from "../services/apiClient";
import config from "../config";
import HelpInfo from "../components/HelpInfo";

export default function StudentAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const user = JSON.parse(localStorage.getItem("user"));
  const studentId = user?.refId || ""; 

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        if (!studentId) return;

        const res = await api.get(`/attendance/student/${studentId}`);
        // Response structure from backend is { success, count, data }
        if (res.data && res.data.success) {
          setRecords(res.data.data || []);
        }
      } catch (err) {
        console.error("Error loading attendance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [studentId]);

  if (loading) {
    return <div className="p-6">Loading attendance...</div>;
  }

  const filteredRecords = records.filter((rec) => {
    const matchesDate = filterDate
      ? rec.date?.slice(0, 10) === filterDate
      : true;
    const matchesStatus =
      filterStatus === "all" ? true : rec.status === filterStatus;
    return matchesDate && matchesStatus;
  });

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold"> Attendance</h2>

        <HelpInfo
          title="Student Attendance Help"
          description={`Page Description: View your personal attendance records. Track your attendance history, check attendance percentage, and see detailed records of present, absent, and late days. Filter attendance by date or status to review specific periods.


1.1 Attendance Page

View your personal attendance records.
Track your attendance history, check attendance percentage, and see detailed records of present, absent, and late days.
Filter attendance by date or status to review specific periods.

Sections:
- Date Filter: Filter attendance records by specific date using the date picker input field
- Status Filter: Filter by attendance status using the dropdown menu (All, Present, Absent, or Late)
- Reset Filters Button: Clear all applied filters to view all attendance records (appears when filters are active)
- Attendance Table: Detailed day-by-day attendance records displayed in a table format with three columns
- Date Column: Shows the date of each attendance record in YYYY-MM-DD format
- Status Column: Displays attendance status (Present, Absent, or Late) with color-coded text (green for Present, red for Absent, orange for Late)
- Time Column: Shows the time of arrival for present/late days or "--" for absent days
- Empty State Message: Displays "No attendance records found" when no records match the applied filters`}
        />
      </div>

      {/* Gray wrapper ke andar white card */}
  
        <div className="bg-white p-3 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Attendance List</h3>
          <div className="flex flex-col md:flex-row md:items-end gap-3 mb-3">
            <div className="flex-1">
             
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full border rounded px-3 py-2 "
              />
            </div>
            <div className="flex-1">
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border rounded px-3 py-2 "
              >
                <option value="all">All</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
              </select>
            </div>
            {(filterDate || filterStatus !== "all") && (
              <button
                onClick={() => {
                  setFilterDate("");
                  setFilterStatus("all");
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md  flex items-center gap-1"
              >
                Reset Filters
              </button>
            )}
          </div>

          <table className="w-full border ">
            <thead className="bg-gray-100 ">
              <tr>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec, i) => (
                <tr key={i} className="text-center border-b hover:bg-gray-50">
                  <td className="p-2 border">{rec.date?.slice(0, 10)}</td>
                  <td
                    className={`p-2 border font-semibold ${
                      rec.status === "Present"
                        ? "text-green-600"
                        : rec.status === "Absent"
                        ? "text-red-600"
                        : "text-orange-500"
                    }`}
                  >
                    {rec.status}
                  </td>
                  <td className="p-2 border">{rec.time || "--"}</td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-4 text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
   
  );
}
