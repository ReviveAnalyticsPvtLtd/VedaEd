const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageTemplateSchema = new Schema(
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
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['SMS', 'Email'],
      default: 'SMS'
    },
    category: {
      type: String,
      default: 'General'
    }
  },
  { timestamps: true }
);

MessageTemplateSchema.index({ createdAt: -1 });

const MessageTemplate = mongoose.model('MessageTemplate', MessageTemplateSchema);
module.exports = MessageTemplate;