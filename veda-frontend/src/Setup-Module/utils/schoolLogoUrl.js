import config from "../../config";

/** Resolve stored logo path to a full URL for preview */
export function resolveSchoolLogoUrl(path) {
  if (!path || typeof path !== "string") return "";
  const cleaned = path.trim();
  if (!cleaned) return "";
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  if (cleaned.startsWith("blob:")) return cleaned;
  if (cleaned.startsWith("/uploads/")) {
    return `${config.SERVER_URL}${cleaned}`;
  }
  if (cleaned.startsWith("uploads/")) {
    return `${config.SERVER_URL}/${cleaned}`;
  }
  return `${config.SERVER_URL}/uploads/${encodeURIComponent(cleaned.split("/").pop() || "")}`;
}
