const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageTemplateSchema = new Schema(
  {
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