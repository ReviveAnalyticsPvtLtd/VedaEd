import React from "react";
import SetupWizardLayout from "./components/SetupWizardLayout";
import SetupProgressBar from "./components/SetupProgressBar";
import SetupWizardFooter from "./components/SetupWizardFooter";
import { useSetupWizardStep11 } from "./hooks/useSetupWizardStep11";
import {
  TOTAL_STEPS,
  STEP_11_NUMBER,
  STEP_11_PROGRESS,
} from "./constants/setupWizard";
import { toastBannerClassName } from "../utils/toastMessageStyle";

// ── Data ───────────────────────────────────────────────────────────────────
const CHANNELS = [
  {
    key: "email",
    icon: "✉️",
    label: "Email",
    desc: "Send announcements, receipts, results, and official communication.",
  },
  {
    key: "sms",
    icon: "📱",
    label: "SMS",
    desc: "Fast alerts for attendance, fees, emergencies, and short notifications.",
  },
  {
    key: "whatsapp",
    icon: "💬",
    label: "WhatsApp",
    desc: "Parent-friendly alerts, reminders, updates, and broadcast messages.",
  },
  {
    key: "pushInApp",
    icon: "🔔",
    label: "Push / In-app",
    desc: "Portal and app notifications for parents, students, and teachers.",
  },
];

const TRIGGERS = [
  {
    key: "studentAbsent",
    label: "Student Absent",
    desc: "Notify parent when student is marked absent.",
  },
  {
    key: "feeDueReminder",
    label: "Fee Due Reminder",
    desc: "Notify parent before, on, and after the fee due date.",
  },
  {
    key: "examResultPublished",
    label: "Exam Result Published",
    desc: "Notify parents and students when results are released.",
  },
  {
    key: "homeworkPublished",
    label: "Homework / Assignment Published",
    desc: "Notify students and parents when teacher publishes homework.",
  },
  {
    key: "emergencyAlert",
    label: "Emergency Alert",
    desc: "Allow urgent broadcasts to all parents, staff, and students.",
  },
  {
    key: "transportUpdates",
    label: "Transport Updates",
    desc: "Notify parents about bus delays, route changes, or stop arrival.",
  },
];

const ANNOUNCEMENT_ROLES = [
  { key: "principal", label: "Principal" },
  { key: "schoolAdmin", label: "School Admin" },
  { key: "classTeacher", label: "Class Teacher" },
  { key: "subjectTeacher", label: "Subject Teacher" },
  { key: "transportManager", label: "Transport Manager" },
];

const MESSAGE_TEMPLATES = [
  {
    title: "Absent Alert",
    desc: "Used when a student is marked absent.",
    preview:
      "Dear Parent, {StudentName} was marked absent today. Please contact the class teacher if needed.",
  },
  {
    title: "Fee Reminder",
    desc: "Used before and after fee due date.",
    preview:
      "Dear Parent, fee payment for {StudentName} is due on {DueDate}. Amount: {Amount}.",
  },
  {
    title: "Result Published",
    desc: "Used when exam result is released.",
    preview:
      "Result for {ExamName} is now available in the parent/student portal.",
  },
  {
    title: "Emergency Alert",
    desc: "Used for urgent communication.",
    preview:
      "Important update from {SchoolName}: {Message}. Please check the portal for details.",
  },
];

const DOC_TEMPLATES = [
  {
    key: "idCardTemplate",
    label: "ID Card Template",
    options: [
      { value: "standard_school_id", label: "Standard School ID Card" },
      { value: "minimal_id", label: "Minimal ID Card" },
      { value: "custom_later", label: "Custom Later" },
    ],
  },
  {
    key: "feeReceiptTemplate",
    label: "Fee Receipt Template",
    options: [
      { value: "standard_receipt", label: "Standard Receipt" },
      { value: "detailed_receipt", label: "Detailed Receipt" },
      { value: "custom_later", label: "Custom Later" },
    ],
  },
  {
    key: "reportCardTemplate",
    label: "Report Card Template",
    options: [
      { value: "board_specific", label: "Board-specific Report Card" },
      { value: "simple_report_card", label: "Simple Report Card" },
      { value: "custom_later", label: "Custom Later" },
    ],
  },
  {
    key: "certificateTemplate",
    label: "Certificate Template",
    options: [
      { value: "standard_certificate", label: "Standard Certificate" },
      { value: "custom_later", label: "Custom Later" },
    ],
  },
];

// ── Toggle ─────────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
      checked ? "bg-setup-primary" : "bg-gray-200"
    }`}
    role="switch"
    aria-checked={checked}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

// ── Card ───────────────────────────────────────────────────────────────────
const Card = ({ title, desc, badge, badgeVariant = "required", children }) => {
  const badgeClass =
    badgeVariant === "recommended"
      ? "bg-green-100 text-green-700"
      : badgeVariant === "auto"
      ? "bg-blue-100 text-blue-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <div className="rounded-2xl border border-setup-border p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-setup-heading">{title}</h3>
          {desc && <p className="mt-0.5 text-sm text-setup-muted">{desc}</p>}
        </div>
        {badge && (
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
};

const InfoBox = ({ title, children, warning }) => (
  <div
    className={`rounded-xl border p-4 ${
      warning ? "border-yellow-300 bg-yellow-50" : "border-setup-border bg-gray-50"
    }`}
  >
    <h4 className="mb-1 text-sm font-semibold text-setup-heading">{title}</h4>
    <div className="text-sm text-setup-muted">{children}</div>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────
const Step11 = () => {
  const {
    form,
    loading,
    saving,
    toast,
    enabledChannelsCount,
    enabledTriggersCount,
    toggleChannel,
    toggleTrigger,
    togglePermission,
    updateDocTemplate,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  } = useSetupWizardStep11();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-setup-page">
        <p className="text-sm font-medium text-gray-500">Loading setup wizard...</p>
      </div>
    );
  }

  return (
    <SetupWizardLayout onSaveExit={handleSaveExit} saving={saving}>
      <SetupProgressBar
        step={STEP_11_NUMBER}
        total={TOTAL_STEPS}
        progress={STEP_11_PROGRESS}
        title="Communication & Templates"
      />

      {/* Section header */}
      <div className="border-b border-setup-border px-6 py-5 sm:px-8">
        <h1 className="text-xl font-bold text-setup-heading sm:text-2xl">
          Communication Foundation
        </h1>
        <p className="mt-1 text-sm text-setup-muted sm:text-[15px]">
          Configure communication rules and templates. Set up how parents, students,
          teachers, and admins receive alerts, announcements, fee reminders, attendance
          notifications, and report updates.
        </p>
      </div>

      {toast && (
        <div className="px-6 pt-4 sm:px-8">
          <p
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${toastBannerClassName(toast)}`}
          >
            {toast}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 px-6 py-6 sm:px-8 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6">

          {/* Communication Channels */}
          <Card
            title="Communication Channels"
            desc="Enable the channels your school will use. Channels can be configured with providers later."
            badge="Required"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CHANNELS.map((ch) => (
                <div
                  key={ch.key}
                  className={`flex items-start justify-between gap-3 rounded-xl border p-4 transition ${
                    form.communicationChannels[ch.key]
                      ? "border-setup-primary bg-blue-50"
                      : "border-setup-border bg-white"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{ch.icon}</span>
                      <p className="text-sm font-semibold text-setup-heading">{ch.label}</p>
                    </div>
                    <p className="mt-1 text-xs text-setup-muted">{ch.desc}</p>
                  </div>
                  <Toggle
                    checked={form.communicationChannels[ch.key]}
                    onChange={() => toggleChannel(ch.key)}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Notification Triggers */}
          <Card
            title="Notification Triggers"
            desc="Choose events that should automatically notify parents or users."
            badge="Recommended"
            badgeVariant="recommended"
          >
            <div className="space-y-3">
              {TRIGGERS.map((tr) => (
                <div
                  key={tr.key}
                  className={`flex items-start justify-between gap-4 rounded-xl border p-4 transition ${
                    form.notificationTriggers[tr.key]
                      ? "border-setup-primary bg-blue-50"
                      : "border-setup-border bg-white"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-setup-heading">{tr.label}</p>
                    <p className="mt-0.5 text-xs text-setup-muted">{tr.desc}</p>
                  </div>
                  <Toggle
                    checked={form.notificationTriggers[tr.key]}
                    onChange={() => toggleTrigger(tr.key)}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Who Can Send Announcements */}
          <Card
            title="Who Can Send Announcements?"
            desc="Control announcement permissions to avoid misuse."
            badge="Required"
          >
            <div className="flex flex-wrap gap-2">
              {ANNOUNCEMENT_ROLES.map((role) => (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => togglePermission(role.key)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    form.announcementPermissions[role.key]
                      ? "border-setup-primary bg-setup-primary text-white"
                      : "border-setup-border bg-white text-setup-heading hover:border-gray-300"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Message Templates */}
          <Card
            title="Message Templates"
            desc="VedaSchool will generate starter templates. You can edit all templates later."
            badge="Auto Generated"
            badgeVariant="auto"
          >
            <div className="space-y-3">
              {MESSAGE_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.title}
                  className="rounded-xl border border-setup-border bg-gray-50 p-4"
                >
                  <p className="text-sm font-semibold text-setup-heading">{tpl.title}</p>
                  <p className="mt-0.5 text-xs text-setup-muted">{tpl.desc}</p>
                  <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-gray-600 ring-1 ring-setup-border">
                    {tpl.preview}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Document Templates */}
          <Card
            title="Document Templates"
            desc="Prepare documents that will use school branding and communication details."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {DOC_TEMPLATES.map((dt) => (
                <div key={dt.key}>
                  <label className="mb-1.5 block text-sm font-semibold text-setup-heading">
                    {dt.label}
                  </label>
                  <select
                    value={form.documentTemplates[dt.key]}
                    onChange={(e) => updateDocTemplate(dt.key, e.target.value)}
                    className="w-full rounded-xl border border-setup-border px-3 py-2 text-sm text-setup-heading focus:border-setup-primary focus:outline-none focus:ring-1 focus:ring-setup-primary"
                  >
                    {dt.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="space-y-5">
          {/* Communication Summary */}
          <div className="rounded-2xl bg-gradient-to-br from-setup-primary to-indigo-700 p-6 text-white">
            <h3 className="mb-3 text-base font-semibold">Communication Summary</h3>
            <p className="mb-4 text-sm text-blue-100">
              Default channels and templates will be created during launch.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-blue-200">Channels Enabled:</span>
                <span className="font-medium">{enabledChannelsCount}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-blue-200">Auto Triggers:</span>
                <span className="font-medium">{enabledTriggersCount}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-blue-200">Templates:</span>
                <span className="font-medium">4 starter messages</span>
              </li>
              <li className="flex justify-between">
                <span className="text-blue-200">Documents:</span>
                <span className="font-medium">4 starter templates</span>
              </li>
            </ul>
          </div>

          {/* Dependency Impact */}
          <InfoBox title="Dependency Impact">
            <p className="mb-2 text-xs text-setup-muted">
              Communication connects these modules.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["Attendance", "Fees", "Exams", "Parent Portal"].map((m) => (
                <div
                  key={m}
                  className="rounded-lg border border-setup-border bg-white px-2 py-1.5 text-center text-xs font-medium text-setup-heading"
                >
                  {m}
                </div>
              ))}
            </div>
          </InfoBox>

          {/* Recommendation */}
          <InfoBox title="Recommendation">
            <p className="text-xs">
              Enable Email, SMS, WhatsApp, and Push for complete parent communication.
              Provider/API configuration can happen later.
            </p>
          </InfoBox>

          {/* Smart Check */}
          <InfoBox title="Smart Check" warning>
            <p className="text-xs text-yellow-800">
              Emergency alerts are enabled. Restrict emergency broadcast permission to
              Principal and Admin only.
            </p>
          </InfoBox>
        </div>
      </div>

      <SetupWizardFooter
        onBack={handleBack}
        onContinue={handleSaveContinue}
        saving={saving}
      />
    </SetupWizardLayout>
  );
};

export default Step11;
