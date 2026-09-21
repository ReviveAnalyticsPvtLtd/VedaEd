import React, { useEffect, useState } from "react";
import {
  FiSearch,
  FiTrash2,
  FiEdit2,
  FiCheckCircle,
  FiEye,
  FiDownload,
} from "react-icons/fi";
import CommunicationAPI from "../communicationAPI";

export default function DraftAnnouncements() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    priority: "medium",
  });

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    setLoading(true);
    setError(null);
    try {
      const noticesRes = await CommunicationAPI.getNotices({
        status: "draft",
        limit: 50,
      });
      let draftsList = [];
      if (noticesRes?.success) {
        draftsList = noticesRes.data.map((n) => ({
          ...n,
          logType: "announcement",
          displayType: n.category || "General",
          date: n.publishDate || n.createdAt,
          authorName:
            n.author?.personalInfo?.name || n.author?.name || "System Admin",
        }));
      }
      setDrafts(draftsList);
    } catch (err) {
      console.error("Error fetching draft announcements:", err);
      setError("Failed to fetch draft announcements. Ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (item) => {
    try {
      const authorId = currentUser?.refId || currentUser?._id || "68c1b2977fa6e0a4c8af3242";
      const authorModel = currentUser?.role?.toLowerCase() === "teacher" ? "Teacher" : "Staff";

      await CommunicationAPI.publishNotice(item._id, authorId, authorModel);
      alert("Notice published successfully!");
      fetchDrafts();
      setSelectedItem(null);
    } catch (err) {
      console.error("Error publishing notice:", err);
      alert(`Publishing failed: ${err.message}`);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("Are you sure you want to delete this draft announcement?")) return;

    try {
      await CommunicationAPI.deleteNotice(item._id);
      alert("Deleted successfully!");
      fetchDrafts();
      setSelectedItem(null);
    } catch (err) {
      console.error("Error deleting draft:", err);
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const handleEditClick = (item) => {
    setEditForm({
      title: item.title,
      content: item.content || item.description || "",
      priority: item.priority || "medium",
    });
    setIsEditing(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      await CommunicationAPI.updateNotice(selectedItem._id, {
        title: editForm.title,
        content: editForm.content,
        priority: editForm.priority,
      });
      alert("Updated successfully!");
      setIsEditing(false);
      setSelectedItem(null);
      fetchDrafts();
    } catch (err) {
      console.error("Error updating draft:", err);
      alert(`Update failed: ${err.message}`);
    }
  };

  const filteredDrafts = drafts.filter((draft) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (draft.content || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Draft Announcements</h3>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDrafts}
              className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-wrap items-center gap-4 mb-5">
          <div className="relative flex-grow max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by draft title or content details..."
              className="w-full border border-gray-200 rounded-lg pl-3 pr-9 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <FiSearch className="absolute right-3 top-3 text-gray-400" />
          </div>
        </div>

        {/* Drafts Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-xs text-gray-500">Retrieving draft announcements...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button onClick={fetchDrafts} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">
              Retry Connection
            </button>
          </div>
        ) : filteredDrafts.length === 0 ? (
          <div className="text-center py-14 text-gray-400 text-sm border border-dashed rounded-lg border-gray-200">
            No draft announcements available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Title</th>
                  <th className="p-2 border">Sub-Type</th>
                  <th className="p-2 border">Audience</th>
                  <th className="p-2 border">Priority</th>
                  <th className="p-2 border">Author</th>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDrafts.map((draft) => (
                  <tr key={draft._id} className="text-center hover:bg-gray-50">
                    <td className="p-2 border text-left font-medium text-gray-800 max-w-[200px] truncate">
                      {draft.title}
                    </td>

                    <td className="p-2 border capitalize text-xs text-gray-500">
                      {draft.displayType}
                    </td>

                    <td className="p-2 border capitalize text-xs text-gray-600">
                      {draft.targetAudience || "Everyone"}
                    </td>

                    <td className="p-2 border">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
                          draft.priority === "urgent" || draft.priority === "high"
                            ? "bg-red-50 text-red-600 border-red-100"
                            : draft.priority === "medium"
                            ? "bg-yellow-50 text-yellow-600 border-yellow-100"
                            : "bg-green-50 text-green-600 border-green-100"
                        }`}
                      >
                        {draft.priority}
                      </span>
                    </td>

                    <td className="p-2 border text-xs text-gray-500">
                      {draft.authorName}
                    </td>

                    <td className="p-2 border text-xs text-gray-400">
                      {draft.date
                        ? new Date(draft.date).toLocaleString()
                        : "-"}
                    </td>

                    <td className="p-2 border">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                        {draft.status}
                      </span>
                    </td>

                    <td className="p-2 border">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedItem(draft)}
                          className="text-gray-500 hover:text-blue-600"
                          title="View Draft Details"
                        >
                          <FiEye size={15} />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedItem(draft);
                            handleEditClick(draft);
                          }}
                          className="text-gray-500 hover:text-amber-600"
                          title="Edit Draft"
                        >
                          <FiEdit2 size={15} />
                        </button>

                        <button
                          onClick={() => handlePublish(draft)}
                          className="text-gray-500 hover:text-green-600"
                          title="Publish Now"
                        >
                          <FiCheckCircle size={15} />
                        </button>

                        <button
                          onClick={() => handleDelete(draft)}
                          className="text-gray-500 hover:text-red-600"
                          title="Delete Draft"
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

      {/* View Details Modal */}
      {selectedItem && !isEditing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-xl overflow-hidden flex flex-col border">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h4 className="font-bold text-gray-800 capitalize flex items-center gap-2">
                <FiEye className="text-blue-600" /> Draft Announcement Details
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
                    selectedItem.priority === "high" || selectedItem.priority === "urgent"
                      ? "bg-red-50 text-red-600 border-red-100"
                      : "bg-yellow-50 text-yellow-600 border-yellow-100"
                  }`}>
                    {selectedItem.priority}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-900 leading-snug">{selectedItem.title}</h3>

              <div className="text-xs text-gray-400 space-y-1">
                <p>Audience: <span className="font-medium text-gray-600 capitalize">{selectedItem.targetAudience || "Everyone"}</span></p>
                <p>Status: <span className="font-semibold text-gray-600 capitalize">{selectedItem.status}</span></p>
                <p>Created: <span className="font-semibold text-gray-600">{selectedItem.date ? new Date(selectedItem.date).toLocaleString() : "N/A"}</span></p>
                <p>Creator: <span className="font-semibold text-gray-600">{selectedItem.authorName}</span></p>
              </div>

              <div className="text-sm text-gray-700 border-t border-b border-gray-100 py-4 leading-relaxed whitespace-pre-wrap">
                {selectedItem.content || "No message body found."}
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

              <button
                type="button"
                onClick={() => handlePublish(selectedItem)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <FiCheckCircle /> Publish Notice Now
              </button>

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
              <h4 className="font-bold text-gray-800">Edit Draft Announcement Details</h4>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600 transition">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Priority</label>
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

              <div>
                <label className="block font-medium text-gray-700 mb-1">Message Content <span className="text-red-500">*</span></label>
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