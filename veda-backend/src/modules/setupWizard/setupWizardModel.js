const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const setupWizardSchema = new mongoose.Schema(
  {
    setupId: {
      type: String,
      default: () => randomUUID(),
      unique: true,
    },
    selectedSetupType: {
      type: String,
      enum: ["quick", "advanced", "import"],
      default: "quick",
    },
    organizationType: {
      type: String,
      enum: ["single_school", "multi_campus", "school_group"],
      default: null,
    },
    schoolName: { type: String, default: "" },
    schoolCode: { type: String, default: "" },
    establishedYear: { type: String, default: "" },
    website: { type: String, default: "" },
    schoolLogo: { type: String, default: "" },
    logoFrameShape: {
      type: String,
      enum: ["square", "rounded-square", "circle", "flexible"],
      default: "rounded-square",
    },
    primaryThemeColor: { type: String, default: "#2563EB" },
    address: { type: String, default: "" },
    country: { type: String, default: "" },
    institutionType: {
      type: String,
      enum: ["preschool", "k12_school", "higher_secondary"],
      default: null,
    },
    curriculumCountry: { type: String, default: "" },
    curriculumBoard: { type: String, default: "" },
    gradeFrom: { type: String, default: "" },
    gradeTo: { type: String, default: "" },
    languagePreference: {
      type: String,
      enum: ["english", "hindi", "regional", "other"],
      default: "english",
    },
    recommendationType: { type: String, default: "" },
    recommendationConfidence: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    recommendationRules: {
      type: [String],
      default: [],
    },
    state: { type: String, default: "" },
    city: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    timezone: { type: String, default: "" },
    currency: { type: String, default: "" },
    officialEmail: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    supportEmail: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },
    currentStep: {
      type: Number,
      min: 1,
      max: 13,
      default: 1,
    },
    completedSteps: {
      type: [Number],
      default: [],
    },
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    setupStatus: {
      type: String,
      enum: ["draft", "completed"],
      default: "draft",
    },

    // ── Step 10: Fee Setup ──────────────────────────────────────────────
    feeCollectionFrequency: {
      type: String,
      enum: ["monthly", "quarterly", "term_wise", "annual"],
      default: "quarterly",
    },
    feeCategories: {
      type: [
        {
          name: { type: String, default: "" },
          type: { type: String, default: "" },
          appliesTo: { type: String, default: "" },
          status: { type: String, default: "" },
        },
      ],
      default: [],
    },
    discounts: {
      siblingDiscount: { type: Boolean, default: false },
      meritScholarship: { type: Boolean, default: false },
      needBasedConcession: { type: Boolean, default: false },
      staffChildDiscount: { type: Boolean, default: false },
    },
    lateFeeType: {
      type: String,
      enum: ["fixed_amount", "daily_penalty", "percentage_penalty", "no_late_fee"],
      default: "fixed_amount",
    },
    lateFeeValue: { type: Number, default: 100 },
    graceDays: { type: Number, default: 7 },
    partialPayment: {
      type: String,
      enum: ["allow", "do_not_allow", "allow_with_approval"],
      default: "allow",
    },
    refundPolicy: {
      type: String,
      enum: ["manual_refund_approval", "no_refund", "auto_refund_rules"],
      default: "manual_refund_approval",
    },
    paymentModes: {
      type: String,
      enum: ["online_offline", "online_only", "offline_only"],
      default: "online_offline",
    },
    feeReminders: {
      beforeDueDate: { type: Boolean, default: true },
      onDueDate: { type: Boolean, default: true },
      afterDueDate: { type: Boolean, default: true },
      lowBalanceReminder: { type: Boolean, default: false },
      scholarshipApprovalAlert: { type: Boolean, default: false },
    },

    // ── Step 11: Communication Setup ────────────────────────────────────
    communicationChannels: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true },
      pushInApp: { type: Boolean, default: true },
    },
    notificationTriggers: {
      studentAbsent: { type: Boolean, default: true },
      feeDueReminder: { type: Boolean, default: true },
      examResultPublished: { type: Boolean, default: true },
      homeworkPublished: { type: Boolean, default: false },
      emergencyAlert: { type: Boolean, default: true },
      transportUpdates: { type: Boolean, default: false },
    },
    announcementPermissions: {
      principal: { type: Boolean, default: true },
      schoolAdmin: { type: Boolean, default: true },
      classTeacher: { type: Boolean, default: false },
      subjectTeacher: { type: Boolean, default: false },
      transportManager: { type: Boolean, default: false },
    },
    documentTemplates: {
      idCardTemplate: { type: String, default: "standard" },
      feeReceiptTemplate: { type: String, default: "standard" },
      reportCardTemplate: { type: String, default: "board_specific" },
      certificateTemplate: { type: String, default: "standard" },
    },

    // ── Step 12: Review & Launch ─────────────────────────────────────────
    launchConfirmed: { type: Boolean, default: false },
    launchSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    launchedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SetupWizard", setupWizardSchema);
