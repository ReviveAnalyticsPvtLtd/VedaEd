import { Link } from "react-router-dom";
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

export default function CommunicationStudentDashboard() {
  const stats = [
    {
      title: "My Messages",
      value: 24,
      icon: <FiMessageSquare size={22} />,
      color: "border-blue-500",
      link: "/student/communication/messages",
    },
    {
      title: "Notices",
      value: 12,
      icon: <FiBell size={22} />,
      color: "border-green-500",
      link: "/student/communication/notices",
    },
    {
      title: "Complaints",
      value: 3,
      icon: <FiAlertCircle size={22} />,
      color: "border-red-500",
      link: "/student/communication/complaints",
    },
    {
      title: "Pending Replies",
      value: 5,
      icon: <FiClock size={22} />,
      color: "border-yellow-500",
      link: "/student/communication/logs",
    },
  ];

  const complaintData = [
    { name: "Resolved", value: 2 },
    { name: "Pending", value: 1 },
  ];

  const COLORS = ["#22c55e", "#ef4444"];

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
                  <h2 className="text-2xl font-semibold">{item.value}</h2>
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
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-md font-semibold mb-4">
            Recent Activity
          </h3>

          <ul className="space-y-3 text-sm text-gray-600">
            <li>📩 You received a message from Class Teacher</li>
            <li>📢 New notice posted (Exam Schedule)</li>
            <li>⚠ Complaint submitted (Library issue)</li>
            <li>✅ Complaint resolved</li>
            <li>📩 Reminder about assignment submission</li>
          </ul>
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
