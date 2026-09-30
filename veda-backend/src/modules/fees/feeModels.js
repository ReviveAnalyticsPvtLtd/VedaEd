const mongoose = require("mongoose");

// ---------------------------------------------------------------------------
// OWNERSHIP MODEL
//
// AcademicYear is GLOBAL_REFERENCE. The academic-year *definitions* (2026-27,
// 2027-28, ...) are shared across every school, so this schema deliberately
// has no schoolId and must never grow one. Its write paths still need
// authorization in a later phase, because a global activate/update can affect
// all schools at once. See the Phase 1 report.
//
// Every other model in this file is TENANT_OWNED and carries schoolId using
// the project's established convention (identical to Student, Staff, Parent
// and the Communication models): required, indexed, and immutable so no later
// update path can move a record to another school. The value is assigned
// server-side from the authenticated session; it is never accepted from a
// request body.
//
// Legacy documents predate the declared field and have no schoolId. They are
// left untouched on purpose: ownership reconciliation for them is a separate,
// dry-run-first phase. They are not defaulted to any school here.
// ---------------------------------------------------------------------------

const termSchema = new mongoose.Schema({
  name: String,
  startDate: String,
  endDate: String,
  dueDate: String,
});

const academicYearSchema = new mongoose.Schema({
  label: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  isActive: { type: Boolean, default: false },
  terms: [termSchema],
}, { timestamps: true });

const AcademicYear = mongoose.model("AcademicYear", academicYearSchema);

// TENANT_OWNED
const feeCategorySchema = new mongoose.Schema({
  // Tenant ownership. Assigned server-side; never accepted from the client.
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
    index: true,
    immutable: true
  },
  name: { type: String, required: true },
  code: { type: String, required: true },
  desc: String,
  frequency: String,
  applicability: String,
  optional: { type: Boolean, default: false },
  partial: { type: Boolean, default: false },
  taxable: { type: Boolean, default: false },
  taxPercent: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  year: { type: String, required: true },
}, { timestamps: true });

const FeeCategory = mongoose.model("FeeCategory", feeCategorySchema);

// TENANT_OWNED
const gradeFeeSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
    index: true,
    immutable: true
  },
  year: { type: String, required: true },
  grade: { type: String, required: true },
  fees: { type: Map, of: Number, default: {} }
}, { timestamps: true });

const GradeFee = mongoose.model("GradeFee", gradeFeeSchema);

const sliceSchema = new mongoose.Schema({
  label: String,
  days: { type: Number, default: 0 },
  percent: { type: Number, default: 0 }
});

// TENANT_OWNED
const installmentPlanSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
    index: true,
    immutable: true
  },
  name: { type: String, required: true },
  category: { type: String, required: true },
  year: { type: String, required: true },
  slices: [sliceSchema]
}, { timestamps: true });

const InstallmentPlan = mongoose.model("InstallmentPlan", installmentPlanSchema);

// TENANT_OWNED
const lateFeePolicySchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
    index: true,
    immutable: true
  },
  category: { type: String, required: true },
  graceDays: { type: Number, default: 0 },
  type: String,
  amount: { type: Number, default: 0 },
  maxCap: { type: Number, default: 0 },
  compound: { type: Boolean, default: false },
  year: { type: String, required: true },
}, { timestamps: true });

const LateFeePolicy = mongoose.model("LateFeePolicy", lateFeePolicySchema);

// TENANT_OWNED
// NOTE: the audit proposed an index on `category`, but this schema has no
// singular `category` field. Discounting is scoped through the `categories`
// array, which the controller filters in application code
// (d.categories.includes(category)). The index below is built from fields that
// actually exist here. See the Phase 1 report, item 7.
const discountRuleSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
    index: true,
    immutable: true
  },
  name: { type: String, required: true },
  description: String,
  basis: String,
  type: String,
  value: { type: Number, default: 0 },
  maxCap: { type: Number, default: 0 },
  categories: [String],
  grades: [String],
  stackable: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  year: { type: String, required: true },
}, { timestamps: true });

const DiscountRule = mongoose.model("DiscountRule", discountRuleSchema);

// TENANT_OWNED
const fineSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
    index: true,
    immutable: true
  },
  name: { type: String, required: true },
  description: String,
  amount: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  year: { type: String, required: true },
}, { timestamps: true });

const Fine = mongoose.model("Fine", fineSchema);

// TENANT_OWNED
const feeTransactionSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
    index: true,
    immutable: true
  },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  year: { type: String, required: true },
  date: { type: Date, default: Date.now },
  fees: [{
    category: String,
    amount: Number,
  }],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, default: 'Cash' },
  status: { type: String, default: 'Paid' },
  remark: String
}, { timestamps: true });

const FeeTransaction = mongoose.model("FeeTransaction", feeTransactionSchema);

// TENANT_OWNED
const feeLedgerSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
    index: true,
    immutable: true
  },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  year: { type: String, required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['Debit', 'Credit'], required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeTransaction' },
  description: String
}, { timestamps: true });

const FeeLedger = mongoose.model("FeeLedger", feeLedgerSchema);

// TENANT_OWNED
const feeAuditLogSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
    index: true,
    immutable: true
  },
  action: { type: String, required: true },
  performedBy: { type: String, required: true },
  details: { type: String, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

const FeeAuditLog = mongoose.model("FeeAuditLog", feeAuditLogSchema);

// ---------------------------------------------------------------------------
// INDEXES
//
// Declared here, never created by hand in MongoDB. Every key below was checked
// against the real schema and against the query shapes in feeControllers.js
// before being added; each mirrors an index that already exists in the local
// database, so enabling them is idempotent and changes no existing data.
//
// FeeCategory / GradeFee / InstallmentPlan / LateFeePolicy / DiscountRule /
// Fine are listed and filtered by year (and grade / category / name).
// FeeTransaction and FeeLedger are looked up per student per year.
// FeeAuditLog is read newest-first for a single school.
// ---------------------------------------------------------------------------
feeCategorySchema.index({ schoolId: 1, name: 1, year: 1 });
gradeFeeSchema.index({ schoolId: 1, year: 1, grade: 1 });
installmentPlanSchema.index({ schoolId: 1, name: 1, year: 1 });
lateFeePolicySchema.index({ schoolId: 1, category: 1, year: 1 });
discountRuleSchema.index({ schoolId: 1, name: 1, year: 1 });
fineSchema.index({ schoolId: 1, name: 1, year: 1 });
feeTransactionSchema.index({ schoolId: 1, studentId: 1, year: 1 });
feeLedgerSchema.index({ schoolId: 1, studentId: 1, year: 1 });
feeAuditLogSchema.index({ schoolId: 1, date: -1 });

// AcademicYear intentionally has no tenant index: it is global reference data.

module.exports = {
  AcademicYear,
  FeeCategory,
  GradeFee,
  InstallmentPlan,
  LateFeePolicy,
  DiscountRule,
  Fine,
  FeeTransaction,
  FeeLedger,
  FeeAuditLog
};
