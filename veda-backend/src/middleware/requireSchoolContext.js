/**
 * requireSchoolContext
 *
 * Rejects requests whose authenticated account has no resolvable school.
 *
 * This guard performs NO database migration and modifies NO tenant-owned record.
 * It only reads the school identity that authMiddleware already resolved from
 * the authenticated user document.
 *
 * The school identity is NEVER taken from the client. Anything the client sends
 * as `schoolId` in the body or query string is stripped before the request
 * continues, so a downstream `new Model(req.body)` can never mass-assign a
 * caller-supplied school. The value on `req.user.schoolId` is the only authority.
 *
 * Must always be mounted after authMiddleware.
 */

const mongoose = require("mongoose");

const NO_SCHOOL_CONTEXT_MESSAGE = "Your account is not linked to a school.";

/**
 * Removes client-supplied school identifiers from the request.
 * Exported for reuse and for direct testing.
 */
const stripClientSuppliedSchoolId = (req) => {
  if (req.body && typeof req.body === "object") {
    delete req.body.schoolId;
  }
  if (req.query && typeof req.query === "object") {
    delete req.query.schoolId;
  }
};

const requireSchoolContext = (req, res, next) => {
  // 1. Authenticated at all?
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHENTICATED",
      message: "Authentication required",
    });
  }

  // Discard anything the client tried to assert about its school.
  stripClientSuppliedSchoolId(req);

  // 2. Authoritative school resolved by authMiddleware?
  const schoolId = req.user.schoolId;
  if (!schoolId || !mongoose.isValidObjectId(String(schoolId))) {
    return res.status(403).json({
      success: false,
      code: "NO_SCHOOL_CONTEXT",
      message: NO_SCHOOL_CONTEXT_MESSAGE,
    });
  }

  // 3. Continue. req.user.schoolId is the authoritative tenant context.
  return next();
};

module.exports = requireSchoolContext;
module.exports.requireSchoolContext = requireSchoolContext;
module.exports.stripClientSuppliedSchoolId = stripClientSuppliedSchoolId;
module.exports.NO_SCHOOL_CONTEXT_MESSAGE = NO_SCHOOL_CONTEXT_MESSAGE;
