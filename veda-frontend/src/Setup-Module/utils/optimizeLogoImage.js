const MAX_OPTIMIZED_SIDE_PX = 1024;
const JPEG_QUALITY = 0.88;

function isSvgFile(file) {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return ext === ".svg" || file.type === "image/svg+xml";
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/**
 * Downscales large raster logos before upload. SVG and small images are returned unchanged.
 */
export async function optimizeLogoImage(file) {
  if (!file || isSvgFile(file)) return file;

  try {
    const img = await loadImage(file);
    const maxSide = Math.max(img.naturalWidth, img.naturalHeight);
    if (maxSide <= MAX_OPTIMIZED_SIDE_PX) return file;

    const scale = MAX_OPTIMIZED_SIDE_PX / maxSide;
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, width, height);

    const mime =
      file.type === "image/png" || file.name.toLowerCase().endsWith(".png")
        ? "image/png"
        : "image/jpeg";

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, mime, mime === "image/jpeg" ? JPEG_QUALITY : undefined);
    });

    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    const ext = mime === "image/png" ? ".png" : ".jpg";
    return new File([blob], `${baseName}${ext}`, { type: mime });
  } catch {
    return file;
  }
}
