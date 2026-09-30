const mongoose = require("mongoose");
const { Schema } = mongoose;

const ComplaintSchema = new Schema(
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
    complainant: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'complainantModel',
      required: true
    },
    complainantModel: {
      type: String,
      enum: ['Student', 'Teacher', 'Parent', 'Admin', 'Staff'],
      required: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'in_progress', 'resolved', 'closed', 'rejected', 'Pending', 'Replied', 'Reviewed'],
      default: 'Pending'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'assignedToModel'
    },
    assignedToModel: {
      type: String,
      enum: ['Teacher', 'Admin', 'Staff']
    },
    attachments: [{
      filename: String,
      originalName: String,
      path: String,
      size: Number,
      uploadedAt: { type: Date, default: Date.now }
    }],
    responses: [{
      responder: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'responses.responderModel',
        required: true
      },
      responderModel: {
        type: String,
        enum: ['Teacher', 'Admin', 'Staff', 'Parent', 'Student'],
        required: true
      },
      response: {
        type: String,
        required: true
      },
      responseDate: {
        type: Date,
        default: Date.now
      },
      isInternal: {
        type: Boolean,
        default: false
      }
    }],
    resolution: {
      description: String,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'resolution.resolvedByModel'
      },
      resolvedByModel: {
        type: String,
        enum: ['Teacher', 'Admin', 'Staff']
      },
      resolvedAt: Date,
      resolutionType: {
        type: String,
        enum: ['resolved', 'dismissed', 'escalated']
      }
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    relatedComplaints: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint'
    }],
    tags: [String],
    dueDate: Date,
    // Add fields from frontend
    complaintAgainst: String,
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'targetUserModel'
    },
    targetUserModel: {
      type: String,
      enum: ['Student', 'Teacher', 'Staff', 'Admin']
    },
    sendTo: [String],
    panel: [String]
  },
  { timestamps: true }
);

// Indexes for better query performance
ComplaintSchema.index({ complainant: 1, createdAt: -1 });
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ category: 1 });
ComplaintSchema.index({ assignedTo: 1 });
ComplaintSchema.index({ priority: 1 });

const Complaint = mongoose.model("Complaint", ComplaintSchema);
module.exports = Complaint;
