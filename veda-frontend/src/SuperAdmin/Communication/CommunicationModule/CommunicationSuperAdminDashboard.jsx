import React from "react";
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

const CommunicationAdminDashboard = () => {
  const navigate = useNavigate();

  const summaryCards = [
    {
      title: "Total Messages",
      value: "1,248",
      icon: <FiMail size={26} />,
      color: "from-blue-500 to-blue-600",
      route: "/communication/messages",
    },
    {
      title: "Notices Sent",
      value: "86",
      icon: <FiBell size={26} />,
      color: "from-green-500 to-green-600",
      route: "/communication/notices",
    },
    {
      title: "Complaints",
      value: "34",
      icon: <FiAlertCircle size={26} />,
      color: "from-red-500 to-red-600",
      route: "/communication/complaints",
    },
    {
      title: "Pending Logs",
      value: "12",
      icon: <FiFileText size={26} />,
      color: "from-purple-500 to-purple-600",
      route: "/communication/logs",
    },
  ];

  return (
    <div className="p-0 m-0  min-h-screen">
      {/* Header */}
     

      {/* Clickable Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {summaryCards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.route)}
            className={`bg-gradient-to-r ${card.color} text-white p-6 rounded-xl shadow-md cursor-pointer transform hover:scale-105 transition duration-300`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">{card.title}</p>
                <h2 className="text-3xl font-bold mt-2">{card.value}</h2>
              </div>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Quick Actions
        </h3>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => navigate("/communication/send-message")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <FiSend /> Send Message
          </button>

          <button
            onClick={() => navigate("/communication/create-notice")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition"
          >
            <FiPlusCircle /> Create Notice
          </button>

          <button
            onClick={() => navigate("/communication/logs")}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition"
          >
            <FiFileText /> View Logs
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Messages Table */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Recent Messages
          </h3>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="py-2">Title</th>
                <th className="py-2">Class</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b">
                <td className="py-2">Exam Schedule</td>
                <td>10-A</td>
                <td>12 Feb 2026</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Holiday Notice</td>
                <td>All</td>
                <td>10 Feb 2026</td>
              </tr>
              <tr>
                <td className="py-2">Fee Reminder</td>
                <td>9-B</td>
                <td>08 Feb 2026</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Performance Section */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Monthly Performance
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Delivery Rate</span>
                <span>92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full w-[92%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Complaint Resolution</span>
                <span>76%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-[76%]" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-green-600 text-sm">
            <FiTrendingUp />
            Performance increased by 12% this month
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationAdminDashboard;
