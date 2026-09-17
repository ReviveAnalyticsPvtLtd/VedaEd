import React, { useState, useEffect } from "react";
import { FiMail, FiCalendar, FiUser, FiDownload, FiSend } from "react-icons/fi";
import CommunicationAPI from "../communicationAPI";

const TEACHER_ID = "6a99120596f5dd52a7cbf930";

export default function NoticesOverview() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadNotices = async () => {
      try {
        const res = await CommunicationAPI.getNotices({ limit: 100 });
        if (!active) return;
        const data = res?.data || [];
        const mapped = data.map((n) => ({
          id: n._id,
          title: n.title,
          message: n.content,
          sender: n.authorName || "Unknown",
          sentDate: n.createdAt,
          publishDate: n.publishDate || n.createdAt,
          roles: n.tags || n.targetRoles || [],
          channels: n.targetChannels || ["In-app"],
          attachment: n.attachment?.filename || null,
          isRead: n.viewedBy?.some(
            (v) => v?.userId === TEACHER_ID || v?.clerkId === TEACHER_ID
          ) || false,
          priority: n.priority || "medium",
          status: n.status,
          type: n.authorId === TEACHER_ID ? "sent" : "received",
        }));
        setNotices(mapped);
      } catch (error) {
        console.error("Notices load failed:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadNotices();
    return () => {
      active = false;
    };
  }, []);

  const filteredNotices = notices.filter((notice) => {
    const matchesSearch =
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.sender.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      filterRole === "all" || notice.roles.includes(filterRole);

    const matchesStatus =
      filterStatus === "all" || notice.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const unreadCount = notices.filter((notice) => !notice.isRead).length;
  const sentCount = notices.filter((notice) => notice.type === "sent").length;
  const receivedCount = notices.filter(
    (notice) => notice.type === "received"
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

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "received":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      {/* Header Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Teacher Notices</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FiSend className="text-green-600" />
              <span className=" text-gray-600">{sentCount} sent</span>
            </div>
            <div className="flex items-center gap-2">
              <FiMail className="text-blue-600" />
              <span className=" text-gray-600">
                {receivedCount} received
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">{unreadCount} unread</span>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-wrap gap-3">
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
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="Teacher">Teacher</option>
            <option value="Student">Student</option>
            <option value="Parent">Parent</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <p className="text-gray-500">Loading notices...</p>
          </div>
        ) : filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className={`p-4 rounded-lg border transition-colors duration-200 ${
                notice.isRead
                  ? "bg-gray-100 border-gray-200"
                  : "bg-white border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4
                      className={`font-semibold ${
                        !notice.isRead ? "text-blue-900" : "text-gray-900"
                      }`}
                    >
                      {notice.title}
                    </h4>
                    {!notice.isRead && (
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
                    <span
                      className={` px-2 py-1 rounded-full ${getStatusColor(
                        notice.status
                      )}`}
                    >
                      {notice.status}
                    </span>
                    <span
                      className={` px-2 py-1 rounded-full ${getTypeColor(
                        notice.type
                      )}`}
                    >
                      {notice.type}
                    </span>
                  </div>

                  <p className="text-gray-700  mb-3 line-clamp-2">
                    {notice.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-4  text-gray-500">
                    <div className="flex items-center gap-1">
                      <FiUser />
                      <span>{notice.sender}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiCalendar />
                      <span>Sent: {formatDate(notice.sentDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiMail />
                      <span>{notice.channels.join(", ")}</span>
                    </div>
                    {notice.attachment && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <FiDownload />
                        <span>{notice.attachment}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  <button className="text-blue-600 hover:text-blue-800  font-medium">
                    View Details
                  </button>
                  {notice.attachment && (
                    <button className="text-gray-600 hover:text-gray-800 ">
                      Download
                    </button>
                  )}
                  {notice.type === "sent" && notice.status === "draft" && (
                    <button className="text-green-600 hover:text-green-800">
                      Edit
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
              No notices found
            </h3>
            <p className="text-gray-500">
              {searchQuery || filterRole !== "all" || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria."
                : "You haven't sent or received any notices yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}