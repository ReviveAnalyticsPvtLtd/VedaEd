const express = require("express");
const router = express.Router();
const hrRecruitmentController = require("./hrRecruitmentController");
const authMiddleware = require("../../middleware/authMiddleware");
const requireSchoolContext = require("../../middleware/requireSchoolContext");
const multer = require("multer");

// Vacancies, applications, interview scorecards and recruitment dashboard
// figures are all school-owned. Require an authenticated session for the router.
router.use(authMiddleware);
router.use(requireSchoolContext);

// Configure Multer for basic file uploads (resumes, documents)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage });

// Dashboard
router.get("/dashboard", hrRecruitmentController.getDashboardStats);

// Vacancies
router.post("/vacancies", hrRecruitmentController.createVacancy);
router.get("/vacancies", hrRecruitmentController.getVacancies);
router.put("/vacancies/:id", hrRecruitmentController.updateVacancy);

// Applications
router.post(
    "/applications",
    upload.fields([
        { name: "resume", maxCount: 1 },
        { name: "aadhaar", maxCount: 1 },
        { name: "pan", maxCount: 1 },
        { name: "photo", maxCount: 1 },
    ]),
    (req, res, next) => {
        // If files are uploaded, append their paths to req.body
        if (req.files) {
            if (req.files.resume) req.body.resumeUrl = req.files.resume[0].path;
            if (req.files.aadhaar) req.body.aadhaarUrl = req.files.aadhaar[0].path;
            if (req.files.pan) req.body.panUrl = req.files.pan[0].path;
            if (req.files.photo) req.body.photoUrl = req.files.photo[0].path;
        }
        next();
    },
    hrRecruitmentController.createApplication
);
router.get("/applications", hrRecruitmentController.getApplications);
router.put("/applications/:id/status", hrRecruitmentController.updateApplicationStatus);
router.put("/applications/:id/training", hrRecruitmentController.updateTrainingStatus);
// Converting an applicant creates a real User and Staff account inside a
// specific school, so it additionally requires an authoritative school context.
// authMiddleware resolves schoolId from the session's user document; a value
// supplied by the client is discarded and never accepted here.
router.post(
    "/applications/:id/convert",
    requireSchoolContext,
    hrRecruitmentController.convertToEmployee
);

// Interviews
router.post("/applications/:applicationId/interviews", hrRecruitmentController.scheduleInterview);
router.get("/interviews", hrRecruitmentController.getInterviews);
router.put("/interviews/:id", hrRecruitmentController.submitInterviewScore);

module.exports = router;
