import React, { useState } from "react";
import {
  FiMessageCircle,
  FiCalendar,
  FiUser,
  FiSend,
  FiInbox,
} from "react-icons/fi";

export default function MessagesOverview() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterChannel, setFilterChannel] = useState("all");
const [selectedMessage, setSelectedMessage] = useState(null);

  const [messages, setMessages] = useState([]);
const openMessage = (msg) => {
  const updated = messages.map((m) =>
    m.id === msg.id ? { ...m, isRead: true } : m
  );

  setMessages(updated);
  setSelectedMessage({ ...msg, isRead: true });
};
  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.sender.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === "all" || message.messageType === filterType;
    const matchesChannel =
      filterChannel === "all" || message.channel === filterChannel;

    return matchesSearch && matchesType && matchesChannel;
  });

  const unreadCount = messages.filter((message) => !message.isRead).length;

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

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div>
      {/* Header Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Received Parent Messages</h3>
          <div className="flex items-center gap-2">
            <FiInbox className="text-blue-600" />
            <span className=" text-gray-600">
              {unreadCount} unread messages
            </span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-4">
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
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg border transition-colors duration-200 ${
                message.isRead ? "bg-gray-100 border-gray-200" : "bg-white border-gray-300"
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
                      <span className="bg-blue-600 text-white px-2 py-1 rounded-full">
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
                      className={`px-2 py-1 rounded-full ${getMessageTypeColor(
                        message.messageType
                      )}`}
                    >
                      {message.messageType}
                    </span>
                  </div>

                  <p className="text-gray-700  mb-3 line-clamp-2">
                    {message.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-4  text-gray-500">
                    <div className="flex items-center gap-1">
                      <FiUser />
                      <span>
                        {message.sender} ({message.senderRole})
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
                      <span>Child Class: {message.childClass}</span>
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  <button
  onClick={() => openMessage(message)}
  className="text-blue-600 hover:text-blue-800 font-medium"
>
  View Details
</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <FiMessageCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No messages for parents
            </h3>
            <p className="text-gray-500">
              {searchQuery || filterType !== "all" || filterChannel !== "all"
                ? "Try adjusting your search or filter criteria."
                : "You haven't received any messages related to your child yet."}
            </p>
          </div>
        )}
      </div>
      {selectedMessage && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    
    <div className="bg-white w-full max-w-lg rounded-lg shadow-lg flex flex-col h-[80vh]">
      
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h2 className="font-semibold">
            {selectedMessage.sender}
          </h2>
          <p className="text-sm text-gray-500">
            {selectedMessage.senderRole} • {selectedMessage.channel}
          </p>
        </div>

        <button
          onClick={() => setSelectedMessage(null)}
          className="text-gray-500"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
        <div className="bg-white p-3 rounded-lg shadow max-w-[80%]">
          <p className="font-medium">{selectedMessage.title}</p>
          <p>{selectedMessage.message}</p>
          <p className="text-xs text-gray-400 mt-1">
            {formatDate(selectedMessage.sentDate)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t text-sm text-gray-600">
        Child Class: {selectedMessage.childClass} | Priority:{" "}
        {selectedMessage.priority}
      </div>
    </div>
  </div>
)}
    </div>
  );
}
