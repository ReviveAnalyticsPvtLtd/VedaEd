import React, { useState, useEffect } from "react";
import { FiMail, FiCalendar, FiUser, FiDownload } from "react-icons/fi";
import CommunicationAPI from "../communicationAPI";

export default function NoticesOverview() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
const [selectedNotice, setSelectedNotice] = useState(null);
  const [studentId, setStudentId] = useState("68c27fb96a063075c9a73ee2");
  const [studentModel, setStudentModel] = useState("Student");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const uId = user.refId || user._id || "68c27fb96a063075c9a73ee2";
    let uModel = "Student";
    if (user.role) {
      uModel = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
    }
    setStudentId(uId);
    setStudentModel(uModel);
    fetchNotices(uId, uModel);
  }, []);

  const fetchNotices = async (uId = studentId, uModel = studentModel) => {
    try {
      setLoading(true);
      const response = await CommunicationAPI.getPublishedNotices(
        uId,
        uModel
      );
      setNotices(response.data || []);
    } catch (error) {
      console.error("Error fetching notices:", error);
      setError("Failed to load notices");
    } finally {
      setLoading(false);
    }
  };
const openNotice = (notice) => {
  // UI update (important for instant change)
  const updated = displayNotices.map((n) => {
    const id = n._id || n.id;
    const currentId = notice._id || notice.id;

    if (id === currentId) {
      return {
        ...n,
        isRead: true,
        views: [...(n.views || []), { user: studentId }],
      };
    }
    return n;
  });

  setNotices(updated);
  setSelectedNotice({
    ...notice,
    isRead: true,
    views: [...(notice.views || []), { user: studentId }],
  });
};
  // Dummy data for received notices (fallback)
  const dummyNotices = [
    {
      id: 1,
      title: "Holiday Notice - Diwali Break",
      message:
        "School will remain closed from 12th to 16th November for Diwali celebrations. Classes will resume on 17th November.",
      sender: "Principal Office",
      sentDate: "2024-01-15",
      publishDate: "2024-01-15",
      roles: ["Student", "Parent"],
      channels: ["Email", "SMS"],
      attachment: "holiday_schedule.pdf",
      isRead: false,
      priority: "high",
    },
    {
      id: 2,
      title: "Parent-Teacher Meeting Schedule",
      message:
        "Parent-Teacher meetings are scheduled for next week. Please check the attached schedule for your class timing.",
      sender: "Class Teacher - Grade 8A",
      sentDate: "2024-01-14",
      publishDate: "2024-01-14",
      roles: ["Student", "Parent"],
      channels: ["Email"],
      attachment: "ptm_schedule.pdf",
      isRead: true,
      priority: "medium",
    },
    {
      id: 3,
      title: "Library Book Return Reminder",
      message:
        "Please return your overdue library books by the end of this week to avoid late fees.",
      sender: "Library Department",
      sentDate: "2024-01-13",
      publishDate: "2024-01-13",
      roles: ["Student"],
      channels: ["SMS"],
      attachment: null,
      isRead: false,
      priority: "low",
    },
    {
      id: 4,
      title: "Sports Day Preparation",
      message:
        "Sports day is coming up next month. Students interested in participating should register with their class teachers.",
      sender: "Sports Department",
      sentDate: "2024-01-12",
      publishDate: "2024-01-12",
      roles: ["Student", "Parent"],
      channels: ["Email", "SMS"],
      attachment: "sports_day_info.pdf",
      isRead: true,
      priority: "medium",
    },
    {
      id: 5,
      title: "Exam Schedule - Mid Term",
      message:
        "Mid-term examination schedule has been published. Please check the attached timetable and prepare accordingly.",
      sender: "Examination Department",
      sentDate: "2024-01-11",
      publishDate: "2024-01-11",
      roles: ["Student", "Parent"],
      channels: ["Email"],
      attachment: "exam_schedule.pdf",
      isRead: false,
      priority: "high",
    },
  ];

  // Use real notices from API, fallback to dummy data if needed
  const displayNotices = notices.length > 0 ? notices : dummyNotices;

const filteredNotices = displayNotices.filter((notice) => {
  const text = (
    notice.title +
    " " +
    (notice.content || notice.message || "") +
    " " +
    (notice.author?.personalInfo?.name || notice.sender || "")
  ).toLowerCase();

  const matchesSearch = text.includes(searchQuery.toLowerCase());

  // Read logic
  const isRead = notice.views
    ? notice.views.some((v) => v.user.toString() === studentId)
    : notice.isRead;

  let matchesFilter = true;

  switch (filterRole) {
    case "unread":
      matchesFilter = !isRead;
      break;
    case "read":
      matchesFilter = isRead;
      break;
    case "high":
    case "medium":
    case "low":
      matchesFilter = notice.priority === filterRole;
      break;
    default:
      matchesFilter = true;
  }

  return matchesSearch && matchesFilter;
});
const handleDownload = (notice) => {
  // API wale case me
  if (notice.attachments?.length > 0) {
    const file = notice.attachments[0];
    const url = file.url || file.fileUrl;

    if (url) {
      window.open(url, "_blank");
    } else {
      alert("File URL not available");
    }
  }
  // Dummy data case
  else if (notice.attachment) {
    alert(`Downloading: ${notice.attachment}`);
  } else {
    alert("No attachment available");
  }
};
  const unreadCount = displayNotices.filter(
    (notice) =>
      !notice.views?.some((view) => view.user.toString() === studentId)
  ).length;

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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div>
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchNotices}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Received Notices</h3>
          <div className="flex items-center gap-2">
            <FiMail className="text-blue-600" />
            <span className="text-gray-600">
              {unreadCount} unread notices
            </span>
          </div>
        </div>

        {/* Search and Filter */}
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
         <select
  value={filterRole}
  onChange={(e) => setFilterRole(e.target.value)}
  className="border border-gray-300 rounded-md px-3 py-2"
>
  <option value="all">All</option>
  <option value="unread">Unread</option>
  <option value="read">Read</option>
  <option value="high">High Priority</option>
  <option value="medium">Medium Priority</option>
  <option value="low">Low Priority</option>
</select>
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => {
            const isRead = notice.views?.some(
              (view) => view.user.toString() === studentId
            );
            const authorName =
              notice.author?.personalInfo?.name || "Unknown Author";

            return (
              <div
                key={notice._id || notice.id}
                className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${
                  isRead ? "border-gray-300" : "border-blue-500"
                } ${!isRead ? "bg-blue-50" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4
                        className={`font-semibold ${
                          !isRead ? "text-blue-900" : "text-gray-900"
                        }`}
                      >
                        {notice.title}
                      </h4>
                      {!isRead && (
                        <span className="bg-blue-600 text-white px-2 py-1 rounded-full">
                          New
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 rounded-full border ${getPriorityColor(
                          notice.priority
                        )}`}
                      >
                        {notice.priority}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-3 line-clamp-2">
                      {notice.content || notice.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-4  text-gray-500">
                      <div className="flex items-center gap-1">
                        <FiUser />
                        <span>{authorName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiCalendar />
                        <span>Published: {formatDate(notice.publishDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiMail />
                        <span>{notice.targetAudience}</span>
                      </div>
                      {notice.attachments && notice.attachments.length > 0 && (
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







                    {notice.attachments && notice.attachments.length > 0 && (
                      <button className="text-gray-600 hover:text-gray-800 ">
                        Download
                      </button>
                    )}
                  </div>
                </div>
            {selectedNotice && (() => {
  const isSelectedRead = selectedNotice.views?.some(
    (v) => (v.user?._id || v.user)?.toString() === studentId
  );






  return (
   <div className="fixed inset-0 bg-black/20  flex items-center justify-center z-50 p-4">
      
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 relative">

        {/* Close */}
        <button
          onClick={() => setSelectedNotice(null)}
          className="absolute top-3 right-3 text-gray-500"
        >
          ✕
        </button>


        {/* Title */}
        <h2 className="text-lg font-semibold mb-2">
          {selectedNotice.title}
        </h2>

        {/* Status + Priority */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              isSelectedRead ? "bg-gray-200" : "bg-blue-600 text-white"
            }`}

          >
            {isSelectedRead ? "Read" : "Unread"}
          </span>


          <span className="text-xs text-gray-500">
            {selectedNotice.priority}
          </span>
        </div>

        {/* Message */}
        <p className="text-gray-700 mb-4">
          {selectedNotice.content || selectedNotice.message}
        </p>

        {/* Meta Info */}
        <div className="text-sm text-gray-500 space-y-1 mb-4">
          <div>

            {selectedNotice.author?.personalInfo?.name ||
              selectedNotice.sender ||
              "Unknown"}
          </div>

          <div>
            {selectedNotice.publishDate
              ? new Date(selectedNotice.publishDate).toLocaleDateString()
              : formatDate(selectedNotice.sentDate)}
          </div>

          <div>
            Channels: {selectedNotice.channels?.join(", ") || "N/A"}
          </div>


          <div>
            Audience:{" "}
            {selectedNotice.targetAudience ||
              selectedNotice.roles?.join(", ") ||
              "N/A"}
          </div>
        </div>

        {/* Attachment */}
        {(selectedNotice.attachments?.length > 0 || selectedNotice.attachment) && (
          <button
            onClick={() => handleDownload(selectedNotice)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {selectedNotice.attachments
              ? selectedNotice.attachments[0].originalName
              : "Download Attachment"}

          </button>
        )}

      </div>
    </div>
  );
})()}


              </div>
            );
          })
          
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <FiMail className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No notices found
            </h3>
            <p className="text-gray-500">
              {searchQuery || filterRole !== "all"
                ? "Try adjusting your search or filter criteria."
                : "You haven't received any notices yet."}
            </p>
          </div>



          
        )}
      </div>
    </div>
  );
}
