import config from "../config";

export const getBackendBaseUrl = () => {
  const apiBase = (config.API_BASE_URL || "http://localhost:5000/api").trim();
  return apiBase.replace(/\/api\/?$/, "");
};

const encodePathSegments = (value = "") =>
  value
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

/**
 * Build a browser URL for a student document record (path / url / fileUrl).
 */
export const getStudentDocumentUrl = (doc = {}) => {
  const backendBaseUrl = getBackendBaseUrl();
  const rawDocPath = doc?.path || doc?.url || doc?.fileUrl || doc?.document || "";
  const rawPath = String(rawDocPath).replace(/\\/g, "/").trim();

  if (!rawPath) return "";
  if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
    return encodeURI(rawPath);
  }

  if (rawPath.includes("public/uploads/")) {
    const trimmed = rawPath.split("public/uploads/")[1]?.replace(/^\/+/, "") || "";
    return trimmed ? `${backendBaseUrl}/uploads/${encodePathSegments(trimmed)}` : "";
  }

  if (rawPath.startsWith("/uploads/")) {
    return `${backendBaseUrl}${encodeURI(rawPath)}`;
  }

  if (rawPath.startsWith("uploads/")) {
    return `${backendBaseUrl}/${encodeURI(rawPath)}`;
  }

  const filename = rawPath.split("/").pop();
  return filename ? `${backendBaseUrl}/uploads/${encodeURIComponent(filename)}` : "";
};

export const normalizeStudentDocumentForAvatar = (doc = {}, idx = 0) => ({
  ...doc,
  id: doc._id || doc.id || idx + 1,
  _id: doc._id || doc.id || idx + 1,
  name: doc.name || doc.type || `Document ${idx + 1}`,
  type: doc.type || "",
  fileType: doc.fileType || "",
  path: doc.path || "",
  fileUrl: getStudentDocumentUrl(doc) || "",
});

const isImageDoc = (doc) => {
  const fileType = String(doc?.fileType || "").toLowerCase();
  const name = String(doc?.name || "").toLowerCase();
  return fileType.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(name);
};

const hasValidUrl = (doc) => !!doc?.fileUrl;

/**
 * Prefer passport / photo labeled images; otherwise latest image document.
 */
export const getLatestPassportPhotoUrlFromDocs = (docs = []) => {
  const prepared = (docs || []).map((d, i) =>
    d && d.fileUrl ? d : normalizeStudentDocumentForAvatar(d, i)
  );

  const matches = prepared.filter((doc) => {
    const typeText = String(doc.type || "").toLowerCase();
    const nameText = String(doc.name || "").toLowerCase();
    const looksPassport =
      typeText.includes("passport") ||
      nameText.includes("passport") ||
      typeText.includes("photo") ||
      nameText.includes("photo");
    return looksPassport && isImageDoc(doc) && hasValidUrl(doc);
  });

  if (matches.length) return matches[matches.length - 1].fileUrl || "";

  const imageDocs = prepared.filter((doc) => isImageDoc(doc) && hasValidUrl(doc));
  if (imageDocs.length) return imageDocs[imageDocs.length - 1].fileUrl || "";

  return "";
};
