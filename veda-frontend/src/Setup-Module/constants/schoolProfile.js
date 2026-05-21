export const DEFAULT_PRIMARY_THEME_COLOR = "#2563EB";

export const THEME_COLOR_PRESETS = [
  { id: "blue", label: "Blue", value: "#2563EB" },
  { id: "green", label: "Green", value: "#16A34A" },
  { id: "purple", label: "Purple", value: "#7C3AED" },
];

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
export const RECOMMENDED_LOGO_SIZE_PX = 512;
export const MIN_LOGO_SIZE_PX = 256;
