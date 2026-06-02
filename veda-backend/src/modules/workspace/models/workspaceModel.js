const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    schoolName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    workspaceSlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 63,
    },
    workspacePreviewUrl: {
      type: String,
      required: true,
      trim: true,
    },
    workspaceUrl: {
      type: String,
      trim: true,
    },
    workspaceStatus: {
      type: String,
      enum: ["draft", "created"],
      default: "draft",
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      default: null,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkspaceSubscription",
      default: null,
    },
    customDomain: {
      type: String,
      trim: true,
      default: "",
    },
    workspaceAccess: {
      type: Boolean,
      default: false,
    },
    subscriptionStatus: {
      type: String,
      enum: ["pending", "active", "expired", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workspace", workspaceSchema);
