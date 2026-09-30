const express = require("express");
const router = express.Router();
const controller = require("./admissionApplicationController");
const multer = require("multer");
const path = require("path");

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure this directory exists or 'uploads/' exists
        // The main app.js serves /uploads from ../public/uploads
        // We should probably use that path
        cb(null, path.join(__dirname, "../../../public/uploads"));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

const authMiddleware = require("../../middleware/authMiddleware");
const requireSchoolContext = require("../../middleware/requireSchoolContext");

// Every route on this router is tenant-scoped.
//
// Document upload and status tracking used to be mounted before authMiddleware
// "because a prospective applicant has no account yet". That reasoning no longer
// holds: application submission (`POST /apply`) is already behind
// authMiddleware, and both frontend callers of these routes
// (AdmissionForm.jsx, SuperAdminAdmissionStatusTracking.jsx) already go through
// the authenticated apiClient. Left public they were an unauthenticated write
// (`POST /:id/upload` pushed a file onto ANY application found by ObjectId) and
// an unauthenticated read of the whole applicant pipeline over a predictable
// applicationId.
router.use(authMiddleware);
router.use(requireSchoolContext);

// Applicant-facing document upload, now confined to the caller's own school.
router.post("/upload", upload.single("file"), controller.uploadApplicationDocument);
router.post("/:id/upload", upload.single("file"), controller.uploadApplicationDocument);
router.get("/track/:id", controller.trackApplication);

router.post("/apply", controller.createApplication);

router.get("/selected", controller.getSelectedStudents);
router.get("/", controller.getAllApplications);
router.get("/:id", controller.getApplicationById);
router.put("/:id", controller.updateApplication);
router.put("/:id/status", controller.updateApplicationStatus);
router.delete("/:id/document/:documentId", controller.deleteApplicationDocument);
router.put("/:applicationId/document/:documentId/verify", controller.verifyDocumentStatus);

module.exports = router;
