import { FiCalendar, FiClock, FiRefreshCw } from "react-icons/fi";

export const ATTENDANCE_MODES = [
  {
    key: "Daily",
    icon: FiCalendar,
    title: "Daily Attendance",
    description:
      "Mark attendance once per day. Best for primary and simple school operations.",
    recommendation:
      "Daily attendance is ideal for lower grades.",
  },
  {
    key: "Period-wise",
    icon: FiClock,
    title: "Period-wise",
    description:
      "Mark attendance by class period. Best for higher grades and subject teachers.",
    recommendation:
      "Ensure timetable and subject teachers are mapped before go-live.",
  },
  {
    key: "Hybrid",
    icon: FiRefreshCw,
    title: "Hybrid",
    description:
      "Use daily attendance for lower grades and period-wise attendance for higher grades.",
    recommendation:
      "Hybrid attendance is recommended for K12 schools with higher grades.",
  },
];

export const WORKING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const LEAVE_APPROVAL_OPTIONS = [
  "Class Teacher Approval",
  "Principal Approval",
  "HR Approval",
  "Auto Approval",
];

export const LEAVE_TYPES = [
  "Sick Leave",
  "Casual Leave",
  "Medical Leave",
  "Emergency Leave",
  "Half Day",
];

export const PERMISSION_TOGGLES = [
  {
    key: "classTeacher",
    title: "Class Teacher",
    description: "Can mark daily attendance for assigned class/section.",
  },
  {
    key: "subjectTeacher",
    title: "Subject Teacher",
    description: "Can mark period-wise attendance for assigned subjects.",
  },
  {
    key: "adminOverride",
    title: "Admin Override",
    description: "Admin can correct attendance with audit log.",
  },
  {
    key: "biometric",
    title: "Biometric / Device Sync",
    description:
      "Allow attendance import from biometric or RFID devices later.",
  },
];

export const PARENT_NOTIFICATION_TOGGLES = [
  {
    key: "absentAlert",
    title: "Absent Alert",
    description: "Notify parent when student is marked absent.",
    patchKey: "absentAlert",
  },
  {
    key: "lateArrivalAlert",
    title: "Late Arrival Alert",
    description: "Notify parent when student arrives late.",
    patchKey: "lateArrivalAlert",
  },
  {
    key: "earlyCheckoutAlert",
    title: "Early Checkout Alert",
    description: "Notify parent when student leaves before school end time.",
    patchKey: "earlyCheckoutAlert",
  },
  {
    key: "lowAttendanceWarning",
    title: "Low Attendance Warning",
    description:
      "Notify when student attendance falls below minimum threshold.",
    patchKey: "lowAttendanceWarning",
  },
];

export const DEFAULT_STEP8_FORM = {
  attendanceMode: "Hybrid",
  workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  schoolStartTime: "08:00",
  schoolEndTime: "14:30",
  halfDayCheckoutTime: "11:30",
  attendanceClosingTime: "09:30",
  lateArrivalAfter: "08:15",
  autoAbsentAfter: "10:00",
  minimumAttendance: 75,
  graceMinutes: 10,
  attendancePermissions: {
    classTeacher: true,
    subjectTeacher: true,
    adminOverride: true,
    biometric: false,
  },
  leaveApprovalRules: {
    studentLeaveApproval: "Class Teacher Approval",
    staffLeaveApproval: "Principal Approval",
  },
  leaveTypes: ["Sick Leave", "Casual Leave", "Medical Leave"],
  parentNotificationRules: {
    absentAlert: true,
    lateArrivalAlert: true,
    earlyCheckoutAlert: true,
    lowAttendanceWarning: true,
  },
};

export const K12_RECOMMENDATION =
  "For K12, use hybrid attendance: daily for lower grades and period-wise for higher grades.";
