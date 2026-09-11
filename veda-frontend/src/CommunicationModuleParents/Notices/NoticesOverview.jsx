import React, { useState, useEffect } from "react";
import { FiMail, FiCalendar, FiUser, FiDownload } from "react-icons/fi";
import CommunicationAPI from "../../services/communicationAPI";

export default function NoticesOverview() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotice, setSelectedNotice] = useState(null);
const [notices, setNotices] = useState([]);
const [user, setUser] = useState(null);

useEffect(() => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      setUser(JSON.parse(storedUser));
    } catch(e) { console.error(e); }
  }
}, []);

useEffect(() => {
  const fetchNotices = async () => {
    if (!user) return;
    try {
      const response = await CommunicationAPI.getPublishedNotices(user._id, user.role || "Parent");
      const data = response.data || [];
      setNotices(data);
    } catch (error) {
      console.error("Error fetching notices", error);
    }
  };
  fetchNotices();
}, [user]);

const handleDownload = (notice) => {
  const attachment = notice.attachments?.[0];
  alert(`Downloading: ${attachment?.originalName || "attachment"}`);
};

const isRead = (notice) =>
  Array.isArray(notice.views) && notice.views.some((v) => String(v.user) === String(user?._id));

const openNotice = (notice) => {
  const updated = notices.map((n) => {
    if (String(n._id) !== String(notice._id)) return n;
    const views = n.views || [];
    if (!views.some((v) => String(v.user) === String(user?._id))) {
      return { ...n, views: [...views, { user: user?._id }] };
    }
    return n;
  });

  setNotices(updated);
  setSelectedNotice(updated.find((n) => String(n._id) === String(notice._id)) || notice);
};
 const filteredNotices = notices.filter(
  (n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.content || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.author?.personalInfo?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
);

 const unreadCount = notices.filter((n) => !isRead(n)).length;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div>
      {/* Header */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Received Parent Notices</h3>
          <div className="flex items-center gap-2">
            <FiMail className="text-blue-600" />
            <span className="text-gray-600">
              {unreadCount} unread notices
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search notices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
            <div
              key={notice._id}
              className={`p-4 rounded-lg border transition-colors duration-200 ${
                isRead(notice) ? "bg-gray-100 border-gray-200" : "bg-white border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4
                      className={`font-semibold ${
                        !isRead(notice) ? "text-blue-900" : "text-gray-900"
                      }`}
                    >
                      {notice.title}
                    </h4>
                    {!isRead(notice) && (
                      <span className="bg-blue-600 text-white  px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                    <span
                      className={` px-2 py-1 rounded-full border ${getPriorityColor(
                        notice.priority
                      )}`}
                    >
                      {notice.priority}
                    </span>
                  </div>

                  <p className="text-gray-700  mb-3 line-clamp-2">
                    {notice.content}
                  </p>

                  <div className="flex flex-wrap items-center gap-4  text-gray-500">
                    <div className="flex items-center gap-1">
                      <FiUser />
                      <span>{notice.author?.personalInfo?.name || "School Admin"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiCalendar />
                      <span>Sent: {formatDate(notice.publishDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiMail />
                      <span>{notice.category || "general"}</span>
                    </div>
                    {notice.attachments?.[0] && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <FiDownload />
                        <span>{notice.attachments[0].originalName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                 <button
  onClick={() => openNotice(notice)}
  className="text-blue-600 hover:text-blue-800 font-medium"
>
  View Details
</button>
                  {notice.attachments?.[0] && (
                    <button
  onClick={() => handleDownload(notice)}
  className="text-gray-600 hover:text-gray-800"
>
  Download
</button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <FiMail className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No notices for parents
            </h3>
            <p className="text-gray-500">
              {searchQuery
                ? "Try adjusting your search."
                : "No notices related to your child yet."}
            </p>
          </div>
        )}
      </div>
      {selectedNotice && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    
    <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 relative">
      
      {/* Close */}
      <button
        onClick={() => setSelectedNotice(null)}
        className="absolute top-3 right-3 text-gray-500"
      >
        ✕
      </button>

      <h2 className="text-lg font-semibold mb-2">
        {selectedNotice.title}
      </h2>

      <p className="text-gray-700 mb-4">
        {selectedNotice.content}
      </p>

      <div className="text-sm text-gray-500 space-y-1 mb-4">
        <div> {selectedNotice.author?.personalInfo?.name || "School Admin"}</div>
        <div> {formatDate(selectedNotice.publishDate)}</div>
        <div> Category: {selectedNotice.category || "general"}</div>
        <div> Priority: {selectedNotice.priority}</div>
      </div>

      {selectedNotice.attachments?.[0] && (
        <button
          onClick={() => handleDownload(selectedNotice)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Download Attachment
        </button>
      )}
    </div>
  </div>
)}
    </div>
  );
}
