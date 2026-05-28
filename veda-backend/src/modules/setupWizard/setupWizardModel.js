const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const step9GradeRowSchema = new mongoose.Schema(
  {
    rowId: {
      type: String,
      default: () => randomUUID(),
    },
    grade: { type: String, default: "" },
    minPercentage: { type: Number, min: 0, max: 100, default: 0 },
    maxPercentage: { type: Number, min: 0, max: 100, default: 0 },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const step9WeightageRowSchema = new mongoose.Schema(
  {
    rowId: {
      type: String,
      default: () => randomUUID(),
    },
    assessmentName: { type: String, default: "" },
    weightValue: { type: Number, min: 0, max: 100, default: 0 },
    weightType: { type: String, default: "% Weight" },
  },
  { _id: false }
);

const step9DependencyStatusSchema = new mongoose.Schema(
  {
    module: { type: String, default: "" },
    status: { type: String, default: "Feeds" },
  },
  { _id: false }
);

const step9AuditLogSchema = new mongoose.Schema(
  {
    logId: { type: String, default: () => randomUUID() },
    action: { type: String, default: "" },
    message: { type: String, default: "" },
    versionNumber: { type: Number, default: 1 },
    actor: { type: String, default: "system" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const step9VersionSnapshotSchema = new mongoose.Schema(
  {
    versionId: { type: String, default: () => randomUUID() },
    versionNumber: { type: Number, default: 1 },
    action: { type: String, default: "" },
    reason: { type: String, default: "" },
    actor: { type: String, default: "system" },
    snapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const step9ExaminationGradebookSchema = new mongoose.Schema(
  {
    assessmentModel: { type: String, default: "Term Exams" },
    resultDisplayFormat: { type: String, default: "Marks + Grade" },
    gradeScaleScope: { type: String, default: "Globally" },
    defaultPassingMarks: { type: Number, min: 0, max: 100, default: 33 },
    gradeTable: {
      type: [step9GradeRowSchema],
      default: [],
    },
    assessmentWeightage: {
      type: [step9WeightageRowSchema],
      default: [],
    },
    reportCardFormat: { type: String, default: "Board-specific Standard" },
    resultPublishingMode: { type: String, default: "Admin Approval Required" },
    reportCardSections: {
      type: [String],
      default: [],
    },
    dependencyStatus: {
      type: [step9DependencyStatusSchema],
      default: [],
    },
    recommendationMessage: { type: String, default: "" },
    smartChecks: {
      type: [String],
      default: [],
    },
    currentStep: { type: Number, default: 9 },
    progressPercentage: { type: Number, min: 0, max: 100, default: 82 },
    assessmentModelLogic: { type: String, default: "" },
    publishingState: {
      type: String,
      enum: ["draft", "approval_pending", "scheduled", "published", "reverted"],
      default: "draft",
    },
    approvalWorkflowStatus: {
      type: String,
      enum: [
        "not_requested",
        "pending",
        "approved",
        "rejected",
        "scheduled",
        "reverted",
      ],
      default: "not_requested",
    },
    scheduledPublishAt: { type: Date, default: null },
    lastPublishedAt: { type: Date, default: null },
    lastPublishedVersion: { type: Number, default: null },
    currentVersion: { type: Number, default: 1 },
    versionHistory: {
      type: [step9VersionSnapshotSchema],
      default: [],
    },
    auditLogs: {
      type: [step9AuditLogSchema],
      default: [],
    },
  },
  { _id: false }
);

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
      enum: ["single_school", "multi_campus", "school_group", null],
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
      enum: ["preschool", "k12_school", "higher_secondary", null],
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
    enabledModules: {
      type: [String],
      default: [],
    },
    disabledModules: {
      type: [String],
      default: [],
    },
    recommendedModules: {
      type: [String],
      default: [],
    },
    dependencyWarnings: {
      type: [String],
      default: [],
    },
    academicYear: { type: String, default: "" },
    academicYearPattern: {
      type: String,
      enum: ["apr_mar", "jun_may", "aug_jun", ""],
      default: "apr_mar",
    },
    academicYearStart: { type: String, default: "" },
    academicYearEnd: { type: String, default: "" },
    termStructure: { type: String, default: "2 Terms" },
    expectedStudents: { type: Number, default: null },
    maxStudentsPerSection: { type: Number, default: 40 },
    sectionMode: {
      type: String,
      enum: ["auto", "manual"],
      default: "auto",
    },
    streams: {
      type: [String],
      default: [],
    },
    subjectFramework: {
      type: String,
      enum: [
        "recommended_template",
        "manual",
        "excel_import",
        "configure_later",
        "",
      ],
      default: "recommended_template",
    },
    enabledRoles: {
      type: [String],
      default: [],
    },
    optionalRoles: {
      type: [String],
      default: [],
    },
    permissionSetupStyle: {
      type: String,
      enum: ["recommended", "custom"],
      default: "recommended",
    },
    staffIdFormat: {
      type: String,
      default: "EMP-{YEAR}-{SEQ}",
    },
    teacherIdFormat: {
      type: String,
      default: "TCH-{YEAR}-{SEQ}",
    },
    staffCategories: {
      type: [String],
      default: [],
    },
    departmentSetup: {
      type: String,
      enum: ["recommended", "manual", "hierarchical", ""],
      default: "manual",
    },
    approvalWorkflow: {
      type: String,
      enum: ["principal", "department_head", "custom", "none", ""],
      default: "custom",
    },
    permissionMatrix: {
      type: [
        {
          role: String,
          academic: String,
          fees: String,
          setup: String,
          portal: String,
        },
      ],
      default: [],
    },
    dependencyStatus: {
      type: [
        {
          module: String,
          status: String,
        },
      ],
      default: [],
    },
    attendanceMode: {
      type: String,
      enum: ["Daily", "Period-wise", "Hybrid", ""],
      default: "Hybrid",
    },
    workingDays: {
      type: [String],
      default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    },
    schoolStartTime: { type: String, default: "08:00" },
    schoolEndTime: { type: String, default: "14:30" },
    halfDayCheckoutTime: { type: String, default: "11:30" },
    attendanceClosingTime: { type: String, default: "09:30" },
    lateArrivalAfter: { type: String, default: "08:15" },
    autoAbsentAfter: { type: String, default: "10:00" },
    minimumAttendance: {
      type: Number,
      min: 50,
      max: 100,
      default: 75,
    },
    graceMinutes: {
      type: Number,
      min: 0,
      default: 10,
    },
    attendancePermissions: {
      classTeacher: { type: Boolean, default: true },
      subjectTeacher: { type: Boolean, default: true },
      adminOverride: { type: Boolean, default: true },
      biometric: { type: Boolean, default: false },
    },
    leaveApprovalRules: {
      studentLeaveApproval: {
        type: String,
        default: "Class Teacher Approval",
      },
      staffLeaveApproval: {
        type: String,
        default: "Principal Approval",
      },
    },
    leaveTypes: {
      type: [String],
      default: ["Sick Leave", "Casual Leave", "Medical Leave"],
    },
    parentNotificationRules: {
      absentAlert: { type: Boolean, default: true },
      lateArrivalAlert: { type: Boolean, default: true },
      earlyCheckoutAlert: { type: Boolean, default: true },
      lowAttendanceWarning: { type: Boolean, default: true },
    },
    attendanceDependencyStatus: {
      type: [
        {
          module: String,
          status: String,
        },
      ],
      default: [],
    },
    attendanceSmartChecks: {
      type: [String],
      default: [],
    },
    feesModuleEnabled: {
      type: Boolean,
      default: true,
    },
    step9ExaminationGradebook: {
      type: step9ExaminationGradebookSchema,
      default: () => ({}),
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
