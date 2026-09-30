const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const { findActivePlatformAdmin } = require("../utils/platformAdminAuth");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing or invalid" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");

    req.user = {
      userId: decoded.userId,
      role: decoded.role ? decoded.role.toLowerCase() : decoded.role,
      refId: decoded.refId,
      sessionId: decoded.sessionId,
    };

    // Any client-supplied school identity is discarded here. The authoritative
    // school is resolved only from the authenticated account, below.
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

    // Authoritative tenant context. Read from the user document rather than the
    // token so a stale or tampered token can never carry a foreign schoolId.
    req.user.schoolId = user.schoolId && mongoose.isValidObjectId(String(user.schoolId))
      ? String(user.schoolId)
      : null;

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
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
