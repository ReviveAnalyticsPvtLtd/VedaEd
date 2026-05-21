export const DEFAULT_PRIMARY_THEME_COLOR = "#2563EB";

export const THEME_COLOR_PRESETS = [
  { id: "blue", label: "Blue", value: "#2563EB" },
  { id: "green", label: "Green", value: "#16A34A" },
  { id: "purple", label: "Purple", value: "#7C3AED" },
];

export const COUNTRY_OPTIONS = [
  "India",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Singapore",
  "Australia",
  "Canada",
];

export const TIMEZONE_OPTIONS = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Asia/Dubai",
  "Asia/Singapore",
  "Australia/Sydney",
  "America/Toronto",
];

export const CURRENCY_OPTIONS = [
  "INR (₹)",
  "USD ($)",
  "GBP (£)",
  "AED (د.إ)",
  "SGD (S$)",
  "AUD (A$)",
  "CAD (C$)",
];

/** Auto-suggest timezone and currency when country changes */
export const COUNTRY_LOCALIZATION_MAP = {
  India: { timezone: "Asia/Kolkata", currency: "INR (₹)" },
  "United States": { timezone: "America/New_York", currency: "USD ($)" },
  "United Kingdom": { timezone: "Europe/London", currency: "GBP (£)" },
  "United Arab Emirates": { timezone: "Asia/Dubai", currency: "AED (د.إ)" },
  Singapore: { timezone: "Asia/Singapore", currency: "SGD (S$)" },
  Australia: { timezone: "Australia/Sydney", currency: "AUD (A$)" },
  Canada: { timezone: "America/Toronto", currency: "CAD (C$)" },
};

export const DEFAULT_SCHOOL_PROFILE_FORM = {
  schoolName: "",
  schoolCode: "",
  establishedYear: "",
  website: "",
  schoolLogo: "",
  schoolLogoPreview: "",
  primaryThemeColor: DEFAULT_PRIMARY_THEME_COLOR,
  address: "",
  country: "",
  state: "",
  city: "",
  postalCode: "",
  timezone: "",
  currency: "",
  officialEmail: "",
  phoneNumber: "",
  supportEmail: "",
  emergencyContact: "",
};

export const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
export const ALLOWED_LOGO_EXTENSIONS = [".png", ".jpg", ".jpeg", ".svg"];
export const MAX_LOGO_SIZE_MB = 5;
