import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import { Link } from "react-router-dom";
import {
  FiBookOpen,
  FiClipboard,
  FiAward,
  FiActivity,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#4F46E5", "#22C55E", "#F59E0B", "#EF4444"];

const defaultStats = {
  assignments: 0,
  pendingAssignments: [],
  attendance: 0,
  exams: 0,
  subjectsCount: 0,
  monthlyAttendance: [],
  subjectProgress: [],
  todayClasses: [],
  upcomingEvents: [],
};

export default function StudentMasterDashboard() {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        console.error("Error fetching student master stats:", err);
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
  const upcomingEvents = stats.upcomingEvents || [];
  const todayClasses = stats.todayClasses || [];

  const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading Student Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat title="Subjects" value={stats.subjectsCount || 0} icon={<FiBookOpen />} />
        <Stat title="Assignments" value={`${stats.assignments || 0} Total`} icon={<FiClipboard />} />
        <Stat title="Attendance" value={`${stats.attendance || 0}%`} icon={<FiActivity />} />
        <Stat title="Exams" value={`${stats.exams || 0} Upcoming`} icon={<FiAward />} />
      </div>

      {/* GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Graph */}
        <Card title="Monthly Attendance (%)">
          <div className="h-56">
            {stats.monthlyAttendance.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={stats.monthlyAttendance}>
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No attendance data available
              </div>
            )}
          </div>
        </Card>

        {/* Subject Progress */}
        <Card title="Subject Performance">
          <div className="h-56">
            {stats.subjectProgress.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={stats.subjectProgress} dataKey="value" nameKey="name" outerRadius={80}>
                    {stats.subjectProgress.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No gradebook data available
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* TIMETABLE + CALENDAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today Classes */}
        <Card title="Today's Classes">
          {todayClasses.length > 0 ? (
            todayClasses.map((item) => (
              <List key={item.id} title={item.title} meta={item.time} />
            ))
          ) : (
            <p className="text-gray-400 text-sm">No classes scheduled today.</p>
          )}
        </Card>

        {/* Assignments */}
        <Card title="Assignments">
          {pendingAssignments.length > 0 ? (
            pendingAssignments.map((item) => (
              <List
                key={item.id}
                title={item.title}
                meta={item.dueDate ? `Due ${formatDate(item.dueDate)}` : "No due date"}
              />
            ))
          ) : (
            <p className="text-gray-400 text-sm">No pending assignments.</p>
          )}
        </Card>

        {/* Upcoming Events */}
        <Card title="Upcoming Events">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((item) => (
              <List
                key={item.id}
                title={item.title}
                meta={item.date ? `${item.type} • ${formatDate(item.date)}` : item.type}
              />
            ))
          ) : (
            <p className="text-gray-400 text-sm">No upcoming events.</p>
          )}
        </Card>
      </div>

      {/* ===== COMMUNICATION + CALENDAR ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardLink
          title="Student SIS"
          desc="Grades, Attendance & Classes"
          to="/student"
        />

        <DashboardLink
          title="Student Communication"
          desc="Messages, Notices & Complaints"
          to="/student/communication"
        />

        <DashboardLink
          title="Academic Calendar"
          desc="View school events & schedules"
          to="/student/calendar"
        />
      </div>
    </div>
  );
}

/* ===== COMPONENTS ===== */

const DashboardLink = ({ title, desc, to }) => (
  <Link
    to={to}
    className="bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow"
  >
    <h3 className="font-semibold text-lg">{title}</h3>
    <p className="text-sm text-gray-500">{desc}</p>
  </Link>
);

const Stat = ({ title, value, icon }) => (
  <div className="bg-white rounded-xl shadow p-4 flex gap-4 items-center">
    <div className="text-indigo-600 text-xl">{icon}</div>
    <div>
      <div className="font-bold">{value}</div>
      <div className="text-sm text-gray-500">{title}</div>
    </div>
  </div>
);

const Card = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow p-4 space-y-3">
    <h2 className="font-semibold">{title}</h2>
    {children}
  </div>
);

const List = ({ title, meta }) => (
  <div>
    <div className="font-medium">{title}</div>
    <div className="text-xs text-gray-400">{meta}</div>
  </div>
);