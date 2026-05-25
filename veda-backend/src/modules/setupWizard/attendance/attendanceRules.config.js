const ATTENDANCE_MODES = ["Daily", "Period-wise", "Hybrid"];

const WORKING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEFAULT_WORKING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LEAVE_APPROVAL_OPTIONS = [
  "Class Teacher Approval",
  "Principal Approval",
  "HR Approval",
  "Auto Approval",
];

const LEAVE_TYPES = [
  "Sick Leave",
  "Casual Leave",
  "Medical Leave",
  "Emergency Leave",
  "Half Day",
];

const DEFAULT_LEAVE_TYPES = ["Sick Leave", "Casual Leave", "Medical Leave"];

const ATTENDANCE_DEPENDENCY_ITEMS = [
  "Parent Portal",
  "Report Cards",
  "Teacher Dashboard",
  "Low Attendance Alerts",
];

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const MIN_ATTENDANCE_MIN = 50;
const MIN_ATTENDANCE_MAX = 100;

module.exports = {
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
};
