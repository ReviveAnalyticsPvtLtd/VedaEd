const mongoose = require("mongoose");

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

const feeCategorySchema = new mongoose.Schema({
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

const gradeFeeSchema = new mongoose.Schema({
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

const installmentPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  year: { type: String, required: true },
  slices: [sliceSchema]
}, { timestamps: true });

const InstallmentPlan = mongoose.model("InstallmentPlan", installmentPlanSchema);

const lateFeePolicySchema = new mongoose.Schema({
  category: { type: String, required: true },
  graceDays: { type: Number, default: 0 },
  type: String,
  amount: { type: Number, default: 0 },
  maxCap: { type: Number, default: 0 },
  compound: { type: Boolean, default: false },
  year: { type: String, required: true },
}, { timestamps: true });

const LateFeePolicy = mongoose.model("LateFeePolicy", lateFeePolicySchema);

const discountRuleSchema = new mongoose.Schema({
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

const fineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  amount: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  year: { type: String, required: true },
}, { timestamps: true });

const Fine = mongoose.model("Fine", fineSchema);

const feeTransactionSchema = new mongoose.Schema({
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

const feeLedgerSchema = new mongoose.Schema({
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

const feeAuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: String, required: true },
  details: { type: String, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

const FeeAuditLog = mongoose.model("FeeAuditLog", feeAuditLogSchema);

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
