import React, { useState } from "react";
import { FiMail, FiCalendar, FiUser, FiDownload, FiSend } from "react-icons/fi";

export default function NoticesOverview() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Dummy data for teacher notices (sent and received)
  const dummyNotices = [
    {
      id: 1,
      title: "Class Schedule Change Notice",
      message:
        "Due to teacher training, Class 8A schedule will be modified for next week. Please inform students and parents accordingly.",
      sender: "Academic Coordinator",
      sentDate: "2024-01-15",
      publishDate: "2024-01-15",
      roles: ["Teacher", "Student", "Parent"],
      channels: ["Email", "SMS"],
      attachment: "schedule_change.pdf",
      isRead: false,
      priority: "high",
      status: "published",
      type: "received",
    },
    {
      id: 2,
      title: "Parent-Teacher Meeting Reminder",
      message:
        "Reminder: Parent-teacher meeting for Grade 8A is scheduled for tomorrow at 2:00 PM. Please prepare student progress reports.",
      sender: "Principal Office",
      sentDate: "2024-01-14",
      publishDate: "2024-01-14",
      roles: ["Teacher"],
      channels: ["Email"],
      attachment: "ptm_agenda.pdf",
      isRead: true,
      priority: "high",
      status: "published",
      type: "received",
    },
    {
      id: 3,
      title: "Exam Paper Submission Deadline",
      message:
        "All teachers are requested to submit their exam papers for review by end of this week. Late submissions will not be accepted.",
      sender: "Examination Department",
      sentDate: "2024-01-13",
      publishDate: "2024-01-13",
      roles: ["Teacher"],
      channels: ["Email", "SMS"],
      attachment: null,
      isRead: false,
      priority: "medium",
      status: "published",
      type: "received",
    },
    {
      id: 4,
      title: "Student Assignment Submission Notice",
      message:
        "Dear students of Grade 8A, please submit your mathematics assignment by Friday. Late submissions will result in grade deduction.",
      sender: "Mrs. Sunita Verma",
      sentDate: "2024-01-12",
      publishDate: "2024-01-12",
      roles: ["Student", "Parent"],
      channels: ["Email", "SMS"],
      attachment: "assignment_guidelines.pdf",
      isRead: true,
      priority: "medium",
      status: "published",
      type: "sent",
    },
    {
      id: 5,
      title: "Class Test Schedule Announcement",
      message:
        "Science class test for Grade 8A is scheduled for next Monday. Please prepare chapters 5-8 thoroughly.",
      sender: "Mr. Anil Kumar",
      sentDate: "2024-01-11",
      publishDate: "2024-01-11",
      roles: ["Student", "Parent"],
      channels: ["Email"],
      attachment: "test_syllabus.pdf",
      isRead: true,
      priority: "medium",
      status: "published",
      type: "sent",
    },
    {
      id: 6,
      title: "Library Book Return Notice",
      message:
        "Students who have borrowed library books are requested to return them by the end of this month to avoid late fees.",
      sender: "Mrs. Sunita Verma",
      sentDate: "2024-01-10",
      publishDate: "2024-01-10",
      roles: ["Student"],
      channels: ["SMS"],
      attachment: null,
      isRead: true,
      priority: "low",
      status: "draft",
      type: "sent",
    },
  ];

  const filteredNotices = dummyNotices.filter((notice) => {
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

  const unreadCount = dummyNotices.filter((notice) => !notice.isRead).length;
  const sentCount = dummyNotices.filter(
    (notice) => notice.type === "sent"
  ).length;
  const receivedCount = dummyNotices.filter(
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
              <span className="text-gray-600">
                {unreadCount} unread
              </span>
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
        {filteredNotices.length > 0 ? (
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
