const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const controller = require("./superadminLandingController");
const { validateProfilePayload } = require("./superadminLandingValidation");
const authMiddleware = require("../../middleware/authMiddleware");
const requireSuperAdmin = require("../../middleware/requireSuperAdminMiddleware");

const router = express.Router();

router.use(authMiddleware, requireSuperAdmin);

const uploadDirectory = path.join(__dirname, "../../../public/uploads");
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDirectory),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const baseName = path
      .basename(file.originalname || "logo", ext)
      .replace(/\s+/g, "_")
      .replace(/[^\w.-]/g, "");
    cb(null, `${Date.now()}-${baseName}${ext}`);
  },
});

const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|svg|gif|webp/;
  const extValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowedTypes.test(file.mimetype.toLowerCase());

  if (extValid && mimeValid) {
    return cb(null, true);
  }
  return cb(new Error("Only image files are allowed"));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

// PROFILE
router.get("/profile", controller.getProfile);
router.put(
  "/profile",
  validateProfilePayload,
  controller.updateProfile
);

// LOGO
router.patch(
  "/profile/logo",
  upload.single("logo"),
  controller.uploadLogo
);

// THEME
router.get("/theme", controller.getTheme);
router.put("/theme", controller.updateTheme);

// OTHER SETTINGS
router.get("/other", controller.getOther);
router.put("/other", controller.updateOther);

module.exports = router;
