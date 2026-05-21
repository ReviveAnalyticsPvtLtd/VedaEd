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
