const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const School = require("../models/School");
const { findActivePlatformAdmin } = require("../utils/platformAdminAuth");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing or invalid" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          code: "TOKEN_EXPIRED",
          message: "Your session has expired. Please log in again.",
          expiredAt: jwtError.expiredAt,
        });
      }
      return res.status(401).json({
        code: "INVALID_TOKEN",
        message: "Invalid or malformed authorization token",
      });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role ? decoded.role.toLowerCase() : decoded.role,
      refId: decoded.refId,
      sessionId: decoded.sessionId,
    };

    req.schoolId = undefined;

    const user = await User.findById(req.user.userId)
      .select("status email activeSession schoolId")
      .lean();
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (user.status === "inactive") {
      return res.status(403).json({
        message: "Your account is inactive. Contact your administrator.",
      });
    }

    let schoolId = user.schoolId && mongoose.isValidObjectId(String(user.schoolId))
      ? String(user.schoolId)
      : null;

    if (!schoolId && req.user.role === "superadmin") {
      const ownedSchool = await School.findOne({ ownerUserId: user._id })
        .select("_id")
        .lean();
      if (ownedSchool?._id) {
        schoolId = String(ownedSchool._id);

        await User.updateOne(
          {
            _id: user._id,
            $or: [{ schoolId: null }, { schoolId: { $exists: false } }],
          },
          { $set: { schoolId: ownedSchool._id } }
        ).catch(() => {});
      }
    }

    req.user.schoolId = schoolId;

    if (decoded.sessionId && (!user.activeSession?.sessionId || user.activeSession.sessionId !== decoded.sessionId)) {
      return res.status(401).json({
        code: "SESSION_REPLACED",
        message: "Your session was ended because your account was signed in from another device or browser.",
      });
    }

    if (user.activeSession?.expiresAt && new Date(user.activeSession.expiresAt).getTime() <= Date.now()) {
      return res.status(401).json({
        code: "SESSION_EXPIRED",
        message: "Your session has expired. Please log in again.",
      });
    }

    if (req.user.role === "admin") {
      const platformAdmin = await findActivePlatformAdmin(user.email);
      if (!platformAdmin || platformAdmin.status !== "active") {
        return res.status(403).json({
          message: "Your admin account is not authorized. Contact your administrator.",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ code: "AUTH_ERROR", message: "Internal authentication error" });
  }
};

module.exports = authMiddleware;
