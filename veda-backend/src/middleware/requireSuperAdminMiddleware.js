const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  if (req.user.role !== "superadmin") {
    return res.status(403).json({ message: "SuperAdmin access required" });
  }

  next();
};

module.exports = requireSuperAdmin;
