import { Link } from "react-router-dom";
import { useState } from "react";
import {
  FiMessageSquare,
  FiAlertCircle,
  FiBell,
  FiUsers,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";

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

export default function TeacherCommunicationDashboard() {

  const [filter, setFilter] = useState("week");

  /* ================= STATS ================= */
  const stats = [
    {
      title: "Total Messages",
      value: 128,
      growth: 12,
      icon: <FiMessageSquare size={22} />,
      color: "border-blue-500",
      link: "/teacher-communication/messages",
    },
    {
      title: "Complaints",
      value: 12,
      growth: -5,
      icon: <FiAlertCircle size={22} />,
      color: "border-red-500",
      link: "/teacher-communication/complaints",
    },
    {
      title: "Notices",
      value: 34,
      growth: 8,
      icon: <FiBell size={22} />,
      color: "border-green-500",
      link: "/teacher-communication/notices",
    },
    {
      title: "Parents Contacted",
      value: 89,
      growth: 15,
      icon: <FiUsers size={22} />,
      color: "border-purple-500",
      link: "/teacher-communication/logs",
    },
  ];

  /* ================= DATA ================= */

  const weeklyData = [
    { name: "Mon", messages: 20 },
    { name: "Tue", messages: 35 },
    { name: "Wed", messages: 28 },
    { name: "Thu", messages: 40 },
    { name: "Fri", messages: 22 },
  ];

  const monthlyTrend = [
    { name: "Jan", messages: 120 },
    { name: "Feb", messages: 180 },
    { name: "Mar", messages: 150 },
    { name: "Apr", messages: 210 },
    { name: "May", messages: 170 },
  ];

  const complaintStatus = [
    { name: "Resolved", value: 8 },
    { name: "Pending", value: 4 },
  ];

  const COLORS = ["#22c55e", "#ef4444"];

  return (
    <div className="space-y-4">

      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center">
      

       
      </div>

    {/* ================= STAT CARDS ================= */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {stats.map((item, index) => (
    <Link to={item.link} key={index}>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-gray-500">{item.title}</p>

            <h2 className="text-2xl font-bold text-gray-800 mt-1">
              {item.value}
            </h2>

            <div
              className={`flex items-center text-sm mt-2 ${
                item.growth > 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {item.growth > 0 ? (
                <FiTrendingUp className="mr-1" />
              ) : (
                <FiTrendingDown className="mr-1" />
              )}
              {item.growth}%
            </div>
          </div>

          <div className="text-gray-400">
            {item.icon}
          </div>
        </div>
      </div>
    </Link>
  ))}
</div>
      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">
            Weekly Messages Overview
          </h3>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="messages" fill="#3b82f6" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            Complaint Status
          </h3>

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
                  <Cell key={index} fill={COLORS[index]} />
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
            <YAxis />
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
        <h3 className="text-lg font-semibold mb-4">
          Most Active Classes
        </h3>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Class</th>
              <th className="pb-2">Messages</th>
              <th className="pb-2">Complaints</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            <tr className="border-b">
              <td className="py-2">10A</td>
              <td>45</td>
              <td>3</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">9B</td>
              <td>38</td>
              <td>2</td>
            </tr>
            <tr>
              <td className="py-2">8C</td>
              <td>29</td>
              <td>1</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
