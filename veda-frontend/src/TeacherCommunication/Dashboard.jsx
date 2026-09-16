import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FiMessageSquare,
  FiAlertCircle,
  FiBell,
  FiUsers,
} from "react-icons/fi";
import CommunicationAPI from "./communicationAPI";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const emptyWeeklyData = () =>
  DAY_NAMES.map((name) => ({ name, messages: 0 }));
const emptyMonthlyTrend = () =>
  MONTH_NAMES.map((name) => ({ name, messages: 0 }));

export default function TeacherCommunicationDashboard() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("week");
  const [stats, setStats] = useState([
    { title: "Total Messages", value: 0 },
    { title: "Complaints", value: 0 },
    { title: "Notices", value: 0 },
    { title: "Parents Contacted", value: 0 },
  ]);
  const [weeklyData, setWeeklyData] = useState(emptyWeeklyData());
  const [monthlyTrend, setMonthlyTrend] = useState(emptyMonthlyTrend());
  const [complaintStatus, setComplaintStatus] = useState([
    { name: "Open", value: 0 },
    { name: "Resolved", value: 0 },
  ]);
  const [activeClasses, setActiveClasses] = useState([]);

  useEffect(() => {
    let active = true;

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const teacherId = user?.refId || user?._id;

    const loadDashboard = async () => {
      try {
        if (!teacherId) {
          console.error("No teacher user found. Please log in again.");
          if (active) setLoading(false);
          return;
        }

        const [
          messagesRes,
          sentRes,
          complaintsRes,
          noticesRes,
          logsRes,
        ] = await Promise.all([
          CommunicationAPI.getMessages(teacherId, "Teacher"),
          CommunicationAPI.getSentMessages(teacherId, "Teacher"),
          CommunicationAPI.getUserComplaints(teacherId, "Teacher"),
          CommunicationAPI.getNotices(),
          CommunicationAPI.getUserLogs(teacherId, "Teacher"),
        ]);

        if (!active) return;

        const messages = messagesRes?.data || [];
        const sentMessages = sentRes?.data || [];
        const complaints = complaintsRes?.data || [];
        const notices = noticesRes?.data || [];
        const logs = logsRes?.data || [];

        const totalMessages = messages.length + sentMessages.length;
        const totalComplaints = complaints.length;
        const totalNotices = notices.length;
        const parentsContacted = logs.filter(
          (log) =>
            (log.details?.receiverModel || "") === "Parent" ||
            (log.targetAudience || "") === "Parents"
        ).length;

        setStats([
          {
            title: "Total Messages",
            value: totalMessages,
          },
          {
            title: "Complaints",
            value: totalComplaints,
          },
          {
            title: "Notices",
            value: totalNotices,
          },
          {
            title: "Parents Contacted",
            value: parentsContacted,
          },
        ]);

        // Weekly messages from logs (only messages sent this week)
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 6);
        startOfWeek.setHours(0, 0, 0, 0);

        const weekByDay = DAY_NAMES.map(() => 0);
        logs.forEach((log) => {
          const date = new Date(log.timestamp || log.createdAt);
          if (date >= startOfWeek) {
            weekByDay[date.getDay()] += 1;
          }
        });
        setWeeklyData(
          DAY_NAMES.map((name, idx) => ({ name, messages: weekByDay[idx] }))
        );

        // Monthly message trend
        const monthCounts = MONTH_NAMES.map(() => 0);
        [...messages, ...sentMessages].forEach((msg) => {
          const date = new Date(msg.createdAt || msg.timestamp);
          if (!isNaN(date.getTime())) {
            monthCounts[date.getMonth()] += 1;
          }
        });
        setMonthlyTrend(
          MONTH_NAMES.map((name, idx) => ({ name, messages: monthCounts[idx] }))
        );

        // Complaint status donut
        const open = complaints.filter(
          (c) => !c.status || c.status === "Open"
        ).length;
        const resolved = complaints.filter(
          (c) => c.status === "Resolved"
        ).length;
        setComplaintStatus([
          { name: "Open", value: open },
          { name: "Resolved", value: resolved },
        ]);

        // Most active classes
        const classMap = {};
        messages.forEach((msg) => {
          const cls = msg.targetClass || "Others";
          classMap[cls] = classMap[cls] || { messages: 0, complaints: 0 };
          classMap[cls].messages += 1;
        });
        complaints.forEach((comp) => {
          const cls = comp.targetClass || "Others";
          classMap[cls] = classMap[cls] || { messages: 0, complaints: 0 };
          classMap[cls].complaints += 1;
        });
        const sortedClasses = Object.entries(classMap)
          .map(([name, data]) => ({
            name,
            messages: data.messages,
            complaints: data.complaints,
          }))
          .sort((a, b) => b.messages - a.messages)
          .slice(0, 5);
        setActiveClasses(sortedClasses);
      } catch (error) {
        console.error("Dashboard load failed:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  /* ================= STAT CARDS ================= */
  const statCards = [
    {
      ...stats[0],
      icon: <FiMessageSquare size={22} />,
      color: "border-blue-500",
      link: "/teacher-communication/messages",
    },
    {
      ...stats[1],
      icon: <FiAlertCircle size={22} />,
      color: "border-red-500",
      link: "/teacher-communication/complaints",
    },
    {
      ...stats[2],
      icon: <FiBell size={22} />,
      color: "border-green-500",
      link: "/teacher-communication/notices",
    },
    {
      ...stats[3],
      icon: <FiUsers size={22} />,
      color: "border-purple-500",
      link: "/teacher-communication/logs",
    },
  ];

  const COLORS = ["#ef4444", "#22c55e"];

  return (
    <div className="space-y-4">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Teacher Communication Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Overview of messages, complaints, notices and parent contacts.
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* ================= STAT CARDS ================= */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">
          Loading dashboard...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((item, index) => (
              <Link to={item.link} key={index}>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{item.title}</p>
                      <h2 className="text-2xl font-bold text-gray-800 mt-1">
                        {item.value}
                      </h2>
                    </div>
                    <div className="text-gray-400">{item.icon}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ================= CHARTS ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">
                Weekly Messages Overview
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="messages" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Complaint Status</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={complaintStatus}
                    dataKey="value"
                    innerRadius={60}
                    outerRadius={100}
                    label
                  >
                    {complaintStatus.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ================= LINE CHART ================= */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">
              Monthly Message Trend
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="messages"
                  stroke="#6366f1"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ================= TOP CLASSES TABLE ================= */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Most Active Classes</h3>
            {activeClasses.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Class</th>
                    <th className="pb-2">Messages</th>
                    <th className="pb-2">Complaints</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {activeClasses.map((cls) => (
                    <tr className="border-b" key={cls.name}>
                      <td className="py-2">{cls.name}</td>
                      <td>{cls.messages}</td>
                      <td>{cls.complaints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-sm">
                No class activity recorded yet.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}