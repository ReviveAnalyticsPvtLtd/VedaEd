import React from "react";
import SetupWizardLayout from "./components/SetupWizardLayout";
import SetupProgressBar from "./components/SetupProgressBar";
import SetupWizardFooter from "./components/SetupWizardFooter";
import { useSetupWizardStep10 } from "./hooks/useSetupWizardStep10";
import {
  TOTAL_STEPS,
  STEP_10_NUMBER,
  STEP_10_PROGRESS,
} from "./constants/setupWizard";
import { toastBannerClassName } from "../utils/toastMessageStyle";

// ── Frequency options ──────────────────────────────────────────────────────
const FREQUENCY_OPTIONS = [
  {
    key: "monthly",
    label: "Monthly",
    desc: "Collect fees every month with recurring due reminders.",
  },
  {
    key: "quarterly",
    label: "Quarterly",
    desc: "Recommended for most schools. Four installments per year.",
    recommended: true,
  },
  {
    key: "term_wise",
    label: "Term-wise",
    desc: "Collect fees aligned to academic terms or semesters.",
  },
  {
    key: "annual",
    label: "Annual",
    desc: "One-time annual fee collection with optional discounts.",
  },
];

const LATE_FEE_TYPES = [
  { value: "fixed_amount", label: "Fixed Amount" },
  { value: "daily_penalty", label: "Daily Penalty" },
  { value: "percentage_penalty", label: "Percentage Penalty" },
  { value: "no_late_fee", label: "No Late Fee" },
];

const PARTIAL_PAYMENT_OPTIONS = [
  { value: "allow", label: "Allow Partial Payment" },
  { value: "do_not_allow", label: "Do Not Allow" },
  { value: "allow_with_approval", label: "Allow with Approval" },
];

const REFUND_POLICY_OPTIONS = [
  { value: "manual_refund_approval", label: "Manual Refund Approval" },
  { value: "no_refund", label: "No Refund" },
  { value: "auto_refund_rules", label: "Auto Refund Rules" },
];

const PAYMENT_MODE_OPTIONS = [
  { value: "online_offline", label: "Online + Offline" },
  { value: "online_only", label: "Online Only" },
  { value: "offline_only", label: "Offline Only" },
];

const DISCOUNT_OPTIONS = [
  {
    key: "siblingDiscount",
    label: "Sibling Discount",
    desc: "Apply concession for siblings studying in the same school.",
  },
  {
    key: "meritScholarship",
    label: "Merit Scholarship",
    desc: "Allow scholarship assignment based on academic performance.",
  },
  {
    key: "needBasedConcession",
    label: "Need-based Concession",
    desc: "Allow financial concession with approval and audit trail.",
  },
  {
    key: "staffChildDiscount",
    label: "Staff Child Discount",
    desc: "Apply staff-dependent fee concession rules.",
  },
];

const REMINDER_OPTIONS = [
  { key: "beforeDueDate", label: "Before Due Date" },
  { key: "onDueDate", label: "On Due Date" },
  { key: "afterDueDate", label: "After Due Date" },
  { key: "lowBalanceReminder", label: "Low Balance Reminder" },
  { key: "scholarshipApprovalAlert", label: "Scholarship Approval Alert" },
];

// ── Toggle component ───────────────────────────────────────────────────────
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

// ── Card wrapper ───────────────────────────────────────────────────────────
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

// ── Sidebar info box ───────────────────────────────────────────────────────
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
const Step10 = () => {
  const {
    form,
    loading,
    saving,
    toast,
    updateField,
    updateDiscount,
    updateReminder,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  } = useSetupWizardStep10();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-setup-page">
        <p className="text-sm font-medium text-gray-500">Loading setup wizard...</p>
      </div>
    );
  }

  const freqLabel =
    FREQUENCY_OPTIONS.find((f) => f.key === form.feeCollectionFrequency)?.label || "Quarterly";
  const lateFeeLabel =
    LATE_FEE_TYPES.find((t) => t.value === form.lateFeeType)?.label || "Fixed Amount";
  const enabledDiscounts = Object.values(form.discounts).filter(Boolean).length;

  return (
    <SetupWizardLayout onSaveExit={handleSaveExit} saving={saving}>
      <SetupProgressBar
        step={STEP_10_NUMBER}
        total={TOTAL_STEPS}
        progress={STEP_10_PROGRESS}
        title="Fee Setup"
      />

      {/* Section header */}
      <div className="border-b border-setup-border px-6 py-5 sm:px-8">
        <h1 className="text-xl font-bold text-setup-heading sm:text-2xl">
          Finance Foundation
        </h1>
        <p className="mt-1 text-sm text-setup-muted sm:text-[15px]">
          Configure your school fee structure. Set up fee categories, collection
          frequency, discounts, scholarships, late fees, reminders, and payment
          rules for standard school operations.
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

          {/* Fee Collection Frequency */}
          <Card
            title="Fee Collection Frequency"
            desc="Select the default collection cycle. You can customize fee plans later by grade or student type."
            badge="Required"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => updateField("feeCollectionFrequency", opt.key)}
                  className={`relative rounded-xl border p-4 text-left transition ${
                    form.feeCollectionFrequency === opt.key
                      ? "border-setup-primary bg-blue-50 ring-1 ring-setup-primary"
                      : "border-setup-border bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {opt.recommended && (
                    <span className="absolute right-3 top-3 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                      Recommended
                    </span>
                  )}
                  <p className="font-semibold text-setup-heading">{opt.label}</p>
                  <p className="mt-1 text-xs text-setup-muted">{opt.desc}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Fee Categories */}
          <Card
            title="Fee Categories"
            desc="Default categories will be created during launch. Amounts can be configured later by grade."
            badge="Required"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-setup-border text-left text-xs font-semibold uppercase text-setup-muted">
                    <th className="pb-2 pr-4">Category</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Applies To</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-setup-border">
                  {form.feeCategories.map((cat, idx) => (
                    <tr key={idx} className="text-setup-heading">
                      <td className="py-2.5 pr-4 font-medium">{cat.name}</td>
                      <td className="py-2.5 pr-4">
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {cat.type}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-setup-muted">{cat.appliesTo}</td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            cat.status === "Required"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {cat.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Discounts & Scholarships */}
          <Card
            title="Discounts & Scholarships"
            desc="Enable common concession rules. Approval workflow can be configured later."
            badge="Recommended"
            badgeVariant="recommended"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {DISCOUNT_OPTIONS.map((opt) => (
                <div
                  key={opt.key}
                  className={`flex items-start justify-between gap-3 rounded-xl border p-4 transition ${
                    form.discounts[opt.key]
                      ? "border-setup-primary bg-blue-50"
                      : "border-setup-border bg-white"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-setup-heading">{opt.label}</p>
                    <p className="mt-0.5 text-xs text-setup-muted">{opt.desc}</p>
                  </div>
                  <Toggle
                    checked={form.discounts[opt.key]}
                    onChange={() => updateDiscount(opt.key, !form.discounts[opt.key])}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Late Fee & Payment Rules */}
          <Card
            title="Late Fee & Payment Rules"
            desc="Define late payment behavior and partial payment permissions."
            badge="Required"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Late Fee Type */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-setup-heading">
                  Late Fee Type
                </label>
                <select
                  value={form.lateFeeType}
                  onChange={(e) => updateField("lateFeeType", e.target.value)}
                  className="w-full rounded-xl border border-setup-border px-3 py-2 text-sm text-setup-heading focus:border-setup-primary focus:outline-none focus:ring-1 focus:ring-setup-primary"
                >
                  {LATE_FEE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Late Fee Value */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-setup-heading">
                  Late Fee Value
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.lateFeeValue}
                  onChange={(e) => updateField("lateFeeValue", Number(e.target.value))}
                  className="w-full rounded-xl border border-setup-border px-3 py-2 text-sm text-setup-heading focus:border-setup-primary focus:outline-none focus:ring-1 focus:ring-setup-primary"
                  placeholder="e.g. 100"
                />
              </div>

              {/* Grace Days */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-setup-heading">
                  Grace Days
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.graceDays}
                  onChange={(e) => updateField("graceDays", Number(e.target.value))}
                  className="w-full rounded-xl border border-setup-border px-3 py-2 text-sm text-setup-heading focus:border-setup-primary focus:outline-none focus:ring-1 focus:ring-setup-primary"
                  placeholder="e.g. 7"
                />
              </div>

              {/* Partial Payment */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-setup-heading">
                  Partial Payment
                </label>
                <select
                  value={form.partialPayment}
                  onChange={(e) => updateField("partialPayment", e.target.value)}
                  className="w-full rounded-xl border border-setup-border px-3 py-2 text-sm text-setup-heading focus:border-setup-primary focus:outline-none focus:ring-1 focus:ring-setup-primary"
                >
                  {PARTIAL_PAYMENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Refund Policy */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-setup-heading">
                  Refund Policy
                </label>
                <select
                  value={form.refundPolicy}
                  onChange={(e) => updateField("refundPolicy", e.target.value)}
                  className="w-full rounded-xl border border-setup-border px-3 py-2 text-sm text-setup-heading focus:border-setup-primary focus:outline-none focus:ring-1 focus:ring-setup-primary"
                >
                  {REFUND_POLICY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Modes */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-setup-heading">
                  Payment Modes
                </label>
                <select
                  value={form.paymentModes}
                  onChange={(e) => updateField("paymentModes", e.target.value)}
                  className="w-full rounded-xl border border-setup-border px-3 py-2 text-sm text-setup-heading focus:border-setup-primary focus:outline-none focus:ring-1 focus:ring-setup-primary"
                >
                  {PAYMENT_MODE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Fee Reminders */}
          <Card
            title="Fee Reminders"
            desc="Choose which reminders should be generated automatically."
            badge="Recommended"
            badgeVariant="recommended"
          >
            <div className="space-y-3">
              {REMINDER_OPTIONS.map((opt) => (
                <div key={opt.key} className="flex items-center justify-between">
                  <span className="text-sm text-setup-heading">{opt.label}</span>
                  <Toggle
                    checked={form.feeReminders[opt.key]}
                    onChange={() => updateReminder(opt.key, !form.feeReminders[opt.key])}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="space-y-5">
          {/* Fee Summary */}
          <div className="rounded-2xl bg-gradient-to-br from-setup-primary to-indigo-700 p-6 text-white">
            <h3 className="mb-3 text-base font-semibold">Fee Summary</h3>
            <p className="mb-4 text-sm text-blue-100">
              Standard school fee engine with {freqLabel.toLowerCase()} collection is being prepared.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-blue-200">Frequency:</span>
                <span className="font-medium">{freqLabel}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-blue-200">Categories:</span>
                <span className="font-medium">{form.feeCategories.length} default</span>
              </li>
              <li className="flex justify-between">
                <span className="text-blue-200">Late Fee:</span>
                <span className="font-medium">
                  {lateFeeLabel}
                  {form.lateFeeType !== "no_late_fee" && form.lateFeeValue
                    ? ` ₹${form.lateFeeValue}`
                    : ""}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-blue-200">Grace Days:</span>
                <span className="font-medium">{form.graceDays}</span>
              </li>
            </ul>
          </div>

          {/* Dependency Impact */}
          <InfoBox title="Dependency Impact">
            <p className="mb-2 text-xs text-setup-muted">
              Fee setup connects to these modules.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["Admissions", "Parent Portal", "Receipts", "Finance Dashboard"].map((m) => (
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
              Use quarterly fee collection with tuition, admission, exam, transport, and
              activity fee categories.
            </p>
          </InfoBox>

          {/* Smart Check */}
          <InfoBox title="Smart Check" warning>
            <p className="text-xs text-yellow-800">
              Once invoices are generated, fee structure changes should create a new version
              instead of overwriting existing invoices.
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

export default Step10;
