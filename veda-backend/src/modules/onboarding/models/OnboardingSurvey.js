const mongoose = require("mongoose");

const onboardingSurveySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  institutionType: {
    type: String,
    enum: ["School", "Preschool"],
  },
  studentStrength: {
    type: String,
  },
  branches: {
    type: String,
  },
  board: {
    type: String,
  },
  currentSystem: {
    type: String,
    enum: ["Excel / Sheets", "No ERP", "Existing ERP", "Custom Software"],
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

onboardingSurveySchema.pre("save", function(next) {
  if (this.completed && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model("OnboardingSurvey", onboardingSurveySchema);
