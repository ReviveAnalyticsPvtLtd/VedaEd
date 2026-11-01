const mongoose = require("mongoose");

// Append-only record of every change made to a timetable. Timetable rows and
// header fields only keep createdBy/updatedBy, so this fills the gap for
// moves, copies, generation, publishing and schedule/requirement edits.
const timetableAuditSchema = new mongoose.Schema(
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
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
    },
    action: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    version: {
      type: Number,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

timetableAuditSchema.index({ schoolId: 1, timetableHeader: 1, createdAt: -1 });

const TimetableAudit = mongoose.model(
  "TimetableAudit",
  timetableAuditSchema
);

// Audit writes must never fail the operation they describe, so errors are
// logged and swallowed. The timetable itself has already been validated and
// saved by the time this runs.
const recordTimetableAudit = async ({
  header,
  schoolId,
  action,
  userId = null,
  version = null,
  details = {},
}) => {
  if (!header?._id || !schoolId || !action) return null;

  try {
    return await TimetableAudit.create({
      schoolId,
      timetableHeader: header._id,
      class: header.class || null,
      section: header.section || null,
      action,
      userId: userId || null,
      version: version ?? header.version ?? null,
      details,
    });
  } catch (error) {
    console.error(`Error recording timetable audit (${action}):`, error);
    return null;
  }
};

module.exports = {
  TimetableAudit,
  recordTimetableAudit,
};
