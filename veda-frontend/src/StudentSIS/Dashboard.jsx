import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import config from "../config";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    assignments: 0,
    pendingAssignments: [],
    attendance: 0,
    exams: 0,
    nextExam: null,
    notices: [],
    activities: 0,
    todayClasses: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const studentId = user?.refId || user?._id;
        if (!studentId) {
          setError("Student account not found. Please log in again.");
          setLoading(false);
          return;
        }
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(
          `${config.API_BASE_URL}/students/${studentId}/dashboard-stats`,
          { headers }
        );
        if (res.data.success) {
          setStats(res.data.stats);
          setError("");
        } else {
          setError(res.data.message || "Failed to load dashboard data.");
        }
      } catch (err) {
        console.error("Error fetching student dashboard data:", err);
        setError(
          err.response?.status === 401
            ? "Session expired. Please log in again."
            : "Could not load dashboard data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const pendingAssignments = stats.pendingAssignments || [];
  const todayClasses = stats.todayClasses || [];
  const notices = stats.notices || [];

  const totalAssignments = stats.assignments || 0;
  const pendingCount = pendingAssignments.length;
  const completedCount = Math.max(totalAssignments - pendingCount, 0);

  const assignmentStatusData = [
    { name: "Completed", value: completedCount },
    { name: "Pending", value: pendingCount },
  ];
  const COLORS = ["#10B981", "#F59E0B"];

  const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };

  const dueLabel = (dueDate) => {
    if (!dueDate) return "No due date";
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isDueToday =
      due.getFullYear() === today.getFullYear() &&
      due.getMonth() === today.getMonth() &&
      due.getDate() === today.getDate();
    if (isDueToday) return "Due Today";
    return `Due ${formatDate(dueDate)}`;
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Student Dashboard</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">My Attendance</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-bold">{loading ? "..." : `${stats.attendance || 0}%`}</h3>
            <span className="text-green-500 text-xs font-medium">Overall</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Assignments</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-bold">{loading ? "..." : totalAssignments}</h3>
            <span className="text-orange-500 text-xs font-medium">{pendingCount} Pending</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Upcoming Exams</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-bold">{loading ? "..." : (stats.exams || 0)}</h3>
            <span className="text-blue-500 text-xs font-medium">
              {stats.nextExam ? `Next: ${formatDate(stats.nextExam)}` : "No exam scheduled"}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Activities</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-bold">{loading ? "..." : (stats.activities || 0)}</h3>
            <span className="text-purple-500 text-xs font-medium">Registered</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignments Chart */}
        <div className="bg-white p-5 rounded-xl border col-span-1 shadow-sm">
          <h3 className="font-semibold mb-4">Assignment Status</h3>
          <div className="h-48">
            {totalAssignments > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assignmentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {assignmentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No assignments available
              </div>
            )}
          </div>
          <div className="flex justify-center gap-4 text-xs mt-2">
            {assignmentStatusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white p-5 rounded-xl border col-span-2 shadow-sm">
          <h3 className="font-semibold mb-4">Today's Schedule</h3>
          <div className="space-y-3">
            {todayClasses.length > 0 ? (
              todayClasses.map((slot) => (
                <div key={slot.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="w-20 text-xs font-medium text-blue-600">{slot.time}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{slot.title}</div>
                    <div className="text-xs text-gray-500">{slot.meta}</div>
                  </div>
                  <div className="px-2 py-1 rounded bg-white border text-[10px] font-bold uppercase text-gray-400">Join</div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm py-4 text-center">No classes scheduled for today.</p>
            )}
          </div>
          <Link to="/student/timetable" className="block text-center text-sm text-blue-600 mt-4 hover:underline">
            View Full Timetable
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Notices */}
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-4">Latest Notices</h3>
          <div className="space-y-4">
            {notices.length > 0 ? (
              notices.map((notice) => (
                <div key={notice.id} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <div>
                      <div className="text-sm font-medium group-hover:text-blue-600 transition">{notice.title}</div>
                      <div className="text-[10px] text-gray-400">{notice.category}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 font-medium">{formatDate(notice.date)}</div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">No notices available.</p>
            )}
          </div>
          <Link to="/student/communication/notices" className="block text-center text-sm text-gray-400 mt-6 hover:underline">
            View All Notices
          </Link>
        </div>

        {/* Action Items */}
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-4">Pending Assignments</h3>
          <div className="space-y-3">
            {pendingAssignments.length > 0 ? (
              pendingAssignments.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
                  <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-orange-800">{item.title}</div>
                    <div className="text-xs text-orange-600 font-medium">{dueLabel(item.dueDate)}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">No pending assignments.</p>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}