import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/apiClient";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function TeacherDashboard() {
  // API state
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const staffId = user?.refId || user?._id;
        if (staffId) {
          const res = await api.get(`/staff/${staffId}/dashboard-stats`);
          if (res.data.success) {
            setStats(res.data.stats);
          }
        }
      } catch (err) {
        console.error("Error fetching teacher stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);


  // Chart data derived from real stats (empty until the API returns data)
  const assignmentData = stats?.assignmentStatus
    ? [
        { name: "Pending", value: stats.assignmentStatus.pending },
        { name: "Submitted", value: stats.assignmentStatus.submitted },
        { name: "Graded", value: stats.assignmentStatus.graded },
      ]
    : [];
  const COLORS = ["#F59E0B", "#10B981", "#3B82F6"];

  const attendanceData = stats?.weeklyAttendance || [];

  return (
    <div className="p-6 space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Link
          to="/teacher/classes"
          className="bg-white p-4 rounded-xl shadow hover:shadow-md"
        >
          <h3 className="text-sm font-medium text-blue-600">My Classes</h3>
          <p className="text-2xl font-bold">{loading ? "..." : (stats?.classes || 0)}</p>
          <p className="text-xs text-gray-500">Ongoing</p>
        </Link>

        <Link
          to="/teacher/assignment"
          className="bg-white p-4 rounded-xl shadow hover:shadow-md"
        >
          <h3 className="text-sm font-medium text-blue-600">Assignments</h3>
          <p className="text-2xl font-bold">{loading ? "..." : (stats?.assignments || 0)}</p>
          <p className="text-xs text-gray-500">Pending + Graded</p>
        </Link>

        <Link
          to="/teacher/attendance"
          className="bg-white p-4 rounded-xl shadow hover:shadow-md"
        >
          <h3 className="text-sm font-medium text-blue-600">Attendance</h3>
          <p className="text-2xl font-bold">{loading ? "..." : `${stats?.attendance || 0}%`}</p>
          <p className="text-xs text-gray-500">This week</p>
        </Link>

        <Link
          to="/teacher/timetable"
          className="bg-white p-4 rounded-xl shadow hover:shadow-md"
        >
          <h3 className="text-sm font-medium text-blue-600">Today's Lectures</h3>
          <p className="text-2xl font-bold">{loading ? "..." : (stats?.lecturesToday || 0)}</p>
          <p className="text-xs text-gray-500">Scheduled</p>
        </Link>
      </div>


      {/* Key Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Key Metrics</h2>
        <div className="grid grid-cols-3 gap-4">
          {/* Assignments chart */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-medium">Assignments Overview</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assignmentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label
                  >
                    {assignmentData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <Link
              to="/teacher/assignment"
              className="text-sm text-blue-600 underline"
            >
              Manage Assignments
            </Link>
          </div>

          {/* Attendance chart */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-medium">Attendance This Week</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="attendance"
                    fill="#3B82F6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Link
              to="/teacher/attendance"
              className="text-sm text-blue-600 underline"
            >
              View Attendance
            </Link>
          </div>

          {/* Timetable */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-medium">Today's Schedule</h3>
            <div className="h-40 overflow-y-auto">
              {loading ? (
                <p className="text-gray-400 text-center">Loading...</p>
              ) : stats?.todaySchedule?.length ? (
                <ul className="text-sm space-y-2">
                  {stats.todaySchedule.map((lec) => (
                    <li
                      key={lec.lectureId}
                      className="flex items-center justify-between border-b pb-1"
                    >
                      <span className="font-medium">{lec.subject}</span>
                      <span className="text-gray-500 text-xs">
                        {lec.className}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {lec.timeFrom} - {lec.timeTo}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-center">
                  No lectures scheduled today.
                </p>
              )}
            </div>
            <Link
              to="/teacher/timetable"
              className="text-sm text-blue-600 underline"
            >
              View Timetable
            </Link>
          </div>
        </div>
      </div>

      {/* My Classes */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-medium">My Classes</h3>
        <div className="h-32 overflow-y-auto">
          {loading ? (
            <p className="text-gray-400 text-center">Loading...</p>
          ) : stats?.classList?.length ? (
            <ul className="text-sm space-y-2">
              {stats.classList.map((c) => (
                <li
                  key={c.classId}
                  className="flex items-center justify-between border-b pb-1"
                >
                  <span>{c.name}</span>
                  {c.classTeacher && (
                    <span className="text-xs text-blue-600">Class Teacher</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-center">
              No classes assigned yet.
            </p>
          )}
        </div>
      </div>

      {/* Quick Links + Notifications */}
      <div className="grid grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="bg-white p-4 rounded-xl shadow col-span-2">
          <h3 className="font-medium mb-3">Quick Actions</h3>
          <div className="flex gap-3 flex-wrap">
            <Link
              to="/teacher/assignment/create"
              className="px-3 py-2 border rounded-md hover:bg-gray-100"
            >
              Create Assignment
            </Link>
            <Link
              to="/teacher/attendance"
              className="px-3 py-2 border rounded-md hover:bg-gray-100"
            >
              Mark Attendance
            </Link>
            <Link
              to="/teacher/timetable"
              className="px-3 py-2 border rounded-md hover:bg-gray-100"
            >
              View Timetable
            </Link>
            <Link
              to="/teacher/gradebook"
              className="px-3 py-2 border rounded-md hover:bg-gray-100"
            >
              Gradebook
            </Link>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-medium">Recent Notifications</h3>
          <ul className="text-sm space-y-2 mt-2">
            <li className="bg-blue-50 px-3 py-2 rounded">
              📄 {loading ? "..." : (stats?.assignmentStatus?.pending || 0)}{" "}
              assignments pending review
            </li>
            <li className="bg-blue-50 px-3 py-2 rounded">
              📅 {loading ? "..." : (stats?.lecturesToday || 0)} lecture(s)
              scheduled today
            </li>
            {!loading && stats?.classList?.length === 0 && (
              <li className="bg-yellow-50 px-3 py-2 rounded">
                ⚠️ No classes assigned yet
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
