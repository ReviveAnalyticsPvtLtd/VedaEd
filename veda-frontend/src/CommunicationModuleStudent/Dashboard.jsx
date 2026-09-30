import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FiMessageSquare,
  FiBell,
  FiAlertCircle,
  FiClock,
} from "react-icons/fi";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import CommunicationAPI from "../services/communicationAPI";
import complaintAPI from "../services/complaintAPI";

const COLORS = ["#22c55e", "#ef4444"];

export default function CommunicationStudentDashboard() {
  const [stats, setStats] = useState([
    { title: "My Messages", value: 0, icon: <FiMessageSquare size={22} />, color: "border-blue-500", link: "/student/communication/messages" },
    { title: "Notices", value: 0, icon: <FiBell size={22} />, color: "border-green-500", link: "/student/communication/notices" },
    { title: "Complaints", value: 0, icon: <FiAlertCircle size={22} />, color: "border-red-500", link: "/student/communication/complaints" },
    { title: "Pending Replies", value: 0, icon: <FiClock size={22} />, color: "border-yellow-500", link: "/student/communication/logs" },
  ]);
  const [complaintData, setComplaintData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.refId || user?._id;
    if (!userId) {
      setLoading(false);
      return;
    }
    const userModel = user.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
      : "Student";

    const load = async () => {
      try {
        // Every call below is tenant-scoped server-side: the school comes from
        // the authenticated user and the party is the caller's own, so no
        // schoolId is ever sent or trusted from the browser.
        const [messagesRes, notificationsRes, noticesRes, complaintsRes, logsRes] =
          await Promise.allSettled([
            CommunicationAPI.getMessages(userId, userModel),
            CommunicationAPI.getReceivedNotifications(userId, userModel),
            CommunicationAPI.getPublishedNotices(userId, userModel),
            complaintAPI.getUserComplaints(userId, userModel),
            CommunicationAPI.getUserLogs(userId, userModel),
          ]);

        if (!active) return;

        const unwrap = (r) =>
          r.status === "fulfilled" ? r.value?.data || r.value || [] : [];

        const messages = unwrap(messagesRes);
        const notifications = unwrap(notificationsRes);
        const notices = unwrap(noticesRes);
        const complaints = unwrap(complaintsRes);
        const logs = unwrap(logsRes);

        const asArray = (v) => (Array.isArray(v) ? v : []);

        const msgCount =
          asArray(messages).length + asArray(notifications).length;
        const noticeCount = asArray(notices).length;
        const complaintList = asArray(complaints);
        const resolvedCount = complaintList.filter((c) =>
          ["resolved", "closed"].includes(String(c.status || "").toLowerCase())
        ).length;
        const pendingCount = complaintList.filter((c) =>
          ["submitted", "under_review", "Pending"].includes(String(c.status || "").toLowerCase())
        ).length;

        setStats([
          { title: "My Messages", value: msgCount, icon: <FiMessageSquare size={22} />, color: "border-blue-500", link: "/student/communication/messages" },
          { title: "Notices", value: noticeCount, icon: <FiBell size={22} />, color: "border-green-500", link: "/student/communication/notices" },
          { title: "Complaints", value: complaintList.length, icon: <FiAlertCircle size={22} />, color: "border-red-500", link: "/student/communication/complaints" },
          { title: "Pending Replies", value: pendingCount, icon: <FiClock size={22} />, color: "border-yellow-500", link: "/student/communication/logs" },
        ]);

        const chartData = [];
        if (resolvedCount > 0) chartData.push({ name: "Resolved", value: resolvedCount });
        if (pendingCount > 0) chartData.push({ name: "Pending", value: pendingCount });
        setComplaintData(chartData);

        const activity = [];
        const logMeta = {
          complaint_submitted: { icon: "⚠", label: "Complaint submitted" },
          complaint_viewed: { icon: "👁", label: "Complaint viewed" },
          complaint_responded: { icon: "💬", label: "Complaint responded" },
          complaint_resolved: { icon: "✅", label: "Complaint resolved" },
          notice_viewed: { icon: "📢", label: "Notice viewed" },
          notice_created: { icon: "📝", label: "Notice created" },
          notice_published: { icon: "📢", label: "Notice published" },
          message_sent: { icon: "📩", label: "Message sent" },
          message_received: { icon: "📩", label: "Message received" },
          message_read: { icon: "📖", label: "Message read" },
          file_uploaded: { icon: "📎", label: "File uploaded" },
          file_downloaded: { icon: "📥", label: "File downloaded" },
          login: { icon: "🔑", label: "Login" },
          logout: { icon: "👋", label: "Logout" },
        };
        asArray(logs).slice(0, 5).forEach((log) => {
          const meta = logMeta[log.action] || { icon: "📋", label: "Communication activity" };
          const detail =
            typeof log.details === "object" && log.details
              ? log.details.subject || log.details.title || ""
              : "";
          activity.push({
            icon: meta.icon,
            text: detail ? `${meta.label}: ${detail}` : meta.label,
          });
        });
        if (activity.length === 0) {
          asArray(notices).slice(0, 3).forEach((n) => {
            activity.push({ icon: "📢", text: `Notice: ${n.title || "New notice"}` });
          });
          [...asArray(messages), ...asArray(notifications)].slice(0, 2).forEach((m) => {
            activity.push({ icon: "📩", text: m.title || m.subject || "New message" });
          });
        }
        setRecentActivity(activity);
      } catch {
        /* silently handle */
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">

      {/* 🔹 HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Student Communication Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Track your messages, notices and complaints
        </p>
      </div>

      {/* 🔹 STAT CARDS */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((item, index) => (
          <Link to={item.link} key={index}>
            <div
              className={`bg-white p-5 rounded-lg shadow-sm border-l-4 ${item.color}
              hover:shadow-md transition cursor-pointer`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">{item.title}</p>
                  <h2 className="text-2xl font-semibold">
                    {loading ? "..." : item.value}
                  </h2>
                </div>
                <div className="text-gray-600">{item.icon}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 🔹 CHART + ACTIVITY */}
      <div className="grid grid-cols-2 gap-4">

        {/* Complaint Status Chart */}
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-md font-semibold mb-4">
            Complaint Status Overview
          </h3>

          {loading ? (
            <p className="text-gray-400 text-sm text-center py-4">Loading...</p>
          ) : complaintData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={complaintData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label
                >
                  {complaintData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">
              You have not raised any complaints yet.
            </p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-md font-semibold mb-4">
            Recent Activity
          </h3>

          {loading ? (
            <p className="text-gray-400 text-sm text-center py-4">Loading...</p>
          ) : recentActivity.length > 0 ? (
            <ul className="space-y-3 text-sm text-gray-600">
              {recentActivity.map((item, index) => (
                <li key={index}>
                  {item.icon} {item.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">
              No recent activity.
            </p>
          )}
        </div>

      </div>

      {/* 🔹 QUICK ACTIONS */}
      <div className="bg-white p-5 rounded-lg shadow-sm">
        <h3 className="text-md font-semibold mb-4">
          Quick Actions
        </h3>

        <div className="flex gap-4">
          <Link
            to="/student/communication/messages"
            className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
          >
            View Messages
          </Link>

          <Link
            to="/student/communication/notices"
            className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
          >
            View Notices
          </Link>

          <Link
            to="/student/communication/complaints"
            className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
          >
            Raise Complaint
          </Link>
        </div>
      </div>

    </div>
  );
}
