const jwt = require("jsonwebtoken");
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
    };

    const user = await User.findById(req.user.userId).select("status email").lean();
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (user.status === "inactive") {
      return res.status(403).json({
        message: "Your account is inactive. Contact your administrator.",
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
