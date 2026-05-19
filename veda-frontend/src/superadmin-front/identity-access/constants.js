export const PHONE_MIN_LENGTH = 10;
export const PHONE_MAX_LENGTH = 15;

export const sanitizePhone = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, PHONE_MAX_LENGTH);

export const isValidPhone = (phone) => {
  if (!phone) return true;
  return /^\d{10,15}$/.test(phone);
};

export const PASSWORD_MIN_LENGTH = 8;

export const isValidPassword = (password) =>
  typeof password === "string" && password.length >= PASSWORD_MIN_LENGTH;

export const validatePasswordFields = (password, confirmPassword) => {
  if (!password?.trim()) {
    return "Password is required.";
  }
  if (!isValidPassword(password)) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }
  return null;
};

export const EMPTY_ADMIN_FORM = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  employeeId: "",
  department: "Academic",
  designation: "",
  adminType: "Academic Admin",
  school: "",
  campus: "",
  scope: "",
  permissions: [],
};
export const PERMISSION_MODULES = [
  "Students",
  "Exams",
  "Gradebook",
  "Fees",
  "HR",
  "Transport",
  "Communication",
  "Admission",
  "Calendar",
  "SIS",
];

export const INVITE_STATUS = {
  pending: "Pending",
  sent: "Invitation Sent",
  accepted: "Accepted",
};

export const INVITE_EXPIRY_HOURS = 48;

export const buildEmptyPermissions = () =>
  PERMISSION_MODULES.map((module) => ({
    module,
    view: false,
    create: false,
    edit: false,
    delete: false,
  }));
