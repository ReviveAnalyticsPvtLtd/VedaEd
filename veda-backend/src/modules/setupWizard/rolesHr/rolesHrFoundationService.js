const {
  CORE_ROLE_KEYS,
  OPTIONAL_ROLE_KEYS,
  REQUIRED_ROLE_SET,
  BASE_PERMISSION_MATRIX,
  MODULE_ROLE_MAP,
  DEPENDENCY_ITEMS,
  ID_FORMAT_REGEX,
  VALID_STAFF_CATEGORIES,
} = require("./rolesHrFoundation.config");

// Future Update:
// Add advanced RBAC permission engine
// with department-wise dynamic access control.

const DEFAULT_OPTIONAL_ON = ["HR Admin", "Admissions Officer"];

const normalizeOptionalRoles = (optionalRoles) => {
  if (!Array.isArray(optionalRoles)) return [...DEFAULT_OPTIONAL_ON];
  const allowed = new Set(OPTIONAL_ROLE_KEYS);
  return [...new Set(optionalRoles.filter((r) => allowed.has(r)))];
};

const buildEnabledRoles = (optionalRoles) => [
  ...CORE_ROLE_KEYS,
  ...normalizeOptionalRoles(optionalRoles),
];

const isRequiredRole = (roleKey) => REQUIRED_ROLE_SET.has(roleKey);

const validateIdFormat = (format, fieldName) => {
  const trimmed = String(format || "").trim();
  if (!trimmed) {
    return { valid: false, message: `${fieldName} is required` };
  }
  if (!ID_FORMAT_REGEX.test(trimmed)) {
    return {
      valid: false,
      message: `${fieldName} may only contain letters, numbers, hyphens, underscores, and braces`,
    };
  }
  return { valid: true, value: trimmed };
};

const formatIdPreview = (format) => {
  const year = new Date().getFullYear();
  return String(format || "")
    .replace(/\{YEAR\}/gi, String(year))
    .replace(/\{SEQ\}/gi, "0001");
};

/**
 * Generates permission preview rows from enabled optional roles and setup style.
 */
const generatePermissionMatrix = (optionalRoles, permissionSetupStyle) => {
  const matrix = BASE_PERMISSION_MATRIX.map((row) => ({ ...row }));

  if (normalizeOptionalRoles(optionalRoles).includes("HR Admin")) {
    matrix.push({
      role: "HR Admin",
      academic: "View",
      fees: "No",
      setup: "HR",
      portal: "Staff",
    });
  }

  if (permissionSetupStyle === "custom") {
    return matrix.map((row) => ({
      ...row,
      setup: row.setup === "Limited" ? "Custom" : row.setup,
    }));
  }

  return matrix;
};

/**
 * Resolves dependency impact rows for sidebar (Ready vs Depends).
 */
const computeDependencyStatus = (wizardDoc = {}) => {
  const subjectReady =
    Boolean(wizardDoc.subjectFramework) &&
    wizardDoc.subjectFramework !== "configure_later";
  const timetableReady = (wizardDoc.enabledModules || []).includes("Timetable");
  const approvalsReady =
    Boolean(wizardDoc.approvalWorkflow) &&
    wizardDoc.approvalWorkflow !== "none";

  return DEPENDENCY_ITEMS.map((module) => {
    let status = "Depends";
    if (module === "Teacher Onboarding") status = "Ready";
    if (module === "Subject Mapping" && subjectReady) status = "Ready";
    if (module === "Timetable" && timetableReady) status = "Ready";
    if (module === "Approvals" && approvalsReady) status = "Ready";
    return { module, status };
  });
};

/**
 * Smart-check messages based on enabled modules from step 5.
 */
const getSmartCheckMessages = (enabledModules = [], optionalRoles = []) => {
  const messages = [];
  const optional = normalizeOptionalRoles(optionalRoles);
  const modules = new Set(enabledModules || []);

  const missingRecommended = [];
  Object.entries(MODULE_ROLE_MAP).forEach(([moduleKey, roleKey]) => {
    if (modules.has(moduleKey) && !optional.includes(roleKey)) {
      missingRecommended.push(roleKey);
    }
  });

  if (missingRecommended.length > 0) {
    messages.push(
      `${missingRecommended.join(" and ")} ${missingRecommended.length > 1 ? "are" : "is"} recommended because related modules are enabled in your setup.`
    );
  }

  if (!optional.includes("HR Admin")) {
    messages.push(
      "HR Admin is disabled. Staff onboarding can still work, but HR controls will be limited."
    );
  }

  if (optional.includes("Transport Manager")) {
    messages.push(
      "Transport Manager enabled. Transport setup will include route and vehicle ownership permissions."
    );
  }

  if (messages.length === 0) {
    messages.push(
      "HR Admin and Admissions Officer are recommended because staff onboarding and admissions workflow are part of your setup."
    );
  }

  return messages;
};

const getRecommendationText = (permissionSetupStyle) => {
  if (permissionSetupStyle === "custom") {
    return "Custom mode selected. You can edit detailed permissions before launch, but setup may take longer.";
  }
  return "Use recommended permissions now. Advanced permission tuning can be done later from Setup Center with audit logs.";
};

const validateRoleToggle = (roleKey, enable) => {
  if (isRequiredRole(roleKey)) {
    if (!enable) {
      return {
        valid: false,
        message: `Required role "${roleKey}" cannot be disabled`,
      };
    }
    return { valid: true };
  }

  if (!OPTIONAL_ROLE_KEYS.includes(roleKey)) {
    return { valid: false, message: `Unknown role "${roleKey}"` };
  }

  return { valid: true };
};

const validateStep7Payload = (body, { draft = false } = {}) => {
  const errors = [];

  const optionalRoles = normalizeOptionalRoles(body.optionalRoles);
  const staffCategories = Array.isArray(body.staffCategories)
    ? body.staffCategories.filter((c) => VALID_STAFF_CATEGORIES.includes(c))
    : [];

  if (!draft) {
    const staffId = validateIdFormat(body.staffIdFormat, "staffIdFormat");
    if (!staffId.valid) errors.push(staffId.message);

    const teacherId = validateIdFormat(body.teacherIdFormat, "teacherIdFormat");
    if (!teacherId.valid) errors.push(teacherId.message);

    if (staffCategories.length === 0) {
      errors.push("At least one staff category is required");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      optionalRoles,
      enabledRoles: buildEnabledRoles(optionalRoles),
      permissionSetupStyle:
        body.permissionSetupStyle === "custom" ? "custom" : "recommended",
      staffIdFormat: validateIdFormat(body.staffIdFormat, "staffIdFormat").value ||
        "EMP-{YEAR}-{SEQ}",
      teacherIdFormat:
        validateIdFormat(body.teacherIdFormat, "teacherIdFormat").value ||
        "TCH-{YEAR}-{SEQ}",
      staffCategories,
      departmentSetup: String(body.departmentSetup || "manual").trim(),
      approvalWorkflow: String(body.approvalWorkflow || "custom").trim(),
    },
  };
};

const mapWizardToStep7Response = (doc) => {
  if (!doc) return null;

  const optionalRoles = normalizeOptionalRoles(doc.optionalRoles);

  return {
    coreRoles: CORE_ROLE_KEYS,
    enabledRoles: buildEnabledRoles(optionalRoles),
    optionalRoles,
    permissionSetupStyle: doc.permissionSetupStyle || "recommended",
    staffIdFormat: doc.staffIdFormat || "EMP-{YEAR}-{SEQ}",
    teacherIdFormat: doc.teacherIdFormat || "TCH-{YEAR}-{SEQ}",
    staffIdPreview: formatIdPreview(doc.staffIdFormat || "EMP-{YEAR}-{SEQ}"),
    teacherIdPreview: formatIdPreview(doc.teacherIdFormat || "TCH-{YEAR}-{SEQ}"),
    staffCategories: doc.staffCategories?.length
      ? doc.staffCategories
      : ["Teaching Staff", "Administrative Staff", "Finance Staff"],
    departmentSetup: doc.departmentSetup || "manual",
    approvalWorkflow: doc.approvalWorkflow || "custom",
    permissionMatrix: doc.permissionMatrix?.length
      ? doc.permissionMatrix
      : generatePermissionMatrix(optionalRoles, doc.permissionSetupStyle),
    dependencyStatus: doc.dependencyStatus?.length
      ? doc.dependencyStatus
      : computeDependencyStatus(doc),
    currentStep: doc.currentStep,
    progressPercentage: doc.progressPercentage,
    enabledModules: doc.enabledModules || [],
  };
};

module.exports = {
  CORE_ROLE_KEYS,
  OPTIONAL_ROLE_KEYS,
  DEFAULT_OPTIONAL_ON,
  normalizeOptionalRoles,
  buildEnabledRoles,
  isRequiredRole,
  validateIdFormat,
  formatIdPreview,
  generatePermissionMatrix,
  computeDependencyStatus,
  getSmartCheckMessages,
  getRecommendationText,
  validateRoleToggle,
  validateStep7Payload,
  mapWizardToStep7Response,
};
