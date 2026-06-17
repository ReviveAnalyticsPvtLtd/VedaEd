import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CommunicationAPI from "../communicationAPI";

export default function AllLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch notices from backend API
  const fetchAllNotices = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all notices from backend
      const response = await CommunicationAPI.getNotices();

      if (response.success) {
        // Transform notices data to match logs format
        const transformedLogs = response.data.map((notice) => ({
          id: notice._id,
          title: notice.title,
          roles: notice.tags || [],
          channels: ["In-app"], // Default channel since we're using in-app notices
          sentAt: notice.createdAt || notice.publishDate,
          status: notice.status,
          targetAudience: notice.targetAudience,
          author: notice.author,
        }));

        setLogs(transformedLogs);
      } else {
        setError("Failed to fetch notices");
      }
    } catch (err) {
      setError("Failed to fetch notices");
      console.error("Error fetching notices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNotices();
  }, []);

  const hasLogs = useMemo(() => logs && logs.length > 0, [logs]);

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* Outer Gray Wrapper */}
      <div className="p-0">
        {/* Inner White Box */}
        <div className="bg-white p-4 rounded-lg shadow-sm overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">All Logs</h3>
          {loading ? (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">Loading notices...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchAllNotices}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : !hasLogs ? (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">No logs yet.</p>
              <button
                onClick={() => navigate("/communication/notices/post")}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Post a notice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-4 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">
                      Channels
                    </th>
                    <th className="px-4 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">
                      Sent At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {log.title || "Untitled"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {Array.isArray(log.roles) ? log.roles.join(", ") : "-"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {Array.isArray(log.channels)
                          ? log.channels.join(", ")
                          : "-"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {log.sentAt
                          ? new Date(log.sentAt).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
