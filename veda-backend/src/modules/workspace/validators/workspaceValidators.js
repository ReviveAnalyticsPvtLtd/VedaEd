const {
  RESERVED_SLUGS,
  MIN_SLUG_LENGTH,
  MAX_SLUG_LENGTH,
} = require("../constants/workspaceConstants");
const {
  generateWorkspaceSlug,
  isValidSlugFormat,
} = require("../utils/workspaceSlug");

const MIN_SCHOOL_NAME_LENGTH = 2;
const MAX_SCHOOL_NAME_LENGTH = 200;

function validateSchoolName(schoolName) {
  const errors = [];
  const trimmed = String(schoolName || "").trim();

  if (!trimmed) {
    errors.push("School name is required");
    return { errors, trimmed };
  }

  if (trimmed.length < MIN_SCHOOL_NAME_LENGTH) {
    errors.push(`School name must be at least ${MIN_SCHOOL_NAME_LENGTH} characters`);
  }

  if (trimmed.length > MAX_SCHOOL_NAME_LENGTH) {
    errors.push(`School name must be at most ${MAX_SCHOOL_NAME_LENGTH} characters`);
  }

  return { errors, trimmed };
}

function validateWorkspaceSlug(slug, { schoolName } = {}) {
  const errors = [];
  const normalized = String(slug || "").trim().toLowerCase();

  if (!normalized) {
    errors.push("Workspace slug could not be generated. Enter a valid school name.");
    return { errors, slug: normalized };
  }

  if (!isValidSlugFormat(normalized)) {
    errors.push(
      "Workspace slug must contain only lowercase letters and numbers"
    );
  }

  if (normalized.length < MIN_SLUG_LENGTH) {
    errors.push(`Workspace slug must be at least ${MIN_SLUG_LENGTH} characters`);
  }

  if (normalized.length > MAX_SLUG_LENGTH) {
    errors.push(`Workspace slug must be at most ${MAX_SLUG_LENGTH} characters`);
  }

  if (RESERVED_SLUGS.has(normalized)) {
    errors.push("This workspace name is reserved. Please choose another school name.");
  }

  if (schoolName) {
    const expected = generateWorkspaceSlug(schoolName);
    if (expected && normalized !== expected) {
      errors.push("Workspace slug does not match the school name");
    }
  }

  return { errors, slug: normalized };
}

function validateCheckWorkspaceBody(body) {
  const errors = [];
  const schoolResult = validateSchoolName(body?.schoolName);
  errors.push(...schoolResult.errors);

  const slugResult = validateWorkspaceSlug(body?.workspaceSlug, {
    schoolName: schoolResult.trimmed,
  });
  errors.push(...slugResult.errors);

  return {
    errors,
    schoolName: schoolResult.trimmed,
    workspaceSlug: slugResult.slug,
  };
}

function validateSaveSchoolInfoBody(body) {
  return validateCheckWorkspaceBody(body);
}

module.exports = {
  validateSchoolName,
  validateWorkspaceSlug,
  validateCheckWorkspaceBody,
  validateSaveSchoolInfoBody,
};
