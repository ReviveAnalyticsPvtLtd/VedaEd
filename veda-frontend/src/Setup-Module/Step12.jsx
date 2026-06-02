import React from "react";
import SetupWizardLayout from "./components/SetupWizardLayout";
import SetupProgressBar from "./components/SetupProgressBar";
import { useSetupWizardStep12 } from "./hooks/useSetupWizardStep12";
import {
  TOTAL_STEPS,
  STEP_12_NUMBER,
  STEP_12_PROGRESS,
} from "./constants/setupWizard";
import { toastBannerClassName } from "../utils/toastMessageStyle";

// ── Helpers ────────────────────────────────────────────────────────────────
const StatusBadge = ({ done, later }) => {
  if (later)
    return (
      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
        Later
      </span>
    );
  if (done)
    return (
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        Done
      </span>
    );
  return (
    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
      Pending
    </span>
  );
};

const AUTO_GEN_ITEMS = [
  {
    title: "Academic Foundation",
    desc: "Academic year, terms, grades, sections, streams, and subject structure.",
  },
  {
    title: "Roles & Permissions",
    desc: "Super Admin, Principal, Teacher, Student, Parent, Accountant, HR roles and permission matrix.",
  },
  {
    title: "Operations Framework",
    desc: "Attendance rules, exam framework, gradebook rules, promotion rules, and fee framework.",
  },
  {
    title: "Dashboards & Templates",
    desc: "Principal, teacher, parent, finance dashboards plus ID cards, receipts, report cards, message templates.",
  },
];

// ── Post-launch success overlay ────────────────────────────────────────────
const LaunchSuccessOverlay = ({ onOpenChecklist }) => (
  <div className="flex flex-col items-center justify-center px-6 py-16 text-center sm:px-10">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
      ✓
    </div>
    <h2 className="text-2xl font-bold text-setup-heading">Your school is ready</h2>
    <p className="mt-3 max-w-md text-sm text-setup-muted">
      VedaSchool has generated the approved configuration snapshot. Continue to the
      post-launch checklist to upload students, onboard teachers, and activate operations.
    </p>
    <button
      type="button"
      onClick={onOpenChecklist}
      className="mt-8 rounded-lg bg-setup-primary px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
    >
      Open Post-Launch Checklist
    </button>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────
const Step12 = () => {
  const {
    reviewData,
    loading,
    launching,
    launched,
    confirmed,
    setConfirmed,
    toast,
    handleLaunch,
    handleBack,
    handleOpenChecklist,
  } = useSetupWizardStep12();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-setup-page">
        <p className="text-sm font-medium text-gray-500">Loading setup review...</p>
      </div>
    );
  }

  const readiness = reviewData?.readinessScore ?? 0;
  const sectionsComplete = reviewData?.sectionsComplete ?? 0;
  const totalSections = reviewData?.totalSections ?? 0;
  const configSectionsComplete = reviewData?.configSectionsComplete ?? 0;
  const configSectionsTotal = reviewData?.configSectionsTotal ?? 0;
  const warnings = reviewData?.warnings ?? [];
  const blockingIssues = reviewData?.blockingIssues ?? 0;
  const blockingMessages = reviewData?.blockingMessages ?? [];
  const launchReady = reviewData?.launchReady ?? false;
  const launchStatusLabel = reviewData?.launchStatusLabel ?? "Review Warnings";
  const sections = reviewData?.sections ?? [];

  const healthSubtitle = launchReady
    ? "All mandatory areas are ready. Review warnings before launch."
    : blockingIssues
      ? "Resolve blocking issues before you can launch."
      : "Mandatory setup is in progress. Review warnings before launch.";

  return (
    <SetupWizardLayout onSaveExit={handleBack} saving={launching}>
      <SetupProgressBar
        step={STEP_12_NUMBER}
        total={TOTAL_STEPS}
        progress={STEP_12_PROGRESS}
        title="Review & Launch"
      />

      {/* Section header */}
      <div className="border-b border-setup-border px-6 py-5 sm:px-8">
        <h1 className="text-xl font-bold text-setup-heading sm:text-2xl">
          Ready for Launch
        </h1>
        <p className="mt-1 text-sm text-setup-muted sm:text-[15px]">
          Review your setup before launching school. VedaSchool will freeze this approved
          setup snapshot, generate required configuration, create templates, and open the
          post-launch checklist.
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

      {/* Show success overlay after launch */}
      {launched ? (
        <LaunchSuccessOverlay onOpenChecklist={handleOpenChecklist} />
      ) : (
        <div className="grid grid-cols-1 gap-8 px-6 py-6 sm:px-8 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-6">

            {/* Setup Health Check */}
            <div className="rounded-2xl border border-setup-border p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-setup-heading">
                    Setup Health Check
                  </h3>
                  <p className="mt-0.5 text-sm text-setup-muted">{healthSubtitle}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                    launchReady
                      ? "bg-green-100 text-green-700"
                      : blockingIssues
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {launchStatusLabel}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div
                  className={`rounded-xl p-4 text-center ${
                    readiness >= 80 ? "bg-green-50" : "bg-yellow-50"
                  }`}
                >
                  <p
                    className={`text-2xl font-bold ${
                      readiness >= 80 ? "text-green-700" : "text-yellow-700"
                    }`}
                  >
                    {readiness}%
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      readiness >= 80 ? "text-green-600" : "text-yellow-600"
                    }`}
                  >
                    Readiness Score
                  </p>
                  <p className="mt-1 text-[10px] text-setup-muted">
                    {configSectionsComplete}/{configSectionsTotal} config areas
                  </p>
                </div>
                <div className="rounded-xl bg-blue-50 p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">
                    {sectionsComplete}/{totalSections}
                  </p>
                  <p className="mt-1 text-xs text-blue-600">Wizard Steps Done</p>
                </div>
                <div className="rounded-xl bg-yellow-50 p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-700">{warnings.length}</p>
                  <p className="mt-1 text-xs text-yellow-600">Warnings</p>
                </div>
                <div
                  className={`rounded-xl p-4 text-center ${
                    blockingIssues ? "bg-red-50" : "bg-gray-50"
                  }`}
                >
                  <p
                    className={`text-2xl font-bold ${
                      blockingIssues ? "text-red-700" : "text-gray-700"
                    }`}
                  >
                    {blockingIssues}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      blockingIssues ? "text-red-600" : "text-gray-500"
                    }`}
                  >
                    Blocking Issues
                  </p>
                </div>
              </div>
            </div>

            {/* Configuration Review */}
            <div className="rounded-2xl border border-setup-border p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-setup-heading">
                    Configuration Review
                  </h3>
                  <p className="mt-0.5 text-sm text-setup-muted">
                    Summary of the approved setup draft.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                  Approved Draft
                </span>
              </div>
              <div className="space-y-3">
                {sections.map((sec) => (
                  <div
                    key={sec.key}
                    className="flex items-start justify-between gap-4 rounded-xl border border-setup-border p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-setup-heading">{sec.label}</p>
                      <p className="mt-0.5 text-xs text-setup-muted">{sec.desc}</p>
                    </div>
                    <StatusBadge done={sec.done} later={sec.later} />
                  </div>
                ))}
              </div>
            </div>

            {/* What VedaSchool Will Generate */}
            <div className="rounded-2xl border border-setup-border p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-setup-heading">
                    What VedaSchool Will Generate
                  </h3>
                  <p className="mt-0.5 text-sm text-setup-muted">
                    These records and frameworks will be created automatically after launch.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                  Auto Configuration
                </span>
              </div>
              <div className="space-y-3">
                {AUTO_GEN_ITEMS.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-xl border border-setup-border bg-gray-50 p-4"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                      ✓
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-setup-heading">{item.title}</p>
                      <p className="mt-0.5 text-xs text-setup-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {blockingMessages.length > 0 && (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-setup-heading">
                    Blocking Issues
                  </h3>
                  <span className="shrink-0 rounded-full bg-red-200 px-3 py-1 text-xs font-bold text-red-800">
                    {blockingIssues} Issue{blockingIssues !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="mb-3 text-xs text-red-700">
                  These must be resolved before launch.
                </p>
                <div className="space-y-2">
                  {blockingMessages.map((message) => (
                    <div
                      key={message}
                      className="flex items-start gap-2 rounded-lg border border-red-200 bg-white p-3"
                    >
                      <span className="mt-0.5 text-red-500">✕</span>
                      <p className="text-xs text-red-800">{message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-setup-heading">
                    Warnings Before Launch
                  </h3>
                  <span className="shrink-0 rounded-full bg-yellow-200 px-3 py-1 text-xs font-bold text-yellow-800">
                    {warnings.length} Warning{warnings.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="mb-3 text-xs text-yellow-700">
                  Warnings do not block launch, but should be reviewed.
                </p>
                <div className="space-y-2">
                  {warnings.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-white p-3"
                    >
                      <span className="mt-0.5 text-yellow-500">⚠</span>
                      <p className="text-xs text-yellow-800">{w}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Launch Confirmation */}
            <div className="rounded-2xl border border-setup-border p-5">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-setup-heading">
                  Launch Confirmation
                </h3>
                <p className="mt-0.5 text-sm text-setup-muted">
                  This action will freeze the approved setup draft and create the school
                  configuration snapshot.
                </p>
              </div>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-setup-primary focus:ring-setup-primary"
                />
                <div>
                  <p className="text-sm font-semibold text-setup-heading">
                    I confirm this setup is ready to launch.
                  </p>
                  <p className="mt-0.5 text-xs text-setup-muted">
                    I understand critical changes after launch may require versioning,
                    impact review, or audit logs.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-5">
            {/* School Readiness */}
            <div className="rounded-2xl bg-gradient-to-br from-setup-primary to-indigo-700 p-6 text-white">
              <h3 className="mb-3 text-base font-semibold">School Readiness</h3>
              <div className="mb-4 text-center">
                <p className="text-4xl font-bold">{readiness}%</p>
                <p className="mt-1 text-sm font-semibold text-blue-200">
                  {launchReady ? "READY" : blockingIssues ? "BLOCKED" : "IN PROGRESS"}
                </p>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className={launchReady ? "text-green-300" : "text-yellow-300"}>
                    {launchReady ? "✓" : "○"}
                  </span>
                  <span className="text-blue-100">
                    {configSectionsComplete}/{configSectionsTotal} mandatory config areas
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={blockingIssues ? "text-red-300" : "text-green-300"}>
                    {blockingIssues ? "✕" : "✓"}
                  </span>
                  <span className="text-blue-100">
                    {blockingIssues
                      ? `${blockingIssues} blocking issue(s)`
                      : "No blocking dependencies"}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">⚠</span>
                  <span className="text-blue-100">
                    {warnings.length} warning{warnings.length !== 1 ? "s" : ""}{" "}
                    {blockingIssues ? "after blockers are fixed" : "can be handled later"}
                  </span>
                </li>
              </ul>
            </div>

            {/* Next After Launch */}
            <div className="rounded-xl border border-setup-border bg-gray-50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-setup-heading">
                Next After Launch
              </h4>
              <p className="text-xs text-setup-muted">
                VedaSchool will open the post-launch checklist: upload students, onboard
                teachers, map subjects, create timetable, start admissions, and activate
                parent portal.
              </p>
            </div>

            {/* Audit Snapshot */}
            <div className="rounded-xl border border-setup-border bg-gray-50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-setup-heading">
                Audit Snapshot
              </h4>
              <ul className="space-y-1.5 text-xs text-setup-muted">
                <li className="flex items-start gap-1.5">
                  <span className="mt-0.5 text-setup-primary">•</span>
                  Setup draft will be locked as Launch Snapshot V1.
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="mt-0.5 text-setup-primary">•</span>
                  Accepted recommendations will be recorded.
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="mt-0.5 text-setup-primary">•</span>
                  Future critical edits will use versioning.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Footer — only show when not yet launched */}
      {!launched && (
        <div className="flex flex-col-reverse gap-3 border-t border-setup-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
          <button
            type="button"
            onClick={handleBack}
            disabled={launching}
            className="w-full rounded-lg border border-setup-border bg-white px-8 py-3 text-sm font-semibold text-setup-heading shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleLaunch}
            disabled={launching || !confirmed || blockingIssues > 0}
            className="w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:from-green-700 hover:to-emerald-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {launching ? "Launching..." : "🚀 Launch School"}
          </button>
        </div>
      )}
    </SetupWizardLayout>
  );
};

export default Step12;
