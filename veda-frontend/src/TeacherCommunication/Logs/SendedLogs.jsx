import React, { useEffect, useState, useMemo } from "react";
import CommunicationAPI from "../communicationAPI";

const TEACHER_ID = "6a99120596f5dd52a7cbf930";

export default function SendedLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadUserLogs = async () => {
      try {
        const res = await CommunicationAPI.getUserLogs(
          TEACHER_ID,
          "Staff",
          { action: "notice_created", limit: 50 }
        );
        if (!active) return;
        const data = res?.data || [];
        const mapped = data.map((log) => ({
          id: log._id,
          title: log.target?.title || "Untitled Notice",
          sendedTo: log.targetAudience || "Not specified",
          className: log.target?.specificTargets?.length ? "Specific" : "All Classes",
          studentId: "-",
          channels: log.target?.targetChannels || ["In-app"],
          sentAt: log.timestamp || log.createdAt,
        }));
        setLogs(mapped);
      } catch (error) {
        console.error("SendedLogs load failed:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadUserLogs();
    return () => {
      active = false;
    };
  }, []);

  const hasLogs = useMemo(() => logs && logs.length > 0, [logs]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-gray-200 p-6 mt-4 border border-gray-100 shadow-sm">
      <div className="bg-white p-4 rounded-lg shadow-sm overflow-x-auto border border-gray-100">
        {loading ? (
          <div className="text-center py-10 text-gray-500">
            Loading sent logs...
          </div>
        ) : !hasLogs ? (
          <div className="text-center py-10 text-gray-500">
            No sent logs available.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">
                  Sent To
                </th>
                <th className="px-4 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-4 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-4 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">
                  Channels
                </th>
                <th className="px-4 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">
                  Sent At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-2 whitespace-nowrap">{log.title}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className="inline-block px-2 py-1  font-semibold rounded-full bg-purple-100 text-purple-800">
                      {log.sendedTo}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {log.className || "-"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {log.studentId || "-"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {log.channels.join(", ")}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {formatDateTime(log.sentAt)}
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