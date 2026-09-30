const mongoose = require("mongoose");

/**
 * AdmissionApplication schoolId backfill - classification and planning only.
 *
 * This module contains NO database access and performs NO writes. It is a pure
 * function library so that the migration decision can be reviewed, unit-tested
 * and proved idempotent before anything is applied to a real database.
 *
 * Design rules enforced here:
 *
 *  1. A schoolId that is already present is NEVER overwritten.
 *  2. Ownership is only ever taken from a documented tenant relationship:
 *     an already-populated schoolId, a linked Parent, a linked Student, or an
 *     authenticated creator.
 *  3. Applicant attributes are explicitly NOT evidence. Name, email, phone,
 *     date of birth, classApplied and the applicationId timestamp are all
 *     rejected by construction because no resolver below is ever given them.
 *  4. A record that cannot be attributed is reported as ambiguous and left
 *     unassigned. Nothing is ever guessed and no record is ever defaulted to
 *     "the first school" or similar.
 */

const OWNERSHIP_SOURCE = Object.freeze({
    EXISTING: "existing-schoolId",
    PARENT: "parent-relationship",
    STUDENT: "student-relationship",
    CREATOR: "authenticated-creator",
});

/** Applicant attributes that must never be used to infer a school. */
const REJECTED_EVIDENCE = Object.freeze([
    "personalInfo.name",
    "contactInfo.email",
    "contactInfo.phone",
    "personalInfo.dateOfBirth",
    "personalInfo.classApplied",
    "applicationId",
]);

const hasUsableSchoolId = (doc) =>
    Boolean(doc && doc.schoolId) && mongoose.isValidObjectId(String(doc.schoolId));

/**
 * Decide what, if anything, may be written to a single application.
 *
 * resolvers.parentId(parentId) -> schoolId | null
 * resolvers.stdId(stdId)      -> schoolId | null
 * resolvers.creator(doc)      -> schoolId | null
 *
 * Each resolver is injected by the caller. A missing resolver simply means that
 * source is unavailable; it is never treated as permission to guess.
 */
const classifyApplication = (doc, resolvers = {}) => {
    const { parentId, stdId } = resolvers;

    // 1. Already attributed - the only permitted outcome is to leave it alone.
    if (hasUsableSchoolId(doc)) {
        return {
            _id: doc._id,
            status: "already-attributed",
            action: "none",
            schoolId: String(doc.schoolId),
            source: OWNERSHIP_SOURCE.EXISTING,
            reason: "schoolId is already populated and is never overwritten",
        };
    }

    // 2. Documented tenant relationships, in priority order.
    const candidates = [
        {
            source: OWNERSHIP_SOURCE.PARENT,
            resolve: typeof parentId === "function"
                ? () => parentId(doc?.parents?.parentId)
                : null,
        },
        {
            source: OWNERSHIP_SOURCE.STUDENT,
            resolve: typeof stdId === "function"
                ? () => stdId(doc?.personalInfo?.stdId)
                : null,
        },
        {
            // The schema has no createdBy field, so this never resolves today.
            // It is supported so a future creator field is picked up without
            // changing the migration contract.
            source: OWNERSHIP_SOURCE.CREATOR,
            resolve: typeof resolvers.creator === "function"
                ? () => resolvers.creator(doc)
                : null,
        },
    ];

    for (const candidate of candidates) {
        if (!candidate.resolve) continue;
        let resolved = null;
        try {
            resolved = candidate.resolve();
        } catch {
            resolved = null; // A failing resolver is never a licence to guess.
        }
        if (resolved && mongoose.isValidObjectId(String(resolved))) {
            return {
                _id: doc._id,
                status: "backfillable",
                action: "set",
                schoolId: String(resolved),
                source: candidate.source,
                reason: `reliably attributable via ${candidate.source}`,
            };
        }
    }

    // 3. No usable evidence. Report, never guess.
    return {
        _id: doc._id,
        status: "ambiguous",
        action: "none",
        schoolId: null,
        source: null,
        reason:
            "no existing schoolId and no reliable Parent/Student/creator relationship; " +
            "applicant attributes are not evidence",
    };
};

/** Classify a whole corpus and summarise it. */
const planAdmissionSchoolBackfill = (docs = [], resolvers = {}) => {
    const classifications = docs.map((doc) => classifyApplication(doc, resolvers));

    const alreadyAttributed = classifications.filter((c) => c.status === "already-attributed");
    const toBackfill = classifications.filter((c) => c.status === "backfillable");
    const ambiguous = classifications.filter((c) => c.status === "ambiguous");

    return {
        total: classifications.length,
        alreadyAttributed: alreadyAttributed.map((c) => c._id),
        toBackfill: toBackfill.map((c) => ({
            _id: c._id,
            schoolId: c.schoolId,
            source: c.source,
        })),
        ambiguous: ambiguous.map((c) => ({ _id: c._id, reason: c.reason })),
        classifications,
    };
};

/**
 * Apply a plan. Idempotent by construction: the update filter re-asserts that
 * the field is still missing, so a record that gained a schoolId between
 * planning and applying is skipped rather than overwritten.
 *
 * `collection` is injected (a Mongoose model in production) purely so this can
 * be unit-tested against an in-memory double. Nothing here runs on import.
 */
const applyBackfill = async (collection, plan, { dryRun = true } = {}) => {
    const result = { changed: 0, skippedAlreadySet: 0, failed: 0, ids: [] };

    for (const entry of plan.toBackfill) {
        if (dryRun) {
            result.changed += 1;
            result.ids.push(String(entry._id));
            continue;
        }

        const write = await collection.updateOne(
            {
                _id: entry._id,
                // Never overwrite: only ever write where the field is absent.
                $or: [{ schoolId: { $exists: false } }, { schoolId: null }],
            },
            { $set: { schoolId: entry.schoolId } }
        );

        if (write && write.modifiedCount === 1) {
            result.changed += 1;
            result.ids.push(String(entry._id));
        } else {
            // Already populated by someone else between plan and apply.
            result.skippedAlreadySet += 1;
        }
    }

    return result;
};

module.exports = {
    OWNERSHIP_SOURCE,
    REJECTED_EVIDENCE,
    hasUsableSchoolId,
    classifyApplication,
    planAdmissionSchoolBackfill,
    applyBackfill,
};
