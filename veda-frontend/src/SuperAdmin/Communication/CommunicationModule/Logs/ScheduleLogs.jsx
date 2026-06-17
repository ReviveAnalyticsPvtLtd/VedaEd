import React, { useState, useEffect } from "react";
import { FiMoreVertical, FiCheck, FiTrash2 } from "react-icons/fi";

// API Endpoints for future backend integration
const API_ENDPOINTS = {
  GET_SCHEDULED_NOTICES: "/api/notices/scheduled",
  DELETE_NOTICE: "/api/notices/:id",
  GET_ALL_NOTICES: "/api/notices",
};

export default function ScheduleLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Future API integration function
  const fetchScheduledNotices = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(API_ENDPOINTS.GET_SCHEDULED_NOTICES);
      // const data = await response.json();
      // setLogs(data);

      // Clear localStorage for fresh start
      localStorage.removeItem("sent_notices_logs");

      // For now, return empty array (will be replaced with API call)
      setLogs([]);
    } catch (err) {
      setError("Failed to fetch scheduled notices");
      console.error("Error fetching notices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledNotices();
  }, []);

  const deleteLog = async (noticeId) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`${API_ENDPOINTS.DELETE_NOTICE.replace(':id', noticeId)}`, {
      //   method: 'DELETE'
      // });

      // For now, remove from local state (will be replaced with API call)
      setLogs((prevLogs) => prevLogs.filter((log) => log.id !== noticeId));
    } catch (error) {
      console.error("Error deleting notice:", error);
      setError("Failed to delete notice");
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
                          onClick={() => deleteLog(log.id || idx)}
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
