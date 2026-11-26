import React, { useCallback, useEffect, useState } from "react";
import CommunicationAPI from "../services/communicationAPI";
import { parentAPI } from "../services/parentAPI";
import HelpInfo from "../components/HelpInfo";

// Read the current sessionStorage-backed auth first, then fall back to the
// legacy localStorage key used by older deployments. Keeping this local avoids
// depending on a utility that does not exist on every base branch.
const readStoredUser = () => {
  try {
    const sessionUser = sessionStorage.getItem("veda_auth_user");
    if (sessionUser) return JSON.parse(sessionUser);
  } catch (_) {
    // Ignore malformed session data and try the legacy key.
  }

  try {
    const legacyUser = localStorage.getItem("user");
    return legacyUser ? JSON.parse(legacyUser) : null;
  } catch (_) {
    return null;
  }
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const capitalize = (value) => {
  const text = String(value || "");
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
};

const formatChannels = (channels) => {
  const list = toArray(channels).filter(Boolean);
  return list.length ? list.map(capitalize).join(", ") : "In-app";
};

const personName = (person, fallback) =>
  person?.personalInfo?.name || person?.name || fallback;

const refId = (value) => String(value?._id || value?.id || value || "");

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const fetchLogs = useCallback(async () => {
    const user = readStoredUser() || {};
    const userId = user?.refId || user?._id;

    if (!userId) {
      setLogs([]);
      setError("No parent account found. Please sign in again.");
      setLoading(false);
      return;
    }

    const userModel = user.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
      : "Parent";

    setLoading(true);
    setError(null);

    try {
      const [noticesRes, messagesRes, notificationsRes, parentRes] =
        await Promise.allSettled([
          CommunicationAPI.getPublishedNotices(userId, userModel, { limit: 100 }),
          CommunicationAPI.getMessages(userId, userModel, { limit: 100 }),
          CommunicationAPI.getReceivedNotifications(userId, userModel, {
            limit: 100,
          }),
          user?.refId ? parentAPI.getParentById(userId) : Promise.resolve(null),
        ]);

      const children = toArray(
        parentRes.status === "fulfilled"
          ? parentRes.value?.parent?.children
          : []
      );
      const childNames = children
        .map((child) => child?.name || "Student")
        .filter(Boolean);
      const childNamesById = new Map(
        children.map((child) => [refId(child), child?.name || "Student"])
      );

      const childLabelFor = (record) => {
        const targetedChildren = toArray(record?.specificTargets)
          .map((target) => childNamesById.get(refId(target)))
          .filter(Boolean);
        if (targetedChildren.length) return targetedChildren.join(", ");

        if (record?.receiverModel === "Student") {
          return childNamesById.get(refId(record?.receiver)) || "Student";
        }

        return childNames.length ? childNames.join(", ") : "All children";
      };

      const noticeLogs = toArray(
        noticesRes.status === "fulfilled" ? noticesRes.value?.data : []
      ).map((notice) => ({
        id: notice._id,
        title: notice.title,
        sender: personName(notice.author, notice.authorModel || "School"),
        channels: ["In-app"],
        sentAt: notice.publishDate || notice.createdAt,
        child: childLabelFor(notice),
      }));

      const messageLogs = toArray(
        messagesRes.status === "fulfilled" ? messagesRes.value?.data : []
      ).map((message) => ({
        id: message._id,
        title: message.subject,
        sender: personName(message.sender, message.senderModel || "School"),
        channels: ["In-app"],
        sentAt: message.createdAt,
        child: childLabelFor(message),
      }));

      const notificationLogs = toArray(
        notificationsRes.status === "fulfilled" ? notificationsRes.value?.data : []
      ).map((notification) => ({
        id: notification._id,
        title: notification.title,
        sender: personName(
          notification.createdBy,
          notification.createdByModel || "School"
        ),
        channels: toArray(notification.channels).length
          ? notification.channels
          : ["In-app"],
        sentAt: notification.publishDate || notification.createdAt,
        child: childLabelFor(notification),
      }));

      const allLogs = [...noticeLogs, ...messageLogs, ...notificationLogs]
        .filter((log) => log.title)
        .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

      const allCommunicationApisFailed =
        noticesRes.status === "rejected" &&
        messagesRes.status === "rejected" &&
        notificationsRes.status === "rejected";

      if (allCommunicationApisFailed) {
        setLogs([]);
        setError("Failed to fetch logs.");
      } else {
        setLogs(allLogs);
      }
    } catch (err) {
      console.error("Error fetching parent logs:", err);
      setLogs([]);
      setError("Failed to fetch logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Logs</h2>
        <HelpInfo
          title="Parent Logs Help"
          description={`Page Description: Track every message or notice your child has received. View sender, channel, sent time, and which child was targeted.


9.3 Parent Communication Logs

Single log tab summarizing all communication entries.

Sections:
- Breadcrumb & Header: Shows you are in Logs > All Logs
- Tab Bar: All Logs button (highlighted) for clarity even in single-tab layout
- Logs Table: Columns for Title, Sender, Channels, Sent At, and Child name
- Status Chips: Colored badges for Teacher/Admin senders for quick context
- Loading/Empty States: Friendly messaging when data is being fetched or no logs exist
- Retry Button: Appears during error states to refetch logs`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        <button
          onClick={() => setActiveTab("all")}
          className={`capitalize pb-2 ${
            activeTab === "all"
              ? "text-blue-600 font-semibold border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All Logs
        </button>
      </div>

      {/* Content */}
      <div className="bg-white p-3 rounded-lg shadow-sm border">
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading logs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No logs available for your child.</p>
          </div>
        ) : (
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Title</th>
                <th className="p-2 border">Sender</th>
                <th className="p-2 border">Channels</th>
                <th className="p-2 border">Sent At</th>
                <th className="p-2 border">Child</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="text-center hover:bg-gray-50">
                  <td className="p-2 border text-left">{log.title}</td>

                  <td className="p-2 border">
                    <span
                      className={`inline-block px-2 py-1 font-semibold rounded-full ${
                        log.sender === "Teacher"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {log.sender}
                    </span>
                  </td>

                  <td className="p-2 border">{formatChannels(log.channels)}</td>

                  <td className="p-2 border">
                    {log.sentAt ? new Date(log.sentAt).toLocaleString() : "-"}
                  </td>

                  <td className="p-2 border text-gray-700 font-medium">
                    {log.child}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
