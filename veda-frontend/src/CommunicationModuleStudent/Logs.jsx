import React, { useEffect, useState, useMemo } from "react";
import CommunicationAPI from "./communicationAPI";
import HelpInfo from "../components/HelpInfo";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const [studentId, setStudentId] = useState("68c27fb96a063075c9a73ee2");
  const [studentModel, setStudentModel] = useState("Student");

  const fetchLogs = async (uId = studentId, uModel = studentModel) => {
    try {
      setLoading(true);
      setError(null);

      const response = await CommunicationAPI.getPublishedNotices(
        uId,
        uModel
      );

      if (response.success) {
        // Transform notices data to match logs format
        const transformedLogs = response.data.map((notice) => ({
          id: notice._id,
          title: notice.title,
          sender: notice.authorModel === "Staff" ? "Admin" : notice.authorModel,
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
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const uId = user.refId || user._id || "68c27fb96a063075c9a73ee2";
    let uModel = "Student";
    if (user.role) {
      uModel = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
    }
    setStudentId(uId);
    setStudentModel(uModel);
    fetchLogs(uId, uModel);
  }, []);

  const hasLogs = useMemo(() => logs && logs.length > 0, [logs]);

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Logs</h2>
        <HelpInfo
          title="Student Logs Help"
          description={`Page Description: Audit every notice or message you have received. See sender, channels, and timestamps for your personal communication history.


10.3 Student Communication Logs

Single tab listing all communication entries in chronological order.

Sections:
- Breadcrumb & Header: Indicates you're on Logs > All Logs
- All Logs Tab: Table columns for Title, Sender, Channels, and Sent At
- Channel Badges: Visual chips showing whether the message came via In-app, SMS, or Email
- Loading/Error States: Displays loading text, retry button, or “No logs available” message when needed
- Refresh Action: Buttons (Retry) to fetch the latest logs if something fails`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-6  mb-3 text-gray-600 border-b">
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
          <div className="text-center py-10">
            <p className="text-gray-500">No logs available.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">
                  Sender
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
              {logs.map((log, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 whitespace-nowrap">{log.title}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                        log.sender === "Teacher"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {log.sender}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {log.channels.join(", ")}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {new Date(log.sentAt).toLocaleString()}
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
