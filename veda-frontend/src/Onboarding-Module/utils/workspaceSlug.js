export const WORKSPACE_BASE_DOMAIN = "vedaschool.ai";
export const MIN_SLUG_LENGTH = 3;

export function generateWorkspaceSlug(schoolName) {
  if (!schoolName || typeof schoolName !== "string") return "";

  return schoolName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "")
    .slice(0, 63);
}

export function buildWorkspacePreviewUrl(workspaceSlug) {
  if (!workspaceSlug) return "";
  return `${workspaceSlug}.${WORKSPACE_BASE_DOMAIN}`;
}

export function isSlugLongEnough(slug) {
  return slug.length >= MIN_SLUG_LENGTH;
}
