const {
  THEME_COLOR_PRESETS,
  DEFAULT_PRIMARY_THEME_COLOR,
  normalizeHex,
  hexToRgb,
  adjustBrightness,
  getDarkThemeTextTint,
  getContrastTextColor,
  isValidHexColor,
} = require("../src/utils/themeColorUtils");

console.log("==================================================");
console.log("  VERIFYING THEME COLOR UTILITIES                 ");
console.log("==================================================");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

// 1. Verify 4 presets
assert(THEME_COLOR_PRESETS.length === 4, `4 predefined theme colors exist (got ${THEME_COLOR_PRESETS.length})`);
assert(THEME_COLOR_PRESETS[0].value === "#2563EB" && THEME_COLOR_PRESETS[0].label === "Blue", "Preset 1 is Blue (#2563EB)");
assert(THEME_COLOR_PRESETS[1].value === "#7C3AED" && THEME_COLOR_PRESETS[1].label === "Purple", "Preset 2 is Purple (#7C3AED)");
assert(THEME_COLOR_PRESETS[2].value === "#16A34A" && THEME_COLOR_PRESETS[2].label === "Green", "Preset 3 is Green (#16A34A)");
assert(THEME_COLOR_PRESETS[3].value === "#EA580C" && THEME_COLOR_PRESETS[3].label === "Orange", "Preset 4 is Orange (#EA580C)");

// 2. Test hex normalization
assert(normalizeHex("#2563eb") === "#2563EB", "normalizeHex handles lowercase");
assert(normalizeHex("7c3aed") === "#7C3AED", "normalizeHex adds missing hash");
assert(normalizeHex("#abc") === "#AABBCC", "normalizeHex expands 3-digit hex");
assert(normalizeHex("invalid") === DEFAULT_PRIMARY_THEME_COLOR, "normalizeHex falls back on invalid");

// 3. Test RGB conversion
const rgbBlue = hexToRgb("#2563EB");
assert(rgbBlue.r === 37 && rgbBlue.g === 99 && rgbBlue.b === 235, "hexToRgb('#2563EB') -> {r:37, g:99, b:235}");

// 4. Test brightness adjustment
const hoverBlue = adjustBrightness("#2563EB", -14);
assert(hoverBlue.startsWith("#") && hoverBlue.length === 7, `adjustBrightness produces valid hex (${hoverBlue})`);

// 5. Test dark theme text tint & contrast
const darkTint = getDarkThemeTextTint("#2563EB");
assert(darkTint.startsWith("#") && darkTint.length === 7, `getDarkThemeTextTint produces valid tint (${darkTint})`);
assert(getContrastTextColor("#FFFFFF") === "#0f172a", "White background gets dark text");
assert(getContrastTextColor("#2563EB") === "#ffffff", "Blue background gets white text");

console.log("\n==================================================");
console.log(`  UTILS RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================");

if (failed > 0) process.exit(1);
