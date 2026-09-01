import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { FiX, FiDownload, FiChevronLeft, FiChevronRight, FiEye, FiEdit2 } from "react-icons/fi";
import * as XLSX from "xlsx";
import HelpInfo from "../../components/HelpInfo";
import api from "../../services/apiClient";

const numberOr = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const LEAVE_PAGE_SIZE = 10;
const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

function toDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value) {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateRange(fromDate, toDateValue) {
  const from = formatDate(fromDate);
  const to = formatDate(toDateValue);
  return from === to ? from : `${from} to ${to}`;
}

function getStaffName(leave) {
  return leave?.staff?.personalInfo?.name || leave?.staffName || "Teacher User";
}

function getStaffId(leave, idx = 0) {
  return leave?.staff?.personalInfo?.staffId || leave?.staffId || `STF-${1000 + idx}`;
}

function getStatusTone(status) {
  if (status === "Approved") return "bg-emerald-100 text-emerald-700";
  if (status === "Disapproved" || status === "Rejected") return "bg-rose-100 text-rose-700";
  if (status === "Cancelled") return "bg-gray-200 text-gray-700";
  return "bg-amber-100 text-amber-700";
}

function getConflictLabel(leave) {
  return leave?.conflict || "—";
}

function getDurationLabel(leave) {
  if (leave?.duration) return leave.duration;
  return Number(leave?.days) > 1 ? "Multiple Days" : "Full Day";
}

function getEffectiveUnits(leave) {
  const e = Number(leave?.effectiveDays);
  if (Number.isFinite(e) && e > 0) return e;
  const units = Number(leave?.days);
  return Number.isFinite(units) && units > 0 ? units : 0;
}

function formatLeaveSplitValue(value) {
  return String(Number(value) || 0).replace(/\.0$/, "");
}

function isLeaveStatusFinalizedWithoutConsumption(status) {
  return ["Disapproved", "Rejected", "Cancelled"].includes(String(status || ""));
}

function getLeaveSplitForDisplay(leave) {
  if (isLeaveStatusFinalizedWithoutConsumption(leave?.status)) {
    return null;
  }
  if (leave?.paidDays != null || leave?.unpaidDays != null) {
    return {
      paid: Number(leave?.paidDays) || 0,
      unpaid: Number(leave?.unpaidDays) || 0,
    };
  }
  if (String(leave?.status || "Pending") === "Pending") {
    const units = getEffectiveUnits(leave);
    return { paid: units, unpaid: 0 };
  }
  return null;
}

function LeaveSplitStack({ leave, compact = false }) {
  const split = getLeaveSplitForDisplay(leave);
  if (!split) return <span className="text-gray-500">—</span>;
  const paidLabel = formatLeaveSplitValue(split.paid);
  const unpaidLabel = formatLeaveSplitValue(split.unpaid);
  return (
    <div className={`flex flex-col ${compact ? "gap-1" : "gap-1.5"} min-w-[106px]`}>
      <span className="inline-flex items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
        <span>Paid</span>
        <span className="tabular-nums">{paidLabel}</span>
      </span>
      <span className="inline-flex items-center justify-between gap-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700">
        <span>Unpaid</span>
        <span className="tabular-nums">{unpaidLabel}</span>
      </span>
    </div>
  );
}

export default function ApproveLeave() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const leaveTab = rawTab === "policy" ? "policy" : "approve";

  const setLeaveTab = (tab) => {
    if (tab === "approve") setSearchParams({});
    else setSearchParams({ tab });
  };

  const [leaveData, setLeaveData] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [policyForm, setPolicyForm] = useState({
    leaveCycleType: "Yearly",
    paidLeaveLimit: 15,
    maxLeaveLimit: 20,
    cycleStartMonth: 1,
    minLeavePerRequest: 0.5,
    maxLeavePerRequest: 10,
    allowHalfDay: true,
    excludeSundays: true,
    excludeHolidays: true,
    autoConvertExtraToUnpaid: true,
  });
  const [policyLoading, setPolicyLoading] = useState(true);
  const [policySaving, setPolicySaving] = useState(false);
  const [policyMessage, setPolicyMessage] = useState({ type: "", text: "" });
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedExportIds, setSelectedExportIds] = useState(() => new Set());
  const selectAllCheckboxRef = useRef(null);
  const [leavePage, setLeavePage] = useState(1);

  const fetchPolicy = useCallback(async () => {
    setPolicyLoading(true);
    try {
      const res = await api.get("/staff/leave/policy");
      if (res.data?.success && res.data.policy) {
        const p = res.data.policy;
        setPolicy(p);
        setPolicyForm({
          leaveCycleType: p.leaveCycle || "Yearly",
          paidLeaveLimit: numberOr(p.paidLeaveLimit, 15),
          maxLeaveLimit: numberOr(p.maxLeaveLimit, 20),
          cycleStartMonth: numberOr(p.cycleStartMonth, 1),
          minLeavePerRequest: numberOr(p.minLeavePerRequest, 0.5),
          maxLeavePerRequest: numberOr(p.maxLeavePerRequest, 10),
          allowHalfDay: Boolean(p.allowHalfDay),
          excludeSundays: Boolean(p.excludeSundays),
          excludeHolidays: Boolean(p.excludeHolidays),
          autoConvertExtraToUnpaid: Boolean(p.autoConvertExtraToUnpaid),
        });
      }
    } catch {
      /* ignore */
    } finally {
      setPolicyLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
    fetchPolicy();
  }, [fetchPolicy]);

  useEffect(() => {
    if (searchParams.get("tab") === "history") {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const updatePolicyField = (key, value) => {
    setPolicyForm((f) => ({ ...f, [key]: value }));
    setPolicyMessage({ type: "", text: "" });
  };

  const savePolicy = async () => {
    if (policyForm.maxLeaveLimit < policyForm.paidLeaveLimit) {
      setPolicyMessage({
        type: "err",
        text: "Maximum leave limit should be greater than or equal to paid leave limit.",
      });
      return;
    }
    if (policyForm.maxLeavePerRequest < policyForm.minLeavePerRequest) {
      setPolicyMessage({
        type: "err",
        text: "Maximum leave per request should be greater than or equal to minimum leave per request.",
      });
      return;
    }
    if (policyForm.minLeavePerRequest < 0.5) {
      setPolicyMessage({
        type: "err",
        text: "Minimum leave per request cannot be less than 0.5.",
      });
      return;
    }
    setPolicySaving(true);
    setPolicyMessage({ type: "", text: "" });
    try {
      const res = await api.put("/staff/leave/policy", {
        ...policyForm,
        leaveCycle: policyForm.leaveCycleType,
      });
      if (res.data.success) {
        setPolicyMessage({ type: "ok", text: "Leave policy saved. New applications will use these rules." });
        if (res.data.policy) setPolicy(res.data.policy);
        await fetchPolicy();
      }
    } catch (e) {
      setPolicyMessage({ type: "err", text: e?.response?.data?.message || "Save failed" });
    } finally {
      setPolicySaving(false);
    }
  };

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get("/staff/leave/requests");
      if (res.data.success) {
        setLeaveData(res.data.leaves || []);
      }
    } catch (err) {
      console.error("Error fetching leaves:", err);
      alert(err?.response?.data?.message || "Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(
    () => leaveData.filter((item) => getStaffName(item).toLowerCase().includes(searchQuery.toLowerCase())),
    [leaveData, searchQuery]
  );

  const totalLeavePages = useMemo(
    () => Math.max(1, Math.ceil(filteredData.length / LEAVE_PAGE_SIZE) || 1),
    [filteredData.length]
  );

  const paginatedLeaveRows = useMemo(() => {
    const start = (leavePage - 1) * LEAVE_PAGE_SIZE;
    return filteredData.slice(start, start + LEAVE_PAGE_SIZE);
  }, [filteredData, leavePage]);

  useEffect(() => {
    setLeavePage(1);
  }, [searchQuery]);

  useEffect(() => {
    setLeavePage((p) => Math.min(p, totalLeavePages));
  }, [totalLeavePages]);

  useEffect(() => {
    const visible = new Set(filteredData.map((d) => String(d._id)));
    setSelectedExportIds((prev) => {
      const next = new Set();
      prev.forEach((id) => {
        if (visible.has(id)) next.add(id);
      });
      return next;
    });
  }, [filteredData]);

  const allFilteredSelected =
    filteredData.length > 0 && filteredData.every((d) => selectedExportIds.has(String(d._id)));
  const someFilteredSelected = filteredData.some((d) => selectedExportIds.has(String(d._id)));
  const selectedExportCount = filteredData.filter((d) => selectedExportIds.has(String(d._id))).length;

  useEffect(() => {
    const el = selectAllCheckboxRef.current;
    if (el) {
      el.indeterminate = someFilteredSelected && !allFilteredSelected;
    }
  }, [someFilteredSelected, allFilteredSelected]);

  const toggleExportSelect = (id) => {
    const sid = String(id);
    setSelectedExportIds((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelectedExportIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredData.forEach((d) => next.delete(String(d._id)));
      } else {
        filteredData.forEach((d) => next.add(String(d._id)));
      }
      return next;
    });
  };

  const exportToExcel = (rows) => {
    const sheetRows = rows.map((d, idx) => ({
      "Staff ID": getStaffId(d, idx),
      Teacher: getStaffName(d),
      "Leave Type": d.leaveType || "",
      Duration: getDurationLabel(d),
      "Date Range": formatDateRange(d.fromDate, d.toDate),
      Days: getEffectiveUnits(d),
      "Paid / Unpaid":
        (() => {
          const split = getLeaveSplitForDisplay(d);
          return split
            ? `Paid: ${formatLeaveSplitValue(split.paid)} / Unpaid: ${formatLeaveSplitValue(split.unpaid)}`
            : "—";
        })(),
      "Apply Date": formatDate(d.applyDate),
      Status: d.status || "Pending",
      Note: d.note || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(sheetRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Requests");
    XLSX.writeFile(workbook, "ApproveLeaveList.xlsx");
  };

  const handleExportExcel = () => {
    const rows = filteredData.filter((d) => selectedExportIds.has(String(d._id)));
    if (!rows.length) {
      alert("Select at least one row to export to Excel.");
      return;
    }
    exportToExcel(rows);
  };

  const summary = useMemo(() => {
    const approvedThisMonth = leaveData.filter((d) => {
      if (d.status !== "Approved") return false;
      const date = toDate(d.fromDate);
      const now = new Date();
      return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }).length;

    return {
      paidLimit: policy?.paidLeaveLimit ?? "—",
      maxLimit: policy?.maxLeaveLimit ?? "—",
      pendingCount: leaveData.filter((d) => d.status === "Pending").length,
      approvedThisMonth,
    };
  }, [leaveData, policy]);

  const updateStatus = async (statusValue) => {
    if (!selectedLeave) return;
    try {
      const res = await api.put(`/staff/leave/${selectedLeave._id}`, {
        status: statusValue,
        note: noteInput,
      });
      if (res.data.success) {
        const updated = res.data.leave;
        setLeaveData((prev) =>
          prev.map((d) => (d._id === selectedLeave._id ? { ...d, ...updated } : d))
        );
        setSelectedLeave(null);
        setNoteInput("");
        fetchLeaves();
      }
    } catch (err) {
      console.error("Error updating leave status:", err);
      alert(err?.response?.data?.message || "Failed to update status");
    }
  };

  const cancelApproved = async () => {
    if (!selectedLeave || selectedLeave.status !== "Approved") return;
    if (!window.confirm("Cancel this approved leave? Attendance markers will be removed and balance restored.")) {
      return;
    }
    try {
      const res = await api.put(`/staff/leave/${selectedLeave._id}/cancel`, { note: noteInput });
      if (res.data.success) {
        const updated = res.data.leave;
        setLeaveData((prev) => prev.map((d) => (d._id === selectedLeave._id ? { ...d, ...updated } : d)));
        setSelectedLeave(null);
        setNoteInput("");
        fetchLeaves();
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to cancel leave");
    }
  };

  const helpDescription =
    leaveTab === "policy"
      ? `Configure institute-wide leave rules. Initial leaves within paid limit are treated as paid, leaves after paid limit and within maximum limit are treated as unpaid, and requests beyond maximum limit are rejected automatically.`
      : `Review pending requests and approve or reject. Summary cards show current policy caps and counts. Use Leave Policy Setup to edit rules.`;

  return (
    <div className="p-0 m-0 min-h-screen w-full max-w-full min-w-0">
      <div className="flex justify-between items-center mb-4 gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
        <HelpInfo title="Leave Management" description={helpDescription} />
      </div>

      {/* Tabs — match Staff Directory (blue underline, border-b) */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        <button
          type="button"
          onClick={() => setLeaveTab("approve")}
          className={`pb-2 ${
            leaveTab === "approve"
              ? "text-blue-600 font-semibold border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
        >
          Approve Leave
        </button>
        <button
          type="button"
          onClick={() => setLeaveTab("policy")}
          className={`pb-2 ${
            leaveTab === "policy"
              ? "text-blue-600 font-semibold border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
        >
          Leave Policy Setup
        </button>
      </div>

      {leaveTab === "approve" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {[
            { label: "Policy: Paid limit / cycle", value: String(summary.paidLimit) },
            { label: "Policy: Max limit / cycle", value: String(summary.maxLimit) },
            { label: "Pending Requests", value: String(summary.pendingCount) },
            { label: "Approved This Month", value: String(summary.approvedThisMonth) },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 min-w-0">
              <p className="text-[11px] sm:text-xs text-gray-500 mb-1 leading-snug">{card.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-none tabular-nums">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {leaveTab === "approve" && (
      <div className="bg-white p-3 rounded-lg shadow-sm border w-full max-w-full min-w-0">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Staff Leave Requests</h3>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search name..."
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={loading || filteredData.length === 0 || selectedExportCount === 0}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shrink-0"
          >
            <FiDownload /> Export to Excel
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading leave requests...</p>
        ) : (
          <>
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full text-left border-collapse min-w-[1020px] text-sm">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="p-2 lg:p-3 font-semibold w-10 text-center">
                      <input
                        ref={selectAllCheckboxRef}
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                        disabled={!filteredData.length}
                        className="rounded border-gray-300"
                        title="Select all matching results (all pages) for export"
                        aria-label="Select all matching rows for export"
                      />
                    </th>
                    <th className="p-2 lg:p-3 font-semibold">Staff ID</th>
                    <th className="p-2 lg:p-3 font-semibold">Teacher</th>
                    <th className="p-2 lg:p-3 font-semibold">Leave Type</th>
                    <th className="p-2 lg:p-3 font-semibold">Duration</th>
                    <th className="p-2 lg:p-3 font-semibold">Date</th>
                    <th className="p-2 lg:p-3 font-semibold whitespace-nowrap">Days</th>
                    <th className="p-2 lg:p-3 font-semibold whitespace-nowrap">Paid / Unpaid</th>
                    <th className="p-2 lg:p-3 font-semibold">Conflict</th>
                    <th className="p-2 lg:p-3 font-semibold">Status</th>
                    <th className="p-2 lg:p-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLeaveRows.map((d, idx) => {
                    const rowIndex = (leavePage - 1) * LEAVE_PAGE_SIZE + idx;
                    return (
                    <tr
                      key={d._id}
                      className={`border-b border-gray-200 ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                      } hover:bg-blue-50/40`}
                    >
                      <td className="p-2 lg:p-3 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={selectedExportIds.has(String(d._id))}
                          onChange={() => toggleExportSelect(d._id)}
                          className="rounded border-gray-300"
                          aria-label={`Include in Excel export: ${getStaffName(d)}`}
                        />
                      </td>
                      <td className="p-2 lg:p-3 font-semibold text-gray-800">{getStaffId(d, rowIndex)}</td>
                      <td className="p-2 lg:p-3">{getStaffName(d)}</td>
                      <td className="p-2 lg:p-3">{d.leaveType || "—"}</td>
                      <td className="p-2 lg:p-3">{getDurationLabel(d)}</td>
                      <td className="p-2 lg:p-3 whitespace-nowrap">{formatDateRange(d.fromDate, d.toDate)}</td>
                      <td className="p-2 lg:p-3 tabular-nums">{getEffectiveUnits(d)}</td>
                      <td className="p-2 lg:p-3 text-xs">
                        <LeaveSplitStack leave={d} compact />
                      </td>
                      <td className="p-2 lg:p-3">{getConflictLabel(d)}</td>
                      <td className="p-2 lg:p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusTone(d.status)}`}>
                          {d.status || "Pending"}
                        </span>
                      </td>
                      <td className="p-2 lg:p-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedLeave(d);
                            setNoteInput(d.note || "");
                          }}
                          title={d.status === "Pending" ? "Review" : "View"}
                          aria-label={d.status === "Pending" ? "Review leave request" : "View leave request"}
                          className={`inline-flex items-center justify-center rounded-md p-2 text-sm font-medium ${
                            d.status === "Pending"
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {d.status === "Pending" ? <FiEdit2 className="text-base" /> : <FiEye className="text-base" />}
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredData.length > 0 && (
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-200 text-sm text-gray-700">
                <button
                  type="button"
                  onClick={() => setLeavePage((p) => Math.max(1, p - 1))}
                  disabled={leavePage <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft className="text-lg" />
                  Previous
                </button>
                <span className="tabular-nums px-2 text-gray-600">
                  Page {leavePage} / {totalLeavePages}
                </span>
                <button
                  type="button"
                  onClick={() => setLeavePage((p) => Math.min(totalLeavePages, p + 1))}
                  disabled={leavePage >= totalLeavePages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <FiChevronRight className="text-lg" />
                </button>
              </div>
            )}
            {filteredData.length === 0 && (
              <p className="text-center text-gray-500 py-4">No records found</p>
            )}
          </>
        )}
      </div>
      )}

      {leaveTab === "policy" && (
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 max-w-2xl space-y-5">
          <h3 className="text-lg font-semibold text-gray-900">Leave Policy Setup</h3>
          {policyLoading ? (
            <p className="text-gray-500">Loading policy…</p>
          ) : (
            <>
              {policyMessage.text && (
                <div
                  className={`rounded-md px-3 py-2 text-sm ${
                    policyMessage.type === "ok"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {policyMessage.text}
                </div>
              )}

              <div className="rounded-lg border border-gray-200 p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Leave Cycle Type</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                      value={policyForm.leaveCycleType}
                      onChange={(e) => updatePolicyField("leaveCycleType", e.target.value)}
                    >
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Paid Leave Limit</label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={policyForm.paidLeaveLimit}
                      onChange={(e) => updatePolicyField("paidLeaveLimit", numberOr(e.target.value, 0))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Maximum Leave Limit</label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={policyForm.maxLeaveLimit}
                      onChange={(e) => updatePolicyField("maxLeaveLimit", numberOr(e.target.value, 0))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cycle Start Month</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                      value={policyForm.cycleStartMonth}
                      onChange={(e) =>
                        updatePolicyField("cycleStartMonth", Math.min(12, Math.max(1, numberOr(e.target.value, 1))))
                      }
                    >
                      {MONTH_OPTIONS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Minimum Leave Per Request</label>
                    <input
                      type="number"
                      min={0.5}
                      step="0.5"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={policyForm.minLeavePerRequest}
                      onChange={(e) => updatePolicyField("minLeavePerRequest", numberOr(e.target.value, 0.5))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Maximum Leave Per Request</label>
                    <input
                      type="number"
                      min={0.5}
                      step="0.5"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={policyForm.maxLeavePerRequest}
                      onChange={(e) => updatePolicyField("maxLeavePerRequest", numberOr(e.target.value, 0.5))}
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Per-request limits are checked on effective leave days after holiday/weekend exclusions.
                    </p>
                  </div>
                </div>
                <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900 space-y-1">
                  <p>First configured paid leaves are treated as paid leave.</p>
                  <p>Leaves after paid limit and within maximum limit are marked as unpaid leave.</p>
                  <p>Leaves beyond the maximum limit are rejected automatically.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={savePolicy}
                disabled={policySaving}
                className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {policySaving ? "Saving…" : "Save policy"}
              </button>
            </>
          )}
        </div>
      )}

      {selectedLeave && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white shadow-xl w-full sm:max-w-3xl sm:rounded-lg rounded-t-xl border border-gray-200 relative max-h-[min(92dvh,100vh-2rem)] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <button
              onClick={() => setSelectedLeave(null)}
              className="absolute top-3 right-3 p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <FiX size={20} />
            </button>

            <div className="p-4 sm:p-5 overflow-y-auto">
              <h3 className="text-lg sm:text-xl font-semibold mb-1 text-gray-900">Leave Request Review</h3>
              <p className="text-sm text-gray-500 mb-4">
                {getStaffId(selectedLeave)} - {getStaffName(selectedLeave)}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Teacher</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">{getStaffName(selectedLeave)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">{selectedLeave.status || "Pending"}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Leave Type</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">{selectedLeave.leaveType || "—"}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">
                    {formatDateRange(selectedLeave.fromDate, selectedLeave.toDate)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">{getDurationLabel(selectedLeave)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Effective days</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">
                    {getEffectiveUnits(selectedLeave)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Paid / Unpaid</p>
                  <div className="mt-1">
                    <LeaveSplitStack leave={selectedLeave} />
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Conflict</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">{getConflictLabel(selectedLeave)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Reason</p>
                  <p className="text-base font-semibold text-gray-900 leading-tight">{selectedLeave.reason || "—"}</p>
                </div>
              </div>

              <label className="block text-base font-semibold text-gray-800 mb-2">
                Admin Comment / Rejection Reason
              </label>
              <textarea
                placeholder="Enter approval note or rejection reason"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none mb-4"
                rows="4"
              />

            </div>

            <div className="border-t border-gray-200 p-3 sm:p-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 flex-wrap">
              {selectedLeave.status === "Approved" && (
                <button
                  type="button"
                  onClick={cancelApproved}
                  className="bg-gray-800 text-white px-5 py-2 rounded-md hover:bg-gray-900 min-w-[108px] text-sm font-semibold"
                >
                  Cancel approval
                </button>
              )}
              {selectedLeave.status === "Pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => updateStatus("Disapproved")}
                    className="bg-red-600 text-white px-5 py-2 rounded-md hover:bg-red-700 min-w-[108px] text-sm font-semibold"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus("Approved")}
                    className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 min-w-[108px] text-sm font-semibold"
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
