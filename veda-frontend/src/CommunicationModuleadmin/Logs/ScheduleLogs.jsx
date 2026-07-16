import React, { useState, useEffect } from "react";
import { FiClock, FiTrash2, FiEdit2, FiCheck, FiX, FiCalendar } from "react-icons/fi";
import CommunicationAPI from "../communicationAPI";

export default function ScheduleLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Edit states
  const [editingItem, setEditingItem] = useState(null);
  const [newPublishDate, setNewPublishDate] = useState("");

  useEffect(() => {
    fetchScheduledItems();
  }, []);

  const fetchScheduledItems = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch notices (scheduled notices are draft status but publishDate > now, or simply any notice where publishDate > now)
      const noticesRes = await CommunicationAPI.getNotices({ limit: 50 });
      let scheduledNotices = [];
      if (noticesRes?.success) {
        scheduledNotices = noticesRes.data
          .filter(n => new Date(n.publishDate) > new Date())
          .map(n => ({
            ...n,
            logType: "announcement",
            displayType: n.category || "General",
            date: n.publishDate,
            authorName: n.author?.personalInfo?.name || n.author?.name || "System Admin"
          }));
      }

      // 2. Fetch notifications (scheduled notifications have status = 'scheduled' or publishDate > now)
      const notificationsRes = await CommunicationAPI.getNotifications({ limit: 50 });
      let scheduledNotifications = [];
      if (notificationsRes?.success) {
        scheduledNotifications = notificationsRes.data
          .filter(n => new Date(n.publishDate) > new Date())
          .map(n => ({
            ...n,
            logType: "notification",
            displayType: n.type || "Information",
            content: n.description,
            date: n.publishDate,
            authorName: n.createdBy?.personalInfo?.name || n.createdBy?.name || "System Admin"
          }));
      }

      // Merge and sort
      const combined = [...scheduledNotices, ...scheduledNotifications].sort((a, b) => {
        return new Date(a.date) - new Date(b.date); // ascending for upcoming items
      });

      setLogs(combined);
    } catch (err) {
      console.error("Error loading scheduled logs:", err);
      setError("Failed to fetch scheduled logs. Make sure the backend is active.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Cancel and delete this scheduled ${item.logType}?`)) return;

    try {
      if (item.logType === "announcement") {
        await CommunicationAPI.deleteNotice(item._id);
      } else {
        await CommunicationAPI.deleteNotification(item._id);
      }
      alert("Scheduled item cancelled successfully!");
      fetchScheduledItems();
    } catch (error) {
      console.error("Error deleting scheduled item:", error);
      alert(`Cancellation failed: ${error.message}`);
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    // Format date for datetime-local
    const dateObj = new Date(item.date);
    const tzoffset = dateObj.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(dateObj.getTime() - tzoffset)).toISOString().slice(0, 16);
    setNewPublishDate(localISOTime);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !newPublishDate) return;

    try {
      const payload = { publishDate: new Date(newPublishDate).toISOString() };

      if (editingItem.logType === "announcement") {
        await CommunicationAPI.updateNotice(editingItem._id, payload);
      } else {
        await CommunicationAPI.updateNotification(editingItem._id, payload);
      }
      
      alert("Schedule modified successfully!");
      setEditingItem(null);
      fetchScheduledItems();
    } catch (error) {
      console.error("Error updating schedule:", error);
      alert(`Rescheduling failed: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiClock className="text-purple-600" /> Upcoming Scheduled Dispatches
        </h3>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
            <p className="text-xs text-gray-500">Scanning schedule queues...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button onClick={fetchScheduledItems} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold">
              Retry Connection
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm border border-dashed rounded-lg border-gray-200">
            No upcoming messages or notices are scheduled at this time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left divide-y divide-gray-100">
              <thead className="bg-gray-50/75">
                <tr className="text-gray-500 font-semibold text-xs border-b">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Log Type</th>
                  <th className="px-4 py-3">Sub-Type</th>
                  <th className="px-4 py-3">Target Audience</th>
                  <th className="px-4 py-3">Scheduled Date</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => {
                  const isCurrentEditing = editingItem && editingItem._id === log._id;

                  return (
                    <tr key={log._id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3.5 font-medium text-gray-800 max-w-[200px] truncate">{log.title}</td>
                      <td className="px-4 py-3.5 capitalize">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          log.logType === 'announcement' 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {log.logType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 capitalize text-xs text-gray-500">{log.displayType}</td>
                      <td className="px-4 py-3.5 capitalize text-xs text-gray-600">{log.targetAudience || log.audience || "Everyone"}</td>
                      <td className="px-4 py-3.5 text-xs">
                        {isCurrentEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="datetime-local"
                              value={newPublishDate}
                              onChange={(e) => setNewPublishDate(e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                            />
                            <button 
                              onClick={handleSaveEdit}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Save Schedule"
                            >
                              <FiCheck size={14} />
                            </button>
                            <button 
                              onClick={() => setEditingItem(null)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Cancel Edit"
                            >
                              <FiX size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-purple-600 font-semibold flex items-center gap-1">
                            <FiCalendar size={13} /> {log.date ? new Date(log.date).toLocaleString() : "-"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2 justify-center">
                          {!isCurrentEditing && (
                            <button
                              onClick={() => handleEditClick(log)}
                              className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-purple-600 transition"
                              title="Reschedule Notice"
                            >
                              <FiEdit2 size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(log)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600 transition"
                            title="Cancel Dispatch Schedule"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
