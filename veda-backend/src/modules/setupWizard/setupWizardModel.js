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
    primaryThemeColor: { type: String, default: "#2563EB" },
    address: { type: String, default: "" },
    country: { type: String, default: "" },
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
