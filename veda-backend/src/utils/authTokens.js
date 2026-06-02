const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const {
  flattenPlatformPermissions,
  validatePlatformAdminForLogin,
} = require("./platformAdminAuth");

const ACCESS_TOKEN_EXPIRY = "7d";
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const REFRESH_BCRYPT_ROUNDS = 10;

const buildAccessToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      role: user.roleId?.name || user.roleId,
      refId: user.refId,
    },
    process.env.JWT_SECRET || "fallback_secret_key",
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

const buildAuthResponse = async (user) => {
  const roleName = user.roleId?.name || user.roleId;
  const normalizedRole = String(roleName).toLowerCase();

  let permissions = [];
  let platformPermissions = null;
  let platformAdminProfile = null;

  if (normalizedRole === "admin") {
    const adminCheck = await validatePlatformAdminForLogin(user);
    if (!adminCheck.ok) {
      const error = new Error(adminCheck.message);
      error.statusCode = adminCheck.status;
      throw error;
    }

    platformPermissions = adminCheck.platformAdmin.permissions || [];
    platformAdminProfile = {
      adminType: adminCheck.platformAdmin.adminType,
      employeeId: adminCheck.platformAdmin.employeeId,
      school: adminCheck.platformAdmin.school,
      campus: adminCheck.platformAdmin.campus,
      scope: adminCheck.platformAdmin.scope,
    };
    permissions = flattenPlatformPermissions(platformPermissions);
  }

  const token = buildAccessToken(user);

  return {
    token,
    role: roleName,
    permissions,
    platformPermissions,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: roleName,
      refId: user.refId,
      profilePicture: user.profilePicture,
      ...(platformAdminProfile || {}),
    },
  };
};

const issueRefreshToken = async (userId) => {
  const plainToken = crypto.randomBytes(48).toString("hex");
  const tokenHash = await bcrypt.hash(plainToken, REFRESH_BCRYPT_ROUNDS);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt,
  });

  return { refreshToken: plainToken, refreshTokenExpiresAt: expiresAt };
};

const buildFullAuthSession = async (user) => {
  const authPayload = await buildAuthResponse(user);
  const refresh = await issueRefreshToken(user._id);
  return { ...authPayload, ...refresh };
};

module.exports = {
  buildAccessToken,
  buildAuthResponse,
  buildFullAuthSession,
  issueRefreshToken,
};
