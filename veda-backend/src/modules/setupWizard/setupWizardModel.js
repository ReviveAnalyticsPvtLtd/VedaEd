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
  },
  { timestamps: true }
);

module.exports = mongoose.model("SetupWizard", setupWizardSchema);
