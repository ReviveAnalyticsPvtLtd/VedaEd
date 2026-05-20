const mongoose = require("mongoose");

const permissionRowSchema = new mongoose.Schema(
  {
    module: { type: String, required: true },
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  { _id: false }
);

const platformAdminSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    employeeId: { type: String, trim: true },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    adminType: { type: String, required: true, trim: true },
    school: { type: String, trim: true },
    campus: { type: String, trim: true },
    scope: { type: String, trim: true },
    permissions: { type: [permissionRowSchema], default: [] },
    inviteStatus: {
      type: String,
      enum: ["pending", "sent", "accepted"],
      default: "pending",
    },
    inviteToken: { type: String, select: false },
    inviteTokenExpiresAt: { type: Date },
    invitedAt: { type: Date },
    acceptedAt: { type: Date },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isDraft: { type: Boolean, default: false },
    initialPassword: { type: String, select: false },
  },
  { timestamps: true }
);

platformAdminSchema.index({ email: 1 });
platformAdminSchema.index({ employeeId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("PlatformAdmin", platformAdminSchema);
