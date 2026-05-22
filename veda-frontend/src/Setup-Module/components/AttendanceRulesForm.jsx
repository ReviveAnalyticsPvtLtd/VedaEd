import React from "react";
import SetupStepHeader from "./SetupStepHeader";
import SetupFormSection from "./SetupFormSection";
import AttendanceModeCard from "./AttendanceModeCard";
import ModuleToggle from "./ModuleToggle";
import {
  ATTENDANCE_MODES,
  LEAVE_APPROVAL_OPTIONS,
  LEAVE_TYPES,
  PARENT_NOTIFICATION_TOGGLES,
  PERMISSION_TOGGLES,
  WORKING_DAYS,
} from "../constants/attendanceRules";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-setup-border px-4 py-2.5 text-sm text-setup-heading shadow-sm transition focus:border-setup-primary focus:outline-none focus:ring-2 focus:ring-setup-primary/20";

const selectClass = `${inputClass} bg-white`;

const fieldError = (errors, key) =>
  errors[key] ? (
    <p className="mt-1 text-xs font-medium text-red-600">{errors[key]}</p>
  ) : null;

const AttendanceRulesForm = ({
  form,
  errors,
  onFieldChange,
  onToggleWorkingDay,
  onToggleLeaveType,
  onTogglePermission,
  onToggleNotification,
}) => {
  return (
    <div className="space-y-6">
      <SetupStepHeader
        badge="Operational Rules"
        title="Configure attendance rules"
        description="Attendance rules define how students and staff are marked present, late, half-day, absent, and how parents are notified."
      />

      <SetupFormSection
        title="Attendance Mode"
        subtitle="Choose the attendance style used by your school."
        required
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {ATTENDANCE_MODES.map((mode) => (
            <AttendanceModeCard
              key={mode.key}
              mode={mode}
              selected={form.attendanceMode === mode.key}
              onSelect={() => onFieldChange("attendanceMode", mode.key)}
            />
          ))}
        </div>
      </SetupFormSection>

      <SetupFormSection
        title="Working Calendar"
        subtitle="Define school working days and default timings."
        required
      >
        <p className="mb-3 text-sm font-medium text-setup-heading">Working Days</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {WORKING_DAYS.map((day) => {
            const active = form.workingDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => onToggleWorkingDay(day)}
                className={`min-w-[3rem] rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-setup-primary bg-setup-primary text-white shadow-sm"
                    : "border-setup-border bg-white text-setup-heading hover:border-blue-300"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
        {fieldError(errors, "workingDays")}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-setup-heading">
              School Start Time
            </label>
            <input
              type="time"
              className={inputClass}
              value={form.schoolStartTime}
              onChange={(e) => onFieldChange("schoolStartTime", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-setup-heading">
              School End Time
            </label>
            <input
              type="time"
              className={inputClass}
              value={form.schoolEndTime}
              onChange={(e) => onFieldChange("schoolEndTime", e.target.value)}
            />
            {fieldError(errors, "schoolEndTime")}
          </div>
          <div>
            <label className="text-sm font-medium text-setup-heading">
              Half-day Checkout Time
            </label>
            <input
              type="time"
              className={inputClass}
              value={form.halfDayCheckoutTime}
              onChange={(e) =>
                onFieldChange("halfDayCheckoutTime", e.target.value)
              }
            />
            {fieldError(errors, "halfDayCheckoutTime")}
          </div>
          <div>
            <label className="text-sm font-medium text-setup-heading">
              Attendance Closing Time
            </label>
            <input
              type="time"
              className={inputClass}
              value={form.attendanceClosingTime}
              onChange={(e) =>
                onFieldChange("attendanceClosingTime", e.target.value)
              }
            />
            <p className="mt-1 text-xs text-setup-muted">
              After this, attendance edits require admin approval.
            </p>
            {fieldError(errors, "attendanceClosingTime")}
          </div>
        </div>
      </SetupFormSection>

      <SetupFormSection
        title="Late, Half-day & Absent Rules"
        subtitle="Set thresholds used by reports, parent alerts, and attendance analytics."
        badge="Recommended"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-setup-heading">
              Late Arrival After
            </label>
            <input
              type="time"
              className={inputClass}
              value={form.lateArrivalAfter}
              onChange={(e) => onFieldChange("lateArrivalAfter", e.target.value)}
            />
            <p className="mt-1 text-xs text-setup-muted">
              Students arriving after this time are marked late.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-setup-heading">
              Auto Absent After
            </label>
            <input
              type="time"
              className={inputClass}
              value={form.autoAbsentAfter}
              onChange={(e) => onFieldChange("autoAbsentAfter", e.target.value)}
            />
            <p className="mt-1 text-xs text-setup-muted">
              If not marked present by this time, mark absent automatically.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-setup-heading">
              Minimum Attendance %
            </label>
            <input
              type="number"
              min={50}
              max={100}
              className={inputClass}
              value={form.minimumAttendance}
              onChange={(e) =>
                onFieldChange("minimumAttendance", e.target.value)
              }
            />
            {fieldError(errors, "minimumAttendance")}
          </div>
          <div>
            <label className="text-sm font-medium text-setup-heading">
              Grace Minutes
            </label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.graceMinutes}
              onChange={(e) => onFieldChange("graceMinutes", e.target.value)}
            />
            <p className="mt-1 text-xs text-setup-muted">
              Optional buffer before late rule applies.
            </p>
            {fieldError(errors, "graceMinutes")}
          </div>
        </div>
      </SetupFormSection>

      <SetupFormSection
        title="Who Can Mark Attendance?"
        subtitle="Define responsibility and avoid unauthorized attendance changes."
        required
      >
        {fieldError(errors, "attendancePermissions")}
        <div className="space-y-3">
          {PERMISSION_TOGGLES.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 rounded-xl border border-setup-border px-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-setup-heading">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-setup-muted">{item.description}</p>
              </div>
              <ModuleToggle
                checked={form.attendancePermissions[item.key]}
                onChange={() => onTogglePermission(item.key)}
                ariaLabel={`Toggle ${item.title}`}
              />
            </div>
          ))}
        </div>
      </SetupFormSection>

      <SetupFormSection
        title="Leave & Approval Rules"
        subtitle="Configure student and staff leave workflows."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-setup-heading">
              Student Leave Approval
            </label>
            <select
              className={selectClass}
              value={form.leaveApprovalRules.studentLeaveApproval}
              onChange={(e) =>
                onFieldChange("leaveApprovalRules", {
                  ...form.leaveApprovalRules,
                  studentLeaveApproval: e.target.value,
                })
              }
            >
              {LEAVE_APPROVAL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-setup-heading">
              Staff Leave Approval
            </label>
            <select
              className={selectClass}
              value={form.leaveApprovalRules.staffLeaveApproval}
              onChange={(e) =>
                onFieldChange("leaveApprovalRules", {
                  ...form.leaveApprovalRules,
                  staffLeaveApproval: e.target.value,
                })
              }
            >
              {LEAVE_APPROVAL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mb-3 mt-5 text-sm font-medium text-setup-heading">Leave Types</p>
        <div className="flex flex-wrap gap-2">
          {LEAVE_TYPES.map((type) => {
            const active = form.leaveTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => onToggleLeaveType(type)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-setup-primary bg-setup-primary text-white"
                    : "border-setup-border bg-white text-setup-heading hover:border-blue-300"
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
        {fieldError(errors, "leaveTypes")}
      </SetupFormSection>

      <SetupFormSection
        title="Parent Notification Rules"
        subtitle="Choose which attendance events should notify parents."
        badge="Recommended"
      >
        <div className="space-y-3">
          {PARENT_NOTIFICATION_TOGGLES.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 rounded-xl border border-setup-border px-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-setup-heading">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-setup-muted">{item.description}</p>
              </div>
              <ModuleToggle
                checked={form.parentNotificationRules[item.key]}
                onChange={() => onToggleNotification(item.key, item.patchKey)}
                ariaLabel={`Toggle ${item.title}`}
              />
            </div>
          ))}
        </div>
      </SetupFormSection>
    </div>
  );
};

export default AttendanceRulesForm;
