import React, { useEffect, useState, useMemo } from "react";
import CommunicationAPI from "../communicationAPI";

export default function AllLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all notices from backend
      const response = await CommunicationAPI.getNotices();

      if (response.success) {
        // Transform notices data to match logs format
        const transformedLogs = response.data.map((notice) => ({
          id: notice._id,
          title: notice.title,
          sender: notice.authorModel === "Staff" ? "Admin" : notice.authorModel,
          className:
            notice.targetAudience === "students"
              ? "All Classes"
              : notice.targetAudience,
          channels: ["In-app"], // Default channel since we're using in-app notices
          sentAt: notice.createdAt || notice.publishDate,
        }));

        setLogs(transformedLogs);
      } else {
        setError("Failed to fetch logs");
      }
    } catch (err) {
      setError("Failed to fetch logs");
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const hasLogs = useMemo(() => logs && logs.length > 0, [logs]);

  return (
    <div>
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading logs...</div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : !hasLogs ? (
        <div className="text-center py-10 text-gray-500">
          No logs available.
        </div>
      ) : (
       <table className="w-full border text-sm">
  <thead className="bg-gray-100">
    <tr>
      <th className="p-2 border">Title</th>
      <th className="p-2 border">Sended By</th>
      <th className="p-2 border">Class</th>
      <th className="p-2 border">Channels</th>
      <th className="p-2 border">Sent At</th>
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
            className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
              log.sender === "Teacher"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {log.sender === "Teacher"
              ? "Class Teacher"
              : log.sender}
          </span>
        </td>

        <td className="p-2 border">
          {log.className || "-"}
        </td>

        <td className="p-2 border">
          {log.channels.join(", ")}
        </td>

        <td className="p-2 border">
          {new Date(log.sentAt).toLocaleString()}
        </td>
      </tr>
    ))}
  </tbody>
</table>
      )}
    </div>
  );
}
