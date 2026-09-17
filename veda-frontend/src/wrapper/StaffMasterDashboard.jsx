import React, { useState, useEffect } from "react";
import api from "../services/apiClient";
import {
  FiUsers,
  FiBookOpen,
  FiClipboard,
  FiCalendar,
  FiMessageCircle,
  FiAward,
} from "react-icons/fi";
import { Link } from "react-router-dom";

export default function StaffMasterDashboard() {
  const [stats, setStats] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const staffId = user?.refId || user?._id;

        const requests = [];
        if (staffId) {
          requests.push(
            api.get(`/staff/${staffId}/dashboard-stats`)
          );
        }
        requests.push(api.get("/assignments"));
        requests.push(
          api.get("/communication/notices?status=published&limit=3")
        );

        const results = await Promise.allSettled(requests);

        const statsRes = results[0];
        if (statsRes.status === "fulfilled" && statsRes.value.data.success) {
          setStats(statsRes.value.data.stats);
        }

        const assignmentsIndex = staffId ? 1 : 0;
        const assignmentsRes = results[assignmentsIndex];
        if (assignmentsRes.status === "fulfilled" && Array.isArray(assignmentsRes.value.data)) {
          setAssignments(assignmentsRes.value.data.slice(0, 3));
        }

        const noticesRes = results[staffId ? 2 : 1];
        if (
          noticesRes.status === "fulfilled" &&
          noticesRes.value.data.success &&
          Array.isArray(noticesRes.value.data.data)
        ) {
          setAnnouncements(noticesRes.value.data.data.slice(0, 3));
        }
      } catch (err) {
        console.error("Error fetching staff master dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading Teacher Dashboard...</div>;
  }

  return (
    <div className="space-y-6">

      {/* ===== HEADER ===== */}
      <div>
        <h1 className="text-2xl font-bold text-gray-700">
          Teacher Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Overview of your academic activities
        </p>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Classes" value={stats?.classes || 0} icon={<FiUsers />} />
        <StatCard title="Students" value={stats?.students || 0} icon={<FiBookOpen />} />
        <StatCard title="Assignments" value={stats?.assignments || 0} icon={<FiClipboard />} />
        <StatCard title="Exams" value={stats?.exams || 0} icon={<FiAward />} />
        <StatCard title="Messages" value={stats?.messages || 0} icon={<FiMessageCircle />} />
        <StatCard title="Events" value={stats?.events || 0} icon={<FiCalendar />} />
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickCard title="My Classes" to="/teacher/classes" />
        <QuickCard title="Attendance" to="/teacher/attendance" />
        <QuickCard title="Assignments" to="/teacher/assignment" />
        <QuickCard title="Gradebook" to="/teacher/gradebook" />
      </div>

      {/* ===== MAIN GRID ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ===== TODAY TIMETABLE ===== */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Today's Timetable</h2>
          {stats?.todaySchedule?.length ? (
            <ul className="space-y-3 text-sm">
              {stats.todaySchedule.map((slot) => (
                <TimetableRow
                  key={slot.lectureId}
                  time={`${slot.timeFrom} - ${slot.timeTo}`}
                  subject={slot.subject}
                  className={slot.className}
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No classes scheduled today.</p>
          )}
        </div>

        {/* ===== RECENT ASSIGNMENTS ===== */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Recent Assignments</h2>
          {assignments.length ? (
            <ul className="space-y-3 text-sm">
              {assignments.map((a) => (
                <ListRow
                  key={a._id}
                  title={a.title}
                  meta={`${a.subject?.subjectName || "N/A"} • ${formatDue(a.dueDate)}`}
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No assignments yet.</p>
          )}
        </div>

        {/* ===== ANNOUNCEMENTS ===== */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Announcements</h2>
          {announcements.length ? (
            <ul className="space-y-3 text-sm">
              {announcements.map((n) => (
                <ListRow
                  key={n._id}
                  title={n.title}
                  meta={`${n.content || "General"} • ${formatDate(n.publishDate)}`}
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No announcements yet.</p>
          )}
        </div>
      </div>

      {/* ===== COMMUNICATION + CALENDAR ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <DashboardLink
          title="Teacher Communication"
          desc="Messages, Notices & Complaints"
          to="/teacher-communication/logs"
        />

        <DashboardLink
          title="Academic Calendar"
          desc="View events & schedules"
          to="/teacher/calendar"
        />

      </div>
    </div>
  );
}

/* ===== COMPONENTS ===== */

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
    <div className="text-indigo-600 text-xl">{icon}</div>
    <div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-sm text-gray-500">{title}</div>
    </div>
  </div>
);

const QuickCard = ({ title, to }) => (
  <Link
    to={to}
    className="bg-indigo-50 rounded-xl p-4 text-center font-medium text-indigo-600 hover:bg-indigo-100"
  >
    {title}
  </Link>
);

const TimetableRow = ({ time, subject, className }) => (
  <li className="flex justify-between">
    <span className="text-gray-500">{time}</span>
    <span className="font-medium">{subject}</span>
    <span className="text-gray-400">{className}</span>
  </li>
);

const ListRow = ({ title, meta }) => (
  <li>
    <div className="font-medium">{title}</div>
    <div className="text-xs text-gray-400">{meta}</div>
  </li>
);

const formatDue = (iso) => {
  if (!iso) return "No due date";
  const due = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due - today) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
};

const formatDate = (iso) => {
  if (!iso) return "Recently";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const DashboardLink = ({ title, desc, to }) => (
  <Link
    to={to}
    className="bg-white rounded-xl shadow p-6 hover:shadow-md"
  >
    <h3 className="font-semibold text-lg">{title}</h3>
    <p className="text-sm text-gray-500">{desc}</p>
  </Link>
);
