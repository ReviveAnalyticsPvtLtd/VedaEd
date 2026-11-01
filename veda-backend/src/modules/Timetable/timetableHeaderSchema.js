const mongoose = require("mongoose");

const periodSchema = new mongoose.Schema(
  {
    periodId: { type: String, required: true },
    name: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
    type: { type: String, enum: ["TEACHING", "LUNCH"], default: "TEACHING" },
  },
  { _id: false }
);

const lunchSchema = new mongoose.Schema(
  {
    afterPeriod: { type: Number },
    durationMinutes: { type: Number },
  },
  { _id: false }
);

const timetableHeaderSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: false,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED"],
      default: "DRAFT",
    },
    workingDays: [
      {
        type: String,
        enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
      },
    ],
    startTime: { type: String },
    defaultDurationMinutes: { type: Number },
    defaultRoom: { type: String },
    lunch: { type: lunchSchema, default: null },
    periods: [periodSchema],
    version: { type: Number, default: 1 },
    needsRebuild: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Ensure one header per school/academicYear/class/section (allowing null academicYear for legacy compatibility)
timetableHeaderSchema.index(
  { schoolId: 1, academicYear: 1, class: 1, section: 1 },
  { unique: true, sparse: false }
);

const TimetableHeader = mongoose.model("TimetableHeader", timetableHeaderSchema);
module.exports = TimetableHeader;
