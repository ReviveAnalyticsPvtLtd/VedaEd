const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const {
  flattenPlatformPermissions,
  validatePlatformAdminForLogin,
} = require("./platformAdminAuth");

const ACCESS_TOKEN_EXPIRY = "7d";
const ACCESS_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const REFRESH_BCRYPT_ROUNDS = 10;

const SESSION_REPLACED_MESSAGE =
  "Your account has been logged in from another device. Please sign in again.";

const createSessionId = () =>
  crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");

const startActiveSession = async (user, { device = null, ip = null } = {}) => {
  const now = new Date();
  const sessionId = createSessionId();
  const expiresAt = new Date(now.getTime() + ACCESS_TOKEN_EXPIRY_MS);

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        lastLogin: now,
        activeSession: {
          sessionId,
          createdAt: now,
          expiresAt,
          device,
          ip,
        },
      },
    }
  );

  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: now } }
  );

  return { sessionId, createdAt: now, expiresAt, device, ip };
};

const buildAccessToken = (user, sessionId) =>
  jwt.sign(
    {
      userId: user._id,
      role: user.roleId?.name || user.roleId,
      refId: user.refId,
      // Informational only. authMiddleware re-resolves schoolId from the user
      // document on every request, so the token is never the authority.
      schoolId: user.schoolId || null,
      ...(sessionId ? { sessionId } : {}),
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

  const session = await startActiveSession(user);
  const token = buildAccessToken(user, session.sessionId);

  return {
    token,
    sessionId: session.sessionId,
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

const issueRefreshToken = async (userId, sessionId) => {
  if (!userId) {
    const error = new Error("A user is required to issue a refresh token");
    error.statusCode = 500;
    error.code = "REFRESH_TOKEN_USER_REQUIRED";
    throw error;
  }

  if (!sessionId) {
    const error = new Error("An active session is required to issue a refresh token");
    error.statusCode = 500;
    error.code = "REFRESH_TOKEN_SESSION_REQUIRED";
    throw error;
  }

  const plainToken = crypto.randomBytes(48).toString("hex");
  const tokenHash = await bcrypt.hash(plainToken, REFRESH_BCRYPT_ROUNDS);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  const doc = await RefreshToken.create({
    userId,
    sessionId,
    tokenHash,
    expiresAt,
  });

  return {
    refreshToken: `${doc._id}.${plainToken}`,
    refreshTokenExpiresAt: expiresAt,
  };
};

const rotateRefreshToken = async (rawRefreshToken) => {
  if (!rawRefreshToken || typeof rawRefreshToken !== "string") {
    const error = new Error("Refresh token is required");
    error.statusCode = 400;
    error.code = "MISSING_REFRESH_TOKEN";
    throw error;
  }

  let tokenDoc = null;
  let secret = null;

  if (rawRefreshToken.includes(".")) {
    const [tokenId, plainSecret] = rawRefreshToken.split(".");
    if (mongoose.isValidObjectId(tokenId)) {
      tokenDoc = await RefreshToken.findById(tokenId);
      secret = plainSecret;
    }
  }

  if (!tokenDoc || !secret) {
    const error = new Error("Invalid refresh token");
    error.statusCode = 401;
    error.code = "INVALID_REFRESH_TOKEN";
    throw error;
  }

  if (tokenDoc.revokedAt) {
    const error = new Error("Refresh token has been revoked");
    error.statusCode = 401;
    error.code = "REVOKED_REFRESH_TOKEN";
    throw error;
  }

  if (new Date(tokenDoc.expiresAt).getTime() <= Date.now()) {
    const error = new Error("Refresh token has expired");
    error.statusCode = 401;
    error.code = "REFRESH_TOKEN_EXPIRED";
    throw error;
  }

  const isValidSecret = await bcrypt.compare(secret, tokenDoc.tokenHash);
  if (!isValidSecret) {
    const error = new Error("Invalid refresh token");
    error.statusCode = 401;
    error.code = "INVALID_REFRESH_TOKEN";
    throw error;
  }

  // Load the user
  const user = await User.findById(tokenDoc.userId).populate("roleId");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 401;
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  if (!tokenDoc.userId || String(tokenDoc.userId) !== String(user._id)) {
    const error = new Error("Invalid refresh token");
    error.statusCode = 401;
    error.code = "INVALID_REFRESH_TOKEN";
    throw error;
  }

  if (user.status === "inactive") {
    const error = new Error("Your account is inactive. Contact your administrator.");
    error.statusCode = 403;
    error.code = "USER_INACTIVE";
    throw error;
  }

  const activeSession = user.activeSession;
  if (
    !activeSession?.sessionId ||
    !tokenDoc.sessionId ||
    tokenDoc.sessionId !== activeSession.sessionId
  ) {
    await RefreshToken.updateOne(
      { _id: tokenDoc._id, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );

    const error = new Error(SESSION_REPLACED_MESSAGE);
    error.statusCode = 401;
    error.code = "SESSION_REPLACED";
    throw error;
  }

  if (
    activeSession.expiresAt &&
    new Date(activeSession.expiresAt).getTime() <= Date.now()
  ) {
    await RefreshToken.updateOne(
      { _id: tokenDoc._id, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );

    const error = new Error("Your session has expired. Please sign in again.");
    error.statusCode = 401;
    error.code = "SESSION_EXPIRED";
    throw error;
  }

  const newAccessToken = buildAccessToken(user, activeSession.sessionId);

  const revoked = await RefreshToken.findOneAndUpdate(
    { _id: tokenDoc._id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
    { new: true }
  );

  if (!revoked) {
    const error = new Error("Refresh token has been revoked");
    error.statusCode = 401;
    error.code = "REVOKED_REFRESH_TOKEN";
    throw error;
  }

  const newRefresh = await issueRefreshToken(user._id, activeSession.sessionId);

  await User.updateOne(
    { _id: user._id },
    { $set: { lastLogin: new Date() } }
  );

  return {
    token: newAccessToken,
    sessionId: activeSession.sessionId,
    refreshToken: newRefresh.refreshToken,
    refreshTokenExpiresAt: newRefresh.refreshTokenExpiresAt,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.roleId?.name || user.roleId,
      refId: user.refId,
      schoolId: user.schoolId || null,
    },
  };
};

const buildFullAuthSession = async (user) => {
  const authPayload = await buildAuthResponse(user);
  const refresh = await issueRefreshToken(user._id, authPayload.sessionId);
  return { ...authPayload, ...refresh };
};

module.exports = {
  buildAccessToken,
  buildAuthResponse,
  buildFullAuthSession,
  issueRefreshToken,
  rotateRefreshToken,
  startActiveSession,
  SESSION_REPLACED_MESSAGE,
};
