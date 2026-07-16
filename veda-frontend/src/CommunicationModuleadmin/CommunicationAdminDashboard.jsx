import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMail,
  FiBell,
  FiAlertCircle,
  FiFileText,
  FiTrendingUp,
  FiPlusCircle,
  FiSend,
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
  Legend,
} from "recharts";
import CommunicationAPI from "./communicationAPI";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const CommunicationAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAnnouncements: 0,
    totalNotifications: 0,
    scheduledCount: 0,
    draftCount: 0,
  });
  const [recentNotices, setRecentNotices] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch notice stats
      const noticeStatsRes = await fetch(`${CommunicationAPI.getNotices ? 'http://localhost:5000/api/communication' : ''}/notices/stats/summary`)
        .then(res => res.json())
        .catch(() => null);

      // Fetch notification stats
      const notificationStatsRes = await fetch('http://localhost:5000/api/communication/notifications/stats/summary')
        .then(res => res.json())
        .catch(() => null);

      // Fetch recent notices
      const recentNoticesRes = await CommunicationAPI.getNotices({ limit: 5 });

      let totalAnn = 0;
      let publishedAnn = 0;
      let draftAnn = 0;
      let categories = [];
      let priorities = [];

      if (noticeStatsRes?.success) {
        const d = noticeStatsRes.data;
        totalAnn = d.totalNotices || 0;
        publishedAnn = d.publishedNotices || 0;
        draftAnn = d.draftNotices || 0;
        categories = (d.noticesByCategory || []).map((c, i) => ({
          name: c._id ? c._id.charAt(0).toUpperCase() + c._id.slice(1) : "General",
          value: c.count
        }));
        priorities = (d.noticesByPriority || []).map((p, i) => ({
          name: p._id ? p._id.charAt(0).toUpperCase() + p._id.slice(1) : "Medium",
          value: p.count
        }));
      }

      let totalNotif = 0;
      let sentNotif = 0;
      let scheduledNotif = 0;

      if (notificationStatsRes?.success) {
        const d = notificationStatsRes.data;
        totalNotif = d.totalNotifications || 0;
        sentNotif = d.sentNotifications || 0;
        scheduledNotif = d.scheduledNotifications || 0;
      }

      setStats({
        totalAnnouncements: totalAnn,
        totalNotifications: totalNotif,
        scheduledCount: scheduledNotif,
        draftCount: draftAnn,
      });

      if (recentNoticesRes?.success) {
        setRecentNotices(recentNoticesRes.data || []);
      }

      setCategoryData(categories.length > 0 ? categories : [{ name: "General", value: 1 }]);
      setPriorityData(priorities.length > 0 ? priorities : [{ name: "Medium", value: 1 }]);

    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Failed to fetch statistics. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const summaryCards = [
    {
      title: "Total Announcements",
      value: stats.totalAnnouncements,
      icon: <FiBell size={26} />,
      color: "from-blue-500 to-blue-600",
      route: "/communication/notices",
    },
    {
      title: "Notifications Sent",
      value: stats.totalNotifications,
      icon: <FiMail size={26} />,
      color: "from-green-500 to-green-600",
      route: "/communication/logs",
    },
    {
      title: "Scheduled Notifications",
      value: stats.scheduledCount,
      icon: <FiSend size={26} />,
      color: "from-purple-500 to-purple-600",
      route: "/communication/logs",
    },
    {
      title: "Draft Announcements",
      value: stats.draftCount,
      icon: <FiFileText size={26} />,
      color: "from-amber-500 to-amber-600",
      route: "/communication/notices",
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Loading Dashboard Statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl mt-6 text-center">
        <FiAlertCircle className="mx-auto text-red-500 mb-3" size={40} />
        <h3 className="text-lg font-semibold text-red-800 mb-1">Communication Dashboard Connection Failure</h3>
        <p className="text-red-600 mb-4 text-sm">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition text-sm"
        >
          Retry Fetching Statistics
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Communication Dashboard</h2>
        <p className="text-sm text-gray-500">Monitor school-wide notices, announcements and outgoing notification logs</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.route)}
            className={`bg-gradient-to-r ${card.color} text-white p-5 rounded-xl shadow-sm cursor-pointer transform hover:translate-y-[-2px] transition duration-200`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider opacity-80">{card.title}</p>
                <h2 className="text-3xl font-extrabold mt-1">{card.value}</h2>
              </div>
              <div className="opacity-90">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-md font-semibold mb-4 text-gray-800">Quick Actions</h3>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => navigate("/communication/messages")}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition text-sm font-medium"
          >
            <FiSend /> Send Group/Class Notification
          </button>

          <button
            onClick={() => navigate("/communication/notices")}
            className="bg-green-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-green-700 transition text-sm font-medium"
          >
            <FiPlusCircle /> Compose Announcement
          </button>

          <button
            onClick={() => navigate("/communication/logs")}
            className="bg-purple-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition text-sm font-medium"
          >
            <FiFileText /> Review History Logs
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Announcements */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
          <h3 className="text-md font-semibold mb-4 text-gray-800">Recent Announcements</h3>
          {recentNotices.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No announcements found. Click "Compose Announcement" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b text-gray-400 font-medium pb-2">
                    <th className="py-2.5">Title</th>
                    <th className="py-2.5">Audience</th>
                    <th className="py-2.5">Priority</th>
                    <th className="py-2.5">Date</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 divide-y divide-gray-50">
                  {recentNotices.map((notice) => (
                    <tr key={notice._id} className="hover:bg-gray-50/55 transition">
                      <td className="py-3 font-medium text-gray-800">{notice.title}</td>
                      <td className="py-3 capitalize">{notice.targetAudience}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                          notice.priority === 'urgent' || notice.priority === 'high'
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : notice.priority === 'medium'
                            ? 'bg-yellow-50 text-yellow-600 border border-yellow-100'
                            : 'bg-green-50 text-green-600 border border-green-100'
                        }`}>
                          {notice.priority}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400 text-xs">
                        {notice.publishDate ? new Date(notice.publishDate).toLocaleDateString() : 'Draft'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Charts & Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-md font-semibold mb-4 text-gray-800">Announcement Breakdown</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 justify-center">
              {categoryData.map((entry, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 mt-4">
            <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
              <FiTrendingUp size={16} />
              Communication module active. Stats refreshed dynamically.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationAdminDashboard;
