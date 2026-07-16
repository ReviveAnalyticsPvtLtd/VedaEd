import React, { useEffect, useState } from "react";
import { FiSearch, FiTrash2, FiEdit2, FiCheckCircle, FiEye, FiDownload } from "react-icons/fi";
import CommunicationAPI from "../communicationAPI";

export default function AllLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [logType, setLogType] = useState("all"); // 'all', 'announcement', 'notification'

  // Modal States
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    priority: "medium",
    type: "Information"
  });

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch notices
      const noticesRes = await CommunicationAPI.getNotices({ limit: 50 });
      let noticesList = [];
      if (noticesRes?.success) {
        noticesList = noticesRes.data.map(n => ({
          ...n,
          logType: "announcement",
          displayType: n.category || "General",
          date: n.publishDate || n.createdAt,
          authorName: n.author?.personalInfo?.name || n.author?.name || "System Admin"
        }));
      }

      // 2. Fetch notifications
      const notificationsRes = await CommunicationAPI.getNotifications({ limit: 50 });
      let notificationsList = [];
      if (notificationsRes?.success) {
        notificationsList = notificationsRes.data.map(n => ({
          ...n,
          logType: "notification",
          displayType: n.type || "Information",
          content: n.description, // map description to content for uniform listing
          date: n.publishDate || n.createdAt,
          authorName: n.createdBy?.personalInfo?.name || n.createdBy?.name || "System Admin"
        }));
      }

      // Merge and sort
      const combined = [...noticesList, ...notificationsList].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });

      setLogs(combined);
    } catch (err) {
      console.error("Error fetching communication logs:", err);
      setError("Failed to fetch logs. Ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (item) => {
    try {
      const authorId = currentUser?.refId || currentUser?._id || "68c1b2977fa6e0a4c8af3242";
      const authorModel = currentUser?.role?.toLowerCase() === "teacher" ? "Teacher" : "Staff";

      if (item.logType === "announcement") {
        await CommunicationAPI.publishNotice(item._id, authorId, authorModel);
      } else {
        // For notification, publish means updating status to 'sent'
        await CommunicationAPI.updateNotification(item._id, { status: "sent", publishDate: new Date().toISOString() });
      }
      alert("Notice published successfully!");
      fetchLogs();
      setSelectedItem(null);
    } catch (error) {
      console.error("Error publishing notice:", error);
      alert(`Publishing failed: ${error.message}`);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete this ${item.logType}?`)) return;

    try {
      if (item.logType === "announcement") {
        await CommunicationAPI.deleteNotice(item._id);
      } else {
        await CommunicationAPI.deleteNotification(item._id);
      }
      alert("Deleted successfully!");
      fetchLogs();
      setSelectedItem(null);
    } catch (error) {
      console.error("Error deleting item:", error);
      alert(`Deletion failed: ${error.message}`);
    }
  };

  const handleEditClick = (item) => {
    setEditForm({
      title: item.title,
      content: item.content || item.description || "",
      priority: item.priority || "medium",
      type: item.type || "Information"
    });
    setIsEditing(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      if (selectedItem.logType === "announcement") {
        await CommunicationAPI.updateNotice(selectedItem._id, {
          title: editForm.title,
          content: editForm.content,
          priority: editForm.priority
        });
      } else {
        await CommunicationAPI.updateNotification(selectedItem._id, {
          title: editForm.title,
          description: editForm.content,
          type: editForm.type
        });
      }
      alert("Updated successfully!");
      setIsEditing(false);
      setSelectedItem(null);
      fetchLogs();
    } catch (error) {
      console.error("Error updating log:", error);
      alert(`Update failed: ${error.message}`);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesType = logType === "all" || log.logType === logType;
    const matchesSearch = searchQuery.trim() === "" || 
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.content || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">All Logs</h3>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchLogs} 
              className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition"
            >
              Refresh Logs
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap items-center gap-4 mb-5">
          {/* Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setLogType("all")}
              className={`px-3 py-1.5 rounded-md transition ${logType === 'all' ? 'bg-white shadow-sm font-semibold text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All Types
            </button>
            <button
              onClick={() => setLogType("announcement")}
              className={`px-3 py-1.5 rounded-md transition ${logType === 'announcement' ? 'bg-white shadow-sm font-semibold text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Announcements
            </button>
            <button
              onClick={() => setLogType("notification")}
              className={`px-3 py-1.5 rounded-md transition ${logType === 'notification' ? 'bg-white shadow-sm font-semibold text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Notifications
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-grow max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by log title or content details..."
              className="w-full border border-gray-200 rounded-lg pl-3 pr-9 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <FiSearch className="absolute right-3 top-3 text-gray-400" />
          </div>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-xs text-gray-500">Retrieving communication logs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button onClick={fetchLogs} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">
              Retry Connection
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-14 text-gray-400 text-sm border border-dashed rounded-lg border-gray-200">
            No logs matched the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left divide-y divide-gray-100">
              <thead className="bg-gray-50/75">
                <tr className="text-gray-500 font-semibold text-xs border-b">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Log Type</th>
                  <th className="px-4 py-3">Sub-Type</th>
                  <th className="px-4 py-3">Audience</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLogs.map((log) => (
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
                    <td className="px-4 py-3.5 text-xs text-gray-500">{log.authorName}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {log.date ? new Date(log.date).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        log.status === 'published' || log.status === 'sent'
                          ? 'bg-green-100 text-green-700'
                          : log.status === 'scheduled'
                          ? 'bg-purple-100 text-purple-700'
                          : log.status === 'draft'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setSelectedItem(log)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition"
                          title="View Notice Details"
                        >
                          <FiEye size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(log);
                            handleEditClick(log);
                          }}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-amber-600 transition"
                          title="Edit Log"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(log)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600 transition"
                          title="Delete Log"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View/Action Details Modal */}
      {selectedItem && !isEditing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-xl overflow-hidden flex flex-col border">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h4 className="font-bold text-gray-800 capitalize flex items-center gap-2">
                <FiEye className="text-blue-600" /> {selectedItem.logType} Details
              </h4>
              <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600 transition">✕</button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-2">
                <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded text-xs font-semibold border border-blue-100 capitalize">
                  {selectedItem.displayType}
                </span>
                
                {selectedItem.priority && (
                  <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border uppercase ${
                    selectedItem.priority === 'high' || selectedItem.priority === 'urgent'
                      ? 'bg-red-50 text-red-600 border-red-100'
                      : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                  }`}>
                    {selectedItem.priority}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-900 leading-snug">{selectedItem.title}</h3>

              <div className="text-xs text-gray-400 space-y-1">
                <p>Audience: <span className="font-medium text-gray-600 capitalize">{selectedItem.targetAudience || selectedItem.audience || "Everyone"}</span></p>
                <p>Status: <span className="font-semibold text-gray-600 capitalize">{selectedItem.status}</span></p>
                <p>Published: <span className="font-semibold text-gray-600">{selectedItem.date ? new Date(selectedItem.date).toLocaleString() : "N/A"}</span></p>
                <p>Creator: <span className="font-semibold text-gray-600">{selectedItem.authorName}</span></p>
              </div>

              <div className="text-sm text-gray-700 border-t border-b border-gray-100 py-4 leading-relaxed whitespace-pre-wrap">
                {selectedItem.content || selectedItem.description || "No message body found."}
              </div>

              {selectedItem.attachments && selectedItem.attachments.length > 0 && (
                <div className="flex items-center justify-between text-xs bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg text-blue-700">
                  <span className="font-medium">File Attachment: {selectedItem.attachments[0].originalName}</span>
                  <button 
                    onClick={() => window.open(selectedItem.attachments[0].url || selectedItem.attachments[0].path, "_blank")}
                    className="hover:underline flex items-center gap-1 font-semibold"
                  >
                    <FiDownload /> Download
                  </button>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 border rounded-lg font-medium text-xs hover:bg-gray-100"
              >
                Close View
              </button>

              {selectedItem.status === "draft" && (
                <button
                  type="button"
                  onClick={() => handlePublish(selectedItem)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  <FiCheckCircle /> Publish Notice Now
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDelete(selectedItem)}
                className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-lg font-semibold text-xs transition"
              >
                Delete Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editing Modal */}
      {selectedItem && isEditing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 border animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-xl overflow-hidden border">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h4 className="font-bold text-gray-800 capitalize">
                Edit {selectedItem.logType} Details
              </h4>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600 transition">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Priority / Notification Type */}
              {selectedItem.logType === "announcement" ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Notification Type</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Information">Information</option>
                    <option value="Reminder">Reminder</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Academic">Academic</option>
                    <option value="Examination">Examination</option>
                    <option value="Fee Related">Fee Related</option>
                    <option value="Transport Related">Transport Related</option>
                  </select>
                </div>
              )}

              {/* Content */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Message Content <span className="text-red-500">*</span></label>
                <textarea
                  rows="5"
                  required
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="border-t border-gray-100 pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border rounded-lg font-medium text-xs hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-xs transition"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
