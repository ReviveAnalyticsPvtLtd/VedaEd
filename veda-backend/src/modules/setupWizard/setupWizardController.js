const { randomUUID } = require("crypto");
const SetupWizard = require("./setupWizardModel");
const {
  generateRecommendation,
  getSmartCheckMessages,
  recommendationToStoredFields,
} = require("./recommendation/recommendationEngine");
const { isValidGradeRange } = require("./recommendation/gradeUtils");

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
