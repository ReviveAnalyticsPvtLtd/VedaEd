import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FiMessageSquare,
  FiBell,
  FiAlertCircle,
  FiUserCheck,
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

export default function CommunicationParentDashboard() {
  const [stats, setStats] = useState([
    { title: "Messages from School", value: 0, icon: <FiMessageSquare size={22} />, iconBg: "bg-blue-50 text-blue-600", link: "/parent/communication/messages" },
    { title: "Notices", value: 0, icon: <FiBell size={22} />, iconBg: "bg-emerald-50 text-emerald-600", link: "/parent/communication/notices" },
    { title: "My Complaints", value: 0, icon: <FiAlertCircle size={22} />, iconBg: "bg-amber-50 text-amber-600", link: "/parent/communication/complaints" },
    { title: "Resolved Issues", value: 0, icon: <FiUserCheck size={22} />, iconBg: "bg-purple-50 text-purple-600", link: "/parent/communication/logs" },
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
    const userModel = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : "Parent";

    const load = async () => {
      try {
        const [messagesRes, notificationsRes, noticesRes, complaintsRes, logsRes] = await Promise.allSettled([
          CommunicationAPI.getMessages(userId, userModel),
          CommunicationAPI.getReceivedNotifications(userId, userModel),
          CommunicationAPI.getPublishedNotices(userId, userModel),
          complaintAPI.getUserComplaints(userId, userModel),
          CommunicationAPI.getUserLogs(userId, userModel),
        ]);

        if (!active) return;

        const messages = messagesRes.status === "fulfilled" ? (messagesRes.value?.data || messagesRes.value || []) : [];
        const notifications = notificationsRes.status === "fulfilled" ? (notificationsRes.value?.data || notificationsRes.value || []) : [];
        const notices = noticesRes.status === "fulfilled" ? (noticesRes.value?.data || noticesRes.value || []) : [];
        const complaints = complaintsRes.status === "fulfilled" ? (complaintsRes.value?.data || complaintsRes.value || []) : [];
        const logs = logsRes.status === "fulfilled" ? (logsRes.value?.data || logsRes.value || []) : [];

        const msgCount = (Array.isArray(messages) ? messages.length : 0) + (Array.isArray(notifications) ? notifications.length : 0);
        const noticeCount = Array.isArray(notices) ? notices.length : 0;
        const complaintList = Array.isArray(complaints) ? complaints : [];
        const resolvedCount = complaintList.filter((c) => ["resolved", "closed"].includes(c.status)).length;

        setStats([
          { title: "Messages from School", value: msgCount, icon: <FiMessageSquare size={22} />, iconBg: "bg-blue-50 text-blue-600", link: "/parent/communication/messages" },
          { title: "Notices", value: noticeCount, icon: <FiBell size={22} />, iconBg: "bg-emerald-50 text-emerald-600", link: "/parent/communication/notices" },
          { title: "My Complaints", value: complaintList.length, icon: <FiAlertCircle size={22} />, iconBg: "bg-amber-50 text-amber-600", link: "/parent/communication/complaints" },
          { title: "Resolved Issues", value: resolvedCount, icon: <FiUserCheck size={22} />, iconBg: "bg-purple-50 text-purple-600", link: "/parent/communication/logs" },
        ]);

        const pendingCount = complaintList.filter((c) => ["submitted", "under_review", "Pending"].includes(c.status)).length;
        const chartData = [];
        if (resolvedCount > 0) chartData.push({ name: "Resolved", value: resolvedCount });
        if (pendingCount > 0) chartData.push({ name: "Pending", value: pendingCount });
        setComplaintData(chartData);

        const activity = [];
        const logList = Array.isArray(logs) ? logs : [];
        const logMeta = {
          complaint_submitted: { icon: "⚠", label: "Complaint submitted" },
          complaint_viewed: { icon: "👁", label: "Complaint viewed" },
          complaint_responded: { icon: "💬", label: "Complaint responded" },
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
        logList.slice(0, 5).forEach((log) => {
          const meta = logMeta[log.action] || { icon: "📋", label: "Communication activity" };
          const detail = typeof log.details === "object" && log.details ? log.details.subject || log.details.title || "" : "";
          activity.push({
            icon: meta.icon,
            text: detail ? `${meta.label}: ${detail}` : meta.label,
          });
        });
        if (activity.length === 0) {
          notices.slice(0, 2).forEach((n) => {
            activity.push({ icon: "📢", text: `Notice: ${n.title}` });
          });
          [...notifications, ...messages].slice(0, 2).forEach((m) => {
            activity.push({ icon: "📩", text: `${m.title || m.subject || "New message"}` });
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
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6">
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item, index) => (
          <Link to={item.link} key={index}>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{item.title}</p>
                  <h2 className="text-2xl font-bold text-gray-800 mt-1">{loading ? "..." : item.value}</h2>
                </div>
                <div className={`p-3 rounded-xl ${item.iconBg}`}>{item.icon}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* CHART + ACTIVITY */}
      <div className="grid grid-cols-2 gap-4">
        {/* Complaint Status Chart */}
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-md font-semibold mb-4">Complaint Status Overview</h3>
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-gray-400">Loading...</div>
          ) : complaintData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-gray-400">No complaints recorded yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={complaintData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {complaintData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-md font-semibold mb-4">Recent Activity</h3>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : recentActivity.length === 0 ? (
            <p className="text-gray-400 text-sm">No recent activity.</p>
          ) : (
            <ul className="space-y-3 text-sm text-gray-600">
              {recentActivity.map((item, i) => (
                <li key={i}>{item.icon} {item.text}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-md font-semibold mb-4 text-gray-800">Quick Actions</h3>
        <div className="flex gap-4 flex-wrap">
          <Link to="/parent/communication/messages" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition">View Messages</Link>
          <Link to="/parent/communication/notices" className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 shadow-sm transition">View Notices</Link>
          <Link to="/parent/communication/complaints" className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 shadow-sm transition">Raise Complaint</Link>
        </div>
      </div>
    </div>
  );
}
