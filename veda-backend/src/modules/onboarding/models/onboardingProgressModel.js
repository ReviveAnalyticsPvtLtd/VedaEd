const mongoose = require("mongoose");

const onboardingProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    currentStep: { type: Number, min: 1, max: 6, default: 1 },
    completedSteps: { type: [Number], default: [] },
    isCompleted: { type: Boolean, default: false },
    onboardingCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    onboardingCompletedAt: { type: Date },
    adminDetails: {
      fullName: { type: String, trim: true, maxlength: 100 },
      email: { type: String, trim: true, lowercase: true, maxlength: 254 },
      countryCode: { type: String, trim: true, maxlength: 6 },
      mobileNumber: { type: String, trim: true, maxlength: 20 },
    },
    passwordHash: { type: String },
    passwordCreated: { type: Boolean, default: false },
    emailOtpHash: { type: String },
    otpCreatedAt: { type: Date },
    otpExpiresAt: { type: Date },
    otpAttempts: { type: Number, default: 0, min: 0 },
    emailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OnboardingProgress", onboardingProgressSchema);
