const mongoose = require("mongoose");
const { Schema } = mongoose;

const NotificationSchema = new Schema(
  {
    /**
     * Authoritative tenant ownership. Assigned server-side from the
     * authenticated session (req.user.schoolId) on creation and never
     * accepted from the request body. Immutable so no later update path can
     * move a record to another school.
     *
     * Legacy records were attributed by the read-only resolver in
     * scripts/communication-ownership-backfill.js. A small, explicitly
     * reported set of legacy documents has no provable owner and therefore no
     * schoolId; they are quarantined (invisible to every school) rather than
     * guessed at. See the migration report for the exact list.
     */
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
      immutable: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['Information', 'Reminder', 'Urgent', 'Academic', 'Examination', 'Fee Related', 'Transport Related'],
      default: 'Information'
    },
    audience: {
      type: String,
      enum: ['all', 'students', 'teachers', 'parents', 'staff', 'specific_class', 'specific_section'],
      default: 'all'
    },
    specificTargets: [{
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'specificTargetModel'
    }],
    specificTargetModel: {
      type: String,
      enum: ['Student', 'Teacher', 'Parent', 'Class', 'Section']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'createdByModel',
      required: true
    },
    createdByModel: {
      type: String,
      enum: ['Teacher', 'Staff', 'Admin'],
      required: true
    },
    channels: [{
      type: String,
      enum: ['sms', 'email', 'app', 'whatsapp'],
      default: ['app']
    }],
    publishDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'scheduled', 'failed'],
      default: 'sent'
    }
  },
  { timestamps: true }
);

// Indexes for query performance optimization
NotificationSchema.index({ status: 1, publishDate: -1 });
NotificationSchema.index({ audience: 1 });
NotificationSchema.index({ type: 1 });

const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;
