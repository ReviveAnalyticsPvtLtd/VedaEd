const {
  ATTENDANCE_MODES,
  WORKING_DAYS,
  DEFAULT_WORKING_DAYS,
  LEAVE_APPROVAL_OPTIONS,
  LEAVE_TYPES,
  DEFAULT_LEAVE_TYPES,
  ATTENDANCE_DEPENDENCY_ITEMS,
  TIME_REGEX,
  MIN_ATTENDANCE_MIN,
  MIN_ATTENDANCE_MAX,
} = require("./attendanceRules.config");

// Future Update:
// Add biometric attendance machine integration
// with real-time attendance sync support.

// Future Update:
// Wire low-attendance, absent, and late alerts to
// parent notification queue and SMS/email providers.

const DEFAULT_ATTENDANCE_MODE = "Hybrid";

const DEFAULT_TIMINGS = {
  schoolStartTime: "08:00",
  schoolEndTime: "14:30",
  halfDayCheckoutTime: "11:30",
  attendanceClosingTime: "09:30",
};

const DEFAULT_RULES = {
  lateArrivalAfter: "08:15",
  autoAbsentAfter: "10:00",
  minimumAttendance: 75,
  graceMinutes: 10,
};

const DEFAULT_PERMISSIONS = {
  classTeacher: true,
  subjectTeacher: true,
  adminOverride: true,
  biometric: false,
};

const DEFAULT_LEAVE_APPROVAL = {
  studentLeaveApproval: "Class Teacher Approval",
  staffLeaveApproval: "Principal Approval",
};

const DEFAULT_PARENT_NOTIFICATIONS = {
  absentAlert: true,
  lateArrivalAlert: true,
  earlyCheckoutAlert: true,
  lowAttendanceWarning: true,
};

const timeToMinutes = (timeStr) => {
  const [h, m] = String(timeStr || "00:00").split(":").map(Number);
  return h * 60 + m;
};

const normalizeWorkingDays = (days) => {
  if (!Array.isArray(days)) return [...DEFAULT_WORKING_DAYS];
  const allowed = new Set(WORKING_DAYS);
  const normalized = [...new Set(days.filter((d) => allowed.has(d)))];
  return normalized.length > 0 ? normalized : [...DEFAULT_WORKING_DAYS];
};

const normalizeLeaveTypes = (types) => {
  if (!Array.isArray(types)) return [...DEFAULT_LEAVE_TYPES];
  const allowed = new Set(LEAVE_TYPES);
  const normalized = [...new Set(types.filter((t) => allowed.has(t)))];
  return normalized.length > 0 ? normalized : [...DEFAULT_LEAVE_TYPES];
};

const normalizePermissions = (raw = {}) => ({
  classTeacher: raw.classTeacher !== false,
  subjectTeacher: raw.subjectTeacher !== false,
  adminOverride: raw.adminOverride !== false,
  biometric: Boolean(raw.biometric),
});

const normalizeParentNotifications = (raw = {}) => ({
  absentAlert: raw.absentAlert !== false,
  lateArrivalAlert: raw.lateArrivalAlert !== false,
  earlyCheckoutAlert: raw.earlyCheckoutAlert !== false,
  lowAttendanceWarning: raw.lowAttendanceWarning !== false,
});

const normalizeLeaveApproval = (raw = {}) => {
  const student = String(
    raw.studentLeaveApproval || DEFAULT_LEAVE_APPROVAL.studentLeaveApproval
  ).trim();
  const staff = String(
    raw.staffLeaveApproval || DEFAULT_LEAVE_APPROVAL.staffLeaveApproval
  ).trim();

  return {
    studentLeaveApproval: LEAVE_APPROVAL_OPTIONS.includes(student)
      ? student
      : DEFAULT_LEAVE_APPROVAL.studentLeaveApproval,
    staffLeaveApproval: LEAVE_APPROVAL_OPTIONS.includes(staff)
      ? staff
      : DEFAULT_LEAVE_APPROVAL.staffLeaveApproval,
  };
};

const getModeRecommendation = (mode) => {
  if (mode === "Daily") {
    return "Daily attendance is ideal for lower grades and preschool setups.";
  }
  if (mode === "Period-wise") {
    return "Period-wise attendance works best when subject teachers mark each class period.";
  }
  return "For K12, use hybrid attendance: daily for lower grades and period-wise for higher grades.";
};

/**
 * Resolves which downstream modules are fed by current attendance settings.
 */
const computeAttendanceDependencyStatus = (
  parentNotifications = {},
  minimumAttendance = 75
) => {
  const feeds = [];
  if (
    parentNotifications.absentAlert ||
    parentNotifications.lateArrivalAlert ||
    parentNotifications.earlyCheckoutAlert
  ) {
    feeds.push("Parent Portal");
  }
  if (minimumAttendance >= MIN_ATTENDANCE_MIN) {
    feeds.push("Report Cards");
  }
  feeds.push("Teacher Dashboard");
  if (
    parentNotifications.lowAttendanceWarning ||
    minimumAttendance < 100
  ) {
    feeds.push("Low Attendance Alerts");
  }

  return ATTENDANCE_DEPENDENCY_ITEMS.map((module) => ({
    module,
    status: feeds.includes(module) ? "Feeds" : "Depends",
  }));
};

const getAttendanceSmartChecks = (form = {}) => {
  const messages = [];
  const permissions = normalizePermissions(form.attendancePermissions);
  const closing = form.attendanceClosingTime || DEFAULT_TIMINGS.attendanceClosingTime;

  if (permissions.adminOverride) {
    messages.push(
      `Admin override is enabled. All attendance edits after ${closing} should be captured in audit logs.`
    );
  }

  if (permissions.biometric) {
    messages.push(
      "Biometric sync is enabled. Device credentials and sync schedules will be required during launch."
    );
  }

  if (!permissions.classTeacher && !permissions.subjectTeacher) {
    messages.push(
      "No teacher role can mark attendance. Enable Class Teacher or Subject Teacher before go-live."
    );
  }

  if (form.attendanceMode === "Period-wise" && !permissions.subjectTeacher) {
    messages.push(
      "Period-wise mode needs Subject Teacher permission enabled for period marking."
    );
  }

  if (messages.length === 0) {
    messages.push(
      "Attendance closing time is set. Late edits should require admin approval with audit trail."
    );
  }

  return messages;
};

/**
 * Describes how attendance mode affects marking behavior (for API/docs).
 */
const resolveAttendanceModeLogic = (mode) => {
  if (mode === "Daily") {
    return "One attendance record per student per school day.";
  }
  if (mode === "Period-wise") {
    return "Attendance captured per subject period by assigned teachers.";
  }
  return "Lower grades use daily attendance; higher grades use period-wise attendance.";
};

const validateTimeField = (value, fieldName) => {
  const trimmed = String(value || "").trim();
  if (!TIME_REGEX.test(trimmed)) {
    return { valid: false, message: `${fieldName} must be a valid time (HH:MM)` };
  }
  return { valid: true, value: trimmed };
};

const validateStep8Payload = (body, { draft = false } = {}) => {
  const errors = [];

  const attendanceMode = ATTENDANCE_MODES.includes(body.attendanceMode)
    ? body.attendanceMode
    : DEFAULT_ATTENDANCE_MODE;

  const workingDays = normalizeWorkingDays(body.workingDays);

  const schoolStart = validateTimeField(
    body.schoolStartTime ?? body.timings?.start,
    "schoolStartTime"
  );
  const schoolEnd = validateTimeField(
    body.schoolEndTime ?? body.timings?.end,
    "schoolEndTime"
  );
  const halfDay = validateTimeField(
    body.halfDayCheckoutTime ?? body.timings?.halfDay,
    "halfDayCheckoutTime"
  );
  const closing = validateTimeField(
    body.attendanceClosingTime ?? body.timings?.close,
    "attendanceClosingTime"
  );
  const lateAfter = validateTimeField(
    body.lateArrivalAfter ?? body.rules?.late,
    "lateArrivalAfter"
  );
  const autoAbsent = validateTimeField(
    body.autoAbsentAfter ?? body.rules?.absent,
    "autoAbsentAfter"
  );

  [schoolStart, schoolEnd, halfDay, closing, lateAfter, autoAbsent].forEach((check) => {
    if (!check.valid) errors.push(check.message);
  });

  let minimumAttendance = Number(
    body.minimumAttendance ?? body.rules?.minPercent ?? DEFAULT_RULES.minimumAttendance
  );
  let graceMinutes = Number(
    body.graceMinutes ?? body.rules?.grace ?? DEFAULT_RULES.graceMinutes
  );

  if (!draft) {
    if (workingDays.length === 0) {
      errors.push("At least one working day is required");
    }

    if (
      !Number.isFinite(minimumAttendance) ||
      minimumAttendance < MIN_ATTENDANCE_MIN ||
      minimumAttendance > MIN_ATTENDANCE_MAX
    ) {
      errors.push(
        `minimumAttendance must be between ${MIN_ATTENDANCE_MIN} and ${MIN_ATTENDANCE_MAX}`
      );
    }

    if (!Number.isFinite(graceMinutes) || graceMinutes < 0) {
      errors.push("graceMinutes cannot be negative");
    }

    if (
      schoolStart.valid &&
      schoolEnd.valid &&
      schoolStart.value >= schoolEnd.value
    ) {
      errors.push("schoolEndTime must be after schoolStartTime");
    }

    if (schoolStart.valid && closing.valid && closing.value <= schoolStart.value) {
      errors.push("attendanceClosingTime must be after schoolStartTime");
    }

    if (
      schoolStart.valid &&
      schoolEnd.valid &&
      halfDay.valid &&
      (halfDay.value <= schoolStart.value || halfDay.value >= schoolEnd.value)
    ) {
      errors.push("halfDayCheckoutTime must be between school start and end times");
    }

    const permissions = normalizePermissions(
      body.attendancePermissions ?? body.permissions
    );
    if (!permissions.classTeacher && !permissions.subjectTeacher) {
      errors.push("At least one of Class Teacher or Subject Teacher must be enabled");
    }
  } else {
    if (!Number.isFinite(minimumAttendance)) {
      minimumAttendance = DEFAULT_RULES.minimumAttendance;
    }
    if (!Number.isFinite(graceMinutes) || graceMinutes < 0) {
      graceMinutes = DEFAULT_RULES.graceMinutes;
    }
  }

  const attendancePermissions = normalizePermissions(
    body.attendancePermissions ?? body.permissions
  );
  const leaveApprovalRules = normalizeLeaveApproval(
    body.leaveApprovalRules ?? body.leaveRules
  );
  const leaveTypes = normalizeLeaveTypes(body.leaveTypes ?? body.leaveRules?.types);
  const parentNotificationRules = normalizeParentNotifications(
    body.parentNotificationRules ?? body.parentNotify
  );

  const dependencyStatus = computeAttendanceDependencyStatus(
    parentNotificationRules,
    minimumAttendance
  );
  const smartChecks = getAttendanceSmartChecks({
    attendanceMode,
    attendancePermissions,
    attendanceClosingTime: closing.valid ? closing.value : DEFAULT_TIMINGS.attendanceClosingTime,
  });

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      attendanceMode,
      workingDays,
      schoolStartTime: schoolStart.valid ? schoolStart.value : DEFAULT_TIMINGS.schoolStartTime,
      schoolEndTime: schoolEnd.valid ? schoolEnd.value : DEFAULT_TIMINGS.schoolEndTime,
      halfDayCheckoutTime: halfDay.valid ? halfDay.value : DEFAULT_TIMINGS.halfDayCheckoutTime,
      attendanceClosingTime: closing.valid
        ? closing.value
        : DEFAULT_TIMINGS.attendanceClosingTime,
      lateArrivalAfter: lateAfter.valid ? lateAfter.value : DEFAULT_RULES.lateArrivalAfter,
      autoAbsentAfter: autoAbsent.valid ? autoAbsent.value : DEFAULT_RULES.autoAbsentAfter,
      minimumAttendance: Math.round(minimumAttendance),
      graceMinutes: Math.round(graceMinutes),
      attendancePermissions,
      leaveApprovalRules,
      leaveTypes,
      parentNotificationRules,
      attendanceDependencyStatus: dependencyStatus,
      attendanceSmartChecks: smartChecks,
    },
  };
};

const mapWizardToStep8Response = (doc) => {
  if (!doc) return null;

  const attendanceMode = ATTENDANCE_MODES.includes(doc.attendanceMode)
    ? doc.attendanceMode
    : DEFAULT_ATTENDANCE_MODE;

  const workingDays = normalizeWorkingDays(doc.workingDays);
  const attendancePermissions = normalizePermissions(doc.attendancePermissions);
  const leaveApprovalRules = normalizeLeaveApproval(doc.leaveApprovalRules);
  const leaveTypes = normalizeLeaveTypes(doc.leaveTypes);
  const parentNotificationRules = normalizeParentNotifications(
    doc.parentNotificationRules
  );

  const minimumAttendance =
    doc.minimumAttendance ?? DEFAULT_RULES.minimumAttendance;

  const dependencyStatus =
    doc.attendanceDependencyStatus?.length > 0
      ? doc.attendanceDependencyStatus
      : computeAttendanceDependencyStatus(
          parentNotificationRules,
          minimumAttendance
        );

  const smartChecks =
    doc.attendanceSmartChecks?.length > 0
      ? doc.attendanceSmartChecks
      : getAttendanceSmartChecks({
          attendanceMode,
          attendancePermissions,
          attendanceClosingTime:
            doc.attendanceClosingTime || DEFAULT_TIMINGS.attendanceClosingTime,
        });

  return {
    attendanceMode,
    workingDays,
    schoolStartTime: doc.schoolStartTime || DEFAULT_TIMINGS.schoolStartTime,
    schoolEndTime: doc.schoolEndTime || DEFAULT_TIMINGS.schoolEndTime,
    halfDayCheckoutTime:
      doc.halfDayCheckoutTime || DEFAULT_TIMINGS.halfDayCheckoutTime,
    attendanceClosingTime:
      doc.attendanceClosingTime || DEFAULT_TIMINGS.attendanceClosingTime,
    lateArrivalAfter: doc.lateArrivalAfter || DEFAULT_RULES.lateArrivalAfter,
    autoAbsentAfter: doc.autoAbsentAfter || DEFAULT_RULES.autoAbsentAfter,
    minimumAttendance,
    graceMinutes: doc.graceMinutes ?? DEFAULT_RULES.graceMinutes,
    attendancePermissions,
    leaveApprovalRules,
    leaveTypes,
    parentNotificationRules,
    attendanceDependencyStatus: dependencyStatus,
    attendanceSmartChecks: smartChecks,
    recommendationText: getModeRecommendation(attendanceMode),
    attendanceModeLogic: resolveAttendanceModeLogic(attendanceMode),
    institutionType: doc.institutionType,
    enabledModules: doc.enabledModules || [],
    currentStep: doc.currentStep,
    progressPercentage: doc.progressPercentage,
  };
};

/**
 * PATCH helper: update a nested toggle group by section key.
 */
const applyTogglePatch = (doc, section, key, enabled) => {
  const value = enabled !== false;

  if (section === "attendancePermissions") {
    const current = normalizePermissions(doc.attendancePermissions);
    if (!Object.prototype.hasOwnProperty.call(current, key)) {
      return { ok: false, message: `Unknown permission key "${key}"` };
    }
    return {
      ok: true,
      update: {
        attendancePermissions: { ...current, [key]: value },
      },
    };
  }

  if (section === "parentNotificationRules") {
    const map = {
      absent: "absentAlert",
      absentAlert: "absentAlert",
      late: "lateArrivalAlert",
      lateArrivalAlert: "lateArrivalAlert",
      early: "earlyCheckoutAlert",
      earlyCheckoutAlert: "earlyCheckoutAlert",
      low: "lowAttendanceWarning",
      lowAttendanceWarning: "lowAttendanceWarning",
    };
    const field = map[key];
    if (!field) {
      return { ok: false, message: `Unknown notification key "${key}"` };
    }
    const current = normalizeParentNotifications(doc.parentNotificationRules);
    return {
      ok: true,
      update: {
        parentNotificationRules: { ...current, [field]: value },
      },
    };
  }

  return { ok: false, message: `Unknown section "${section}"` };
};

module.exports = {
  DEFAULT_ATTENDANCE_MODE,
  DEFAULT_TIMINGS,
  DEFAULT_RULES,
  DEFAULT_PERMISSIONS,
  DEFAULT_LEAVE_APPROVAL,
  DEFAULT_PARENT_NOTIFICATIONS,
  normalizeWorkingDays,
  normalizeLeaveTypes,
  normalizePermissions,
  normalizeParentNotifications,
  normalizeLeaveApproval,
  getModeRecommendation,
  computeAttendanceDependencyStatus,
  getAttendanceSmartChecks,
  resolveAttendanceModeLogic,
  validateStep8Payload,
  mapWizardToStep8Response,
  applyTogglePatch,
  timeToMinutes,
};
