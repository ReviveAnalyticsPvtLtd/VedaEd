import { getStoredUser } from "../utils/authStorage";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiEdit, FiEye, FiFileText, FiX } from "react-icons/fi";
import staffAPI from "../services/staffAPI";
import api from "../services/apiClient";

const STORAGE_KEY_PREFIX = "veda_teacher_leave_requests_v1";

const DEFAULT_POLICY = {
  paidLeaveLimit: 15,
  maxLeaveLimit: 20,
  cycleStartMonth: 1,
  allowHalfDay: true,
  excludeSundays: true,
  excludeHolidays: true,
  autoConvertExtraToUnpaid: true,
};

const LEAVE_TYPES = [
  "Casual Leave",
  "Sick Leave",
  "Emergency Leave",
  "Personal Leave",
  "Maternity Leave",
];

const DURATIONS = [
  "Full Day",
  "Multiple Days",
  "Half Day - First Half",
  "Half Day - Second Half",
];

function parseLocalYmd(ymd) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function ymdFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addOneLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
}

function buildHolidayKeySet(events) {
  const set = new Set();
  (events || []).forEach((ev) => {
    const type = String(ev.eventType || ev.type || "").toLowerCase();
    if (type !== "holiday") return;
    let cur = new Date(ev.startDate || ev.start);
    const end = new Date(ev.endDate || ev.end || ev.startDate || ev.start);
    if (Number.isNaN(cur.getTime()) || Number.isNaN(end.getTime())) return;
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cur <= endDay) {
      set.add(ymdFromDate(cur));
      cur = addOneLocalDay(cur);
    }
  });
  return set;
}

function effectiveDaysPreview(startStr, endStr, duration, policy, holidaySet) {
  if (!policy || !startStr || !endStr) return 0;
  const hol = holidaySet instanceof Set ? holidaySet : new Set();
  if (duration.includes("Half")) {
    const d = parseLocalYmd(startStr);
    if (!d || endStr !== startStr) return 0;
    if (policy.excludeSundays && d.getDay() === 0) return 0;
    const key = ymdFromDate(d);
    if (policy.excludeHolidays && hol.has(key)) return 0;
    return 0.5;
  }
  let n = 0;
  let cur = parseLocalYmd(startStr);
  const end = parseLocalYmd(endStr);
  if (!cur || !end || end < cur) return 0;
  while (cur <= end) {
    if (policy.excludeSundays && cur.getDay() === 0) {
      cur = addOneLocalDay(cur);
      continue;
    }
    const key = ymdFromDate(cur);
    if (policy.excludeHolidays && hol.has(key)) {
      cur = addOneLocalDay(cur);
      continue;
    }
    n++;
    cur = addOneLocalDay(cur);
  }
  return n;
}

function calendarDaysInclusive(startStr, endStr) {
  const start = parseLocalYmd(startStr);
  const end = parseLocalYmd(endStr);
  if (!start || !end) return 0;
  return Math.round((end - start) / 86400000) + 1;
}

function leaveBucket(leaveType) {
  return leaveType === "Sick Leave" ? "sick" : "casual";
}

function leaveUnits(startDate, endDate, duration, policy, holidaySet) {
  return effectiveDaysPreview(startDate, endDate, duration, policy || DEFAULT_POLICY, holidaySet);
}

function conflictLabel(startDate, endDate, duration, policy, holidaySet) {
  if (!startDate || !endDate) return "—";
  if (parseLocalYmd(endDate) < parseLocalYmd(startDate)) return "Invalid range";
  const u = effectiveDaysPreview(startDate, endDate, duration, policy || DEFAULT_POLICY, holidaySet);
  if (u <= 0) return "No billable days (weekend/holiday per policy)";
  return `${u} day(s) per policy`;
}

function localRangesOverlap(startStr, endStr, oStart, oEnd) {
  const a = parseLocalYmd(startStr);
  const b = parseLocalYmd(endStr);
  const x = parseLocalYmd(oStart);
  const y = parseLocalYmd(oEnd);
  if (!a || !b || !x || !y) return false;
  return a <= y && x <= b;
}

function isPastYmd(ymd) {
  const d = parseLocalYmd(ymd);
  if (!d) return false;
  const t = new Date();
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return d < today;
}

function leaveStatusBadgeClass(status) {
  if (status === "Approved") {
    return "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800";
  }
  if (status === "Disapproved" || status === "Rejected") {
    return "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium bg-rose-100 text-rose-800";
  }
  if (status === "Cancelled") {
    return "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-800";
  }
  return "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800";
}

function isMultipleDaysDuration(duration) {
  return duration === "Multiple Days";
}

function formatRangeDisplay(startStr, endStr) {
  const a = parseLocalYmd(startStr);
  const b = parseLocalYmd(endStr);
  if (!a || !b) return "—";
  const opts = { day: "numeric", month: "short", year: "numeric" };
  const left = a.toLocaleDateString("en-IN", opts);
  const right = b.toLocaleDateString("en-IN", opts);
  if (left === right) return left;
  return `${left} to ${right}`;
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
    const units = Number(leave?.units);
    if (Number.isFinite(units) && units > 0) return { paid: units, unpaid: 0 };
  }
  return null;
}

function LeaveSplitStack({ leave }) {
  const split = getLeaveSplitForDisplay(leave);
  if (!split) return <span className="text-gray-500">—</span>;
  return (
    <div className="flex flex-col gap-1 min-w-[106px]">
      <span className="inline-flex items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
        <span>Paid</span>
        <span className="tabular-nums">{formatLeaveSplitValue(split.paid)}</span>
      </span>
      <span className="inline-flex items-center justify-between gap-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700">
        <span>Unpaid</span>
        <span className="tabular-nums">{formatLeaveSplitValue(split.unpaid)}</span>
      </span>
    </div>
  );
}

function LeaveDetailCell({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/90 p-3 min-w-0">
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-gray-900 mt-1 break-words">{value}</p>
    </div>
  );
}

function loadRequests(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map((row) => {
          const { substitute: _s, handover: _h, ...rest } = row;
          const teacherName =
            !rest.teacherName || rest.teacherName === "Teacher User"
              ? teacherDisplayName()
              : rest.teacherName;
          return { ...rest, teacherName };
        });
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

function persistRequests(list, storageKey) {
  localStorage.setItem(storageKey, JSON.stringify(list));
}

function nextRequestId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `LR-${n}`;
}

function teacherDisplayName() {
  try {
    const u = (getStoredUser() || {});
    return (
      u?.name ||
      u?.personalInfo?.name ||
      u?.personalInfo?.fullName ||
      u?.username ||
      u?.email ||
      "Teacher"
    );
  } catch {
    return "Teacher";
  }
}

function teacherStorageKey() {
  try {
    const u = (getStoredUser() || {});
    const identity =
      u?.staffId ||
      u?.personalInfo?.staffId ||
      u?.refId ||
      u?._id ||
      u?.email ||
      u?.username ||
      "default";
    return `${STORAGE_KEY_PREFIX}_${String(identity)}`;
  } catch {
    return `${STORAGE_KEY_PREFIX}_default`;
  }
}

/** Stored rows may still say "Teacher User"; show current profile name instead. */
function displayTeacherName(stored) {
  if (!stored || stored === "Teacher User") return teacherDisplayName();
  return stored;
}

function isObjectIdLike(value) {
  return typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);
}

function toYmd(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mapApiLeaveToUi(row, policy, holidaySet) {
  const startDate = toYmd(row?.fromDate);
  const endDate = toYmd(row?.toDate);
  const duration = row?.duration || (row?.days > 1 ? "Multiple Days" : "Full Day");
  const units =
    row?.effectiveDays != null
      ? Number(row.effectiveDays)
      : typeof row?.days === "number"
        ? row.days
        : leaveUnits(startDate, endDate, duration, policy, holidaySet);
  return {
    id: row?._id,
    teacherName: row?.staff?.personalInfo?.name || teacherDisplayName(),
    teacherId: row?.staff?.personalInfo?.staffId || null,
    leaveType: row?.leaveType || "Casual Leave",
    duration,
    startDate,
    endDate,
    conflict: conflictLabel(startDate, endDate, duration, policy, holidaySet),
    status: row?.status || "Pending",
    reason: row?.reason || row?.note || "",
    docName: null,
    units,
    paidDays: row?.paidDays,
    unpaidDays: row?.unpaidDays,
    bucket: leaveBucket(row?.leaveType),
    appliedAt: row?.applyDate || row?.createdAt || new Date().toISOString(),
    _source: "api",
  };
}

export default function TeacherLeave() {
  const formTopRef = useRef(null);
  const storageKey = useMemo(() => teacherStorageKey(), []);
  const [requests, setRequests] = useState(() => loadRequests(storageKey));
  const [teacherStaffId, setTeacherStaffId] = useState("");

  const [leaveType, setLeaveType] = useState("Emergency Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState("Half Day - First Half");
  const [editingId, setEditingId] = useState(null);
  const [reason, setReason] = useState("");
  const [docName, setDocName] = useState("");
  const [fileKey, setFileKey] = useState(0);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [viewRow, setViewRow] = useState(null);
  const [syncMode, setSyncMode] = useState("local");
  const [leavePolicy, setLeavePolicy] = useState(null);
  const [holidayKeys, setHolidayKeys] = useState(() => new Set());
  const [leaveBalance, setLeaveBalance] = useState(null);

  const policyEffective = leavePolicy || DEFAULT_POLICY;

  const refreshLeaveBalance = useCallback(async () => {
    try {
      const b = await staffAPI.getLeaveBalance();
      if (b?.success) setLeaveBalance(b);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    persistRequests(requests, storageKey);
  }, [requests, storageKey]);

  useEffect(() => {
    let isMounted = true;
    const loadTeacherStaffId = async () => {
      try {
        const u = (getStoredUser() || {});
        const localStaffId = u?.staffId || u?.personalInfo?.staffId;
        if (localStaffId && !isObjectIdLike(localStaffId)) {
          if (isMounted) setTeacherStaffId(localStaffId);
          return;
        }
        const refId = u?.refId || u?._id;
        if (!refId) return;
        const res = await staffAPI.getStaffById(refId);
        const apiStaffId = res?.staff?.personalInfo?.staffId;
        if (apiStaffId && !isObjectIdLike(apiStaffId) && isMounted) {
          setTeacherStaffId(apiStaffId);
        }
      } catch {
        /* ignore */
      }
    };
    loadTeacherStaffId();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      let hk = new Set();
      try {
        const ev = await api.get("/calendar/events");
        if (ev.data?.success && Array.isArray(ev.data.data)) {
          hk = buildHolidayKeySet(ev.data.data);
        }
      } catch {
        /* ignore */
      }
      if (!active) return;
      setHolidayKeys(hk);

      let pol = { ...DEFAULT_POLICY };
      try {
        const pr = await staffAPI.getLeavePolicy();
        if (pr?.policy) pol = { ...DEFAULT_POLICY, ...pr.policy };
      } catch {
        /* ignore */
      }
      if (!active) return;
      setLeavePolicy(pol);

      try {
        const res = await staffAPI.getMyLeaveRequests();
        if (!active) return;
        const apiRows = Array.isArray(res?.leaves)
          ? res.leaves.map((row) => mapApiLeaveToUi(row, pol, hk))
          : [];
        setRequests(apiRows);
        setSyncMode("api");
        await refreshLeaveBalance();
      } catch {
        if (!active) return;
        setSyncMode("local");
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [refreshLeaveBalance]);

  const durationOptions = useMemo(() => {
    if (policyEffective.allowHalfDay) return DURATIONS;
    return DURATIONS.filter((d) => !d.includes("Half"));
  }, [policyEffective.allowHalfDay]);

  useEffect(() => {
    if (!policyEffective.allowHalfDay && duration.includes("Half")) {
      setDuration("Full Day");
    }
  }, [policyEffective.allowHalfDay, duration]);

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === "Pending").length,
    [requests]
  );

  const approvedThisMonth = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return requests.filter((r) => {
      if (r.status !== "Approved") return false;
      const d = parseLocalYmd(r.startDate);
      return d && d.getFullYear() === y && d.getMonth() === m;
    }).length;
  }, [requests]);

  const sickDocRequired = useMemo(() => {
    if (leaveType !== "Sick Leave" || !startDate || !endDate) return false;
    return calendarDaysInclusive(startDate, endDate) > 2;
  }, [leaveType, startDate, endDate]);

  const validate = useCallback(() => {
    const errs = [];
    if (!policyEffective.allowHalfDay && duration.includes("Half")) {
      errs.push("Half-day leave is disabled by HR policy.");
    }
    if (!leaveType) errs.push("Select a leave type.");
    if (!startDate || !endDate) errs.push("Start date and end date are required.");
    if (startDate && endDate && endDate < startDate) errs.push("End date cannot be before start date.");
    if (isPastYmd(startDate) || isPastYmd(endDate)) errs.push("Past leave dates are not allowed.");
    if (duration.includes("Half") && startDate && endDate && startDate !== endDate) {
      errs.push("Half-day leave must use the same start and end date.");
    }
    if (isMultipleDaysDuration(duration) && calendarDaysInclusive(startDate, endDate) <= 1) {
      errs.push("Multiple Days requires an end date after the start date (at least two calendar days).");
    }
    if (!reason.trim()) errs.push("Reason is required.");
    const sickDays = calendarDaysInclusive(startDate, endDate);
    if (leaveType === "Sick Leave" && sickDays > 2 && !docName) {
      errs.push("Supporting document is required for Sick Leave longer than 2 calendar days.");
    }
    const units = leaveUnits(startDate, endDate, duration, policyEffective, holidayKeys);
    if (units <= 0 && startDate && endDate && endDate >= startDate) {
      errs.push("No billable leave days in this range (check weekends and holidays).");
    }

    requests.forEach((r) => {
      if (editingId && r.id === editingId) return;
      if (!["Pending", "Approved"].includes(r.status)) return;
      if (localRangesOverlap(startDate, endDate, r.startDate, r.endDate)) {
        errs.push("This date range overlaps another leave request.");
      }
    });

    return errs;
  }, [
    leaveType,
    startDate,
    endDate,
    duration,
    reason,
    docName,
    editingId,
    requests,
    policyEffective,
    holidayKeys,
  ]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    setDocName(f ? f.name : "");
  };

  const resetFormFields = () => {
    setLeaveType("Emergency Leave");
    setStartDate("");
    setEndDate("");
    setDuration("Half Day - First Half");
    setEditingId(null);
    setReason("");
    setDocName("");
    setFileKey((k) => k + 1);
  };

  const clearForm = () => {
    resetFormFields();
    setFormError("");
    setFormSuccess("");
  };

  const openEdit = (r) => {
    if (r.status !== "Pending") return;
    setEditingId(r.id);
    setLeaveType(r.leaveType);
    setStartDate(r.startDate);
    setEndDate(r.endDate);
    setDuration(r.duration);
    setReason(r.reason || "");
    setDocName(r.docName || "");
    setFileKey((k) => k + 1);
    setFormError("");
    setFormSuccess("");
    setViewRow(null);
    scrollToForm();
  };

  const submit = async () => {
    setFormSuccess("");
    const errs = validate();
    if (errs.length) {
      setFormError(errs.join(" "));
      return;
    }
    setFormError("");
    const bucket = leaveBucket(leaveType);
    const units = leaveUnits(startDate, endDate, duration, policyEffective, holidayKeys);
    const conflict = conflictLabel(startDate, endDate, duration, policyEffective, holidayKeys);

    if (editingId) {
      const editingRow = requests.find((r) => r.id === editingId);
      if (syncMode === "api" && editingRow?._source === "api") {
        try {
          const res = await staffAPI.updateMyLeaveRequest(editingId, {
            leaveType,
            duration,
            fromDate: startDate,
            toDate: endDate,
            reason: reason.trim(),
          });
          const updatedUi = mapApiLeaveToUi(res?.leave || {}, policyEffective, holidayKeys);
          setRequests((prev) => prev.map((r) => (r.id === editingId ? updatedUi : r)));
          refreshLeaveBalance();
        } catch (err) {
          setFormError(err?.response?.data?.message || "Failed to update leave request.");
          return;
        }
      } else {
        setRequests((prev) =>
          prev.map((r) => {
            if (r.id !== editingId) return r;
            const { handover: _h, ...base } = r;
            return {
              ...base,
              leaveType,
              duration,
              startDate,
              endDate,
              conflict,
              reason: reason.trim(),
              docName: docName || null,
              units,
              bucket,
            };
          })
        );
      }
      resetFormFields();
      setFormSuccess("Leave request updated successfully.");
      return;
    }

    if (syncMode === "api") {
      try {
        const res = await staffAPI.applyLeave({
          leaveType,
          duration,
          fromDate: startDate,
          toDate: endDate,
          reason: reason.trim(),
        });
        const createdUi = mapApiLeaveToUi(res?.leave || {}, policyEffective, holidayKeys);
        setRequests((prev) => [createdUi, ...prev]);
        refreshLeaveBalance();
      } catch (err) {
        setFormError(err?.response?.data?.message || "Failed to submit leave request.");
        return;
      }
    } else {
      const row = {
        id: nextRequestId(),
        teacherName: teacherDisplayName(),
        teacherId: teacherStaffId || null,
        leaveType,
        duration,
        startDate,
        endDate,
        conflict,
        status: "Pending",
        reason: reason.trim(),
        docName: docName || null,
        units,
        bucket,
        appliedAt: new Date().toISOString(),
      };
      setRequests((prev) => [row, ...prev]);
    }
    resetFormFields();
    setFormError("");
    setFormSuccess("Leave request submitted and is pending approval.");
  };

  const scrollToForm = () => {
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="p-0 m-0 space-y-4 w-full max-w-full min-w-0">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Remaining paid (est.)",
            value:
              syncMode === "api" && leaveBalance
                ? String(Math.max(0, Number(leaveBalance.remainingPaidLeaves) || 0).toFixed(1)).replace(/\.0$/, "")
                : "—",
          },
          {
            label: "Used unpaid (cycle)",
            value:
              syncMode === "api" && leaveBalance
                ? String(Number(leaveBalance.usedUnpaidLeaves) || 0).replace(/\.0$/, "")
                : "—",
          },
          { label: "Pending Requests", value: String(pendingCount) },
          { label: "Approved This Month", value: String(approvedThisMonth) },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 min-w-0"
          >
            <p className="text-[11px] sm:text-xs text-gray-500 mb-1 leading-snug">{card.label}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 tabular-nums">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Apply form */}
      <div
        ref={formTopRef}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 w-full max-w-full min-w-0"
      >
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          Apply Teacher Leave
        </h3>

        {editingId && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm">
            You are updating a pending request. Submit to save changes, or Clear to cancel editing.
          </div>
        )}

        {formError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm break-words">
            {formError}
          </div>
        )}
        {formSuccess && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 text-green-800 px-3 py-2 text-sm break-words">
            {formSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <div className="min-w-0">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Leave Type<span className="text-red-500"> *</span>
            </label>
            <select
              className="w-full min-w-0 max-w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Start Date<span className="text-red-500"> *</span>
            </label>
            <input
              type="date"
              className="w-full min-w-0 max-w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              End Date<span className="text-red-500"> *</span>
            </label>
            <input
              type="date"
              className="w-full min-w-0 max-w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <div className="min-w-0">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Duration<span className="text-red-500"> *</span>
            </label>
            <select
              className="w-full min-w-0 max-w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              {durationOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500 mt-1 leading-snug">
              Leave days follow HR policy: Sundays
              {policyEffective.excludeHolidays ? " and institute holidays" : ""} may be excluded from the count.
            </p>
          </div>
          <div className="min-w-0 sm:col-span-2 lg:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Supporting Document
              {sickDocRequired && <span className="text-red-500"> *</span>}
            </label>
            <input
              key={fileKey}
              type="file"
              className="w-full min-w-0 max-w-full text-sm text-gray-600 file:mr-2 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-gray-100 file:text-gray-700"
              onChange={handleFile}
            />
          </div>
        </div>

        <div className="mb-4 min-w-0">
          <label className="block text-xs font-medium text-gray-600 mb-1 break-words">
            Reason<span className="text-red-500"> *</span>
          </label>
          <textarea
            rows={3}
            className="w-full min-w-0 max-w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-y"
            placeholder="Enter leave reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap gap-3 pt-4 mt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={submit}
            className="inline-flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 sm:py-2 rounded-md text-sm font-medium shadow-sm w-full sm:w-auto min-h-[44px]"
          >
            <FiCheck className="text-lg shrink-0" />
            {editingId ? "Update Leave Request" : "Submit Leave Request"}
          </button>
          <button
            type="button"
            onClick={clearForm}
            className="inline-flex justify-center items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 sm:py-2 rounded-md text-sm font-medium border border-gray-300 w-full sm:w-auto min-h-[44px]"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Requests: cards (mobile) + table (md+) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 w-full max-w-full min-w-0">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          My Leave Requests
        </h3>

        {/* Mobile / narrow */}
        <div className="md:hidden space-y-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 text-sm space-y-2 min-w-0"
            >
              <div className="flex justify-between items-start gap-2 min-w-0">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 break-words">{r.leaveType}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.duration}</p>
                </div>
                <span className={leaveStatusBadgeClass(r.status)}>{r.status}</span>
              </div>
              <p className="text-gray-700 break-words">
                <span className="font-medium text-gray-800">Date:</span>{" "}
                {formatRangeDisplay(r.startDate, r.endDate)}
              </p>
              <p className="text-gray-700 break-words">
                <span className="font-medium text-gray-800">Conflict:</span> {r.conflict}
              </p>
              <div className="text-gray-700">
                <span className="font-medium text-gray-800">Paid / Unpaid:</span>
                <div className="mt-1">
                  <LeaveSplitStack leave={r} />
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  title="View"
                  onClick={() => setViewRow(r)}
                  className="inline-flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  <FiEye className="text-lg text-gray-600" />
                  View
                </button>
                <button
                  type="button"
                  title="Update"
                  disabled={r.status !== "Pending"}
                  onClick={() => openEdit(r)}
                  className={`inline-flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-md border text-sm font-medium ${
                    r.status === "Pending"
                      ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                      : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <FiEdit className="text-lg" />
                  Update
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Tablet / desktop */}
        <div className="hidden md:block overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[520px] text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-700">
                <th className="p-2 lg:p-3 border border-gray-200 font-semibold">Leave Type</th>
                <th className="p-2 lg:p-3 border border-gray-200 font-semibold whitespace-nowrap">
                  Date
                </th>
                <th className="p-2 lg:p-3 border border-gray-200 font-semibold">Conflict</th>
                <th className="p-2 lg:p-3 border border-gray-200 font-semibold whitespace-nowrap">
                  Paid / Unpaid
                </th>
                <th className="p-2 lg:p-3 border border-gray-200 font-semibold whitespace-nowrap text-center">
                  Status
                </th>
                <th className="p-2 lg:p-3 border border-gray-200 font-semibold whitespace-nowrap text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-blue-50/40"}>
                  <td className="p-2 lg:p-3 border border-gray-200 text-gray-800 break-words max-w-[200px]">
                    <div className="font-medium">{r.leaveType}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{r.duration}</div>
                  </td>
                  <td className="p-2 lg:p-3 border border-gray-200 text-gray-700 whitespace-nowrap">
                    {formatRangeDisplay(r.startDate, r.endDate)}
                  </td>
                  <td className="p-2 lg:p-3 border border-gray-200 text-gray-700 break-words max-w-[180px]">
                    {r.conflict}
                  </td>
                  <td className="p-2 lg:p-3 border border-gray-200 text-xs">
                    <LeaveSplitStack leave={r} />
                  </td>
                  <td className="p-2 lg:p-3 border border-gray-200 whitespace-nowrap text-center">
                    <span className={`inline-block ${leaveStatusBadgeClass(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="p-2 lg:p-3 border border-gray-200 whitespace-nowrap text-center">
                    <div className="inline-flex items-center justify-center gap-1">
                      <button
                        type="button"
                        title="View"
                        onClick={() => setViewRow(r)}
                        className="p-2 rounded text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                      >
                        <FiEye className="text-lg" />
                      </button>
                      <button
                        type="button"
                        title="Update"
                        disabled={r.status !== "Pending"}
                        onClick={() => openEdit(r)}
                        className={`p-2 rounded ${
                          r.status === "Pending"
                            ? "text-blue-600 hover:bg-blue-50"
                            : "text-gray-300 cursor-not-allowed"
                        }`}
                      >
                        <FiEdit className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {requests.length === 0 && (
          <p className="text-gray-500 text-sm mt-3">No leave requests yet.</p>
        )}
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={scrollToForm}
        className="fixed z-40 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white shadow-lg flex items-center justify-center bottom-[max(1rem,env(safe-area-inset-bottom,0px))] right-[max(1rem,env(safe-area-inset-right,0px))]"
        title="Apply leave"
        aria-label="Scroll to apply leave form"
      >
        <FiFileText className="text-lg sm:text-xl" />
      </button>

      {/* View modal */}
      {viewRow && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 overscroll-contain"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white shadow-xl w-full sm:max-w-lg sm:rounded-lg rounded-t-xl border border-gray-200 max-h-[min(92dvh,100vh-2rem)] sm:max-h-[90vh] overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 gap-2 shrink-0">
              <div className="min-w-0 pr-2">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  Leave details
                </h4>
              </div>
              <button
                type="button"
                className="p-2 rounded hover:bg-gray-100 text-gray-600 shrink-0"
                onClick={() => setViewRow(null)}
                aria-label="Close"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-sm text-gray-700 overflow-y-auto min-h-0 break-words">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <LeaveDetailCell
                  label="Teacher"
                  value={
                    <span className="block">
                      <span className="block">{displayTeacherName(viewRow.teacherName)}</span>
                      {((viewRow.teacherId && !isObjectIdLike(viewRow.teacherId)) || teacherStaffId) && (
                        <span className="block text-xs text-gray-500 mt-0.5">
                          {(viewRow.teacherId && !isObjectIdLike(viewRow.teacherId))
                            ? viewRow.teacherId
                            : teacherStaffId}
                        </span>
                      )}
                    </span>
                  }
                />
                <LeaveDetailCell label="Status" value={viewRow.status} />
                <LeaveDetailCell label="Leave type" value={viewRow.leaveType} />
                <LeaveDetailCell
                  label="Date"
                  value={formatRangeDisplay(viewRow.startDate, viewRow.endDate)}
                />
                <LeaveDetailCell label="Conflict" value={viewRow.conflict} />
                <LeaveDetailCell
                  label="Duration"
                  value={
                    typeof viewRow.units === "number"
                      ? `${viewRow.duration} (${String(viewRow.units).replace(/\.0$/, "")} day${
                          viewRow.units === 1 ? "" : "s"
                        } charged)`
                      : viewRow.duration
                  }
                />
                <LeaveDetailCell
                  label="Paid / Unpaid"
                  value={
                    (() => {
                      const split = getLeaveSplitForDisplay(viewRow);
                      if (!split) return "—";
                      return `Paid: ${formatLeaveSplitValue(split.paid)} / Unpaid: ${formatLeaveSplitValue(split.unpaid)}`;
                    })()
                  }
                />
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50/90 p-3 min-w-0">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                  Reason
                </p>
                <p className="text-gray-900 mt-1 break-words whitespace-pre-wrap">{viewRow.reason}</p>
              </div>
              {viewRow.docName && (
                <LeaveDetailCell label="Supporting document" value={viewRow.docName} />
              )}
            </div>
            <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-gray-200 flex justify-stretch sm:justify-end shrink-0">
              <button
                type="button"
                onClick={() => setViewRow(null)}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800"
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
