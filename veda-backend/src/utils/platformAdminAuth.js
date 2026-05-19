const PlatformAdmin = require("../models/PlatformAdmin");

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const flattenPlatformPermissions = (permissionRows = []) => {
  const names = [];
  for (const row of permissionRows) {
    const moduleKey = String(row.module || "")
      .toLowerCase()
      .replace(/\s+/g, "_");
    if (!moduleKey) continue;
    if (row.view) names.push(`view_${moduleKey}`);
    if (row.create) names.push(`create_${moduleKey}`);
    if (row.edit) names.push(`edit_${moduleKey}`);
    if (row.delete) names.push(`delete_${moduleKey}`);
  }
  return names;
};

const findActivePlatformAdmin = async (email) => {
  if (!email) return null;
  return PlatformAdmin.findOne({
    email: String(email).toLowerCase(),
    isDraft: false,
  }).lean();
};

const findPlatformAdminByEmployeeId = async (employeeId) => {
  const trimmed = String(employeeId || "").trim();
  if (!trimmed) return null;
  return PlatformAdmin.findOne({
    employeeId: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, "i") },
    isDraft: false,
  }).lean();
};

const validatePlatformAdminForLogin = async (user) => {
  const platformAdmin = await findActivePlatformAdmin(user.email);

  if (!platformAdmin) {
    return {
      ok: false,
      status: 401,
      message: "Invalid credentials",
    };
  }

  if (platformAdmin.status !== "active") {
    return {
      ok: false,
      status: 403,
      message: "Your admin account has been deactivated. Contact your administrator.",
    };
  }

  if (user.status === "inactive") {
    if (platformAdmin.inviteStatus !== "accepted") {
      return {
        ok: false,
        status: 403,
        message: "Please accept your invitation email before signing in.",
      };
    }

    return {
      ok: false,
      status: 403,
      message: "Your admin account has been deactivated. Contact your administrator.",
    };
  }

  const invitePending =
    platformAdmin.inviteStatus === "sent" ||
    (platformAdmin.inviteStatus === "pending" && platformAdmin.invitedAt);

  if (invitePending && platformAdmin.inviteStatus !== "accepted") {
    return {
      ok: false,
      status: 403,
      message: "Please accept your invitation email before signing in.",
    };
  }

  return { ok: true, platformAdmin };
};

module.exports = {
  flattenPlatformPermissions,
  findActivePlatformAdmin,
  findPlatformAdminByEmployeeId,
  validatePlatformAdminForLogin,
};
