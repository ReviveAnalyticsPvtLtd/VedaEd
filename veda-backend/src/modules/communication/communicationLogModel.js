const mongoose = require("mongoose");
const { Schema } = mongoose;

const CommunicationLogSchema = new Schema(
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'userModel',
      required: true
    },
    userModel: {
      type: String,
      enum: ['Student', 'Teacher', 'Parent', 'Admin', 'Staff'],
      required: true
    },
    action: {
      type: String,
      enum: [
        'message_sent', 'message_received', 'message_read',
        'notice_viewed', 'notice_created', 'notice_published',
        'complaint_submitted', 'complaint_viewed', 'complaint_responded',
        'file_uploaded', 'file_downloaded', 'login', 'logout'
      ],
      required: true
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'targetModel'
    },
    targetModel: {
      type: String,
      // 'Notification' and 'Template' were added with tenant-scoped writes:
      // notifications and templates are logged against their own record kind.
      enum: ['Message', 'Notice', 'Complaint', 'User', 'Notification', 'Template']
    },
    details: {
      type: Schema.Types.Mixed
    },
    ipAddress: String,
    userAgent: String,
    sessionId: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Indexes for better query performance
CommunicationLogSchema.index({ user: 1, timestamp: -1 });
CommunicationLogSchema.index({ action: 1 });
CommunicationLogSchema.index({ timestamp: -1 });
CommunicationLogSchema.index({ userModel: 1 });

const CommunicationLog = mongoose.model("CommunicationLog", CommunicationLogSchema);
module.exports = CommunicationLog;
