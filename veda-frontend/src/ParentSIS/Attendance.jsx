import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import HelpInfo from "../components/HelpInfo";

export default function ParentAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");

  useEffect(() => {
    const fetchParentInfo = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");
        if (!user || !user.refId) return;

        const authHeaders = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`${config.API_BASE_URL}/parents/${user.refId}`, { headers: authHeaders });
        
        if (res.data && res.data.success && res.data.parent.children) {
          const kids = res.data.parent.children;
          setChildren(kids);
          if (kids.length > 0) {
            setSelectedChildId(kids[0]._id);
          }
        }
      } catch (err) {
        console.error("Error fetching parent info:", err);
      }
    };
    fetchParentInfo();
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedChildId) return;
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${config.API_BASE_URL}/attendance/student/${selectedChildId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch child's attendance");
        const data = await res.json();
        const apiRecords = Array.isArray(data) ? data : data.records || data.data || [];
        setRecords(apiRecords);
      } catch (err) {
        console.error("Error loading attendance:", err);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedChildId]);

  if (loading) {
    return <div className="p-6">Loading child’s attendance...</div>;
  }

  const filteredRecords = records.filter((rec) => {
    const matchesDate = filterDate ? rec.date?.slice(0, 10) === filterDate : true;
    const matchesStatus = filterStatus === "all" ? true : rec.status === filterStatus;
    return matchesDate && matchesStatus;
  });

  return (
      <div className="p-0 m-0 min-h-screen">
      {/* Breadcrumbs - bahar */}
      <p className="text-gray-500 text-sm mb-2 flex items-center gap-1"> Attendance &gt;</p>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          {selectedChildId 
            ? `${children.find(c => c._id === selectedChildId)?.personalInfo?.name || "Child"}'s Attendance` 
            : "Attendance"}
        </h2>
        <div className="flex gap-2">
          {children.length > 1 && (
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="border px-3 py-1 rounded bg-blue-50 text-blue-700 font-medium"
            >
              {children.map((child) => (
                <option key={child._id} value={child._id}>
                  {child.personalInfo?.name || child.name}
                </option>
              ))}
            </select>
          )}
          <HelpInfo
  title="Child Attendance"
  description={`4.4 Child Attendance (Daily Attendance Overview)

Track your child's attendance records with detailed day-by-day status and check-in times.

Sections:
- Filter by Date: Select a specific date to view attendance records
- Filter by Status: Filter entries by Present, Absent, or Late
- Attendance Table: Displays date-wise attendance with status and time
- Status Highlights: Color-coded indicators for Present, Absent, and Late
- Check-in Time: Shows the exact time your child marked attendance
`}
  steps={[
    "Filter attendance records by date or status",
    "View daily attendance status including Present, Absent, or Late",
    "Check the exact check-in time for each day",
    "Scroll through history to monitor long-term attendance patterns",
    "Use filters to quickly find specific attendance entries"
  ]}
/>
        </div>
      </div>

      {/* Gray Wrapper */}
         <div className="bg-white p-3 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Attendance List</h3>
          <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
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
                className="w-full border rounded px-3 py-2  "
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
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-1"
              >
                Reset Filters
              </button>
            )}
          </div>

         <table className="w-full text-sm border ">
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
