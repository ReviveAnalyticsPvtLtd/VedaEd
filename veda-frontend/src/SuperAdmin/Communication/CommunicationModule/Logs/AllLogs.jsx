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
      const response = await CommunicationAPI.getNotices();

      if (response.success) {
        const transformedLogs = response.data.map((notice) => ({
          id: notice._id,
          title: notice.title,
          roles: notice.tags || [],
          channels: ["In-app"],
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
      <div className="p-0">
        <div className="bg-white p-4 rounded-lg shadow-sm border overflow-x-auto">
         
          {/* Loading */}
          {loading ? (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">
                Loading notices...
              </p>
            </div>
          ) : error ? (
            /* Error */
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
            /* Empty State */
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">
                No logs yet.
              </p>

              <button
                onClick={() =>
                  navigate(
                    "/superadmin/communication/notices/post"
                  )
                }
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Post a notice
              </button>
            </div>
          ) : (
            /* Table */
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">
                      Title
                    </th>

                    <th className="p-2 border">
                      Roles
                    </th>

                    <th className="p-2 border">
                      Channels
                    </th>

                    <th className="p-2 border">
                      Sent At
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log, idx) => (
                    <tr
                      key={idx}
                      className="text-center hover:bg-gray-50"
                    >
                      <td className="p-2 border text-left">
                        {log.title || "Untitled"}
                      </td>

                      <td className="p-2 border">
                        {Array.isArray(log.roles) &&
                        log.roles.length > 0
                          ? log.roles.join(", ")
                          : "-"}
                      </td>

                      <td className="p-2 border">
                        {Array.isArray(log.channels) &&
                        log.channels.length > 0
                          ? log.channels.join(", ")
                          : "-"}
                      </td>

                      <td className="p-2 border">
                        {log.sentAt
                          ? new Date(
                              log.sentAt
                            ).toLocaleString()
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