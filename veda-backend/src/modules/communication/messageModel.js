const mongoose = require("mongoose");
const { Schema } = mongoose;

const MessageSchema = new Schema(
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
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'senderModel',
      required: true
    },
    senderModel: {
      type: String,
      enum: ['Student', 'Teacher', 'Parent', 'Admin', 'Staff'],
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'receiverModel',
      required: true
    },
    receiverModel: {
      type: String,
      enum: ['Student', 'Teacher', 'Parent', 'Admin', 'Staff'],
      required: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    messageType: {
      type: String,
      enum: ['text', 'file', 'image', 'announcement'],
      default: 'text'
    },
    attachments: [{
      filename: String,
      originalName: String,
      path: String,
      size: Number,
      uploadedAt: { type: Date, default: Date.now }
    }],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'archived'],
      default: 'sent'
    },
    readAt: {
      type: Date
    },
    isImportant: {
      type: Boolean,
      default: false
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }
  },
  { timestamps: true }
);

// Indexes for better query performance
MessageSchema.index({ sender: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, createdAt: -1 });
MessageSchema.index({ status: 1 });
MessageSchema.index({ threadId: 1 });

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
