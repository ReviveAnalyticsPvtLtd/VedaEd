import React, { useEffect, useState, useMemo } from "react";
import HelpInfo from "../components/HelpInfo";

// Dummy logs — child related for parent view
const dummyLogs = [
  {
    title: "Exam Schedule",
    sender: "Teacher",
    channels: ["In-app"],
    sentAt: new Date(),
    child: "Riya Sharma",
  },
  {
    title: "Holiday Notice",
    sender: "Admin",
    channels: ["SMS", "Email"],
    sentAt: new Date(),
    child: "Riya Sharma",
  },
];

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Simulate fetching child-specific logs
    setTimeout(() => {
      setLogs(dummyLogs);
      setLoading(false);
    }, 500);
  }, []);

  const hasLogs = useMemo(() => logs && logs.length > 0, [logs]);

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Logs</h2>
        <HelpInfo
          title="Parent Logs Help"
          description={`Page Description: Track every message or notice your child has received. View sender, channel, sent time, and which child was targeted.


9.3 Parent Communication Logs

Single log tab summarizing all communication entries.

Sections:
- Breadcrumb & Header: Shows you are in Logs > All Logs
- Tab Bar: All Logs button (highlighted) for clarity even in single-tab layout
- Logs Table: Columns for Title, Sender, Channels, Sent At, and Child name
- Status Chips: Colored badges for Teacher/Admin senders for quick context
- Loading/Empty States: Friendly messaging when data is being fetched or no logs exist
- Retry Button: Appears during error states to refetch logs`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        <button
          onClick={() => setActiveTab("all")}
          className={`capitalize pb-2 ${
            activeTab === "all"
              ? "text-blue-600 font-semibold border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All Logs
        </button>
      </div>

      {/* Content */}
      <div className="bg-white p-3 rounded-lg shadow-sm border">
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading logs...</p>
          </div>
        ) : !hasLogs ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No logs available for your child.</p>
          </div>
        ) : (
        <table className="w-full border text-sm">
  <thead className="bg-gray-100">
    <tr>
      <th className="p-2 border">Title</th>
      <th className="p-2 border">Sender</th>
      <th className="p-2 border">Channels</th>
      <th className="p-2 border">Sent At</th>
      <th className="p-2 border">Child</th>
    </tr>
  </thead>

  <tbody>
    {logs.map((log, idx) => (
      <tr
        key={idx}
        className="text-center hover:bg-gray-50"
      >
        <td className="p-2 border text-left">
          {log.title}
        </td>

        <td className="p-2 border">
          <span
            className={`inline-block px-2 py-1 font-semibold rounded-full ${
              log.sender === "Teacher"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {log.sender}
          </span>
        </td>

        <td className="p-2 border">
          {log.channels.join(", ")}
        </td>

        <td className="p-2 border">
          {new Date(log.sentAt).toLocaleString()}
        </td>

        <td className="p-2 border text-gray-700 font-medium">
          {log.child}
        </td>
      </tr>
    ))}
  </tbody>
</table>
        )}
      </div>
    </div>
  );
}
