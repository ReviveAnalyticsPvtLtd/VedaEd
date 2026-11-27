import { getStoredUserJSON } from "../../utils/authStorage";
import React, { useState, useEffect } from "react";
import {
  FiMessageCircle,
  FiCalendar,
  FiUser,
  FiSend,
  FiInbox,
  FiReply,
} from "react-icons/fi";
import CommunicationAPI from "../communicationAPI";

export default function MessagesOverview() {
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterChannel, setFilterChannel] = useState("all");
  const [filterDirection, setFilterDirection] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    const stored = getStoredUserJSON();
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setCurrentUser({
          id: u.refId || u._id,
          model: (u.role || "Teacher").toLowerCase() === "teacher" ? "Teacher" : (u.role || "Teacher"),
        });
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const [inboxRes, sentRes, notifRes] = await Promise.allSettled([
          CommunicationAPI.getMessages(currentUser.id, currentUser.model, { limit: 100 }),
          CommunicationAPI.getSentMessages(currentUser.id, currentUser.model, { limit: 100 }),
          CommunicationAPI.getReceivedNotifications(currentUser.id, currentUser.model, { limit: 100 }),
        ]);

        if (!active) return;

        const inboxData = inboxRes.status === "fulfilled" && Array.isArray(inboxRes.value?.data) ? inboxRes.value.data : [];
        const sentData = sentRes.status === "fulfilled" && Array.isArray(sentRes.value?.data) ? sentRes.value.data : [];
        const notifData = notifRes.status === "fulfilled" && Array.isArray(notifRes.value?.data) ? notifRes.value.data : [];

        const readKey = `read_notifs_${currentUser.id}`;
        let readNotifIds = [];
        try {
          readNotifIds = JSON.parse(localStorage.getItem(readKey) || "[]");
        } catch (e) {
          readNotifIds = [];
        }

        const formatChannel = (channels) => {
          if (!channels || (Array.isArray(channels) && channels.length === 0)) return "App";
          const first = Array.isArray(channels) ? channels[0] : channels;
          const lower = String(first).toLowerCase();
          if (lower === "sms") return "SMS";
          if (lower === "email") return "Email";
          if (lower === "app") return "App";
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        };

        const inbox = inboxData.map((m) => ({
          id: m._id,
          isNotification: false,
          title: m.subject || "Message",
          message: m.content || "",
          sender: m.sender?.personalInfo?.name || m.sender?.personalInfo?.fullName || m.sender?.name || m.senderModel || "User",
          senderRole: m.senderModel || "Staff",
          recipient: m.receiver?.personalInfo?.name || m.receiver?.personalInfo?.fullName || m.receiver?.name || m.receiverModel || "Me",
          recipientRole: m.receiverModel || "Teacher",
          sentDate: m.createdAt,
          messageType: "Individual",
          channel: "App",
          channels: ["app"],
          isRead: m.status === "read" || m.status === "archived",
          priority: (m.priority || "medium").toLowerCase(),
          class: "",
          direction: "received",
          student: "",
        }));

        const sent = sentData.map((m) => ({
          id: m._id,
          isNotification: false,
          title: m.subject || "Message",
          message: m.content || "",
          sender: m.sender?.personalInfo?.name || m.sender?.personalInfo?.fullName || m.sender?.name || m.senderModel || "Me",
          senderRole: m.senderModel || "Teacher",
          recipient: m.receiver?.personalInfo?.name || m.receiver?.personalInfo?.fullName || m.receiver?.name || m.receiverModel || "Recipient",
          recipientRole: m.receiverModel || "User",
          sentDate: m.createdAt,
          messageType: "Individual",
          channel: "App",
          channels: ["app"],
          isRead: m.status === "read" || m.status === "archived",
          priority: (m.priority || "medium").toLowerCase(),
          class: "",
          direction: "sent",
          student: "",
        }));

        const notifs = notifData.map((n) => {
          let messageType = "Group";
          if (
            n.audience === "specific_class" ||
            n.audience === "specific_section" ||
            n.specificTargetModel === "Class" ||
            n.specificTargetModel === "Section"
          ) {
            messageType = "Class";
          } else if (
            n.specificTargets &&
            n.specificTargets.length > 0 &&
            (n.specificTargetModel === "Teacher" ||
              n.specificTargetModel === "Staff" ||
              n.specificTargetModel === "Student" ||
              n.specificTargetModel === "Parent")
          ) {
            messageType = "Individual";
          }

          const primaryChannel = formatChannel(n.channels);
          const priority =
            n.type === "Urgent"
              ? "high"
              : (n.priority || "medium").toLowerCase();

          return {
            id: n._id,
            isNotification: true,
            title: n.title,
            message: n.description,
            sender:
              n.createdBy?.personalInfo?.name ||
              n.createdBy?.name ||
              n.createdByModel ||
              "Admin",
            senderRole: n.createdByModel || "Admin",
            recipient: "Me",
            recipientRole: "Teacher",
            sentDate: n.publishDate || n.createdAt,
            messageType,
            channel: primaryChannel,
            channels: Array.isArray(n.channels) ? n.channels : [primaryChannel],
            isRead: readNotifIds.includes(n._id),
            priority,
            class: "",
            direction: "received",
            student: "",
            category: n.type || "Academic",
          };
        });

        const combined = [...inbox, ...notifs, ...sent].sort(
          (a, b) => new Date(b.sentDate) - new Date(a.sentDate)
        );

        setMessages(combined);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchMessages();
    return () => { active = false; };
  }, [currentUser]);

  const handleOpenMessage = (msg) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      const updated = messages.map((m) =>
        m.id === msg.id ? { ...m, isRead: true } : m
      );
      setMessages(updated);

      if (msg.isNotification) {
        try {
          const key = `read_notifs_${currentUser?.id || "teacher"}`;
          const readIds = JSON.parse(localStorage.getItem(key) || "[]");
          if (!readIds.includes(msg.id)) {
            readIds.push(msg.id);
            localStorage.setItem(key, JSON.stringify(readIds));
          }
        } catch (e) {
          console.error("Failed to save read notification state:", e);
        }
      } else if (currentUser) {
        CommunicationAPI.updateMessageStatus(
          msg.id,
          "read",
          currentUser.id,
          currentUser.model
        ).catch(() => {});
      }
    }
  };

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      (message.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (message.message || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (message.sender || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (message.category || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === "all" || message.messageType === filterType;
    const matchesChannel =
      filterChannel === "all" ||
      message.channel === filterChannel ||
      (Array.isArray(message.channels) &&
        message.channels.some(
          (c) => c.toLowerCase() === filterChannel.toLowerCase()
        ));
    const matchesDirection =
      filterDirection === "all" || message.direction === filterDirection;

    return matchesSearch && matchesType && matchesChannel && matchesDirection;
  });

  const unreadCount = messages.filter((message) => !message.isRead).length;
  const sentCount = messages.filter(
    (message) => message.direction === "sent"
  ).length;
  const receivedCount = messages.filter(
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
            <option value="App">App</option>
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
        {loading ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : filteredMessages.length > 0 ? (
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
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  <button
                  onClick={() => handleOpenMessage(message)}
                  className="text-blue-600 hover:text-blue-800  font-medium"
                >
                  View Details
                </button>
                  {message.direction === "received" && (
                    <button className="text-green-600 hover:text-green-800 ">
                      Reply
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

      {selectedMessage && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg flex flex-col h-[80vh]">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h2 className="font-semibold">
                  {selectedMessage.direction === "sent"
                    ? `To: ${selectedMessage.recipient}`
                    : `From: ${selectedMessage.sender}`}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedMessage.direction === "sent"
                    ? `${selectedMessage.recipientRole} • ${selectedMessage.channel}`
                    : `${selectedMessage.senderRole} • ${selectedMessage.channel}`}
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
              Priority: {selectedMessage.priority}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
