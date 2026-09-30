const mongoose = require("mongoose");
const Institution = require("./institutionModel");

const getSchoolId = (req) => {
    const schoolId = req.user?.schoolId;
    if (!schoolId || !mongoose.isValidObjectId(String(schoolId))) {
        return null;
    }
    return String(schoolId);
};

const NO_SCHOOL_CONTEXT_RESPONSE = {
    success: false,
    code: "NO_SCHOOL_CONTEXT",
    message: "Your account is not linked to a school.",
};

const sanitizeInstitutionPayload = (body = {}) => {
    const clean = {};
    if (body.identity && typeof body.identity === "object") {
        clean.identity = { ...body.identity };
        delete clean.identity.schoolId;
        delete clean.identity._id;
    }
    if (body.branding && typeof body.branding === "object") {
        clean.branding = { ...body.branding };
        delete clean.branding.schoolId;
        delete clean.branding._id;
    }
    if (body.domain && typeof body.domain === "object") {
        clean.domain = { ...body.domain };
        delete clean.domain.schoolId;
        delete clean.domain._id;
    }
    if (body.modules && typeof body.modules === "object") {
        clean.modules = { ...body.modules };
        delete clean.modules.schoolId;
        delete clean.modules._id;
    }
    if (body.contact && typeof body.contact === "object") {
        clean.contact = { ...body.contact };
        delete clean.contact.schoolId;
        delete clean.contact._id;
    }
    if (body.status && ["Draft", "Published"].includes(body.status)) {
        clean.status = body.status;
    }
    return clean;
};

// Get institution setup data for the authenticated school
exports.getInstitution = async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        if (!schoolId) {
            return res.status(403).json(NO_SCHOOL_CONTEXT_RESPONSE);
        }

        const institution = await Institution.findOne({ schoolId }).lean();
        if (!institution) {
            return res.status(200).json({
                success: true,
                data: null,
                message: "No institution setup found",
            });
        }
        return res.status(200).json({
            success: true,
            data: institution,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch institution data",
            error: error.message,
        });
    }
};

// Update or create institution setup for the authenticated school
exports.updateInstitution = async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        if (!schoolId) {
            return res.status(403).json(NO_SCHOOL_CONTEXT_RESPONSE);
        }

        const sanitizedData = sanitizeInstitutionPayload(req.body);

        const institution = await Institution.findOneAndUpdate(
            { schoolId },
            {
                $set: sanitizedData,
                $setOnInsert: { schoolId },
            },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        ).lean();

        return res.status(200).json({
            success: true,
            data: institution,
            message: "Institution setup saved successfully",
        });
    } catch (error) {
        console.error("Error updating institution:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to save institution setup",
            error: error.message,
        });
    }
};

// Handle file uploads (Logo and Cover Image) strictly for the authenticated school
exports.uploadInstitutionAssets = async (req, res) => {
    try {
        const schoolId = getSchoolId(req);
        if (!schoolId) {
            return res.status(403).json(NO_SCHOOL_CONTEXT_RESPONSE);
        }

        if (!req.files || (!req.files.logo && !req.files.coverImage)) {
            return res.status(400).json({ success: false, message: "No files uploaded" });
        }

        const institution = await Institution.findOne({ schoolId });
        if (!institution) {
            return res.status(404).json({ success: false, message: "Please save basic details first" });
        }

        const updateFields = {};
        if (req.files.logo && req.files.logo[0]) {
            updateFields["branding.logo"] = req.files.logo[0].filename;
        }
        if (req.files.coverImage && req.files.coverImage[0]) {
            updateFields["branding.coverImage"] = req.files.coverImage[0].filename;
        }

        const updatedInstitution = await Institution.findOneAndUpdate(
            { _id: institution._id, schoolId },
            { $set: updateFields },
            { new: true }
        ).lean();

        return res.status(200).json({
            success: true,
            data: updatedInstitution,
            message: "Assets uploaded successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to upload assets",
            error: error.message,
        });
    }
};
