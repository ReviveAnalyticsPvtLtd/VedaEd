import React, { useEffect, useMemo, useState } from "react";
import { FiSearch, FiEye } from "react-icons/fi";
import CommunicationAPI from "../communicationAPI";

const TARGET_FILTERS = [
  { key: "all", label: "All Types" },
  { key: "Notice", label: "Announcements" },
  { key: "Notification", label: "Notifications" },
  { key: "Complaint", label: "Complaints" },
];

const formatAction = (action = "") =>
  action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const actorName = (log) =>
  log.user?.personalInfo?.name ||
  log.user?.name ||
  log.user?.personalInfo?.email ||
  log.user?.email ||
  "System";

const targetTitle = (log) =>
  log.target?.title || log.details?.title || log.details?.subject || "-";

const targetSummary = (log) => {
  if (log.target?.content) return log.target.content;
  if (log.target?.description) return log.target.description;
  if (log.details?.description) return log.details.description;
  return "";
};

const ACTION_TONES = {
  message_sent: "bg-emerald-50 text-emerald-700 border-emerald-100",
  notice_published: "bg-indigo-50 text-indigo-700 border-indigo-100",
  notice_created: "bg-indigo-50 text-indigo-700 border-indigo-100",
  complaint_submitted: "bg-amber-50 text-amber-700 border-amber-100",
  complaint_responded: "bg-amber-50 text-amber-700 border-amber-100",
  file_uploaded: "bg-gray-100 text-gray-600 border-gray-200",
};

const TONES = {
  Notice: "bg-indigo-50 text-indigo-700 border-indigo-100",
  Notification: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Complaint: "bg-amber-50 text-amber-700 border-amber-100",
};

export default function AllLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [targetFilter, setTargetFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await CommunicationAPI.getCommunicationLogs({ page: 1, limit: 50 });
      if (res?.success) {
        setLogs(res.data || []);
        setTotal(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Error fetching communication logs:", err);
      setError("Failed to fetch logs. Ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesTarget = targetFilter === "all" || log.targetModel === targetFilter;
      if (!matchesTarget) return false;
      if (!q) return true;
      return (
        (log.action || "").toLowerCase().includes(q) ||
        (log.targetModel || "").toLowerCase().includes(q) ||
        targetTitle(log).toLowerCase().includes(q) ||
        actorName(log).toLowerCase().includes(q)
      );
    });
  }, [logs, searchQuery, targetFilter]);

  const Badge = ({ children, className }) => (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border capitalize ${className}`}>
      {children}
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">All Logs</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Audit trail of every communication action in this school.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition disabled:opacity-50"
          >
            Refresh Logs
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-5">
          <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-medium">
            {TARGET_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setTargetFilter(f.key)}
                className={`px-3 py-1.5 rounded-md transition ${
                  targetFilter === f.key
                    ? "bg-white shadow-sm font-semibold text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative flex-grow max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, target or actor..."
              className="w-full border border-gray-200 rounded-lg pl-3 pr-9 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <FiSearch className="absolute right-3 top-3 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-xs text-gray-500">Retrieving communication logs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-14 text-gray-400 text-sm border border-dashed rounded-lg border-gray-200">
            No logs matched the selected criteria.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Action</th>
                    <th className="p-2 border">Target Type</th>
                    <th className="p-2 border">Subject</th>
                    <th className="p-2 border">Actor</th>
                    <th className="p-2 border">Timestamp</th>
                    <th className="p-2 border">Details</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log._id} className="text-center hover:bg-gray-50">
                      <td className="p-2 border">
                        <Badge className={ACTION_TONES[log.action] || "bg-gray-100 text-gray-600 border-gray-200"}>
                          {formatAction(log.action)}
                        </Badge>
                      </td>

                      <td className="p-2 border">
                        <Badge className={TONES[log.targetModel] || "bg-gray-100 text-gray-600 border-gray-200"}>
                          {log.targetModel || "-"}
                        </Badge>
                      </td>

                      <td className="p-2 border text-left font-medium text-gray-800 max-w-[220px] truncate">
                        {targetTitle(log)}
                      </td>

                      <td className="p-2 border text-xs text-gray-500">{actorName(log)}</td>

                      <td className="p-2 border text-xs text-gray-400">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}
                      </td>

                      <td className="p-2 border">
                        <button
                          onClick={() => setSelectedItem(log)}
                          className="text-gray-500 hover:text-blue-600"
                          title="View Log Details"
                        >
                          <FiEye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Showing {filteredLogs.length} of {total} logs
            </p>
          </>
        )}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-xl overflow-hidden flex flex-col border">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <FiEye className="text-blue-600" /> Log Details
              </h4>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={ACTION_TONES[selectedItem.action] || "bg-gray-100 text-gray-600 border-gray-200"}>
                  {formatAction(selectedItem.action)}
                </Badge>
                <Badge className={TONES[selectedItem.targetModel] || "bg-gray-100 text-gray-600 border-gray-200"}>
                  {selectedItem.targetModel || "Unknown"}
                </Badge>
              </div>

              <h3 className="text-lg font-bold text-gray-900 leading-snug">
                {targetTitle(selectedItem)}
              </h3>

              <div className="text-xs text-gray-400 space-y-1">
                <p>
                  Actor:{" "}
                  <span className="font-medium text-gray-600">
                    {actorName(selectedItem)} ({selectedItem.userModel || "-"})
                  </span>
                </p>
                <p>
                  Timestamp:{" "}
                  <span className="font-medium text-gray-600">
                    {selectedItem.timestamp
                      ? new Date(selectedItem.timestamp).toLocaleString()
                      : "N/A"}
                  </span>
                </p>
                {selectedItem.ipAddress && (
                  <p>
                    IP: <span className="font-medium text-gray-600">{selectedItem.ipAddress}</span>
                  </p>
                )}
              </div>

              {targetSummary(selectedItem) && (
                <div className="text-sm text-gray-700 border-t border-b border-gray-100 py-4 leading-relaxed whitespace-pre-wrap">
                  {targetSummary(selectedItem)}
                </div>
              )}

              {selectedItem.details && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Metadata</p>
                  <pre className="text-[11px] bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto text-gray-600">
                    {JSON.stringify(selectedItem.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 border rounded-lg font-medium text-xs hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
