const mongoose = require("mongoose");

const timetableRequirementSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    timetableHeader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimetableHeader",
      required: true,
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    periodsPerWeek: {
      type: Number,
      required: true,
      min: 0,
    },
    days: [
      {
        type: String,
        enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
        required: true,
      },
    ],
    preferredPeriodId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

timetableRequirementSchema.index({ schoolId: 1, timetableHeader: 1 });

const TimetableRequirement = mongoose.model(
  "TimetableRequirement",
  timetableRequirementSchema
);
module.exports = TimetableRequirement;
