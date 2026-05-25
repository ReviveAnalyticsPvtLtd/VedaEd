const { randomUUID } = require("crypto");
const SetupWizard = require("./setupWizardModel");
const {
  generateRecommendation,
  getSmartCheckMessages,
  recommendationToStoredFields,
} = require("./recommendation/recommendationEngine");
const { isValidGradeRange } = require("./recommendation/gradeUtils");
const {
  CORE_ROLE_KEYS,
  OPTIONAL_ROLE_KEYS,
  normalizeOptionalRoles,
  buildEnabledRoles,
  validateRoleToggle,
  validateStep7Payload,
  generatePermissionMatrix,
  computeDependencyStatus,
  getSmartCheckMessages: getRolesHrSmartChecks,
  mapWizardToStep7Response,
} = require("./rolesHr/rolesHrFoundationService");
const {
  VALID_PERMISSION_STYLES,
  VALID_DEPARTMENT_SETUP,
  VALID_APPROVAL_WORKFLOW,
} = require("./rolesHr/rolesHrFoundation.config");
const {
  validateStep8Payload,
  mapWizardToStep8Response,
  applyTogglePatch,
  computeAttendanceDependencyStatus,
  getAttendanceSmartChecks,
  normalizePermissions,
  normalizeParentNotifications,
} = require("./attendance/attendanceRulesService");
const {
  getDefaultStep9State,
  validateStep9Payload,
  buildStep9PersistPayload,
  mapWizardToStep9Response,
  removeGradeRow,
  removeWeightageRow,
} = require("./examination/examinationGradebookService");

const VALID_SETUP_TYPES = ["quick", "advanced", "import"];
const VALID_ORGANIZATION_TYPES = [
  "single_school",
  "multi_campus",
  "school_group",
];
const VALID_LOGO_FRAME_SHAPES = [
  "square",
  "rounded-square",
  "circle",
  "flexible",
];
const VALID_INSTITUTION_TYPES = [
  "preschool",
  "k12_school",
  "higher_secondary",
];
const VALID_LANGUAGE_PREFERENCES = [
  "english",
  "hindi",
  "regional",
  "other",
];

const getSetupStatus = (doc) => doc?.setupStatus || doc?.status || "draft";

const formatSetupDoc = (doc) => {
  if (!doc) return null;
  return {
    setupId: doc.setupId,
    currentStep: doc.currentStep,
    completedSteps: doc.completedSteps || [],
    progressPercentage: doc.progressPercentage,
    setupStatus: getSetupStatus(doc),
    selectedSetupType: doc.selectedSetupType,
    organizationType: doc.organizationType,
    schoolName: doc.schoolName,
    schoolCode: doc.schoolCode,
    establishedYear: doc.establishedYear,
    website: doc.website,
    schoolLogo: doc.schoolLogo,
    logoFrameShape: doc.logoFrameShape || "rounded-square",
    primaryThemeColor: doc.primaryThemeColor,
    address: doc.address,
    country: doc.country,
    institutionType: doc.institutionType,
    curriculumCountry: doc.curriculumCountry,
    curriculumBoard: doc.curriculumBoard,
    gradeFrom: doc.gradeFrom,
    gradeTo: doc.gradeTo,
    languagePreference: doc.languagePreference,
    recommendationType: doc.recommendationType,
    recommendationConfidence: doc.recommendationConfidence,
    recommendationRules: doc.recommendationRules || [],
    enabledModules: doc.enabledModules || [],
    disabledModules: doc.disabledModules || [],
    recommendedModules: doc.recommendedModules || [],
    dependencyWarnings: doc.dependencyWarnings || [],
    academicYear: doc.academicYear,
    academicYearPattern: doc.academicYearPattern,
    academicYearStart: doc.academicYearStart,
    academicYearEnd: doc.academicYearEnd,
    termStructure: doc.termStructure,
    expectedStudents: doc.expectedStudents,
    maxStudentsPerSection: doc.maxStudentsPerSection,
    sectionMode: doc.sectionMode,
    streams: doc.streams || [],
    subjectFramework: doc.subjectFramework,
    enabledRoles: doc.enabledRoles || [],
    optionalRoles: doc.optionalRoles || [],
    permissionSetupStyle: doc.permissionSetupStyle,
    staffIdFormat: doc.staffIdFormat,
    teacherIdFormat: doc.teacherIdFormat,
    staffCategories: doc.staffCategories || [],
    departmentSetup: doc.departmentSetup,
    approvalWorkflow: doc.approvalWorkflow,
    permissionMatrix: doc.permissionMatrix || [],
    dependencyStatus: doc.dependencyStatus || [],
    attendanceMode: doc.attendanceMode,
    workingDays: doc.workingDays || [],
    schoolStartTime: doc.schoolStartTime,
    schoolEndTime: doc.schoolEndTime,
    halfDayCheckoutTime: doc.halfDayCheckoutTime,
    attendanceClosingTime: doc.attendanceClosingTime,
    lateArrivalAfter: doc.lateArrivalAfter,
    autoAbsentAfter: doc.autoAbsentAfter,
    minimumAttendance: doc.minimumAttendance,
    graceMinutes: doc.graceMinutes,
    attendancePermissions: doc.attendancePermissions,
    leaveApprovalRules: doc.leaveApprovalRules,
    leaveTypes: doc.leaveTypes || [],
    parentNotificationRules: doc.parentNotificationRules,
    attendanceDependencyStatus: doc.attendanceDependencyStatus || [],
    attendanceSmartChecks: doc.attendanceSmartChecks || [],
    feesModuleEnabled: doc.feesModuleEnabled,
    step9ExaminationGradebook: doc.step9ExaminationGradebook || null,
    state: doc.state,
    city: doc.city,
    postalCode: doc.postalCode,
    timezone: doc.timezone,
    currency: doc.currency,
    officialEmail: doc.officialEmail,
    phoneNumber: doc.phoneNumber,
    supportEmail: doc.supportEmail,
    emergencyContact: doc.emergencyContact,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const validateStepProgress = (currentStep, progressPercentage, res) => {
  const step = Number(currentStep);
  if (!Number.isFinite(step) || step < 1 || step > 13) {
    res.status(400).json({
      success: false,
      message: "currentStep must be a number between 1 and 13",
    });
    return null;
  }

  const progress = Number(progressPercentage);
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
    res.status(400).json({
      success: false,
      message: "progressPercentage must be a number between 0 and 100",
    });
    return null;
  }

  return { step, progress };
};

const upsertSetupDoc = async (payload) => {
  let doc = await SetupWizard.findOne();
  if (doc) {
    doc = await SetupWizard.findByIdAndUpdate(doc._id, payload, {
      new: true,
      runValidators: true,
    });
  } else {
    doc = await SetupWizard.create({
      setupId: randomUUID(),
      selectedSetupType: "quick",
      ...payload,
    });
  }
  return doc;
};

const hasResumableDraft = (doc) => {
  if (!doc || getSetupStatus(doc) !== "draft") return false;
  const completed = doc.completedSteps?.length > 0;
  const progressed = doc.currentStep > 1 || doc.progressPercentage > 0;
  return completed || progressed;
};

/** GET /api/setup-wizard/progress — fetch existing setup progress */
exports.getSetupProgress = async (req, res) => {
  try {
    const doc = await SetupWizard.findOne().sort({ updatedAt: -1 });
    return res.status(200).json({
      success: true,
      data: formatSetupDoc(doc),
      hasDraft: hasResumableDraft(doc),
      message: doc ? "Setup progress loaded" : "No setup progress found",
    });
  } catch (error) {
    console.error("getSetupProgress error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch setup progress",
      error: error.message,
    });
  }
};

/** GET /api/setup-wizard — fetch saved wizard progress for prefill (step pages) */
exports.getSetupWizard = async (req, res) => {
  try {
    const doc = await SetupWizard.findOne().sort({ updatedAt: -1 });
    return res.status(200).json({
      success: true,
      data: doc,
      hasDraft: hasResumableDraft(doc),
      message: doc ? "Setup progress loaded" : "No setup progress found",
    });
  } catch (error) {
    console.error("getSetupWizard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch setup progress",
      error: error.message,
    });
  }
};

/** POST /api/setup-wizard/initialize — create or reset setup session */
exports.initializeSetup = async (req, res) => {
  try {
    const payload = {
      setupId: randomUUID(),
      currentStep: 1,
      completedSteps: [],
      progressPercentage: 0,
      setupStatus: "draft",
      selectedSetupType: "quick",
    };

    const existing = await SetupWizard.findOne();
    let doc;
    if (existing) {
      doc = await SetupWizard.findByIdAndUpdate(existing._id, payload, {
        new: true,
        runValidators: true,
      });
    } else {
      doc = await SetupWizard.create(payload);
    }

    return res.status(201).json({
      success: true,
      data: formatSetupDoc(doc),
      message: "Setup session initialized successfully",
    });
  } catch (error) {
    console.error("initializeSetup error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to initialize setup",
      error: error.message,
    });
  }
};

/** POST /api/setup-wizard — save step 1 (upsert single document) */
exports.saveSetupWizard = async (req, res) => {
  try {
    const { selectedSetupType, currentStep, progressPercentage, completedSteps } =
      req.body;

    if (!selectedSetupType || !VALID_SETUP_TYPES.includes(selectedSetupType)) {
      return res.status(400).json({
        success: false,
        message: "selectedSetupType must be one of: quick, advanced, import",
      });
    }

    const step = Number(currentStep);
    if (!Number.isFinite(step) || step < 1 || step > 13) {
      return res.status(400).json({
        success: false,
        message: "currentStep must be a number between 1 and 13",
      });
    }

    const progress = Number(progressPercentage);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: "progressPercentage must be a number between 0 and 100",
      });
    }

    const completed = Array.isArray(completedSteps)
      ? completedSteps.filter((n) => Number.isFinite(Number(n)))
      : [];

    const payload = {
      selectedSetupType,
      currentStep: step,
      progressPercentage: progress,
      setupStatus: "draft",
      completedSteps: completed,
    };

    let doc = await SetupWizard.findOne();
    if (doc) {
      doc = await SetupWizard.findByIdAndUpdate(doc._id, payload, {
        new: true,
        runValidators: true,
      });
    } else {
      doc = await SetupWizard.create({
        setupId: randomUUID(),
        ...payload,
      });
    }

    return res.status(200).json({
      success: true,
      data: doc,
      message: "Setup wizard step saved successfully",
    });
  } catch (error) {
    console.error("saveSetupWizard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save setup progress",
      error: error.message,
    });
  }
};

/** POST /api/setup-wizard/step-2 — save organization type (step 2) */
exports.saveStep2OrganizationType = async (req, res) => {
  try {
    const { organizationType, currentStep, progressPercentage, completedSteps } =
      req.body;

    if (
      !organizationType ||
      !VALID_ORGANIZATION_TYPES.includes(organizationType)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "organizationType must be one of: single_school, multi_campus, school_group",
      });
    }

    const step = Number(currentStep);
    if (!Number.isFinite(step) || step < 1 || step > 13) {
      return res.status(400).json({
        success: false,
        message: "currentStep must be a number between 1 and 13",
      });
    }

    const progress = Number(progressPercentage);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: "progressPercentage must be a number between 0 and 100",
      });
    }

    const completed = Array.isArray(completedSteps)
      ? completedSteps.filter((n) => Number.isFinite(Number(n)))
      : [];

    const payload = {
      organizationType,
      currentStep: step,
      progressPercentage: progress,
      setupStatus: "draft",
      completedSteps: completed,
    };

    let doc = await SetupWizard.findOne();
    if (doc) {
      doc = await SetupWizard.findByIdAndUpdate(doc._id, payload, {
        new: true,
        runValidators: true,
      });
    } else {
      doc = await SetupWizard.create({
        setupId: randomUUID(),
        selectedSetupType: "quick",
        ...payload,
      });
    }

    return res.status(200).json({
      success: true,
      data: doc,
      message: "Organization type saved successfully",
    });
  } catch (error) {
    console.error("saveStep2OrganizationType error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save organization type",
      error: error.message,
    });
  }
};

/** POST /api/setup-wizard/step-3/logo — upload school logo */
exports.uploadSchoolLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Use PNG, JPG, or SVG.",
      });
    }

    const schoolLogo = `/uploads/${req.file.filename}`;
    const doc = await upsertSetupDoc({ schoolLogo, setupStatus: "draft" });

    return res.status(200).json({
      success: true,
      data: { schoolLogo, setupId: doc.setupId },
      message: "School logo uploaded successfully",
    });
  } catch (error) {
    console.error("uploadSchoolLogo error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload school logo",
      error: error.message,
    });
  }
};

/** POST /api/setup-wizard/step-3 — save school profile (step 3) */
exports.saveStep3SchoolProfile = async (req, res) => {
  try {
    const {
      schoolName,
      schoolCode,
      establishedYear,
      website,
      schoolLogo,
      logoFrameShape,
      primaryThemeColor,
      address,
      country,
      state,
      city,
      postalCode,
      timezone,
      currency,
      officialEmail,
      phoneNumber,
      supportEmail,
      emergencyContact,
      currentStep,
      progressPercentage,
      completedSteps,
    } = req.body;

    const progressMeta = validateStepProgress(currentStep, progressPercentage, res);
    if (!progressMeta) return;

    const isDraft = req.body.draft === true || req.body.draft === "true";
    const trimmedName = String(schoolName || "").trim();
    const trimmedCode = String(schoolCode || "").trim();
    const trimmedCountry = String(country || "").trim();
    const trimmedTimezone = String(timezone || "").trim();
    const trimmedCurrency = String(currency || "").trim();
    const trimmedAddress = String(address || "").trim();
    const themeColor = String(primaryThemeColor || "#2563EB").trim();

    if (!isDraft) {
      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: "School name is required",
        });
      }

      if (!trimmedCode) {
        return res.status(400).json({
          success: false,
          message: "School code is required",
        });
      }

      if (!trimmedAddress) {
        return res.status(400).json({
          success: false,
          message: "Address is required",
        });
      }

      if (!trimmedCountry) {
        return res.status(400).json({
          success: false,
          message: "Country is required",
        });
      }

      if (!trimmedTimezone) {
        return res.status(400).json({
          success: false,
          message: "Time zone is required",
        });
      }

      if (!trimmedCurrency) {
        return res.status(400).json({
          success: false,
          message: "Currency is required",
        });
      }
    }

    if (themeColor && !HEX_COLOR_REGEX.test(themeColor)) {
      return res.status(400).json({
        success: false,
        message: "primaryThemeColor must be a valid hex color",
      });
    }

    const frameShape = String(logoFrameShape || "rounded-square").trim();
    if (frameShape && !VALID_LOGO_FRAME_SHAPES.includes(frameShape)) {
      return res.status(400).json({
        success: false,
        message: "logoFrameShape must be square, rounded-square, circle, or flexible",
      });
    }

    const yearStr = String(establishedYear || "").trim();
    if (yearStr) {
      const yearNum = Number(yearStr);
      if (
        !Number.isInteger(yearNum) ||
        yearNum < 1800 ||
        yearNum > new Date().getFullYear() + 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Established year must be a valid year",
        });
      }
    }

    const completed = Array.isArray(completedSteps)
      ? completedSteps.filter((n) => Number.isFinite(Number(n)))
      : [];

    const payload = {
      schoolName: trimmedName,
      schoolCode: trimmedCode,
      establishedYear: yearStr,
      website: String(website || "").trim(),
      schoolLogo: String(schoolLogo || "").trim(),
      logoFrameShape: frameShape || "rounded-square",
      primaryThemeColor: themeColor,
      address: trimmedAddress,
      country: trimmedCountry,
      state: String(state || "").trim(),
      city: String(city || "").trim(),
      postalCode: String(postalCode || "").trim(),
      timezone: trimmedTimezone,
      currency: trimmedCurrency,
      officialEmail: String(officialEmail || "").trim(),
      phoneNumber: String(phoneNumber || "").trim(),
      supportEmail: String(supportEmail || "").trim(),
      emergencyContact: String(emergencyContact || "").trim(),
      currentStep: progressMeta.step,
      progressPercentage: progressMeta.progress,
      setupStatus: "draft",
      completedSteps: completed,
    };

    const doc = await upsertSetupDoc(payload);

    return res.status(200).json({
      success: true,
      data: doc,
      message: "School profile saved successfully",
    });
  } catch (error) {
    console.error("saveStep3SchoolProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save school profile",
      error: error.message,
    });
  }
};

/** POST /api/setup-wizard/step-4 — save school type & curriculum (step 4) */
exports.saveStep4SchoolTypeCurriculum = async (req, res) => {
  try {
    const {
      institutionType,
      country,
      curriculumCountry,
      curriculumBoard,
      gradeFrom,
      gradeTo,
      languagePreference,
      currentStep,
      progressPercentage,
      completedSteps,
    } = req.body;

    const progressMeta = validateStepProgress(currentStep, progressPercentage, res);
    if (!progressMeta) return;

    const isDraft = req.body.draft === true || req.body.draft === "true";
    const trimmedInstitution = String(institutionType || "").trim();
    const trimmedCountry = String(
      country || curriculumCountry || ""
    ).trim();
    const trimmedBoard = String(curriculumBoard || "").trim();
    const trimmedGradeFrom = String(gradeFrom || "").trim();
    const trimmedGradeTo = String(gradeTo || "").trim();
    const trimmedLanguage = String(languagePreference || "english")
      .trim()
      .toLowerCase();

    if (!isDraft) {
      if (!trimmedInstitution || !VALID_INSTITUTION_TYPES.includes(trimmedInstitution)) {
        return res.status(400).json({
          success: false,
          message:
            "institutionType must be one of: preschool, k12_school, higher_secondary",
        });
      }

      if (!trimmedCountry) {
        return res.status(400).json({
          success: false,
          message: "country is required",
        });
      }

      if (!trimmedBoard) {
        return res.status(400).json({
          success: false,
          message: "curriculumBoard is required",
        });
      }

      if (!trimmedGradeFrom || !trimmedGradeTo) {
        return res.status(400).json({
          success: false,
          message: "gradeFrom and gradeTo are required",
        });
      }
    }

    if (
      trimmedInstitution &&
      !VALID_INSTITUTION_TYPES.includes(trimmedInstitution)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "institutionType must be one of: preschool, k12_school, higher_secondary",
      });
    }

    if (
      trimmedLanguage &&
      !VALID_LANGUAGE_PREFERENCES.includes(trimmedLanguage)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "languagePreference must be one of: english, hindi, regional, other",
      });
    }

    const completed = Array.isArray(completedSteps)
      ? completedSteps.filter((n) => Number.isFinite(Number(n)))
      : [];

    const recommendation = generateRecommendation({
      institutionType: trimmedInstitution,
      country: trimmedCountry,
      curriculumBoard: trimmedBoard,
      gradeFrom: trimmedGradeFrom,
      gradeTo: trimmedGradeTo,
    });

    const payload = {
      institutionType: trimmedInstitution || null,
      curriculumCountry: trimmedCountry,
      curriculumBoard: trimmedBoard,
      gradeFrom: trimmedGradeFrom,
      gradeTo: trimmedGradeTo,
      languagePreference: trimmedLanguage || "english",
      ...recommendationToStoredFields(recommendation),
      currentStep: progressMeta.step,
      progressPercentage: progressMeta.progress,
      setupStatus: "draft",
      completedSteps: completed,
    };

    const doc = await upsertSetupDoc(payload);

    return res.status(200).json({
      success: true,
      data: doc,
      recommendation,
      message: "School type and curriculum saved successfully",
    });
  } catch (error) {
    console.error("saveStep4SchoolTypeCurriculum error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save school type and curriculum",
      error: error.message,
    });
  }
};

const REQUIRED_MODULE_KEYS = [
  "SIS",
  "Academics",
  "Attendance",
  "Timetable",
  "Exams",
  "Fees",
  "Communication",
  "Reports",
];

const OPTIONAL_MODULE_KEYS = [
  "Transport",
  "Library",
  "Health",
  "Hostel",
  "LMS",
  "Inventory",
  "HR",
  "Payroll",
];

const sanitizeModuleKeys = (list, allowed) => {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter((key) => allowed.includes(key)))];
};

/** POST /api/setup-wizard/step-5 — save module selection (step 5) */
exports.saveStep5ModuleSelection = async (req, res) => {
  try {
    const {
      enabledModules,
      disabledModules,
      recommendedModules,
      dependencyWarnings,
      currentStep,
      progressPercentage,
      completedSteps,
    } = req.body;

    const progressMeta = validateStepProgress(currentStep, progressPercentage, res);
    if (!progressMeta) return;

    const optionalEnabled = sanitizeModuleKeys(
      enabledModules,
      OPTIONAL_MODULE_KEYS
    );

    if (optionalEnabled.includes("Payroll") && !optionalEnabled.includes("HR")) {
      return res.status(400).json({
        success: false,
        message:
          "Payroll depends on HR. Enable HR before saving Payroll.",
      });
    }

    const mergedEnabled = [
      ...REQUIRED_MODULE_KEYS,
      ...optionalEnabled,
    ];

    const completed = Array.isArray(completedSteps)
      ? completedSteps.filter((n) => Number.isFinite(Number(n)))
      : [];

    const payload = {
      enabledModules: mergedEnabled,
      disabledModules: sanitizeModuleKeys(
        disabledModules,
        OPTIONAL_MODULE_KEYS
      ),
      recommendedModules: sanitizeModuleKeys(
        recommendedModules,
        OPTIONAL_MODULE_KEYS
      ),
      dependencyWarnings: Array.isArray(dependencyWarnings)
        ? dependencyWarnings.filter((w) => typeof w === "string" && w.trim())
        : [],
      currentStep: progressMeta.step,
      progressPercentage: progressMeta.progress,
      setupStatus: "draft",
      completedSteps: completed,
    };

    const doc = await upsertSetupDoc(payload);

    return res.status(200).json({
      success: true,
      data: doc,
      message: "Module selection saved successfully",
    });
  } catch (error) {
    console.error("saveStep5ModuleSelection error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save module selection",
      error: error.message,
    });
  }
};

const VALID_ACADEMIC_PATTERNS = ["apr_mar", "jun_may", "aug_jun"];
const VALID_TERM_STRUCTURES = ["2 Terms", "3 Terms", "Quarters", "Custom"];
const VALID_SECTION_MODES = ["auto", "manual"];
const VALID_SUBJECT_FRAMEWORKS = [
  "recommended_template",
  "manual",
  "excel_import",
  "configure_later",
];
const VALID_STREAM_OPTIONS = [
  "Science",
  "Commerce",
  "Arts / Humanities",
  "Vocational",
];

/** POST /api/setup-wizard/step-6 — save academic structure (step 6) */
exports.saveStep6AcademicStructure = async (req, res) => {
  try {
    const {
      academicYear,
      academicYearPattern,
      academicYearStart,
      academicYearEnd,
      termStructure,
      gradeFrom,
      gradeTo,
      expectedStudents,
      maxStudentsPerSection,
      sectionMode,
      streams,
      subjectFramework,
      currentStep,
      progressPercentage,
      completedSteps,
    } = req.body;

    const progressMeta = validateStepProgress(currentStep, progressPercentage, res);
    if (!progressMeta) return;

    const isDraft = req.body.draft === true || req.body.draft === "true";
    const trimmedYear = String(academicYear || "").trim();
    const trimmedPattern = String(academicYearPattern || "").trim();
    const trimmedStart = String(academicYearStart || "").trim();
    const trimmedEnd = String(academicYearEnd || "").trim();
    const trimmedTerm = String(termStructure || "").trim();
    const trimmedGradeFrom = String(gradeFrom || "").trim();
    const trimmedGradeTo = String(gradeTo || "").trim();
    const trimmedSectionMode = String(sectionMode || "auto").trim();
    const trimmedSubjectFramework = String(
      subjectFramework || "recommended_template"
    ).trim();

    const parsedExpected = Number(expectedStudents);
    const parsedMaxPerSection = Number(maxStudentsPerSection);

    if (!isDraft) {
      if (!trimmedYear) {
        return res.status(400).json({
          success: false,
          message: "academicYear is required",
        });
      }

      if (!trimmedGradeFrom || !trimmedGradeTo) {
        return res.status(400).json({
          success: false,
          message: "gradeFrom and gradeTo are required",
        });
      }

      if (!isValidGradeRange(trimmedGradeFrom, trimmedGradeTo)) {
        return res.status(400).json({
          success: false,
          message: "Invalid grade range",
        });
      }

      if (!Number.isFinite(parsedExpected) || parsedExpected < 1) {
        return res.status(400).json({
          success: false,
          message: "expectedStudents must be a positive number",
        });
      }

      if (!Number.isFinite(parsedMaxPerSection) || parsedMaxPerSection < 1) {
        return res.status(400).json({
          success: false,
          message: "maxStudentsPerSection must be a positive number",
        });
      }
    }

    if (
      trimmedPattern &&
      !VALID_ACADEMIC_PATTERNS.includes(trimmedPattern)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid academicYearPattern",
      });
    }

    if (trimmedTerm && !VALID_TERM_STRUCTURES.includes(trimmedTerm)) {
      return res.status(400).json({
        success: false,
        message: "Invalid termStructure",
      });
    }

    if (
      trimmedSectionMode &&
      !VALID_SECTION_MODES.includes(trimmedSectionMode)
    ) {
      return res.status(400).json({
        success: false,
        message: "sectionMode must be auto or manual",
      });
    }

    if (
      trimmedSubjectFramework &&
      !VALID_SUBJECT_FRAMEWORKS.includes(trimmedSubjectFramework)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid subjectFramework",
      });
    }

    const sanitizedStreams = Array.isArray(streams)
      ? [...new Set(streams.filter((s) => VALID_STREAM_OPTIONS.includes(s)))]
      : [];

    const completed = Array.isArray(completedSteps)
      ? completedSteps.filter((n) => Number.isFinite(Number(n)))
      : [];

    const payload = {
      academicYear: trimmedYear,
      academicYearPattern: trimmedPattern || "apr_mar",
      academicYearStart: trimmedStart,
      academicYearEnd: trimmedEnd,
      termStructure: trimmedTerm || "2 Terms",
      gradeFrom: trimmedGradeFrom,
      gradeTo: trimmedGradeTo,
      expectedStudents: Number.isFinite(parsedExpected)
        ? parsedExpected
        : null,
      maxStudentsPerSection: Number.isFinite(parsedMaxPerSection)
        ? parsedMaxPerSection
        : 40,
      sectionMode: trimmedSectionMode || "auto",
      streams: sanitizedStreams,
      subjectFramework: trimmedSubjectFramework || "recommended_template",
      currentStep: progressMeta.step,
      progressPercentage: progressMeta.progress,
      setupStatus: "draft",
      completedSteps: completed,
    };

    const doc = await upsertSetupDoc(payload);

    return res.status(200).json({
      success: true,
      data: doc,
      message: "Academic structure saved successfully",
    });
  } catch (error) {
    console.error("saveStep6AcademicStructure error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save academic structure",
      error: error.message,
    });
  }
};

/** POST /api/setup-wizard/recommendation/generate — run rule engine on inputs */
exports.generateRecommendation = async (req, res) => {
  try {
    const {
      institutionType,
      country,
      curriculumCountry,
      curriculumBoard,
      selectedBoard,
      gradeFrom,
      gradeTo,
      persist,
    } = req.body;

    const recommendation = generateRecommendation({
      institutionType,
      country: country || curriculumCountry,
      curriculumBoard: curriculumBoard || selectedBoard,
      gradeFrom,
      gradeTo,
    });

    const smartChecks = getSmartCheckMessages({
      institutionType,
      country: country || curriculumCountry,
      curriculumBoard: curriculumBoard || selectedBoard,
      gradeFrom,
      gradeTo,
    });

    const shouldPersist = persist === true || persist === "true";
    if (shouldPersist) {
      await upsertSetupDoc({
        ...recommendationToStoredFields(recommendation),
        institutionType: institutionType || undefined,
        curriculumCountry: String(country || curriculumCountry || "").trim(),
        curriculumBoard: String(curriculumBoard || selectedBoard || "").trim(),
        gradeFrom: String(gradeFrom || "").trim(),
        gradeTo: String(gradeTo || "").trim(),
        setupStatus: "draft",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        recommendation,
        smartChecks,
      },
      message: "Recommendation generated successfully",
    });
  } catch (error) {
    console.error("generateRecommendation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate recommendation",
      error: error.message,
    });
  }
};

/** GET /api/setup-wizard/recommendation — fetch stored or regenerate from wizard */
exports.getRecommendation = async (req, res) => {
  try {
    const doc = await SetupWizard.findOne().sort({ updatedAt: -1 });

    if (!doc) {
      return res.status(200).json({
        success: true,
        data: {
          recommendation: generateRecommendation({}),
          smartChecks: getSmartCheckMessages({}),
          source: "default",
        },
        message: "No setup found; returning default recommendation",
      });
    }

    const fresh = generateRecommendation({
      institutionType: doc.institutionType,
      country: doc.curriculumCountry,
      curriculumBoard: doc.curriculumBoard,
      gradeFrom: doc.gradeFrom,
      gradeTo: doc.gradeTo,
    });

    const merged = {
      ...fresh,
      recommendationType:
        doc.recommendationType || fresh.recommendationType,
      confidence:
        doc.recommendationConfidence != null
          ? doc.recommendationConfidence
          : fresh.confidence,
      recommendationRules:
        doc.recommendationRules?.length > 0
          ? doc.recommendationRules
          : fresh.recommendationRules,
    };

    const smartChecks = getSmartCheckMessages({
      institutionType: doc.institutionType,
      country: doc.curriculumCountry,
      curriculumBoard: doc.curriculumBoard,
      gradeFrom: doc.gradeFrom,
      gradeTo: doc.gradeTo,
    });

    return res.status(200).json({
      success: true,
      data: {
        recommendation: merged,
        smartChecks,
        source: doc.recommendationType ? "stored_regenerated" : "regenerated",
      },
      message: "Recommendation loaded successfully",
    });
  } catch (error) {
    console.error("getRecommendation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recommendation",
      error: error.message,
    });
  }
};

const buildStep7PersistPayload = (sanitized, wizardDoc, progressMeta, completedSteps) => {
  const permissionMatrix = generatePermissionMatrix(
    sanitized.optionalRoles,
    sanitized.permissionSetupStyle
  );
  const dependencyStatus = computeDependencyStatus({
    ...wizardDoc,
    approvalWorkflow: sanitized.approvalWorkflow,
    subjectFramework: wizardDoc?.subjectFramework,
    enabledModules: wizardDoc?.enabledModules,
  });

  return {
    enabledRoles: buildEnabledRoles(sanitized.optionalRoles),
    optionalRoles: sanitized.optionalRoles,
    permissionSetupStyle: sanitized.permissionSetupStyle,
    staffIdFormat: sanitized.staffIdFormat,
    teacherIdFormat: sanitized.teacherIdFormat,
    staffCategories: sanitized.staffCategories,
    departmentSetup: sanitized.departmentSetup,
    approvalWorkflow: sanitized.approvalWorkflow,
    permissionMatrix,
    dependencyStatus,
    currentStep: progressMeta.step,
    progressPercentage: progressMeta.progress,
    setupStatus: "draft",
    completedSteps,
  };
};

/** GET /api/setup-wizard/step-7 — fetch saved roles & HR foundation */
exports.getStep7RolesHrFoundation = async (req, res) => {
  try {
    const doc = await SetupWizard.findOne().sort({ updatedAt: -1 });
    const data = mapWizardToStep7Response(doc);
    const smartChecks = doc
      ? getRolesHrSmartChecks(doc.enabledModules, data?.optionalRoles)
      : [];

    return res.status(200).json({
      success: true,
      data: data
        ? {
            ...data,
            smartChecks,
            recommendationText:
              data.permissionSetupStyle === "custom"
                ? "Custom mode selected. You can edit detailed permissions before launch, but setup may take longer."
                : "Use recommended permissions now. Advanced permission tuning can be done later from Setup Center with audit logs.",
          }
        : null,
      message: doc ? "Step 7 data loaded" : "No step 7 data found",
    });
  } catch (error) {
    console.error("getStep7RolesHrFoundation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch step 7 data",
      error: error.message,
    });
  }
};

/** POST /api/setup-wizard/step-7 — save roles & HR foundation */
exports.saveStep7RolesHrFoundation = async (req, res) => {
  try {
    const { currentStep, progressPercentage, completedSteps } = req.body;
    const progressMeta = validateStepProgress(currentStep, progressPercentage, res);
    if (!progressMeta) return;

    const isDraft = req.body.draft === true || req.body.draft === "true";
    const validation = validateStep7Payload(req.body, { draft: isDraft });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join("; "),
      });
    }

    const { sanitized } = validation;

    if (
      sanitized.permissionSetupStyle &&
      !VALID_PERMISSION_STYLES.includes(sanitized.permissionSetupStyle)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid permissionSetupStyle",
      });
    }

    if (
      sanitized.departmentSetup &&
      !VALID_DEPARTMENT_SETUP.includes(sanitized.departmentSetup)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid departmentSetup",
      });
    }

    if (
      sanitized.approvalWorkflow &&
      !VALID_APPROVAL_WORKFLOW.includes(sanitized.approvalWorkflow)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid approvalWorkflow",
      });
    }

    const existing = await SetupWizard.findOne().sort({ updatedAt: -1 });
    const completed = Array.isArray(completedSteps)
      ? completedSteps.filter((n) => Number.isFinite(Number(n)))
      : [];

    const payload = buildStep7PersistPayload(
      sanitized,
      existing,
      progressMeta,
      completed
    );

    const doc = await upsertSetupDoc(payload);

    return res.status(200).json({
      success: true,
      data: mapWizardToStep7Response(doc),
      message: "Roles & HR foundation saved successfully",
    });
  } catch (error) {
    console.error("saveStep7RolesHrFoundation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save roles & HR foundation",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 10 — Fee Setup
// ─────────────────────────────────────────────────────────────────────────────

const VALID_FEE_FREQUENCIES = ["monthly", "quarterly", "term_wise", "annual"];
const VALID_LATE_FEE_TYPES = [
  "fixed_amount",
  "daily_penalty",
  "percentage_penalty",
  "no_late_fee",
];
const VALID_PARTIAL_PAYMENT = ["allow", "do_not_allow", "allow_with_approval"];
const VALID_REFUND_POLICY = [
  "manual_refund_approval",
  "no_refund",
  "auto_refund_rules",
];
const VALID_PAYMENT_MODES = ["online_offline", "online_only", "offline_only"];

/** POST /api/setup-wizard/step-10 — save fee setup */
exports.saveStep10FeeSetup = async (req, res) => {
  try {
    const {
      feeCollectionFrequency,
      feeCategories,
      discounts,
      lateFeeType,
      lateFeeValue,
      graceDays,
      partialPayment,
      refundPolicy,
      paymentModes,
      feeReminders,
      currentStep,
      progressPercentage,
      completedSteps,
    } = req.body;

    const progressMeta = validateStepProgress(currentStep, progressPercentage, res);
    if (!progressMeta) return;

    const freq = String(feeCollectionFrequency || "quarterly").trim();
    if (!VALID_FEE_FREQUENCIES.includes(freq)) {
      return res.status(400).json({
        success: false,
        message:
          "feeCollectionFrequency must be one of: monthly, quarterly, term_wise, annual",
      });
    }

    const lateType = String(lateFeeType || "fixed_amount").trim();
    if (!VALID_LATE_FEE_TYPES.includes(lateType)) {
      return res.status(400).json({
        success: false,
        message:
          "lateFeeType must be one of: fixed_amount, daily_penalty, percentage_penalty, no_late_fee",
      });
    }

    const partial = String(partialPayment || "allow").trim();
    if (!VALID_PARTIAL_PAYMENT.includes(partial)) {
      return res.status(400).json({
        success: false,
        message:
          "partialPayment must be one of: allow, do_not_allow, allow_with_approval",
      });
    }

    const refund = String(refundPolicy || "manual_refund_approval").trim();
    if (!VALID_REFUND_POLICY.includes(refund)) {
      return res.status(400).json({
        success: false,
        message:
          "refundPolicy must be one of: manual_refund_approval, no_refund, auto_refund_rules",
      });
    }

    const modes = String(paymentModes || "online_offline").trim();
    if (!VALID_PAYMENT_MODES.includes(modes)) {
      return res.status(400).json({
        success: false,
        message: "paymentModes must be one of: online_offline, online_only, offline_only",
      });
    }

    const completed = Array.isArray(completedSteps)
      ? completedSteps.filter((n) => Number.isFinite(Number(n)))
      : [];

    const payload = {
      feeCollectionFrequency: freq,
      feeCategories: Array.isArray(feeCategories) ? feeCategories : [],
      discounts: {
        siblingDiscount: Boolean(discounts?.siblingDiscount),
        meritScholarship: Boolean(discounts?.meritScholarship),
        needBasedConcession: Boolean(discounts?.needBasedConcession),
        staffChildDiscount: Boolean(discounts?.staffChildDiscount),
      },
      lateFeeType: lateType,
      lateFeeValue: Number(lateFeeValue) || 0,
      graceDays: Number(graceDays) || 0,
      partialPayment: partial,
      refundPolicy: refund,
      paymentModes: modes,
      feeReminders: {
        beforeDueDate: Boolean(feeReminders?.beforeDueDate),
        onDueDate: Boolean(feeReminders?.onDueDate),
        afterDueDate: Boolean(feeReminders?.afterDueDate),
        lowBalanceReminder: Boolean(feeReminders?.lowBalanceReminder),
        scholarshipApprovalAlert: Boolean(feeReminders?.scholarshipApprovalAlert),
      },
      currentStep: progressMeta.step,
      progressPercentage: progressMeta.progress,
      setupStatus: "draft",
      completedSteps: completed,
    };

    const doc = await upsertSetupDoc(payload);

    return res.status(200).json({
      success: true,
      data: doc,
      message: "Fee setup saved successfully",
    });
  } catch (error) {
    console.error("saveStep10FeeSetup error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save fee setup",
      error: error.message,
    });
  }
};

/** PUT /api/setup-wizard/step-7/roles — update optional role configuration */
exports.updateStep7RoleConfiguration = async (req, res) => {
  try {
    const { roleKey, enabled } = req.body;

    if (!roleKey) {
      return res.status(400).json({
        success: false,
        message: "roleKey is required",
      });
    }

    const toggleCheck = validateRoleToggle(roleKey, enabled !== false);
    if (!toggleCheck.valid) {
      return res.status(400).json({
        success: false,
        message: toggleCheck.message,
      });
    }

    const doc = await SetupWizard.findOne().sort({ updatedAt: -1 });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Setup wizard not found. Complete earlier steps first.",
      });
    }

    let optionalRoles = normalizeOptionalRoles(doc.optionalRoles);
    const shouldEnable = enabled !== false;

    if (shouldEnable && !optionalRoles.includes(roleKey)) {
      optionalRoles.push(roleKey);
    } else if (!shouldEnable) {
      optionalRoles = optionalRoles.filter((r) => r !== roleKey);
    }

    const permissionMatrix = generatePermissionMatrix(
      optionalRoles,
      doc.permissionSetupStyle
    );

    const updated = await SetupWizard.findByIdAndUpdate(
      doc._id,
      {
        optionalRoles,
        enabledRoles: buildEnabledRoles(optionalRoles),
        permissionMatrix,
        dependencyStatus: computeDependencyStatus(doc),
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: mapWizardToStep7Response(updated),
      message: `Role "${roleKey}" updated`,
    });
  } catch (error) {
    console.error("updateStep7RoleConfiguration error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update role configuration",
      error: error.message,
    });
  }
};

/** DELETE /api/setup-wizard/step-7/roles/:roleKey — remove optional role */
exports.deleteStep7OptionalRole = async (req, res) => {
  try {
    const roleKey = decodeURIComponent(req.params.roleKey || "").trim();

    if (!roleKey) {
      return res.status(400).json({
        success: false,
        message: "roleKey is required",
      });
    }

    if (CORE_ROLE_KEYS.includes(roleKey)) {
      return res.status(400).json({
        success: false,
        message: `Cannot remove required role "${roleKey}"`,
      });
    }

    if (!OPTIONAL_ROLE_KEYS.includes(roleKey)) {
      return res.status(400).json({
        success: false,
        message: `Unknown optional role "${roleKey}"`,
      });
    }

    const doc = await SetupWizard.findOne().sort({ updatedAt: -1 });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Setup wizard not found",
      });
    }

    const optionalRoles = normalizeOptionalRoles(doc.optionalRoles).filter(
      (r) => r !== roleKey
    );

    const permissionMatrix = generatePermissionMatrix(
      optionalRoles,
      doc.permissionSetupStyle
    );

    const updated = await SetupWizard.findByIdAndUpdate(
      doc._id,
      {
        optionalRoles,
        enabledRoles: buildEnabledRoles(optionalRoles),
        permissionMatrix,
        dependencyStatus: computeDependencyStatus(doc),
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: mapWizardToStep7Response(updated),
      message: `Optional role "${roleKey}" removed`,
    });
  } catch (error) {
    console.error("deleteStep7OptionalRole error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove optional role",
      error: error.message,
    });
  }
};

const buildStep8PersistPayload = (sanitized, progressMeta, completedSteps) => ({
  attendanceMode: sanitized.attendanceMode,
  workingDays: sanitized.workingDays,
  schoolStartTime: sanitized.schoolStartTime,
  schoolEndTime: sanitized.schoolEndTime,
  halfDayCheckoutTime: sanitized.halfDayCheckoutTime,
  attendanceClosingTime: sanitized.attendanceClosingTime,
  lateArrivalAfter: sanitized.lateArrivalAfter,
  autoAbsentAfter: sanitized.autoAbsentAfter,
  minimumAttendance: sanitized.minimumAttendance,
  graceMinutes: sanitized.graceMinutes,
  attendancePermissions: sanitized.attendancePermissions,
  leaveApprovalRules: sanitized.leaveApprovalRules,
  leaveTypes: sanitized.leaveTypes,
  parentNotificationRules: sanitized.parentNotificationRules,
  attendanceDependencyStatus: sanitized.attendanceDependencyStatus,
  attendanceSmartChecks: sanitized.attendanceSmartChecks,
  currentStep: progressMeta.step,
  progressPercentage: progressMeta.progress,
  setupStatus: "draft",
  completedSteps,
});

const persistStep8FromBody = async (req, res, { advancingDefaults } = {}) => {
  const { currentStep, progressPercentage, completedSteps } = req.body;
  const progressMeta = validateStepProgress(currentStep, progressPercentage, res);
  if (!progressMeta) return null;

  const isDraft = req.body.draft === true || req.body.draft === "true";
  const validation = validateStep8Payload(req.body, { draft: isDraft });

  if (!validation.valid) {
    res.status(400).json({
      success: false,
      message: validation.errors.join("; "),
    });
    return null;
  }

  const completed = Array.isArray(completedSteps)
    ? completedSteps.filter((n) => Number.isFinite(Number(n)))
    : advancingDefaults?.completedSteps || [];

  const payload = buildStep8PersistPayload(
    validation.sanitized,
    progressMeta,
    completed
  );

  const doc = await upsertSetupDoc(payload);
  return doc;
};

/** GET /api/setup-wizard/step-8 — fetch saved attendance rules */
exports.getStep8AttendanceRules = async (req, res) => {
  try {
    const doc = await SetupWizard.findOne().sort({ updatedAt: -1 });
    const data = mapWizardToStep8Response(doc);

    return res.status(200).json({
      success: true,
      data,
      message: doc ? "Step 8 data loaded" : "No step 8 data found",
    });
  } catch (error) {
    console.error("getStep8AttendanceRules error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch step 8 data",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 11 — Communication Setup
// ─────────────────────────────────────────────────────────────────────────────

const VALID_ID_CARD_TEMPLATES = ["standard_school_id", "minimal_id", "custom_later"];
const VALID_FEE_RECEIPT_TEMPLATES = ["standard_receipt", "detailed_receipt", "custom_later"];
const VALID_REPORT_CARD_TEMPLATES = ["board_specific", "simple_report_card", "custom_later"];
const VALID_CERTIFICATE_TEMPLATES = ["standard_certificate", "custom_later"];

/** POST /api/setup-wizard/step-11 — save communication setup */
exports.saveStep11CommunicationSetup = async (req, res) => {
  try {
    const {
      communicationChannels,
      notificationTriggers,
      announcementPermissions,
      documentTemplates,
      currentStep,
      progressPercentage,
      completedSteps,
    } = req.body;

    const progressMeta = validateStepProgress(currentStep, progressPercentage, res);
    if (!progressMeta) return;

    const completed = Array.isArray(completedSteps)
      ? completedSteps.filter((n) => Number.isFinite(Number(n)))
      : [];

    const payload = {
      communicationChannels: {
        email: Boolean(communicationChannels?.email),
        sms: Boolean(communicationChannels?.sms),
        whatsapp: Boolean(communicationChannels?.whatsapp),
        pushInApp: Boolean(communicationChannels?.pushInApp),
      },
      notificationTriggers: {
        studentAbsent: Boolean(notificationTriggers?.studentAbsent),
        feeDueReminder: Boolean(notificationTriggers?.feeDueReminder),
        examResultPublished: Boolean(notificationTriggers?.examResultPublished),
        homeworkPublished: Boolean(notificationTriggers?.homeworkPublished),
        emergencyAlert: Boolean(notificationTriggers?.emergencyAlert),
        transportUpdates: Boolean(notificationTriggers?.transportUpdates),
      },
      announcementPermissions: {
        principal: Boolean(announcementPermissions?.principal),
        schoolAdmin: Boolean(announcementPermissions?.schoolAdmin),
        classTeacher: Boolean(announcementPermissions?.classTeacher),
        subjectTeacher: Boolean(announcementPermissions?.subjectTeacher),
        transportManager: Boolean(announcementPermissions?.transportManager),
      },
      documentTemplates: {
        idCardTemplate: String(documentTemplates?.idCardTemplate || "standard"),
        feeReceiptTemplate: String(documentTemplates?.feeReceiptTemplate || "standard"),
        reportCardTemplate: String(documentTemplates?.reportCardTemplate || "board_specific"),
        certificateTemplate: String(documentTemplates?.certificateTemplate || "standard"),
      },
      currentStep: progressMeta.step,
      progressPercentage: progressMeta.progress,
      setupStatus: "draft",
      completedSteps: completed,
    };

    const doc = await upsertSetupDoc(payload);

    return res.status(200).json({
      success: true,
      data: doc,
      message: "Communication setup saved successfully",
    });
  } catch (error) {
    console.error("saveStep11CommunicationSetup error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save communication setup",
      error: error.message,
    });
  }
};

/** POST /api/setup-wizard/step-8 — save attendance rules */
exports.saveStep8AttendanceRules = async (req, res) => {
  try {
    const doc = await persistStep8FromBody(req, res, {
      advancingDefaults: { completedSteps: [1, 2, 3, 4, 5, 6, 7, 8] },
    });
    if (!doc) return;

    return res.status(200).json({
      success: true,
      data: mapWizardToStep8Response(doc),
      message: "Attendance rules saved successfully",
    });
  } catch (error) {
    console.error("saveStep8AttendanceRules error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save attendance rules",
      error: error.message,
    });
  }
};

/** PUT /api/setup-wizard/step-8 — update attendance rules */
exports.updateStep8AttendanceRules = async (req, res) => {
  try {
    const existing = await SetupWizard.findOne().sort({ updatedAt: -1 });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Setup wizard not found. Complete earlier steps first.",
      });
    }

    const doc = await persistStep8FromBody(req, res);
    if (!doc) return;

    return res.status(200).json({
      success: true,
      data: mapWizardToStep8Response(doc),
      message: "Attendance rules updated successfully",
    });
  } catch (error) {
    console.error("updateStep8AttendanceRules error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update attendance rules",
      error: error.message,
    });
  }
};

/** PATCH /api/setup-wizard/step-8/toggles — update permission/notification toggles */
exports.patchStep8AttendanceToggles = async (req, res) => {
  try {
    const { section, key, enabled } = req.body;

    if (!section || !key) {
      return res.status(400).json({
        success: false,
        message: "section and key are required",
      });
    }

    const doc = await SetupWizard.findOne().sort({ updatedAt: -1 });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Setup wizard not found. Complete earlier steps first.",
      });
    }

    const patchResult = applyTogglePatch(doc, section, key, enabled);
    if (!patchResult.ok) {
      return res.status(400).json({
        success: false,
        message: patchResult.message,
      });
    }

    const mergedPermissions = normalizePermissions(
      patchResult.update.attendancePermissions || doc.attendancePermissions
    );
    const mergedNotifications = normalizeParentNotifications(
      patchResult.update.parentNotificationRules || doc.parentNotificationRules
    );

    const attendanceDependencyStatus = computeAttendanceDependencyStatus(
      mergedNotifications,
      doc.minimumAttendance
    );
    const attendanceSmartChecks = getAttendanceSmartChecks({
      attendanceMode: doc.attendanceMode,
      attendancePermissions: mergedPermissions,
      attendanceClosingTime: doc.attendanceClosingTime,
    });

    const updated = await SetupWizard.findByIdAndUpdate(
      doc._id,
      {
        ...patchResult.update,
        attendanceDependencyStatus,
        attendanceSmartChecks,
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: mapWizardToStep8Response(updated),
      message: "Attendance toggle updated",
    });
  } catch (error) {
    console.error("patchStep8AttendanceToggles error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update attendance toggle",
      error: error.message,
    });
  }
};

const persistStep9ExaminationGradebook = async (
  req,
  res,
  { existingWizardDoc = null, action = "step9_saved" } = {}
) => {
  const { currentStep, progressPercentage, completedSteps, publishingAction, revertToVersionNumber } =
    req.body;
  const progressMeta = validateStepProgress(currentStep, progressPercentage, res);
  if (!progressMeta) return null;

  const wizardDoc =
    existingWizardDoc || (await SetupWizard.findOne().sort({ updatedAt: -1 }));
  const currentConfig = wizardDoc?.step9ExaminationGradebook || getDefaultStep9State(wizardDoc);
  const mergedPayload = {
    ...currentConfig,
    ...req.body,
  };

  const isDraft = req.body.draft === true || req.body.draft === "true";
  const validation = validateStep9Payload(mergedPayload, wizardDoc, { draft: isDraft });
  if (!validation.valid) {
    res.status(400).json({
      success: false,
      message: validation.errors.join("; "),
    });
    return null;
  }

  const completed = Array.isArray(completedSteps)
    ? completedSteps.filter((n) => Number.isFinite(Number(n)))
    : [];

  const actor =
    req.user?.email ||
    req.user?.id ||
    req.body.updatedBy ||
    req.body.actor ||
    "system";

  const nextStep9Payload = buildStep9PersistPayload({
    sanitized: {
      ...validation.sanitized,
      currentStep: progressMeta.step,
      progressPercentage: progressMeta.progress,
    },
    existingConfig: currentConfig,
    wizardDoc,
    actor,
    action,
    publishingAction,
    revertToVersionNumber,
  });

  const doc = await upsertSetupDoc({
    step9ExaminationGradebook: nextStep9Payload,
    currentStep: progressMeta.step,
    progressPercentage: progressMeta.progress,
    completedSteps: completed,
    setupStatus: "draft",
  });

  return doc;
};

/** GET /api/setup-wizard/step-9 — fetch examination & gradebook setup */
exports.getStep9ExaminationGradebook = async (req, res) => {
  try {
    const doc = await SetupWizard.findOne().sort({ updatedAt: -1 });
    return res.status(200).json({
      success: true,
      data: mapWizardToStep9Response(doc || {}),
      message: doc ? "Step 9 data loaded" : "No step 9 data found",
    });
  } catch (error) {
    console.error("getStep9ExaminationGradebook error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch step 9 data",
      error: error.message,
    });
  }
};

/** POST /api/setup-wizard/step-9 — save examination & gradebook setup */
exports.saveStep9ExaminationGradebook = async (req, res) => {
  try {
    const doc = await persistStep9ExaminationGradebook(req, res, {
      action: "step9_saved",
    });
    if (!doc) return;

    return res.status(200).json({
      success: true,
      data: mapWizardToStep9Response(doc),
      message: "Examination & gradebook setup saved successfully",
    });
  } catch (error) {
    console.error("saveStep9ExaminationGradebook error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save examination & gradebook setup",
      error: error.message,
    });
  }
};

/** PUT /api/setup-wizard/step-9 — update examination & gradebook rules */
exports.updateStep9ExaminationGradebook = async (req, res) => {
  try {
    const existing = await SetupWizard.findOne().sort({ updatedAt: -1 });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Setup wizard not found. Complete earlier steps first.",
      });
    }

    const doc = await persistStep9ExaminationGradebook(req, res, {
      existingWizardDoc: existing,
      action: "step9_updated",
    });
    if (!doc) return;

    return res.status(200).json({
      success: true,
      data: mapWizardToStep9Response(doc),
      message: "Examination & gradebook rules updated successfully",
    });
  } catch (error) {
    console.error("updateStep9ExaminationGradebook error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update examination & gradebook rules",
      error: error.message,
    });
  }
};

/** PATCH /api/setup-wizard/step-9/grade-scale — update grade scale independently */
exports.patchStep9GradeScale = async (req, res) => {
  try {
    const existing = await SetupWizard.findOne().sort({ updatedAt: -1 });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Setup wizard not found. Complete earlier steps first.",
      });
    }

    const currentStep9 = existing.step9ExaminationGradebook || getDefaultStep9State(existing);
    const mergedPayload = {
      ...currentStep9,
      gradeScaleScope:
        req.body.gradeScaleScope ?? currentStep9.gradeScaleScope,
      defaultPassingMarks:
        req.body.defaultPassingMarks ?? currentStep9.defaultPassingMarks,
      gradeTable: req.body.gradeTable ?? currentStep9.gradeTable,
      resultDisplayFormat:
        req.body.resultDisplayFormat ?? currentStep9.resultDisplayFormat,
      currentStep: req.body.currentStep ?? currentStep9.currentStep ?? 9,
      progressPercentage:
        req.body.progressPercentage ?? currentStep9.progressPercentage ?? 82,
      completedSteps: req.body.completedSteps ?? existing.completedSteps ?? [],
    };

    req.body = mergedPayload;
    const doc = await persistStep9ExaminationGradebook(req, res, {
      existingWizardDoc: existing,
      action: "grade_scale_patched",
    });
    if (!doc) return;

    return res.status(200).json({
      success: true,
      data: mapWizardToStep9Response(doc),
      message: "Grade scale updated successfully",
    });
  } catch (error) {
    console.error("patchStep9GradeScale error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update grade scale",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 12 — Review & Launch
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/setup-wizard/step-12/launch — confirm and launch school setup */
exports.launchSchoolSetup = async (req, res) => {
  try {
    const { launchConfirmed, currentStep, progressPercentage, completedSteps } =
      req.body;

    if (!launchConfirmed) {
      return res.status(400).json({
        success: false,
        message: "Launch confirmation is required. Set launchConfirmed to true.",
      });
    }

    const progressMeta = validateStepProgress(currentStep, progressPercentage, res);
    if (!progressMeta) return;

    const completed = Array.isArray(completedSteps)
      ? completedSteps.filter((n) => Number.isFinite(Number(n)))
      : [];

    // Build a snapshot of the current wizard state
    const existingDoc = await SetupWizard.findOne().sort({ updatedAt: -1 });
    const snapshot = existingDoc ? existingDoc.toObject() : {};

    const payload = {
      launchConfirmed: true,
      launchSnapshot: {
        ...snapshot,
        snapshotVersion: "V1",
        snapshotCreatedAt: new Date().toISOString(),
      },
      launchedAt: new Date(),
      currentStep: progressMeta.step,
      progressPercentage: 100,
      setupStatus: "completed",
      completedSteps: completed,
    };

    const doc = await upsertSetupDoc(payload);

    return res.status(200).json({
      success: true,
      data: doc,
      message: "School setup launched successfully. Configuration snapshot created.",
    });
  } catch (error) {
    console.error("launchSchoolSetup error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to launch school setup",
      error: error.message,
    });
  }
};

/** DELETE /api/setup-wizard/step-9/grade-rows/:rowId — remove grade row */
exports.deleteStep9GradeRow = async (req, res) => {
  try {
    const rowId = decodeURIComponent(req.params.rowId || "").trim();
    if (!rowId) {
      return res.status(400).json({
        success: false,
        message: "rowId is required",
      });
    }

    const existing = await SetupWizard.findOne().sort({ updatedAt: -1 });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Setup wizard not found. Complete earlier steps first.",
      });
    }

    const currentStep9 = existing.step9ExaminationGradebook || getDefaultStep9State(existing);
    req.body = {
      ...removeGradeRow(currentStep9, rowId),
      currentStep: currentStep9.currentStep || 9,
      progressPercentage: currentStep9.progressPercentage || 82,
      completedSteps: existing.completedSteps || [],
    };

    const doc = await persistStep9ExaminationGradebook(req, res, {
      existingWizardDoc: existing,
      action: "grade_row_deleted",
    });
    if (!doc) return;

    return res.status(200).json({
      success: true,
      data: mapWizardToStep9Response(doc),
      message: "Grade row removed successfully",
    });
  } catch (error) {
    console.error("deleteStep9GradeRow error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove grade row",
      error: error.message,
    });
  }
};

/** DELETE /api/setup-wizard/step-9/weightage-rows/:rowId — remove weightage row */
exports.deleteStep9WeightageRow = async (req, res) => {
  try {
    const rowId = decodeURIComponent(req.params.rowId || "").trim();
    if (!rowId) {
      return res.status(400).json({
        success: false,
        message: "rowId is required",
      });
    }

    const existing = await SetupWizard.findOne().sort({ updatedAt: -1 });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Setup wizard not found. Complete earlier steps first.",
      });
    }

    const currentStep9 = existing.step9ExaminationGradebook || getDefaultStep9State(existing);
    req.body = {
      ...removeWeightageRow(currentStep9, rowId),
      currentStep: currentStep9.currentStep || 9,
      progressPercentage: currentStep9.progressPercentage || 82,
      completedSteps: existing.completedSteps || [],
    };

    const doc = await persistStep9ExaminationGradebook(req, res, {
      existingWizardDoc: existing,
      action: "weightage_row_deleted",
    });
    if (!doc) return;

    return res.status(200).json({
      success: true,
      data: mapWizardToStep9Response(doc),
      message: "Assessment weightage row removed successfully",
    });
  } catch (error) {
    console.error("deleteStep9WeightageRow error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove assessment weightage row",
      error: error.message,
    });
  }
};

/** GET /api/setup-wizard/step-12/review — get full review summary for launch page */
exports.getSetupReview = async (req, res) => {
  try {
    const doc = await SetupWizard.findOne().sort({ updatedAt: -1 });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "No setup wizard data found",
      });
    }

    const completedCount = doc.completedSteps?.length || 0;
    const totalSections = 12;
    const readinessScore = Math.round((completedCount / totalSections) * 100);

    const sections = [
      {
        key: "schoolProfile",
        label: "School Profile",
        desc: "Name, branding, localization, contacts configured.",
        done: Boolean(doc.schoolName && doc.schoolCode && doc.address),
      },
      {
        key: "academicStructure",
        label: "Academic Structure",
        desc: "Academic year, grades, sections, streams, subjects mode configured.",
        done: Boolean(doc.gradeFrom && doc.gradeTo),
      },
      {
        key: "rolesHR",
        label: "Roles & HR",
        desc: "Core roles, optional roles, staff categories, permissions configured.",
        done: doc.completedSteps?.includes(7) || false,
      },
      {
        key: "attendance",
        label: "Attendance",
        desc: "Hybrid mode, late rules, leave approvals, parent alerts configured.",
        done: doc.completedSteps?.includes(8) || false,
      },
      {
        key: "exams",
        label: "Exams & Gradebook",
        desc: "Term exams, marks + grade, report card, grade scale configured.",
        done: doc.completedSteps?.includes(9) || false,
      },
      {
        key: "fees",
        label: "Fees",
        desc: "Quarterly fees, categories, late fee, discounts, reminders configured.",
        done: Boolean(doc.feeCollectionFrequency),
      },
      {
        key: "communication",
        label: "Communication",
        desc: "Channels, triggers, message templates, documents configured.",
        done: Boolean(
          doc.communicationChannels?.email !== undefined
        ),
      },
      {
        key: "optionalModules",
        label: "Optional Modules",
        desc: "Transport / Library / Health mini setup can run after launch.",
        done: false,
        later: true,
      },
    ];

    const warnings = [];
    if (!doc.gradeFrom || !doc.gradeTo) {
      warnings.push("Subject details may need review. Review subject lists before timetable creation.");
    }
    warnings.push(
      "Optional modules not fully configured. Transport, Library, Health, and other optional modules can be configured using mini setup wizards after launch."
    );

    return res.status(200).json({
      success: true,
      data: {
        doc: formatSetupDoc(doc),
        readinessScore: Math.min(94, readinessScore),
        sectionsComplete: sections.filter((s) => s.done).length,
        totalSections,
        warnings,
        blockingIssues: 0,
        sections,
        isLaunched: doc.setupStatus === "completed",
        launchedAt: doc.launchedAt,
      },
      message: "Setup review loaded successfully",
    });
  } catch (error) {
    console.error("getSetupReview error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load setup review",
      error: error.message,
    });
  }
};
