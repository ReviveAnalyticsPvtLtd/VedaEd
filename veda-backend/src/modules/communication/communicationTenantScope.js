/**
 * Shared tenant-scope helpers for the Communication module.
 *
 * Every rule in here exists to make one guarantee: a request can only ever read
 * or write communication records belonging to the school resolved from the
 * authenticated account by authMiddleware (`req.user.schoolId`).
 *
 * Nothing here ever reads a school from the request body, query string or path.
 */
"use strict";

const mongoose = require("mongoose");

const Student = require("../student/studentModels");
const Parent = require("../parents/parentModel");
const Staff = require("../staff/staffModels");
const Teacher = require("../teacher/teacherModel");
const User = require("../../models/User");

/**
 * Every collection that holds a tenant-owned party. A polymorphic ref in the
 * Communication schemas points at one of these.
 *
 * The stored model label is treated as a HINT, never as the only place to look:
 * the real corpus labels teacher refs "Teacher" while the document actually
 * lives in `staffs`. A MongoDB _id is unique, so resolving by _id across these
 * collections is deterministic. `resolvePartySchool` reports ambiguity instead
 * of guessing.
 */
const PARTY_MODELS = Object.freeze({
    Student,
    Parent,
    Staff,
    Teacher,
    User,
});

/** Roles allowed to manage each kind of communication record. */
const MANAGEMENT_ROLES = Object.freeze({
    notice: ["admin", "superadmin", "teacher", "staff"],
    notification: ["admin", "superadmin", "staff"],
    template: ["admin", "superadmin"],
    log: ["admin", "superadmin"],
    complaint: ["admin", "superadmin", "teacher", "staff"],
});

const FORBIDDEN = (message) => ({ success: false, message });

/** The authoritative tenant for this request. Always a validated ObjectId string. */
function schoolId(req) {
    const id = req.user && req.user.schoolId;
    if (!id || !mongoose.isValidObjectId(String(id))) {
        const err = new Error("NO_SCHOOL_CONTEXT");
        err.status = 403;
        err.code = "NO_SCHOOL_CONTEXT";
        throw err;
    }
    return String(id);
}

/**
 * Resolve a party ref to its school by _id across every tenant collection.
 * @returns {Promise<{schoolId: string|null, collection: string|null, ambiguous: boolean}>}
 */
async function resolvePartySchool(id) {
    if (!id || !mongoose.isValidObjectId(String(id))) {
        return { schoolId: null, collection: null, ambiguous: false };
    }
    const hits = [];
    for (const [name, Model] of Object.entries(PARTY_MODELS)) {
        const doc = await Model.findById(id).select("schoolId").lean();
        if (doc && doc.schoolId) hits.push({ schoolId: String(doc.schoolId), collection: name });
    }
    if (hits.length === 0) return { schoolId: null, collection: null, ambiguous: false };
    if (hits.length > 1) return { schoolId: null, collection: null, ambiguous: true };
    return hits[0];
}

/**
 * True when the path/query id refers to the authenticated actor themselves.
 *
 * The client legitimately sends either their own party refId or their own User
 * _id (the frontend uses `user.refId || user._id`), so both are accepted. Any
 * other id - in particular another school's student - is rejected.
 */
function isSelfActor(req, id) {
    if (!id) return false;
    const candidate = String(id);
    if (req.user.userId && String(req.user.userId) === candidate) return true;
    if (req.user.refId && String(req.user.refId) === candidate) return true;
    return false;
}

/**
 * Reject a request whose party id is somebody other than the caller.
 * Responds 403 and returns true when it rejected.
 */
function rejectForeignActor(req, res, id) {
    if (isSelfActor(req, id)) return false;
    res.status(403).json(
        FORBIDDEN("You may only access your own communications in this school.")
    );
    return true;
}

/**
 * Validate that every recipient belongs to the caller's school.
 * Responds 400/403 and returns true when it rejected.
 */
async function rejectForeignRecipients(res, ids, school) {
    const list = [...new Set((ids || []).filter(Boolean).map(String))];
    if (!list.length) return false;
    for (const id of list) {
        const r = await resolvePartySchool(id);
        if (r.ambiguous) {
            res.status(400).json(FORBIDDEN("A recipient reference is ambiguous and was rejected."));
            return true;
        }
        if (!r.schoolId) {
            res.status(400).json(FORBIDDEN("A recipient does not exist."));
            return true;
        }
        if (r.schoolId !== String(school)) {
            res.status(403).json(
                FORBIDDEN("One or more recipients belong to a different school.")
            );
            return true;
        }
    }
    return false;
}

/**
 * Flatten whatever shape a controller passed for recipients into a list of ids.
 */
function recipientIds(value) {
    if (!value) return [];
    const raw = Array.isArray(value) ? value : [value];
    return raw
        .map((v) => (v && typeof v === "object" ? v._id || v.user || v.id : v))
        .filter(Boolean);
}

/**
 * The label to store in a polymorphic `*Model` field.
 *
 * `User` and `Admin` are two Mongoose model names over the SAME `users`
 * collection (see models/User.js), and the existing corpus records those refs as
 * 'Admin'. Every schema enum lists 'Admin' and none lists 'User', so writing
 * 'User' would fail validation. The collection names are otherwise used as-is.
 *
 * Ownership is always re-resolved by _id, so the label is a display hint and a
 * validation concern, never the security boundary.
 */
const labelFor = (model) => (model === "User" ? "Admin" : model);

/**
 * Which tenant collection actually holds this _id?
 *
 * The ref's stored model label is unreliable in this corpus, so the collection
 * is discovered rather than assumed. An _id present in more than one collection
 * is reported as ambiguous.
 * @returns {Promise<{model: string|null, ambiguous: boolean}>}
 */
async function findPartyModel(id) {
    if (!id || !mongoose.isValidObjectId(String(id))) {
        return { model: null, ambiguous: false };
    }
    const hits = [];
    for (const name of Object.keys(PARTY_MODELS)) {
        const exists = await PARTY_MODELS[name].exists({ _id: id });
        if (exists) hits.push(name);
    }
    if (hits.length === 0) return { model: null, ambiguous: false };
    if (hits.length > 1) return { model: null, ambiguous: true };
    return { model: hits[0], ambiguous: false };
}

/**
 * The authenticated caller's own identity, as a party ref.
 *
 * Messages, notices and complaints store party refs (Student/Parent/Staff/
 * Teacher) on both sides, so the actor is the caller's `refId` when they have
 * one. Accounts with no refId (a SuperAdmin, for example) fall back to their own
 * User _id, which is still a real tenant-owned document.
 *
 * This is read from the user document on the server. It is never taken from
 * req.body, so a caller cannot post as another user.
 */
async function resolveActor(req) {
    if (req.communication && req.communication.actor) return req.communication.actor;

    const user = await User.findById(req.user.userId).select("refId schoolId").lean();
    if (!user) {
        const err = new Error("Authenticated account no longer exists.");
        err.status = 401;
        throw err;
    }

    const school = user.schoolId ? String(user.schoolId) : String(req.user.schoolId || "");
    let id = String(req.user.userId);
    let model = "User";

    if (user.refId) {
        const found = await findPartyModel(user.refId);
        if (found.model) {
            id = String(user.refId);
            model = found.model;
        }
    }

    const actor = { id, model, schoolId: school };
    req.communication = { ...(req.communication || {}), actor };
    return actor;
}

/**
 * Write a CommunicationLog with a server-derived actor and tenant.
 *
 * The actor is the authenticated user, never a body field, and schoolId comes
 * from the session, so a log can never be written into another school.
 */
async function logAction(req, { action, target, targetModel, details }) {
    const CommunicationLog = require("./communicationLogModel");
    const school = schoolId(req);
    // targetModel must be one of the CommunicationLog enum values.
    const allowed = ["Message", "Notice", "Complaint", "User", "Notification", "Template"];
    return CommunicationLog.create({
        schoolId: school,
        user: req.user.userId,
        // 'Admin' is the users collection alias used throughout the corpus.
        userModel: "Admin",
        action,
        target,
        targetModel: allowed.includes(targetModel) ? targetModel : "Notice",
        details,
    });
}

module.exports = {
    PARTY_MODELS,
    MANAGEMENT_ROLES,
    schoolId,
    resolvePartySchool,
    findPartyModel,
    resolveActor,
    isSelfActor,
    rejectForeignActor,
    rejectForeignRecipients,
    recipientIds,
    labelFor,
    logAction,
    FORBIDDEN,
};
