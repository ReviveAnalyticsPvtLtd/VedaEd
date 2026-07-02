const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    marketing: {
      type: Boolean,
      default: false
    }
  },
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    lastPasswordChange: {
      type: Date
    },
    loginAlerts: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);
module.exports = UserSettings;
