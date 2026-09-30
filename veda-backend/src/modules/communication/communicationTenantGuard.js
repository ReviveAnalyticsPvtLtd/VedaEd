/**
 * Guards for the Communication module's routes.
 *
 * `communicationTenantContext` layers on top of the shared
 * `requireSchoolContext`:
 *   - it additionally discards a client-supplied `schoolId` from the PATH,
 *     which the shared guard only strips from body and query
 *   - it exposes req.communication.school, the single tenant every controller
 *     in this module is required to scope by
 *
 * `requireCommunicationRole` gates the management routes. The Communication
 * permissions are not present in the RBAC seed, so this uses the authenticated
 * role directly rather than adding permissions that would not be enforced.
 */
"use strict";

const mongoose = require("mongoose");
const requireSchoolContext = require("../../middleware/requireSchoolContext");
const { MANAGEMENT_ROLES } = require("./communicationTenantScope");

/** Discard a client-supplied school from the path as well as body/query. */
const stripPathSchoolId = (req) => {
    if (req.params && typeof req.params === "object") {
        delete req.params.schoolId;
    }
};

/**
 * Must be mounted after authMiddleware. Establishes the authoritative tenant.
 */
const communicationTenantContext = (req, res, next) =>
    requireSchoolContext(req, res, () => {
        stripPathSchoolId(req);
        const school = req.user.schoolId;
        if (!school || !mongoose.isValidObjectId(String(school))) {
            return res.status(403).json({
                success: false,
                code: "NO_SCHOOL_CONTEXT",
                message: "Your account is not linked to a school.",
            });
        }
        req.communication = { ...(req.communication || {}), schoolId: String(school) };
        return next();
    });

/**
 * Gate a route to the roles allowed to manage that kind of record.
 * @param {"notice"|"notification"|"template"|"log"|"complaint"} capability
 */
const requireCommunicationRole = (capability) => (req, res, next) => {
    const allowed = MANAGEMENT_ROLES[capability];
    if (!allowed) {
        return res.status(500).json({ success: false, message: "Unknown capability" });
    }
    const role = String(req.user?.role || "").toLowerCase();
    if (!allowed.includes(role)) {
        return res.status(403).json({
            success: false,
            code: "FORBIDDEN_ROLE",
            message: "Your role cannot perform this action.",
        });
    }
    return next();
};

module.exports = {
    communicationTenantContext,
    requireCommunicationRole,
    stripPathSchoolId,
};
