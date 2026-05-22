import {
  ATTENDANCE_MODES,
  DEFAULT_STEP8_FORM,
  K12_RECOMMENDATION,
} from "../constants/attendanceRules";

const MIN_ATTENDANCE = 50;
const MAX_ATTENDANCE = 100;

export const mapWizardDataToStep8Form = (data = {}) => ({
  attendanceMode: data.attendanceMode || DEFAULT_STEP8_FORM.attendanceMode,
  workingDays: data.workingDays?.length
    ? data.workingDays
    : DEFAULT_STEP8_FORM.workingDays,
  schoolStartTime: data.schoolStartTime || DEFAULT_STEP8_FORM.schoolStartTime,
  schoolEndTime: data.schoolEndTime || DEFAULT_STEP8_FORM.schoolEndTime,
  halfDayCheckoutTime:
    data.halfDayCheckoutTime || DEFAULT_STEP8_FORM.halfDayCheckoutTime,
  attendanceClosingTime:
    data.attendanceClosingTime || DEFAULT_STEP8_FORM.attendanceClosingTime,
  lateArrivalAfter: data.lateArrivalAfter || DEFAULT_STEP8_FORM.lateArrivalAfter,
  autoAbsentAfter: data.autoAbsentAfter || DEFAULT_STEP8_FORM.autoAbsentAfter,
  minimumAttendance:
    data.minimumAttendance ?? DEFAULT_STEP8_FORM.minimumAttendance,
  graceMinutes: data.graceMinutes ?? DEFAULT_STEP8_FORM.graceMinutes,
  attendancePermissions: {
    ...DEFAULT_STEP8_FORM.attendancePermissions,
    ...(data.attendancePermissions || {}),
  },
  leaveApprovalRules: {
    ...DEFAULT_STEP8_FORM.leaveApprovalRules,
    ...(data.leaveApprovalRules || {}),
  },
  leaveTypes: data.leaveTypes?.length
    ? data.leaveTypes
    : DEFAULT_STEP8_FORM.leaveTypes,
  parentNotificationRules: {
    ...DEFAULT_STEP8_FORM.parentNotificationRules,
    ...(data.parentNotificationRules || {}),
  },
});

export const buildStep8Payload = (
  form,
  { advancing = false, draft = false, stepMeta } = {}
) => ({
  draft,
  attendanceMode: form.attendanceMode,
  workingDays: form.workingDays,
  schoolStartTime: form.schoolStartTime,
  schoolEndTime: form.schoolEndTime,
  halfDayCheckoutTime: form.halfDayCheckoutTime,
  attendanceClosingTime: form.attendanceClosingTime,
  lateArrivalAfter: form.lateArrivalAfter,
  autoAbsentAfter: form.autoAbsentAfter,
  minimumAttendance: Number(form.minimumAttendance),
  graceMinutes: Number(form.graceMinutes),
  attendancePermissions: form.attendancePermissions,
  leaveApprovalRules: form.leaveApprovalRules,
  leaveTypes: form.leaveTypes,
  parentNotificationRules: form.parentNotificationRules,
  currentStep: stepMeta?.currentStep ?? (advancing ? 9 : 8),
  progressPercentage: stepMeta?.progressPercentage ?? (advancing ? 80 : 72),
  completedSteps: advancing
    ? [1, 2, 3, 4, 5, 6, 7, 8]
    : [1, 2, 3, 4, 5, 6, 7],
});

export const getAttendanceSummary = (form) => ({
  mode: form.attendanceMode,
  timing: `${form.schoolStartTime} – ${form.schoolEndTime}`,
  lateAfter: form.lateArrivalAfter,
  minimumAttendance: `${form.minimumAttendance}%`,
});

export const getModeRecommendation = (mode, serverText) => {
  if (serverText) return serverText;
  if (mode === "Hybrid") return K12_RECOMMENDATION;
  const match = ATTENDANCE_MODES.find((m) => m.key === mode);
  return match?.recommendation || K12_RECOMMENDATION;
};

export const resolveAttendanceDependencyStatus = (
  serverStatus,
  parentNotificationRules,
  minimumAttendance
) => {
  if (serverStatus?.length) return serverStatus;

  const feeds = [];
  if (
    parentNotificationRules.absentAlert ||
    parentNotificationRules.lateArrivalAlert ||
    parentNotificationRules.earlyCheckoutAlert
  ) {
    feeds.push("Parent Portal");
  }
  if (minimumAttendance >= MIN_ATTENDANCE) feeds.push("Report Cards");
  feeds.push("Teacher Dashboard");
  if (parentNotificationRules.lowAttendanceWarning) {
    feeds.push("Low Attendance Alerts");
  }

  return [
    "Parent Portal",
    "Report Cards",
    "Teacher Dashboard",
    "Low Attendance Alerts",
  ].map((module) => ({
    module,
    status: feeds.includes(module) ? "Feeds" : "Depends",
  }));
};

export const validateStep8Form = (form) => {
  const errors = {};

  if (!form.workingDays?.length) {
    errors.workingDays = "Select at least one working day";
  }

  const minPct = Number(form.minimumAttendance);
  if (
    !Number.isFinite(minPct) ||
    minPct < MIN_ATTENDANCE ||
    minPct > MAX_ATTENDANCE
  ) {
    errors.minimumAttendance = `Enter a value between ${MIN_ATTENDANCE} and ${MAX_ATTENDANCE}`;
  }

  const grace = Number(form.graceMinutes);
  if (!Number.isFinite(grace) || grace < 0) {
    errors.graceMinutes = "Grace minutes cannot be negative";
  }

  if (form.schoolStartTime >= form.schoolEndTime) {
    errors.schoolEndTime = "End time must be after start time";
  }

  if (form.attendanceClosingTime <= form.schoolStartTime) {
    errors.attendanceClosingTime = "Closing time must be after school start";
  }

  if (
    form.halfDayCheckoutTime <= form.schoolStartTime ||
    form.halfDayCheckoutTime >= form.schoolEndTime
  ) {
    errors.halfDayCheckoutTime = "Half-day time must be between start and end";
  }

  const perms = form.attendancePermissions || {};
  if (!perms.classTeacher && !perms.subjectTeacher) {
    errors.attendancePermissions =
      "Enable Class Teacher or Subject Teacher to mark attendance";
  }

  if (!form.leaveTypes?.length) {
    errors.leaveTypes = "Select at least one leave type";
  }

  return errors;
};
