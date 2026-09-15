import React, { useState, useEffect } from "react";
import { FiCheck, FiTrash2, FiMoreVertical } from "react-icons/fi";
import CommunicationAPI from "../communicationAPI";

export default function ScheduleLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadDraftNotices = async () => {
      try {
        const res = await CommunicationAPI.getNotices({ status: "draft", limit: 100 });
        if (!active) return;
        const data = res?.data || [];
        const mapped = data.map((n) => ({
          id: n._id,
          title: n.title,
          message: n.content,
          sendedTo: n.targetAudience || "All",
          className: n.specificTargets?.length ? "Specific" : "All Classes",
          studentId: "-",
          channels: n.targetChannels || ["In-app"],
          sentAt: n.createdAt,
          publishOn: n.publishDate,
          roles: n.tags || [],
        }));
        setLogs(mapped);
      } catch (error) {
        console.error("Failed to load draft notices:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDraftNotices();
    return () => {
      active = false;
    };
  }, []);

  const deleteLog = async (id) => {
    if (!window.confirm("Are you sure you want to delete this draft notice?")) return;
    try {
      await CommunicationAPI.deleteNotice(id);
      setLogs((prev) => prev.filter((log) => log.id !== id));
    } catch (error) {
      console.error("Failed to delete draft notice:", error);
    }
  };

  return (
    <div>
      {loading ? (
        <div className="text-center py-10 text-gray-500">
          Loading scheduled logs...
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No draft notices available.
        </div>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border text-left">Title</th>
              <th className="p-2 border text-left">Message</th>
              <th className="p-2 border text-left">Sended To</th>
              <th className="p-2 border text-left">Class</th>
              <th className="p-2 border text-left">Student ID</th>
              <th className="p-2 border text-center">In-App</th>
              <th className="p-2 border text-center">Email</th>
              <th className="p-2 border text-center">Roles</th>
              <th className="p-2 border text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="text-center hover:bg-gray-50">
                <td className="p-2 border text-left font-semibold">
                  {log.title}
                </td>
                <td className="p-2 border text-left text-gray-700">
                  {log.message}
                </td>
                <td className="p-2 border">{log.sendedTo}</td>
                <td className="p-2 border">{log.className}</td>
                <td className="p-2 border">{log.studentId}</td>
                <td className="p-2 border">
                  {log.channels.includes("In-app") ? (
                    <FiCheck className="text-blue-600 inline" />
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-2 border">
                  {log.channels.includes("Email") ? (
                    <FiCheck className="text-green-600 inline" />
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-2 border">{log.roles.join(", ")}</td>
                <td className="p-2 border">
                  <div className="flex gap-1 justify-center">
                    <button className="p-1 rounded hover:bg-gray-100">
                      <FiMoreVertical />
                    </button>
                    <button
                      className="p-1 rounded hover:bg-red-100 text-red-600"
                      onClick={() => deleteLog(log.id)}
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
  );
}