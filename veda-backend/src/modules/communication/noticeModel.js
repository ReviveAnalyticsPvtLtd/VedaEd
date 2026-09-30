const mongoose = require("mongoose");
const { Schema } = mongoose;

const NoticeSchema = new Schema(
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
    content: {
      type: String,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'authorModel',
      required: true
    },
    authorModel: {
      type: String,
      enum: ['Teacher', 'Staff', 'Admin'],
      required: true
    },
    category: {
      type: String,
      enum: ['general', 'academic', 'exam', 'event', 'emergency', 'maintenance'],
      default: 'general'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    targetAudience: {
      type: String,
      enum: ['all', 'students', 'teachers', 'parents', 'staff', 'specific_class', 'specific_grade'],
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
    attachments: [{
      filename: String,
      originalName: String,
      path: String,
      size: Number,
      uploadedAt: { type: Date, default: Date.now }
    }],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived', 'expired'],
      default: 'draft'
    },
    publishDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    views: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'views.userModel'
      },
      userModel: {
        type: String,
        enum: ['Student', 'Teacher', 'Parent', 'Admin']
      },
      viewedAt: {
        type: Date,
        default: Date.now
      }
    }],
    tags: { type: [String], default: [] }
  },
  { timestamps: true }
);

// Indexes for better query performance
NoticeSchema.index({ status: 1, publishDate: -1 });
NoticeSchema.index({ targetAudience: 1 });
NoticeSchema.index({ category: 1 });
NoticeSchema.index({ isPinned: -1, publishDate: -1 });

const Notice = mongoose.model("Notice", NoticeSchema);
module.exports = Notice;
