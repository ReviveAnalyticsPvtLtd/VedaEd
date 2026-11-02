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
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const REFRESH_BCRYPT_ROUNDS = 10;

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

  const sessionId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");
  const token = buildAccessToken(user, sessionId);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  try {
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          lastLogin: new Date(),
          activeSession: {
            sessionId,
            token,
            createdAt: new Date(),
            expiresAt,
          },
        },
      }
    );
  } catch (err) {
    console.error("Failed to update activeSession in buildAuthResponse:", err);
  }

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

  const doc = await RefreshToken.create({
    userId,
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

  // Fallback for legacy plain refresh tokens without tokenId prefix
  if (!tokenDoc || !secret) {
    const candidates = await RefreshToken.find({
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    for (const candidate of candidates) {
      const match = await bcrypt.compare(rawRefreshToken, candidate.tokenHash);
      if (match) {
        tokenDoc = candidate;
        secret = rawRefreshToken;
        break;
      }
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

  // Revoke the old refresh token (Token Rotation)
  tokenDoc.revokedAt = new Date();
  await tokenDoc.save();

  // Load the user
  const user = await User.findById(tokenDoc.userId).populate("roleId");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 401;
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  if (user.status === "inactive") {
    const error = new Error("Your account is inactive. Contact your administrator.");
    error.statusCode = 403;
    error.code = "USER_INACTIVE";
    throw error;
  }

  // Issue new access token and new refresh token
  const sessionId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");
  const newAccessToken = buildAccessToken(user, sessionId);
  const newRefresh = await issueRefreshToken(user._id);

  // Update user's active session
  const accessExpiresAt = new Date();
  accessExpiresAt.setDate(accessExpiresAt.getDate() + 7);

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        lastLogin: new Date(),
        activeSession: {
          sessionId,
          token: newAccessToken,
          createdAt: new Date(),
          expiresAt: accessExpiresAt,
        },
      },
    }
  );

  return {
    token: newAccessToken,
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
  const refresh = await issueRefreshToken(user._id);
  return { ...authPayload, ...refresh };
};

module.exports = {
  buildAccessToken,
  buildAuthResponse,
  buildFullAuthSession,
  issueRefreshToken,
  rotateRefreshToken,
};
