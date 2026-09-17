export const DEFAULT_PRIMARY_THEME_COLOR = "#2563EB";

export const THEME_COLOR_PRESETS = [
  { id: "blue", label: "Blue", value: "#2563EB" },
  { id: "purple", label: "Purple", value: "#7C3AED" },
  { id: "green", label: "Green", value: "#16A34A" },
  { id: "orange", label: "Orange", value: "#EA580C" },
];

export const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function isValidHexColor(hex) {
  return typeof hex === "string" && HEX_COLOR_REGEX.test(hex.trim());
}

export function normalizeHex(hex) {
  if (!hex || typeof hex !== "string") return DEFAULT_PRIMARY_THEME_COLOR;
  let clean = hex.trim();
  if (!clean.startsWith("#")) clean = `#${clean}`;
  if (!HEX_COLOR_REGEX.test(clean)) return DEFAULT_PRIMARY_THEME_COLOR;
  if (clean.length === 4) {
    clean = `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`;
  }
  return clean.toUpperCase();
}

export function hexToRgb(hex) {
  const norm = normalizeHex(hex);
  const r = parseInt(norm.slice(1, 3), 16);
  const g = parseInt(norm.slice(3, 5), 16);
  const b = parseInt(norm.slice(5, 7), 16);
  return { r, g, b };
}

export function adjustBrightness(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent / 100;
  const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
  const toHex = (c) => c.toString(16).padStart(2, "0");
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`.toUpperCase();
}

export function getDarkThemeTextTint(hex) {
  const { r, g, b } = hexToRgb(hex);
  // Mix 60% color with 40% white for optimal contrast on dark backgrounds (#0b0f19 / #1e293b)
  const newR = Math.round(r * 0.6 + 255 * 0.4);
  const newG = Math.round(g * 0.6 + 255 * 0.4);
  const newB = Math.round(b * 0.6 + 255 * 0.4);
  const toHex = (c) => c.toString(16).padStart(2, "0");
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`.toUpperCase();
}

export function getContrastTextColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 180 ? "#0f172a" : "#ffffff";
}

export function applyPrimaryColorToDOM(colorHex) {
  if (typeof document === "undefined") return;
  const hex = normalizeHex(colorHex);
  const rgb = hexToRgb(hex);
  const hover = adjustBrightness(hex, -14);
  const active = adjustBrightness(hex, -22);
  const darkText = getDarkThemeTextTint(hex);
  const contrast = getContrastTextColor(hex);

  const root = document.documentElement;
  root.style.setProperty("--primary-color", hex);
  root.style.setProperty("--primary-color-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  root.style.setProperty("--primary-hover", hover);
  root.style.setProperty("--primary-active", active);
  root.style.setProperty("--primary-light", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
  root.style.setProperty("--primary-light-border", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.22)`);
  root.style.setProperty("--primary-ring", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`);
  root.style.setProperty("--primary-dark-text", darkText);
  root.style.setProperty("--primary-contrast", contrast);
  root.style.setProperty("--setup-primary", hex);
  root.style.setProperty("--setup-theme", hex);
}
