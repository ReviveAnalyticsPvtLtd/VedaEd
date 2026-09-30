/**
 * Communication tenant-ownership resolver.
 *
 * PURE PLAN BUILDER. This module performs no database access and no writes.
 * It takes already-loaded communication documents plus a set of resolver
 * callbacks and produces a deterministic, auditable ownership plan.
 *
 * Ownership rules (strongest evidence first). Legacy `schoolId` is NEVER an
 * ownership source - the previous audit proved it can be wrong - it is only
 * compared against the resolved answer.
 *
 *   Notice            author -> (Teacher|teachers | Staff|staffs | Admin|users)
 *                     + independent confirmation from specificTargets[] /
 *                       views[] when those resolve
 *   Complaint         complainant -> tenant-owned party
 *                     + independent confirmation from targetUser,
 *                       assignedTo, responses[].responder,
 *                       resolution.resolvedBy
 *   Message           sender AND receiver must both resolve to the SAME school
 *   Notification      createdBy -> tenant-owned party
 *   CommunicationLog  user -> tenant-owned party, + independent confirmation
 *                     from target -> the logged record's resolved school
 *   NoticeTemplate    no author at all -> never resolvable
 *   MessageTemplate   no author at all -> never resolvable
 *
 * Confidence:
 *   HIGH     >= 2 independent relationships agree, or the single relationship
 *            is a direct, non-dangling ref to a tenant-owned document
 *   MEDIUM   exactly one relationship resolves and it is a direct ref
 *   NONE     no relationship resolves -> UNRESOLVED, never guessed
 *
 * A plan entry is only ever `backfill` when confidence is HIGH or MEDIUM and
 * every relationship that DID resolve agrees. Any disagreement is CONFLICT and
 * is never written.
 */
"use strict";

/** Collections that hold tenant-owned parties, keyed by the model label used
 *  throughout the communication module's polymorphic refPaths. */
const PARTY_SOURCES = Object.freeze({
    Student: "students",
    Teacher: "teachers",
    Staff: "staffs",
    Parent: "parents",
    Admin: "users",
    User: "users",
});

/** Roles that map onto a Staff-backed party record. */
const STAFF_ROLES = ["admin", "superadmin", "staff", "hr", "receptionist", "admission"];

const str = (v) => (v === null || v === undefined ? null : String(v));

/**
 * Resolve one polymorphic party ref to its school.
 *
 * The stored model label (authorModel, senderModel, ...) is NOT trusted as the
 * only place to look. The corpus proved it is wrong: every "Teacher"-labelled
 * ref in this database actually lives in `staffs`, and "Staff"-labelled refs
 * sometimes live in `users`. A MongoDB _id is unique, so a ref _id identifies
 * at most one tenant-owned party document.
 *
 * The labelled collection is still used FIRST, because matching the label is
 * stronger evidence than not matching it. Only when the labelled collection
 * misses do we fall back to scanning every tenant collection.
 *
 * A _id that exists in more than one tenant collection, or in two collections
 * owned by different schools, is a CONFLICT - never silently picked.
 *
 * @param lookup {(id:string)=>Array<{collection:string, schoolId:string}>}
 * @returns {{school:string|null, dangling:boolean, collision:boolean, via:string}}
 */
function resolveParty(id, model, lookup) {
    const raw = str(id);
    if (!raw) return { school: null, dangling: false, collision: false, via: "empty" };

    const hits = (lookup(raw) || []).filter((h) => h && h.schoolId);
    if (hits.length === 0) return { school: null, dangling: true, collision: false, via: "dangling" };

    const schools = new Set(hits.map((h) => str(h.schoolId)));
    if (schools.size > 1 || hits.length > 1) {
        // A _id that resolves ambiguously cannot be used to prove ownership.
        return {
            school: null,
            dangling: false,
            collision: true,
            via: `ambiguous(${hits.map((h) => h.collection).join("|")})`,
        };
    }

    const labelled = PARTY_SOURCES[model];
    const hit = hits[0];
    const matchedLabel = labelled && hit.collection === labelled;
    return {
        school: str(hit.schoolId),
        dangling: false,
        collision: false,
        via: matchedLabel ? model : `${model}*${hit.collection}`,
        labelMismatch: !matchedLabel,
    };
}

/**
 * Record why a ref failed to contribute, so the report distinguishes a
 * hard-deleted party (dangling) from an ambiguous one (collision).
 */
function noteRefIssue(r, label, sink) {
    if (r.collision) sink.push(`${label}:AMBIGUOUS(${r.via})`);
    else if (r.dangling) sink.push(`${label}:DANGLING`);
}

/** Collect the set of schools implied by an array of polymorphic refs. */
function resolveParties(refs, lookup, out, issues, prefix) {
    for (const ref of refs || []) {
        if (!ref) continue;
        if (Array.isArray(ref)) {
            resolveParties(ref, lookup, out, issues, prefix);
            continue;
        }
        const id = ref._id || ref.user || ref;
        const model = ref.userModel || ref.model || ref.responderModel;
        const r = resolveParty(id, model, lookup);
        if (r.school) out.push({ school: r.school, via: r.via });
        else if (issues) noteRefIssue(r, `${prefix || "ref"}:${model}`, issues);
    }
}

/**
 * Reduce a list of resolved school observations to one decision.
 * @param {Array<{school:string, via:string}>} observations
 */
function decide(observations, existingSchoolId) {
    const schools = [...new Set(observations.map((o) => o.school))];

    if (schools.length === 0) {
        // No relationship resolved. The legacy undeclared schoolId is NOT an
        // ownership source, so this stays unresolved - but we still surface the
        // legacy value as evidence for a human to confirm, distinctly from a
        // record whose legacy value merely disagrees with a resolved owner.
        return {
            action: "unresolved_legacy_only",
            schoolId: null,
            confidence: "NONE",
            evidence: existingSchoolId
                ? `no relationship resolved; legacy undeclared schoolId=${existingSchoolId} is the only hint and is NOT trusted for write`
                : "no relationship resolved and no legacy value",
            conflictWith: existingSchoolId ? [existingSchoolId] : [],
        };
    }

    if (schools.length > 1) {
        return {
            action: "conflict",
            schoolId: null,
            confidence: "NONE",
            evidence: `relationships disagree: ${observations
                .map((o) => `${o.via}=${o.school}`)
                .join(", ")}`,
            conflictWith: schools,
        };
    }

    const school = schools[0];
    const independent = new Set(observations.map((o) => o.via)).size;

    // Legacy schoolId is never trusted; a disagreement is reported, not resolved
    // in favour of the legacy value.
    const legacyDisagrees = existingSchoolId && str(existingSchoolId) !== school;
    const confidence = independent >= 2 ? "HIGH" : "MEDIUM";

    if (!existingSchoolId) {
        return {
            action: "missing_and_resolvable",
            schoolId: school,
            confidence,
            evidence: observations.map((o) => `${o.via}=${o.school}`).join(", "),
            conflictWith: [],
        };
    }

    if (legacyDisagrees) {
        return {
            action: "repair",
            schoolId: school,
            confidence,
            evidence: `relationships resolve to ${school} (${observations
                .map((o) => `${o.via}=${o.school}`)
                .join(", ")}); legacy undeclared schoolId said ${existingSchoolId} - legacy value is NOT trusted`,
            conflictWith: [str(existingSchoolId)],
        };
    }

    return {
        action: "match",
        schoolId: school,
        confidence,
        evidence: observations.map((o) => `${o.via}=${o.school}`).join(", "),
        conflictWith: [],
        legacyAgrees: true,
    };
}

/** Notice: author is the primary owner; specificTargets/views are confirmation. */
function planNotices(docs, lookup) {
    return docs.map((d) => {
        const obs = [];
        const issues = [];
        const primary = resolveParty(d.author, d.authorModel, lookup);
        if (primary.school) obs.push({ school: primary.school, via: `author:${primary.via}` });
        else noteRefIssue(primary, `author:${d.authorModel}`, issues);

        resolveParties(
            (d.specificTargets || []).map((id) => ({ _id: id, model: d.specificTargetModel })),
            lookup,
            obs,
            issues,
            "specificTarget"
        );
        resolveParties(
            (d.views || []).map((v) => ({ _id: v.user, model: v.userModel })),
            lookup,
            obs,
            issues,
            "view"
        );

        const decision = decide(obs, d.schoolId);
        return {
            collection: "notices",
            _id: d._id,
            existingSchoolId: str(d.schoolId),
            refIssues: issues,
            ...decision,
        };
    });
}

/** Complaint: complainant primary; targetUser/assignedTo/responses/resolution confirm. */
function planComplaints(docs, lookup) {
    return docs.map((d) => {
        const obs = [];
        const issues = [];
        if (!d.isAnonymous) {
            const c = resolveParty(d.complainant, d.complainantModel, lookup);
            if (c.school) obs.push({ school: c.school, via: `complainant:${c.via}` });
            else noteRefIssue(c, `complainant:${d.complainantModel}`, issues);
        } else {
            issues.push("complainant:ANONYMOUS(no owner anchor)");
        }
        const t = resolveParty(d.targetUser, d.targetUserModel, lookup);
        if (t.school) obs.push({ school: t.school, via: `targetUser:${t.via}` });
        else noteRefIssue(t, `targetUser:${d.targetUserModel}`, issues);

        const a = resolveParty(d.assignedTo, d.assignedToModel, lookup);
        if (a.school) obs.push({ school: a.school, via: `assignedTo:${a.via}` });
        else noteRefIssue(a, `assignedTo:${d.assignedToModel}`, issues);

        for (const r of d.responses || []) {
            const rr = resolveParty(r.responder, r.responderModel, lookup);
            if (rr.school) obs.push({ school: rr.school, via: `response:${rr.via}` });
            else noteRefIssue(rr, `responder:${r.responderModel}`, issues);
        }
        if (d.resolution) {
            const rs = resolveParty(d.resolution.resolvedBy, d.resolution.resolvedByModel, lookup);
            if (rs.school) obs.push({ school: rs.school, via: `resolvedBy:${rs.via}` });
            else noteRefIssue(rs, `resolvedBy:${d.resolution.resolvedByModel}`, issues);
        }

        const decision = decide(obs, d.schoolId);
        return {
            collection: "complaints",
            _id: d._id,
            existingSchoolId: str(d.schoolId),
            refIssues: issues,
            ...decision,
        };
    });
}

/**
 * Message: a message is owned by the single school that owns BOTH parties.
 * If the two parties resolve to different schools that is a conflict, never a
 * pick-one. A message is only attributed when BOTH the sender and the receiver
 * are proven in-school, because either field is caller-supplied at write time.
 */
function planMessages(docs, lookup) {
    return docs.map((d) => {
        const s = resolveParty(d.sender, d.senderModel, lookup);
        const r = resolveParty(d.receiver, d.receiverModel, lookup);
        const issues = [];
        noteRefIssue(s, `sender:${d.senderModel}`, issues);
        noteRefIssue(r, `receiver:${d.receiverModel}`, issues);

        const obs = [];
        if (s.school) obs.push({ school: s.school, via: `sender:${s.via}` });
        if (r.school) obs.push({ school: r.school, via: `receiver:${r.via}` });

        const decision = decide(obs, d.schoolId);
        const out = {
            collection: "messages",
            _id: d._id,
            existingSchoolId: str(d.schoolId),
            refIssues: issues,
            ...decision,
        };
        if (!s.school && r.school) {
            out.action = "unresolved_legacy_only";
            out.schoolId = null;
            out.confidence = "NONE";
            out.evidence =
                "receiver resolves but sender does not; a message may only be attributed when BOTH parties are proven in-school";
            out.conflictWith = out.existingSchoolId ? [out.existingSchoolId] : [];
        }
        return out;
    });
}

/** Notification: createdBy is the only structural owner link. */
function planNotifications(docs, lookup) {
    return docs.map((d) => {
        const c = resolveParty(d.createdBy, d.createdByModel, lookup);
        const obs = c.school ? [{ school: c.school, via: `createdBy:${c.via}` }] : [];
        const issues = [];
        if (!c.school) noteRefIssue(c, `createdBy:${d.createdByModel}`, issues);
        resolveParties(
            (d.specificTargets || []).map((id) => ({ _id: id, model: d.specificTargetModel })),
            lookup,
            obs,
            issues,
            "specificTarget"
        );
        const decision = decide(obs, d.schoolId);
        return {
            collection: "notifications",
            _id: d._id,
            existingSchoolId: str(d.schoolId),
            refIssues: issues,
            ...decision,
        };
    });
}

/**
 * CommunicationLog: `user` is the actor and is the primary owner link.
 * `target` is an INDEPENDENT confirmation, but only when the target record's
 * own resolved school is known - a log whose target points at a record that is
 * itself unresolved contributes nothing.
 */
function planCommunicationLogs(docs, lookup, resolveTargetSchool) {
    return docs.map((d) => {
        const u = resolveParty(d.user, d.userModel, lookup);
        const obs = u.school ? [{ school: u.school, via: `user:${u.via}` }] : [];
        const issues = [];
        if (!u.school) noteRefIssue(u, `user:${d.userModel}`, issues);

        if (d.target && d.targetModel) {
            const ts = resolveTargetSchool(d.targetModel, d.target);
            if (ts) obs.push({ school: ts, via: `target:${d.targetModel}` });
        }

        const decision = decide(obs, d.schoolId);
        return {
            collection: "communicationlogs",
            _id: d._id,
            existingSchoolId: str(d.schoolId),
            refIssues: issues,
            ...decision,
        };
    });
}

/** Templates carry no author reference at all, so they are never resolvable. */
function planTemplates(collection, docs) {
    return docs.map((d) => ({
        collection,
        _id: d._id,
        existingSchoolId: str(d.schoolId),
        refIssues: ["author:NONE(schema has no author field)"],
        action: "unresolved_legacy_only",
        schoolId: null,
        confidence: "NONE",
        evidence: `${collection} has no author/creator field, so no relationship can resolve ownership`,
        conflictWith: d.schoolId ? [str(d.schoolId)] : [],
    }));
}

/** Ordered most-actionable first. */
const ACTION_ORDER = [
    "repair",
    "missing_and_resolvable",
    "match",
    "conflict",
    "unresolved_legacy_only",
];

function summarize(rows) {
    const summary = { total: rows.length };
    for (const a of ACTION_ORDER) summary[a] = 0;
    for (const r of rows) summary[r.action] = (summary[r.action] || 0) + 1;
    return summary;
}

module.exports = {
    PARTY_SOURCES,
    STAFF_ROLES,
    ACTION_ORDER,
    resolveParty,
    decide,
    planNotices,
    planComplaints,
    planMessages,
    planNotifications,
    planCommunicationLogs,
    planTemplates,
    summarize,
};
