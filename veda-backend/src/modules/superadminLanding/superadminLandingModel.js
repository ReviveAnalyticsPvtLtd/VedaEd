const mongoose = require("mongoose");

const { Schema } = mongoose;

const superadminLandingSchema = new Schema(
  {
    // Tenant ownership. Assigned server-side; never accepted from the client.
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      unique: true,
      index: true,
      immutable: true,
    },
    // Retained for backward schema compatibility; no longer unique or used for tenant identification.
    singletonKey: {
      type: String,
      default: "default",
    },
    profile: {
      // GENERAL
      schoolName: { type: String, trim: true, required: true },
      shortName: { type: String, trim: true, default: "" },
      schoolType: { type: String, trim: true, default: "Private" },
      board: { type: String, trim: true, default: "CBSE" },
      affiliationNumber: { type: String, trim: true, default: "" },
      udise: { type: String, trim: true, required: true },
      establishmentYear: { type: String, trim: true, default: "" },
      schoolLevel: { type: [String], default: [] },
      medium: { type: [String], default: [] },
      genderType: { type: String, trim: true, default: "Co-ed" },
      status: { type: String, trim: true, default: "Active" },

      // ACADEMIC
      sessionStart: { type: String, trim: true, required: true },
      sessionEnd: { type: String, trim: true, required: true },
      gradingSystem: { type: String, trim: true, default: "Percentage" },
      startTime: { type: String, trim: true, default: "" },
      endTime: { type: String, trim: true, default: "" },

      // ADDRESS
      street: { type: String, trim: true, required: true },
      area: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "India" },
      state: { type: String, trim: true, required: true },
      district: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, required: true },
      pin: { type: String, trim: true, required: true },

      // CONTACT
      principalName: { type: String, trim: true, default: "" },
      principalEmail: { type: String, trim: true, default: "" },
      principalPhone: { type: String, trim: true, default: "" },
      schoolPhone: { type: String, trim: true, default: "" },
      altPhone: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
      website: { type: String, trim: true, default: "" },

      // ADMIN
      management: { type: String, trim: true, default: "Trust" },
      recognition: { type: String, trim: true, default: "Recognized" },
      authority: { type: String, trim: true, default: "" },

      // SYSTEM
      motto: { type: String, trim: true, default: "" },
      subdomain: { type: String, trim: true, default: "" },
      timezone: { type: String, trim: true, default: "Asia/Kolkata" },
      language: { type: String, trim: true, default: "English" },

      // BRANDING
      logo: { type: String, trim: true, default: "" },
    },
    theme: {
      type: Schema.Types.Mixed,
      default: {},
    },
    other: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SuperadminLanding", superadminLandingSchema);
