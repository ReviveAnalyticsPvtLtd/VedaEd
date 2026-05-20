import React, { useEffect, useMemo, useState } from "react";
import config from "../config";

const IMAGE_KEYS = [
  "profileImage",
  "profilePic",
  "profilePhoto",
  "avatar",
  "photo",
  "image",
  "userImage",
  "passportPhoto",
];

const extractImageValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.url || value.path || value.fileUrl || value.document || "";
  }
  return "";
};

const resolveUploadsUrl = (value) => {
  const raw = String(extractImageValue(value) || "").trim();
  if (!raw || raw === "#" || raw.toLowerCase() === "null" || raw.toLowerCase() === "undefined") return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  const cleaned = raw.replace(/\\/g, "/");
  if (cleaned.includes("public/uploads/")) {
    const fileName = cleaned.split("public/uploads/")[1]?.replace(/^\/+/, "");
    return fileName ? `${config.SERVER_URL}/uploads/${encodeURIComponent(fileName)}` : "";
  }
  if (cleaned.startsWith("/uploads/")) {
    return `${config.SERVER_URL}${cleaned}`;
  }
  if (cleaned.startsWith("uploads/")) {
    return `${config.SERVER_URL}/${cleaned}`;
  }

  return `${config.SERVER_URL}/uploads/${encodeURIComponent(cleaned.split("/").pop() || "")}`;
};

export const resolveProfileImage = (entity = {}, explicitImage = "") => {
  const resolvedExplicitImage = resolveUploadsUrl(explicitImage);
  if (resolvedExplicitImage) return resolvedExplicitImage;
  for (const key of IMAGE_KEYS) {
    const resolved = resolveUploadsUrl(entity?.[key]);
    if (resolved) return resolved;
  }
  return "";
};

export const getInitials = (name = "") => {
  const normalized = String(name || "").trim();
  if (!normalized) return "U";
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
};

export default function ProfileAvatar({
  name = "",
  imageSrc = "",
  sizeClassName = "w-20 h-20",
  className = "",
  textClassName = "text-2xl",
}) {
  const [hasImageError, setHasImageError] = useState(false);
  const initials = useMemo(() => getInitials(name), [name]);
  const resolvedSrc = useMemo(() => resolveUploadsUrl(imageSrc), [imageSrc]);

  useEffect(() => {
    // Reset image error when src changes so avatar can recover
    // from a temporary/broken URL to a valid one after data refresh.
    setHasImageError(false);
  }, [resolvedSrc]);

  const shouldShowImage = Boolean(resolvedSrc) && !hasImageError;

  return (
    <div
      className={`${sizeClassName} rounded-full overflow-hidden bg-indigo-600 text-white ring-4 ring-indigo-200 flex items-center justify-center font-bold ${textClassName} ${className}`}
      aria-label={`${name || "User"} avatar`}
    >
      {shouldShowImage ? (
        <img
          src={resolvedSrc}
          alt={name || "User"}
          className="w-full h-full object-cover"
          onError={() => setHasImageError(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}
