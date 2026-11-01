const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema({
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
  subjectGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubjectGroup",
    required: function () {
      // Keep existing behavior: subjectGroup required for legacy flow
      // New header-based flow may not require it
      return !this.timetableHeader;
    },
  },
  day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    required: true,
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
  timeFrom: {
    type: String, // "09:00"
    required: true,
  },
  timeTo: {
    type: String, // "09:45"
    required: true,
  },
  roomNo: {
    type: String,
  },
  // New optional fields for header-based flow
  timetableHeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TimetableHeader",
    required: false,
  },
  periodId: {
    type: String,
    required: false,
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AcademicYear",
    required: false,
  },
}, { timestamps: true });

// Indexes for potential conflict checks and lookups (non-destructive)
timetableSchema.index({ timetableHeader: 1, day: 1, periodId: 1 });
timetableSchema.index({ teacher: 1, day: 1 });
timetableSchema.index({ class: 1, section: 1, day: 1 });

const Timetable = mongoose.model("Timetable", timetableSchema);
module.exports = Timetable;
