import {
  ALLOWED_LOGO_EXTENSIONS,
  ALLOWED_LOGO_TYPES,
  MAX_LOGO_DIMENSION_PX,
  MAX_LOGO_SIZE_MB,
  MIN_LOGO_SIZE_PX,
  RECOMMENDED_LOGO_SIZE_PX,
} from "../constants/schoolProfile";

function isSvgFile(file) {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return ext === ".svg" || file.type === "image/svg+xml";
}

function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions"));
    };
    img.src = url;
  });
}

/**
 * Validates logo file (type, size, dimensions).
 * Dimension rules are lenient: only blocks extreme sizes; warns below recommended via return value.
 */
export async function validateLogoFile(file) {
  if (!file) return { error: "No file selected" };

  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_LOGO_EXTENSIONS.includes(ext) && !ALLOWED_LOGO_TYPES.includes(file.type)) {
    return { error: "Please upload PNG, JPG, or SVG only." };
  }

  if (file.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
    return { error: `File must be under ${MAX_LOGO_SIZE_MB}MB.` };
  }

  if (isSvgFile(file)) {
    return { error: null, warning: null };
  }

  try {
    const { width, height } = await readImageDimensions(file);
    const maxSide = Math.max(width, height);
    const minSide = Math.min(width, height);

    if (maxSide > MAX_LOGO_DIMENSION_PX) {
      return {
        error: `Image is too large. Maximum dimension is ${MAX_LOGO_DIMENSION_PX}px.`,
      };
    }

    if (minSide < 32) {
      return { error: "Image is too small. Use at least 32×32 pixels." };
    }

    let warning = null;
    if (minSide < MIN_LOGO_SIZE_PX || maxSide < RECOMMENDED_LOGO_SIZE_PX) {
      warning = `For best quality, use at least ${RECOMMENDED_LOGO_SIZE_PX}×${RECOMMENDED_LOGO_SIZE_PX} px.`;
    }

    return { error: null, warning, width, height };
  } catch {
    return { error: null, warning: null };
  }
}
