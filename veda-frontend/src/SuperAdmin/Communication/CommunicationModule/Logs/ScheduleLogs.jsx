import React, { useState, useEffect } from "react";
import { FiMoreVertical, FiCheck, FiTrash2 } from "react-icons/fi";
import CommunicationAPI from "../communicationAPI";

export default function ScheduleLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchScheduledNotices = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch notices (future-dated notices, usually saved as draft)
      const noticesRes = await CommunicationAPI.getNotices({ limit: 50 });
      let scheduledNotices = [];
      if (noticesRes?.success) {
        scheduledNotices = noticesRes.data
          .filter((n) => new Date(n.publishDate) > new Date())
          .map((n) => ({
            ...n,
            id: n._id,
            logType: "notice",
            message: n.content,
            publishOn: n.publishDate,
            sentAt: null,
            channels: [],
            roles: n.tags && n.tags.length ? n.tags : n.targetAudience ? [n.targetAudience] : [],
          }));
      }

      // 2. Fetch notifications (scheduled ones have a future publishDate)
      const notificationsRes = await CommunicationAPI.getNotifications({ limit: 50 });
      let scheduledNotifications = [];
      if (notificationsRes?.success) {
        scheduledNotifications = notificationsRes.data
          .filter((n) => new Date(n.publishDate) > new Date())
          .map((n) => ({
            ...n,
            id: n._id,
            logType: "notification",
            message: n.description,
            publishOn: n.publishDate,
            sentAt: null,
            channels: (n.channels || []).map(
              (c) => c.charAt(0).toUpperCase() + c.slice(1)
            ),
            roles: n.audience ? [n.audience] : [],
          }));
      }

      // Merge and sort by upcoming publish date
      const combined = [...scheduledNotices, ...scheduledNotifications].sort(
        (a, b) => new Date(a.publishOn) - new Date(b.publishOn)
      );

      setLogs(combined);
    } catch (err) {
      setError("Failed to fetch scheduled notices");
      console.error("Error fetching scheduled notices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledNotices();
  }, []);

  const deleteLog = async (logId, logType) => {
    if (!window.confirm("Cancel and delete this scheduled item?")) return;

    try {
      if (logType === "notice") {
        await CommunicationAPI.deleteNotice(logId);
      } else if (logType === "notification") {
        await CommunicationAPI.deleteNotification(logId);
      }
      setLogs((prevLogs) => prevLogs.filter((log) => log.id !== logId));
    } catch (error) {
      console.error("Error deleting log:", error);
      setError("Failed to delete log");
    }
  };

  return (
    <div className="p-0  min-h-screen">
      {/* Outer Gray Wrapper */}
      <div className="p-0">
        {/* Inner White Box */}
        <div className="bg-white p-4 rounded-lg shadow-sm overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">Schedule Logs</h3>
          {loading ? (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">Loading scheduled notices...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchScheduledNotices}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">No scheduled notices yet.</p>
              <p className=" text-gray-400">
                Scheduled notices will appear here when you set a "Publish On"
                date.
              </p>
            </div>
          ) : (
            <table className="w-full border ">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border text-left">Title</th>
                  <th className="p-2 border text-left">Message</th>
                  <th className="p-2 border text-left">Date</th>
                  <th className="p-2 border text-left">Schedule Date</th>
                  <th className="p-2 border text-center">Email</th>
                  <th className="p-2 border text-center">SMS</th>
                  <th className="p-2 border text-center">Group</th>
                  <th className="p-2 border text-center">Individual</th>
                  <th className="p-2 border text-left">Roles</th>
                  <th className="p-2 border text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={idx} className="text-center hover:bg-gray-50">
                    <td className="p-2 border text-left font-semibold">
                      {log.title || "Untitled"}
                    </td>
                    <td className="p-2 border text-left text-gray-700">
                      {log.message || "-"}
                    </td>
                    <td className="p-2 border">
                      {log.sentAt ? new Date(log.sentAt).toLocaleString() : "-"}
                    </td>
                    <td className="p-2 border">
                      {log.publishOn
                        ? new Date(log.publishOn).toLocaleString()
                        : "-"}
                    </td>

                    <td className="p-2 border">
                      {log.channels && log.channels.includes("Email") ? (
                        <FiCheck className="text-blue-600 inline" />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-2 border">
                      {log.channels && log.channels.includes("SMS") ? (
                        <FiCheck className="text-green-600 inline" />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-2 border">
                      {log.roles && log.roles.length > 1 ? (
                        <FiCheck className="text-blue-600 inline" />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-2 border">
                      {log.roles && log.roles.length === 1 ? (
                        <FiCheck className="text-green-600 inline" />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-2 border">
                      {log.roles ? log.roles.join(", ") : "-"}
                    </td>
                    <td className="p-2 border">
                      <div className="flex gap-1 justify-center">
                        <button className="p-1 rounded hover:bg-gray-100">
                          <FiMoreVertical />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-red-100 text-red-600"
                          onClick={() => deleteLog(log.id || idx, log.logType)}
                          title="Delete notice"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {logs.length > 0 && (
            <p className=" text-gray-500 mt-3">
              Records: {logs.length} of {logs.length}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
