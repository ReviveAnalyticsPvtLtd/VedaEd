const mongoose = require("mongoose");

/**
 * Login-account (User) tenant backfill - classification and planning only.
 *
 * This module contains NO database access and performs NO writes. It is a pure
 * function library so that the migration decision can be reviewed, unit-tested
 * and proved idempotent before anything is applied to a real database.
 *
 * It exists because the just-in-time login paths used to create User documents
 * with no schoolId at all, and because the login key they chose (User.email) was
 * derived from whichever field happened to be populated. Two students with no
 * contactInfo and the same placeholder username produced the same key, and the
 * second insert failed with E11000 duplicate key ... index: email_1. Those
 * failures also left orphaned accounts behind, permanently squatting the unique
 * login key that a later legitimate login needed.
 *
 * Design rules enforced here:
 *
 *  1. A User that already has a schoolId is NEVER touched.
 *  2. A school is only ever taken from the record the login account is linked
 *     to by refId. Name, email, phone, username and identifier matching are
 *     rejected by construction because no resolver below is ever given them.
 *  3. An account whose refId points at a record that no longer exists is
 *     REPORTED, never deleted. Removing a login account is a destructive
 *     decision that is out of scope for a backfill.
 *  4. A record that cannot be attributed is reported and left unassigned.
 *     Nothing is ever guessed or defaulted to "the first school".
 *  5. Applying is idempotent: only accounts with no schoolId are ever written,
 *     and each write is re-checked immediately before it is issued.
 */

const CATEGORY = Object.freeze({
  ALREADY_SCOPED: "already-scoped",
  ASSIGN_SCHOOL: "assign-school",
  ORPHAN: "orphan-refId-has-no-source-record",
  UNRESOLVABLE: "unresolvable-source-has-no-school",
  NO_REF: "no-refId-not-a-linked-login-account",
});

/** Attributes that must never be used to infer a school. */
const REJECTED_EVIDENCE = Object.freeze([
  "name",
  "email",
  "personalInfo.username",
  "personalInfo.stdId",
  "personalInfo.staffId",
  "parentId",
  "activeSession",
]);

/**
 * Builds an id -> source lookup from plain records. Pure: the caller supplies the
 * documents, this module never touches a database.
 *
 * @param {Array<{kind:string,_id:*,schoolId?:*,identifier?:string}>} records
 * @returns {Map<string, {kind:string,schoolId:?string, identifier:?string}>}
 */
const buildSourceIndex = (records = []) => {
  const index = new Map();
  for (const record of records) {
    if (!record || record._id == null) continue;
    index.set(String(record._id), {
      kind: record.kind,
      schoolId:
        record.schoolId && mongoose.isValidObjectId(String(record.schoolId))
          ? String(record.schoolId)
          : null,
      identifier: record.identifier || null,
    });
  }
  return index;
};

/**
 * Classifies a single login account. Pure.
 *
 * Orphan status is evaluated BEFORE and independently of school scoping. An
 * account whose person was deleted is a problem in its own right even when it
 * carries a schoolId, because it still occupies a unique login key that a later
 * legitimate login needs — that is precisely how a stale record caused an
 * E11000 duplicate key on User.email. Reporting it as merely "already-scoped"
 * would hide it.
 *
 * @param {{_id:*,schoolId?:*,refId?:*,email?:string}} user
 * @param {Map<string, object>} sourceIndex result of buildSourceIndex
 */
const classifyUser = (user, sourceIndex) => {
  const alreadyScoped = Boolean(
    user.schoolId && mongoose.isValidObjectId(String(user.schoolId))
  );

  const hasRef = user.refId != null;
  const source = hasRef ? sourceIndex.get(String(user.refId)) : null;
  const isOrphan = hasRef && !source;

  const base = {
    userId: String(user._id),
    email: user.email || null,
    isOrphan,
    hasSchoolId: alreadyScoped,
  };

  if (isOrphan) {
    return {
      ...base,
      category: CATEGORY.ORPHAN,
      schoolId: alreadyScoped ? String(user.schoolId) : null,
      reason: alreadyScoped
        ? "refId points at a student, parent, staff or application record that no longer exists; it still holds a unique login key"
        : "refId points at a student, parent, staff or application record that no longer exists",
    };
  }

  if (alreadyScoped) {
    return {
      ...base,
      category: CATEGORY.ALREADY_SCOPED,
      schoolId: String(user.schoolId),
      reason: "already has a schoolId; never modified",
    };
  }

  if (!hasRef) {
    return {
      ...base,
      category: CATEGORY.NO_REF,
      schoolId: null,
      reason:
        "no refId, so this is not a linked login account (for example a superadmin signup); nothing to infer from",
    };
  }

  if (!source.schoolId) {
    return {
      ...base,
      category: CATEGORY.UNRESOLVABLE,
      schoolId: null,
      reason: `linked ${source.kind} record has no schoolId; refusing to guess`,
    };
  }

  return {
    ...base,
    category: CATEGORY.ASSIGN_SCHOOL,
    schoolId: source.schoolId,
    sourceKind: source.kind,
    reason: `takes the school from the linked ${source.kind} record`,
  };
};

/**
 * Classifies a whole collection of login accounts. Pure.
 *
 * @returns {{summary: object, assignments: Array, report: Array}}
 */
const planBackfill = (users = [], sourceIndex = new Map()) => {
  const report = users.map((user) => classifyUser(user, sourceIndex));

  const summary = {
    total: report.length,
    alreadyScoped: 0,
    assignSchool: 0,
    orphan: 0,
    unresolvable: 0,
    noRef: 0,
  };

  const assignments = [];
  for (const entry of report) {
    switch (entry.category) {
      case CATEGORY.ALREADY_SCOPED:
        summary.alreadyScoped += 1;
        break;
      case CATEGORY.ASSIGN_SCHOOL:
        summary.assignSchool += 1;
        assignments.push(entry);
        break;
      case CATEGORY.ORPHAN:
        summary.orphan += 1;
        break;
      case CATEGORY.UNRESOLVABLE:
        summary.unresolvable += 1;
        break;
      case CATEGORY.NO_REF:
        summary.noRef += 1;
        break;
      default:
        break;
    }
  }

  return { summary, assignments, report };
};

/**
 * Applies a plan. Contains NO database access of its own: the caller injects the
 * writer, which is what keeps this testable and keeps the default dry run inert.
 *
 * Refuses to run unless explicitly passed dryRun: false, and re-checks each
 * account immediately before writing so a concurrent change is never clobbered.
 */
const applyBackfill = async (plan, deps = {}, { dryRun = true } = {}) => {
  const { readUser, writeUserSchoolId } = deps;

  if (typeof readUser !== "function" || typeof writeUserSchoolId !== "function") {
    throw new Error("applyBackfill requires readUser and writeUserSchoolId functions");
  }
  if (dryRun) {
    return { dryRun: true, changed: 0, skipped: plan.assignments.length, applied: [] };
  }

  const applied = [];
  let skipped = 0;

  for (const assignment of plan.assignments) {
    const current = await readUser(assignment.userId);
    if (!current) {
      skipped += 1;
      continue;
    }
    if (current.schoolId && mongoose.isValidObjectId(String(current.schoolId))) {
      // Somebody filled it in since planning. Never overwrite.
      skipped += 1;
      continue;
    }
    await writeUserSchoolId(assignment.userId, assignment.schoolId);
    applied.push(assignment);
  }

  return { dryRun: false, changed: applied.length, skipped, applied };
};

module.exports = {
  CATEGORY,
  REJECTED_EVIDENCE,
  buildSourceIndex,
  classifyUser,
  planBackfill,
  applyBackfill,
};
