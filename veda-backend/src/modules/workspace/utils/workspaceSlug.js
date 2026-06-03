const {
  WORKSPACE_BASE_DOMAIN,
  MIN_SLUG_LENGTH,
  MAX_SLUG_LENGTH,
} = require("../constants/workspaceConstants");

/**
 * Converts a school display name into a URL-safe workspace slug.
 * Rules: lowercase, strip special chars, collapse/remove spaces (no hyphens).
 */
function generateWorkspaceSlug(schoolName) {
  if (!schoolName || typeof schoolName !== "string") return "";

  return schoolName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}

function buildWorkspacePreviewUrl(workspaceSlug) {
  if (!workspaceSlug) return "";
  return `${workspaceSlug}.${WORKSPACE_BASE_DOMAIN}`;
}

function isValidSlugFormat(slug) {
  if (!slug || typeof slug !== "string") return false;
  if (slug.length < MIN_SLUG_LENGTH || slug.length > MAX_SLUG_LENGTH) return false;
  return /^[a-z0-9]+$/.test(slug);
}

module.exports = {
  generateWorkspaceSlug,
  buildWorkspacePreviewUrl,
  isValidSlugFormat,
  WORKSPACE_BASE_DOMAIN,
  MIN_SLUG_LENGTH,
  MAX_SLUG_LENGTH,
};
