import {
  DEFAULT_PERMISSION_MATRIX,
  DEFAULT_STEP7_FORM,
  DEPENDENCY_ITEMS,
  MODULE_ROLE_MAP,
} from "../constants/rolesHrFoundation";

// Future Update:
// Add advanced RBAC permission engine
// with department-wise dynamic access control.

export const CORE_ROLE_COUNT = 6;

export const generatePermissionMatrix = (
  optionalRoles = [],
  permissionSetupStyle = "recommended"
) => {
  const matrix = DEFAULT_PERMISSION_MATRIX.map((row) => ({ ...row }));

  if (optionalRoles.includes("HR Admin")) {
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

export const formatIdPreview = (format) => {
  const year = new Date().getFullYear();
  return String(format || "")
    .replace(/\{YEAR\}/gi, String(year))
    .replace(/\{SEQ\}/gi, "0001");
};

export const mapWizardDataToStep7Form = (data) => {
  if (!data) return { ...DEFAULT_STEP7_FORM };

  return {
    optionalRoles: Array.isArray(data.optionalRoles)
      ? data.optionalRoles
      : DEFAULT_STEP7_FORM.optionalRoles,
    permissionSetupStyle:
      data.permissionSetupStyle || DEFAULT_STEP7_FORM.permissionSetupStyle,
    staffIdFormat: data.staffIdFormat || DEFAULT_STEP7_FORM.staffIdFormat,
    teacherIdFormat:
      data.teacherIdFormat || DEFAULT_STEP7_FORM.teacherIdFormat,
    staffCategories: data.staffCategories?.length
      ? data.staffCategories
      : DEFAULT_STEP7_FORM.staffCategories,
    departmentSetup:
      data.departmentSetup || DEFAULT_STEP7_FORM.departmentSetup,
    approvalWorkflow:
      data.approvalWorkflow || DEFAULT_STEP7_FORM.approvalWorkflow,
  };
};

export const getRecommendationText = (permissionSetupStyle) => {
  if (permissionSetupStyle === "custom") {
    return "Custom mode selected. You can edit detailed permissions before launch, but setup may take longer.";
  }
  return "Use recommended permissions now. Advanced permission tuning can be done later from Setup Center with audit logs.";
};

export const getSmartCheckMessages = (
  enabledModules = [],
  optionalRoles = []
) => {
  const messages = [];
  const modules = new Set(enabledModules || []);
  const optional = new Set(optionalRoles || []);

  const missingRecommended = [];
  Object.entries(MODULE_ROLE_MAP).forEach(([moduleKey, roleKey]) => {
    if (modules.has(moduleKey) && !optional.has(roleKey)) {
      missingRecommended.push(roleKey);
    }
  });

  if (missingRecommended.length > 0) {
    messages.push(
      `${missingRecommended.join(" and ")} ${missingRecommended.length > 1 ? "are" : "is"} recommended because related modules are enabled in your setup.`
    );
  }

  if (!optional.has("HR Admin")) {
    messages.push(
      "HR Admin is disabled. Staff onboarding can still work, but HR controls will be limited."
    );
  }

  if (optional.has("Transport Manager")) {
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

export const getAutoRecommendedRoles = (enabledModules = []) => {
  const modules = new Set(enabledModules || []);
  const autoRoles = new Set();

  Object.entries(MODULE_ROLE_MAP).forEach(([moduleKey, roleKey]) => {
    if (modules.has(moduleKey)) {
      autoRoles.add(roleKey);
    }
  });

  return [...autoRoles];
};

export const getModuleDrivenRoleKeys = () => {
  return [...new Set(Object.values(MODULE_ROLE_MAP))];
};

export const syncOptionalRolesWithModules = (
  optionalRoles = [],
  enabledModules = []
) => {
  const autoRoles = new Set(getAutoRecommendedRoles(enabledModules));
  const moduleDrivenRoles = new Set(getModuleDrivenRoleKeys());
  const preservedManualRoles = (optionalRoles || []).filter(
    (role) => !moduleDrivenRoles.has(role)
  );

  return [...new Set([...preservedManualRoles, ...autoRoles])];
};

export const resolveDependencyStatus = (
  serverStatus,
  wizardMeta = {}
) => {
  if (Array.isArray(serverStatus) && serverStatus.length > 0) {
    return serverStatus;
  }

  const subjectReady =
    Boolean(wizardMeta.subjectFramework) &&
    wizardMeta.subjectFramework !== "configure_later";
  const timetableReady = (wizardMeta.enabledModules || []).includes("Timetable");
  const approvalsReady =
    Boolean(wizardMeta.approvalWorkflow) &&
    wizardMeta.approvalWorkflow !== "none";

  return DEPENDENCY_ITEMS.map((module) => {
    let status = "Depends";
    if (module === "Teacher Onboarding") status = "Ready";
    if (module === "Subject Mapping" && subjectReady) status = "Ready";
    if (module === "Timetable" && timetableReady) status = "Ready";
    if (module === "Approvals" && approvalsReady) status = "Ready";
    return { module, status };
  });
};

export const validateStep7Form = (form) => {
  const errors = {};
  const idPattern = /^[A-Za-z0-9_{}-]+$/;

  if (!form.staffIdFormat?.trim()) {
    errors.staffIdFormat = "Staff ID format is required";
  } else if (!idPattern.test(form.staffIdFormat.trim())) {
    errors.staffIdFormat = "Invalid staff ID format";
  }

  if (!form.teacherIdFormat?.trim()) {
    errors.teacherIdFormat = "Teacher ID format is required";
  } else if (!idPattern.test(form.teacherIdFormat.trim())) {
    errors.teacherIdFormat = "Invalid teacher ID format";
  }

  if (!form.staffCategories?.length) {
    errors.staffCategories = "Select at least one staff category";
  }

  return errors;
};

export const permissionChipClass = (value) => {
  if (!value || value === "No") {
    return "bg-gray-100 text-gray-600";
  }
  return "bg-blue-50 text-blue-700";
};
