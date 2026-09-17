import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import {
  FiUsers,
  FiDollarSign,
  FiAlertCircle,
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

const COLORS = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#3B82F6"];

const defaultStats = {
  childrenCount: 0,
  totalFees: 0,
  pendingFees: 0,
  attendanceAverage: 0,
  overallGrade: "—",
  upcomingPTA: "No upcoming PTM",
  monthlyAttendance: [],
  subjectProgress: [],
  complaintsOpen: 0,
  complaints: [],
  notices: [],
  upcomingEvents: [],
};

export default function ParentMasterDashboard() {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const parentId = user?.refId || user?._id;
        if (!parentId) {
          setError("Parent account not found. Please log in again.");
          setLoading(false);
          return;
        }
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(
          `${config.API_BASE_URL}/parents/${parentId}/dashboard-stats`,
          { headers }
        );
        if (res.data.success) {
          setStats(res.data.stats);
          setError("");
        } else {
          setError(res.data.message || "Failed to load dashboard data.");
        }
      } catch (err) {
        console.error("Error fetching parent master stats:", err);
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

  const complaints = stats.complaints || [];
  const notices = stats.notices || [];
  const upcomingEvents = stats.upcomingEvents || [];

  const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading Parent Dashboard...</div>;
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
        <Stat title="Children" value={stats.childrenCount || 0} icon={<FiUsers />} />
        <Stat title="Attendance" value={`${stats.attendanceAverage || 0}%`} icon={<FiActivity />} />
        <Stat title="Pending Fees" value={`₹${(stats.pendingFees || 0).toLocaleString()}`} icon={<FiDollarSign />} />
        <Stat title="Complaints" value={`${stats.complaintsOpen || 0} Open`} icon={<FiAlertCircle />} />
      </div>

      {/* GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance */}
        <Card title="Monthly Attendance (%)">
          <div className="h-56">
            {(stats.monthlyAttendance || []).some((d) => d.value > 0) ? (
              <ResponsiveContainer>
                <BarChart data={stats.monthlyAttendance || []}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No attendance data available
              </div>
            )}
          </div>
        </Card>

        {/* Academic Performance */}
        <Card title="Subject Performance">
          <div className="h-56">
            {(stats.subjectProgress || []).length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats.subjectProgress || []}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label
                  >
                    {(stats.subjectProgress || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No subject performance data available
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ACADEMICS + FEES + COMPLAINTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Academic Summary">
          <List title="Overall Grade" meta={stats.overallGrade || "—"} />
          <List title="PTA Status" meta={stats.upcomingPTA || "No upcoming PTM"} />
        </Card>

        <Card title="Fees Status">
          <List title="Collected Fees" meta={`₹${(stats.totalFees || 0).toLocaleString()}`} />
          <List title="Pending" meta={`₹${(stats.pendingFees || 0).toLocaleString()}`} />
        </Card>

        <Card title="Recent Complaints">
          {complaints.length > 0 ? (
            complaints.slice(0, 3).map((c) => (
              <List key={c.id || c.subject} title={c.subject} meta={`${c.status} · ${formatDate(c.date) || "—"}`} />
            ))
          ) : (
            <List title="No complaints" meta="No complaints raised from this account" />
          )}
        </Card>
      </div>

      {/* EVENTS + NOTICES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Upcoming Events">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((e) => (
              <List key={e.id || e.title} title={e.title} meta={`${e.type || "Event"} · ${formatDate(e.date)}`} />
            ))
          ) : (
            <List title="No upcoming events" meta="No events scheduled for parents" />
          )}
        </Card>

        <Card title="School Notices">
          {notices.length > 0 ? (
            notices.map((n) => (
              <List key={n.id || n.title} title={n.title} meta={`${n.category || "Notice"} · ${formatDate(n.date) || "—"}`} />
            ))
          ) : (
            <List title="No notices" meta="No published notices right now" />
          )}
        </Card>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

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
  <div className="border-b last:border-none pb-2">
    <div className="font-medium">{title}</div>
    <div className="text-xs text-gray-400">{meta}</div>
  </div>
);