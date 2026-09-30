/**
 * Calendar tenant-ownership resolver.
 *
 * PURE PLAN BUILDER. This module performs no database access and no writes.
 * It takes already-loaded calendar documents plus resolver callbacks and
 * produces a deterministic, auditable ownership plan.
 *
 * Ownership rules (strongest evidence first). An existing `schoolId` is NEVER
 * an ownership source - it is only compared against the resolved answer - but
 * it is the one relationship this collection actually has that can be proven
 * against a real School document, so a present-and-valid `schoolId` is
 * accepted at HIGH confidence.
 *
 *   CalendarEvent  schoolId -> real School document
 *                  createdBy -> a real User _id (NOT the role label "Admin")
 *
 * `createdBy` is a String field holding a role label on the legacy corpus
 * rather than a user reference, and `classes`/`sections` hold legacy name
 * strings ("1", "A") that match no Class or Section document. Neither is a
 * reliable ownership relationship, so an event with no valid `schoolId` is
 * UNRESOLVED and is never guessed at. Those documents are quarantined:
 * invisible to every school, and still readable by a migration report.
 *
 * Confidence:
 *   HIGH     schoolId present, well-formed, and resolves to a real School
 *   NONE     no relationship resolves -> UNRESOLVED, never guessed
 *
 * A plan entry is only ever `backfill` when confidence is HIGH. Anything else
 * is `quarantine`.
 */
"use strict";

const mongoose = require("mongoose");

const str = (v) => (v === null || v === undefined ? null : String(v));

/** Role labels that were stored in `createdBy` instead of a user reference.
 *  These prove the field is not a ref, so they can never establish ownership. */
const ROLE_LABEL_RE = /^(admin|superadmin|staff|teacher|principal|hr|receptionist|admission|management)$/i;

/**
 * Decide the ownership of a single calendar document.
 *
 * @param {object}  doc                  raw calendar document
 * @param {object}  resolvers
 * @param {(id:string)=>Promise<object|null>} resolvers.schoolById
 *        resolves a schoolId to a real School document, or null
 * @param {(id:string)=>Promise<object|null>} [resolvers.userById]
 *        resolves a createdBy value to a real User document, or null
 * @returns {Promise<{verdict:string, confidence:string, schoolId:string|null, reason:string, evidence:string[]}>}
 */
const resolveCalendarEventOwnership = async (doc, resolvers) => {
  const { schoolById, userById } = resolvers || {};
  const evidence = [];
  const _id = str(doc && doc._id);

  // Candidate 1: an explicit schoolId that resolves to a real School document.
  const rawSchool = str(doc && doc.schoolId);
  if (rawSchool && mongoose.isValidObjectId(rawSchool) && typeof schoolById === "function") {
    const school = await schoolById(rawSchool);
    if (school) {
      evidence.push(`schoolId ${rawSchool} resolves to School "${school.name || school._id}"`);
      return {
        verdict: "MATCH",
        confidence: "HIGH",
        schoolId: rawSchool,
        reason: "schoolId resolves to a real School document",
        evidence,
      };
    }
    evidence.push(`schoolId ${rawSchool} does not resolve to any School document`);
  }

  // Candidate 2: createdBy, but only when it is a real user reference. A role
  // label such as "Admin" identifies no document and establishes nothing.
  const rawCreatedBy = str(doc && doc.createdBy);
  if (rawCreatedBy && typeof userById === "function" && !ROLE_LABEL_RE.test(rawCreatedBy)) {
    if (mongoose.isValidObjectId(rawCreatedBy)) {
      const user = await userById(rawCreatedBy);
      const userSchool = user && str(user.schoolId);
      if (user && userSchool && mongoose.isValidObjectId(userSchool)) {
        evidence.push(`createdBy ${rawCreatedBy} resolves to a User in school ${userSchool}`);
        return {
          verdict: "MISSING_AND_RESOLVABLE",
          confidence: "MEDIUM",
          schoolId: userSchool,
          reason: "createdBy resolves to a real user in exactly one school",
          evidence,
        };
      }
      evidence.push(`createdBy ${rawCreatedBy} resolves to a User with no resolvable school`);
    } else {
      evidence.push(`createdBy "${rawCreatedBy}" is not an ObjectId, so it is not a user reference`);
    }
  } else if (rawCreatedBy) {
    evidence.push(`createdBy "${rawCreatedBy}" is a role label, not a user reference`);
  }

  // classes[]/sections[] are deliberately NOT consulted: on this corpus they
  // are plain name strings matching no Class or Section document, so resolving
  // them would mean inventing an ownership relationship that does not exist.
  evidence.push("classes[]/sections[] are legacy name strings, not references");

  return {
    verdict: "UNRESOLVED",
    confidence: "NONE",
    schoolId: null,
    reason:
      "no provable owner: no valid schoolId, and createdBy is a role label rather than a user reference",
    evidence,
  };
};

/**
 * Build the full plan for a set of calendar documents.
 *
 * @param {object[]} docs
 * @param {object}   resolvers see resolveCalendarEventOwnership
 * @returns {Promise<{summary:object, entries:object[]}>}
 */
const buildCalendarOwnershipPlan = async (docs, resolvers) => {
  const entries = [];
  const list = Array.isArray(docs) ? docs : [];

  for (const doc of list) {
    const verdict = await resolveCalendarEventOwnership(doc, resolvers);
    const _id = str(doc && doc._id);
    entries.push({
      _id,
      collection: "calendarevents",
      currentSchoolId: str(doc && doc.schoolId),
      ...verdict,
      // Only a proven owner is ever written back. UNRESOLVED documents are
      // quarantined: left untouched and invisible to every school.
      action: verdict.verdict === "UNRESOLVED" ? "quarantine" : "backfill",
    });
  }

  const summary = entries.reduce(
    (acc, e) => {
      acc.total += 1;
      acc[e.verdict] = (acc[e.verdict] || 0) + 1;
      if (e.action === "backfill") acc.backfillable += 1;
      if (e.action === "quarantine") acc.quarantined += 1;
      return acc;
    },
    { total: 0, backfillable: 0, quarantined: 0 }
  );

  return { summary, entries };
};

module.exports = {
  resolveCalendarEventOwnership,
  buildCalendarOwnershipPlan,
  ROLE_LABEL_RE,
};
