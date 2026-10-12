const express = require("express");
const router = express.Router();
const supportStaffController = require("./supportStaffController");
const authMiddleware = require("../../middleware/authMiddleware");
const requireSchoolContext = require("../../middleware/requireSchoolContext");
const { upload } = require("../../middleware/upload");

// Every support-staff record is school-owned: session must be authenticated
// and the account must carry an authoritative schoolId (client-supplied
// schoolId values are stripped by requireSchoolContext).
router.use(authMiddleware);
router.use(requireSchoolContext);

const handleSupportStaffUpload = (req, res, next) => {
    upload.fields([
        { name: "photo", maxCount: 1 },
        { name: "aadhaarDoc", maxCount: 1 },
        { name: "otherDocs", maxCount: 1 },
    ])(req, res, (err) => {
        if (err) {
            return res
                .status(400)
                .json({ success: false, message: err.message || "File upload failed" });
        }
        next();
    });
};

router.get("/next-id", supportStaffController.getNextSupportStaffId);
router.post("/", handleSupportStaffUpload, supportStaffController.createSupportStaff);
router.get("/", supportStaffController.getSupportStaff);
router.get("/:id", supportStaffController.getSupportStaffById);
router.put("/:id", handleSupportStaffUpload, supportStaffController.updateSupportStaff);
router.delete("/:id", supportStaffController.deleteSupportStaff);

module.exports = router;
