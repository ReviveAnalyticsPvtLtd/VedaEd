import React, { useState } from "react";
import {
  FiMessageCircle,
  FiCalendar,
  FiUser,
  FiSend,
  FiInbox,
  FiReply,
} from "react-icons/fi";

export default function MessagesOverview() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterChannel, setFilterChannel] = useState("all");
  const [filterDirection, setFilterDirection] = useState("all");

  // Dummy data for teacher messages (sent and received)
  const dummyMessages = [
    {
      id: 1,
      title: "Student Progress Update Request",
      message:
        "Dear Mrs. Sunita Verma, could you please provide an update on my child's progress in mathematics? I would like to schedule a meeting to discuss improvement strategies.",
      sender: "Mrs. Priya Sharma",
      senderRole: "Parent",
      recipient: "Mrs. Sunita Verma",
      recipientRole: "Teacher",
      sentDate: "2024-01-15",
      messageType: "Individual",
      channel: "Email",
      isRead: false,
      priority: "high",
      class: "Grade 8A",
      direction: "received",
      student: "Rahul Sharma",
    },
    {
      id: 2,
      title: "Assignment Submission Reminder",
      message:
        "Dear students, please submit your mathematics assignment by tomorrow. Late submissions will not be accepted. Contact me if you have any questions.",
      sender: "Mrs. Sunita Verma",
      senderRole: "Teacher",
      recipient: "Grade 8A Students",
      recipientRole: "Student",
      sentDate: "2024-01-14",
      messageType: "Class",
      channel: "SMS",
      isRead: true,
      priority: "medium",
      class: "Grade 8A",
      direction: "sent",
    },
    {
      id: 3,
      title: "Class Test Schedule Confirmation",
      message:
        "Hi Anil, could you confirm the science test schedule for Grade 8A? I need to coordinate with the lab assistant for practical sessions.",
      sender: "Mrs. Sunita Verma",
      senderRole: "Teacher",
      recipient: "Mr. Anil Kumar",
      recipientRole: "Teacher",
      sentDate: "2024-01-13",
      messageType: "Individual",
      channel: "Email",
      isRead: true,
      priority: "medium",
      class: "Grade 8A",
      direction: "sent",
    },
    {
      id: 4,
      title: "Parent Meeting Confirmation",
      message:
        "Thank you for the update. I would like to schedule the meeting for this Friday at 3:00 PM. Please let me know if this time works for you.",
      sender: "Mrs. Sunita Verma",
      senderRole: "Teacher",
      recipient: "Mrs. Priya Sharma",
      recipientRole: "Parent",
      sentDate: "2024-01-12",
      messageType: "Individual",
      channel: "Email",
      isRead: true,
      priority: "high",
      class: "Grade 8A",
      direction: "sent",
      student: "Rahul Sharma",
    },
    {
      id: 5,
      title: "Library Book Return Notice",
      message:
        "Dear students, please return your overdue library books by the end of this week. Late returns will result in fine charges.",
      sender: "Mrs. Sunita Verma",
      senderRole: "Teacher",
      recipient: "Grade 8A Students",
      recipientRole: "Student",
      sentDate: "2024-01-11",
      messageType: "Class",
      channel: "SMS",
      isRead: true,
      priority: "low",
      class: "Grade 8A",
      direction: "sent",
    },
    {
      id: 6,
      title: "Staff Meeting Reminder",
      message:
        "Reminder: Staff meeting is scheduled for tomorrow at 2:00 PM in the conference room. Please bring your monthly reports.",
      sender: "Principal Office",
      senderRole: "Admin",
      recipient: "All Teachers",
      recipientRole: "Teacher",
      sentDate: "2024-01-10",
      messageType: "Group",
      channel: "Email",
      isRead: false,
      priority: "high",
      class: "All Classes",
      direction: "received",
    },
    {
      id: 7,
      title: "Student Absence Inquiry",
      message:
        "Hi Mrs. Verma, my daughter has been absent for the past two days due to illness. Could you please share the notes and assignments she missed?",
      sender: "Mr. Rajesh Gupta",
      senderRole: "Parent",
      recipient: "Mrs. Sunita Verma",
      recipientRole: "Teacher",
      sentDate: "2024-01-09",
      messageType: "Individual",
      channel: "SMS",
      isRead: false,
      priority: "medium",
      class: "Grade 8A",
      direction: "received",
      student: "Priya Gupta",
    },
  ];

  const filteredMessages = dummyMessages.filter((message) => {
    const matchesSearch =
      message.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (message.student &&
        message.student.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType =
      filterType === "all" || message.messageType === filterType;
    const matchesChannel =
      filterChannel === "all" || message.channel === filterChannel;
    const matchesDirection =
      filterDirection === "all" || message.direction === filterDirection;

    return matchesSearch && matchesType && matchesChannel && matchesDirection;
  });

  const unreadCount = dummyMessages.filter((message) => !message.isRead).length;
  const sentCount = dummyMessages.filter(
    (message) => message.direction === "sent"
  ).length;
  const receivedCount = dummyMessages.filter(
    (message) => message.direction === "received"
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

  const getMessageTypeColor = (type) => {
    switch (type) {
      case "Individual":
        return "bg-blue-100 text-blue-800";
      case "Class":
        return "bg-green-100 text-green-800";
      case "Group":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDirectionColor = (direction) => {
    switch (direction) {
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
          <h3 className="text-lg font-semibold">Teacher Messages</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FiSend className="text-green-600" />
              <span className=" text-gray-600">{sentCount} sent</span>
            </div>
            <div className="flex items-center gap-2">
              <FiInbox className="text-blue-600" />
              <span className=" text-gray-600">
                {receivedCount} received
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className=" text-gray-600">
                {unreadCount} unread
              </span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="Individual">Individual</option>
            <option value="Class">Class</option>
            <option value="Group">Group</option>
          </select>
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Channels</option>
            <option value="SMS">SMS</option>
            <option value="Email">Email</option>
          </select>
          <select
            value={filterDirection}
            onChange={(e) => setFilterDirection(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Messages</option>
            <option value="sent">Sent</option>
            <option value="received">Received</option>
          </select>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message) => (
            <div
  key={message.id}
  className={`p-4 rounded-lg border transition-colors duration-200 ${
    message.isRead
      ? "bg-gray-100 border-gray-200"
      : "bg-white border-gray-300"
  }`}
>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4
                      className={`font-semibold ${
                        !message.isRead ? "text-blue-900" : "text-gray-900"
                      }`}
                    >
                      {message.title}
                    </h4>
                    {!message.isRead && (
                      <span className="bg-blue-600 text-white  px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                    <span
                      className={` px-2 py-1 rounded-full border ${getPriorityColor(
                        message.priority
                      )}`}
                    >
                      {message.priority}
                    </span>
                    <span
                      className={` px-2 py-1 rounded-full ${getMessageTypeColor(
                        message.messageType
                      )}`}
                    >
                      {message.messageType}
                    </span>
                    <span
                      className={` px-2 py-1 rounded-full ${getDirectionColor(
                        message.direction
                      )}`}
                    >
                      {message.direction}
                    </span>
                  </div>

                  <p className="text-gray-700  mb-3 line-clamp-2">
                    {message.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-4  text-gray-500">
                    <div className="flex items-center gap-1">
                      <FiUser />
                      <span>
                        {message.direction === "sent"
                          ? `To: ${message.recipient} (${message.recipientRole})`
                          : `From: ${message.sender} (${message.senderRole})`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiCalendar />
                      <span>Sent: {formatDate(message.sentDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiSend />
                      <span>{message.channel}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiMessageCircle />
                      <span>Class: {message.class}</span>
                    </div>
                    {message.student && (
                      <div className="flex items-center gap-1">
                        <span>Student: {message.student}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  <button className="text-blue-600 hover:text-blue-800  font-medium">
                    View Details
                  </button>
                  {message.direction === "received" && (
                    <button className="text-green-600 hover:text-green-800 ">
                      Reply
                    </button>
                  )}
                  {message.direction === "sent" && (
                    <button className="text-gray-600 hover:text-gray-800 ">
                      Forward
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <FiMessageCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No messages found
            </h3>
            <p className="text-gray-500">
              {searchQuery ||
              filterType !== "all" ||
              filterChannel !== "all" ||
              filterDirection !== "all"
                ? "Try adjusting your search or filter criteria."
                : "You haven't sent or received any messages yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
