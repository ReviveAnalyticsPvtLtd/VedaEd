import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import * as attendanceAPI from "../../../services/attendanceAPI";

export default function SuperAdminSISAttendanceOverview() {
  const [summary, setSummary] = useState([
    { title: "Present", count: 0, color: "bg-green-500" },
    { title: "Absent", count: 0, color: "bg-red-500" },
    { title: "Late", count: 0, color: "bg-yellow-500" },
  ]);
  const [trends, setTrends] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [summaryRes, trendsRes, recentRes] = await Promise.all([
        attendanceAPI.getAttendanceSummary(),
        attendanceAPI.getWeeklyStats(),
        attendanceAPI.getRecentAttendance(),
      ]);

      if (summaryRes.success) {
        setSummary([
          { title: "Present", count: summaryRes.data.Present, color: "bg-green-500" },
          { title: "Absent", count: summaryRes.data.Absent, color: "bg-red-500" },
          { title: "Late", count: summaryRes.data.Late, color: "bg-yellow-500" },
        ]);
      }

      if (trendsRes.success) {
        setTrends(trendsRes.data);
      }

      if (recentRes.success) {
        setRecent(recentRes.data);
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* Summary Cards */}
      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
        <h2 className="text-lg font-semibold mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {summary.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg border p-4 flex flex-col items-center hover:shadow-md transition"
            >
              <div className={`w-4 h-4 rounded-full ${item.color} mb-2`} />
              <p className="text-gray-600 ">Today</p>
              <h3 className=" font-semibold">{item.title}</h3>
              <p className=" text-gray-500">{item.count} students</p>
              <button className="mt-3 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                View List
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Trends Chart */}
      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
        <h2 className="text-lg font-semibold mb-4">Attendance Trends</h2>
        <ResponsiveContainer width="96%" height={300}>
          <BarChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="students" fill="#169ef9ff" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Attendance Table */}
      <div className="bg-white p-3 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Recent Attendance</h2>
        <div className="overflow-x-auto">
          <table className="w-full border ">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 border text-left">Name</th>
                <th className="p-2 border text-left">Class</th>
                <th className="p-2 border text-left">Status</th>
                <th className="p-2 border text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((student, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="p-2 border text-left">{student.name}</td>
                  <td className="p-2 border text-left">{student.grade}</td>
                  <td
                    className={`p-2 border text-left font-semibold ${
                      student.status === "Present"
                        ? "text-green-600"
                        : student.status === "Absent"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {student.status}
                  </td>
                  <td className="p-2 border text-left">{student.time}</td>
                </tr>
              ))}
              {recent.length === 0 && !loading && (
                <tr>
                   <td colSpan="4" className="p-4 text-center text-gray-500">No recent records</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
