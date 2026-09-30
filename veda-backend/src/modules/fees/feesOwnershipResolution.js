/**
 * READ-ONLY ownership resolution rules for the Fees module.
 *
 * This module is PURE: it imports nothing, touches no database, and performs no
 * I/O. It is handed already-loaded plain documents and returns a plan. Nothing
 * in here writes, and nothing in the application imports it at runtime, so
 * adding it cannot change existing behaviour.
 *
 * Ownership is derived only from TRUSTED, DECLARED relationships:
 *
 *   FeeTransaction.studentId -> Student.schoolId
 *   FeeLedger.studentId       -> Student.schoolId
 *   FeeLedger.transactionId   -> FeeTransaction.studentId -> Student.schoolId
 *   FeeAuditLog.studentId     -> Student.schoolId
 *
 * Name-, grade-, amount- and year-based reasoning is deliberately NOT treated
 * as evidence. It is collected separately and reported as `inadmissible`, so a
 * human reviewer can see the hint without the resolver ever acting on it.
 *
 * Classification contract:
 *   MATCH       the document already carries a schoolId and it resolves to a
 *               real School record -> nothing to do
 *   REPAIRABLE  no schoolId on the document, but a trusted relationship
 *               derives exactly one school deterministically
 *   CONFLICT    no schoolId, and two or more independent trusted relationships
 *               derive DIFFERENT schools -> never auto-assigned
 *   UNRESOLVED  insufficient trusted evidence, or a dangling reference
 */

const MATCH = "MATCH";
const REPAIRABLE = "REPAIRABLE";
const CONFLICT = "CONFLICT";
const UNRESOLVED = "UNRESOLVED";

const CLASSIFICATIONS = [MATCH, REPAIRABLE, CONFLICT, UNRESOLVED];

/** Relations that are genuine object references and may be trusted. */
const TRUSTED_REFERENCES = {
    feetransactions: ["studentId"],
    feeledgers: ["studentId", "transactionId"],
    feeauditlogs: ["studentId"],
};

const has = (doc, field) =>
    doc[field] !== undefined && doc[field] !== null && String(doc[field]).length > 0;

const id = (v) => (v && v._id !== undefined ? String(v._id) : v === undefined ? null : String(v));

/**
 * Flatten the trusted evidence for one document.
 *
 * @param {object} doc        the fee document (lean/plain)
 * @param {string} collection fee collection name
 * @param {object} ctx        {
 *   studentSchool:   Map<studentIdString, schoolIdString|null>
 *   transactionOf:   Map<transactionIdString, { studentId }>
 *   knownSchools:    Set<schoolIdString>
 * }
 * @returns {{schoolIds: string[], evidence: object[]}}
 */
function collectTrustedEvidence(doc, collection, ctx) {
    const { studentSchool, transactionOf, knownSchools } = ctx;
    const evidence = [];
    const schools = new Set();

    for (const field of TRUSTED_REFERENCES[collection] || []) {
        if (!has(doc, field)) continue;

        if (field === "studentId") {
            const studentId = id(doc.studentId);
            const known = studentSchool.get(studentId);
            if (known === undefined) {
                evidence.push({
                    source: "Student",
                    via: "studentId",
                    refId: studentId,
                    resolved: false,
                    note: "no Student document with this _id",
                });
            } else if (known === null) {
                evidence.push({
                    source: "Student",
                    via: "studentId",
                    refId: studentId,
                    resolved: false,
                    note: "Student exists but carries no schoolId",
                });
            } else {
                evidence.push({
                    source: "Student",
                    via: "studentId",
                    refId: studentId,
                    resolved: true,
                    schoolId: known,
                    knownSchool: knownSchools.has(known),
                });
                schools.add(known);
            }
        }

        if (field === "transactionId") {
            // A ledger row can be reached through the transaction it offsets.
            // This is a genuine reference, not a name match.
            const txId = id(doc.transactionId);
            const tx = transactionOf.get(txId);
            if (!tx) {
                evidence.push({
                    source: "FeeTransaction",
                    via: "transactionId",
                    refId: txId,
                    resolved: false,
                    note: "no FeeTransaction document with this _id",
                });
            } else if (!has(tx, "studentId")) {
                evidence.push({
                    source: "FeeTransaction",
                    via: "transactionId",
                    refId: txId,
                    resolved: false,
                    note: "referenced FeeTransaction has no studentId",
                });
            } else {
                const viaStudent = id(tx.studentId);
                const known = studentSchool.get(viaStudent);
                if (known) {
                    evidence.push({
                        source: "FeeTransaction->Student",
                        via: "transactionId",
                        refId: txId,
                        resolved: true,
                        schoolId: known,
                        knownSchool: knownSchools.has(known),
                    });
                    schools.add(known);
                } else {
                    evidence.push({
                        source: "FeeTransaction->Student",
                        via: "transactionId",
                        refId: txId,
                        resolved: false,
                        note: "referenced transaction's student does not resolve to a school",
                    });
                }
            }
        }
    }

    return { schoolIds: [...schools], evidence };
}

/**
 * Classify a single fee document.
 *
 * @param {object} doc
 * @param {string} collection
 * @param {object} ctx
 * @param {object} [doc.inadmissible] hints gathered by the caller, never acted on
 */
function classify(doc, collection, ctx, docInadmissible = []) {
    const row = {
        collection,
        _id: id(doc._id),
        currentSchoolId: has(doc, "schoolId") ? id(doc.schoolId) : null,
        proposedSchoolId: null,
        classification: UNRESOLVED,
        evidence: { trusted: [], inadmissible: docInadmissible },
        reason: "",
    };

    const { schoolIds, evidence } = collectTrustedEvidence(doc, collection, ctx);
    row.evidence.trusted = evidence;

    // ---- already owned -----------------------------------------------------
    if (row.currentSchoolId) {
        if (!ctx.knownSchools.has(row.currentSchoolId)) {
            row.classification = UNRESOLVED;
            row.reason =
                "document already carries a schoolId that does not match any School record (dangling tenant reference)";
            return row;
        }
        row.classification = MATCH;
        row.proposedSchoolId = row.currentSchoolId;
        row.reason =
            "document already carries a schoolId that resolves to a real School record; no migration action required";
        return row;
    }

    // ---- derive from trusted relationships ---------------------------------
    const distinct = [...new Set(schoolIds)];

    if (distinct.length === 1) {
        const school = distinct[0];
        if (!ctx.knownSchools.has(school)) {
            row.classification = UNRESOLVED;
            row.reason =
                "trusted relationship derives a schoolId that does not match any School record (dangling reference)";
            return row;
        }
        row.classification = REPAIRABLE;
        row.proposedSchoolId = school;
        row.reason = `no schoolId on the document, but ${evidence
            .filter((e) => e.resolved)
            .map((e) => `${e.source} via ${e.via}`)
            .join(" and ")} derives exactly one school`;
        return row;
    }

    if (distinct.length > 1) {
        row.classification = CONFLICT;
        row.reason = `independent trusted relationships derive ${distinct.length} different schools (${distinct.join(
            ", "
        )}); ownership is ambiguous and must never be auto-assigned`;
        return row;
    }

    // ---- no trusted evidence ----------------------------------------------
    const unresolvedButResolvable = evidence.length > 0;
    row.classification = UNRESOLVED;
    row.reason = unresolvedButResolvable
        ? "document has no schoolId and no trusted relationship resolves to a school"
        : "document has no schoolId and this model carries no trusted ownership reference at all";
    return row;
}

/**
 * Group the plan by classification and produce the exact counts.
 */
function summarise(rows) {
    const counts = { MATCH: 0, REPAIRABLE: 0, CONFLICT: 0, UNRESOLVED: 0 };
    for (const r of rows) counts[r.classification] += 1;
    return counts;
}

module.exports = {
    MATCH,
    REPAIRABLE,
    CONFLICT,
    UNRESOLVED,
    CLASSIFICATIONS,
    TRUSTED_REFERENCES,
    classify,
    collectTrustedEvidence,
    summarise,
};
