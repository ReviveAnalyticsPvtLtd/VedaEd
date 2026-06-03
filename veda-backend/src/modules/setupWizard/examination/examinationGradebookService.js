const { randomUUID } = require("crypto");
const {
  ASSESSMENT_MODELS,
  RESULT_DISPLAY_FORMATS,
  GRADE_SCALE_SCOPES,
  REPORT_CARD_FORMATS,
  RESULT_PUBLISHING_MODES,
  REPORT_CARD_SECTIONS,
  DEFAULT_GRADE_TABLE,
  getDefaultGradeTableForFormat,
  GPA_SCALE_TYPES,
  getGpaScaleMax,
  DEFAULT_ASSESSMENT_WEIGHTAGE,
  DEFAULT_REPORT_CARD_SECTIONS,
  DEFAULT_DEPENDENCY_STATUS,
} = require("./examinationGradebook.config");

const DEFAULT_ASSESSMENT_MODEL = "Term Exams";
const DEFAULT_RESULT_FORMAT = "Marks + Grade";
const DEFAULT_GPA_SCALE_TYPE = "4.0";
const DEFAULT_GRADE_SCALE_SCOPE = "Globally";
const DEFAULT_PASSING_MARKS = 33;
const DEFAULT_REPORT_CARD_FORMAT = "Board-specific Standard";
const DEFAULT_PUBLISHING_MODE = "Admin Approval Required";

const PICKED_SNAPSHOT_FIELDS = [
  "assessmentModel",
  "resultDisplayFormat",
  "gpaScaleType",
  "gradeScaleScope",
  "defaultPassingMarks",
  "gradeTable",
  "assessmentWeightage",
  "reportCardFormat",
  "resultPublishingMode",
  "reportCardSections",
  "dependencyStatus",
  "recommendationMessage",
  "smartChecks",
  "currentStep",
  "progressPercentage",
  "assessmentModelLogic",
  "publishingState",
  "approvalWorkflowStatus",
  "scheduledPublishAt",
  "lastPublishedAt",
  "lastPublishedVersion",
];

const asTrimmedString = (value, fallback = "") => String(value ?? fallback).trim();

const asNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const cloneRows = (rows = []) => rows.map((row) => ({ ...row }));

const getDefaultAssessmentModel = (wizardDoc = {}) => {
  const board = asTrimmedString(wizardDoc.curriculumBoard).toUpperCase();
  if (wizardDoc.institutionType === "k12_school" || board.includes("CBSE")) {
    return DEFAULT_ASSESSMENT_MODEL;
  }
  return DEFAULT_ASSESSMENT_MODEL;
};

const resolveAssessmentModelLogic = (assessmentModel) => {
  if (assessmentModel === "Continuous Assessment") {
    return "Activities, assignments, projects, and regular evaluations contribute to the final result.";
  }
  if (assessmentModel === "Unit Test + Final") {
    return "Periodic assessments and final examinations are combined through configured weightage.";
  }
  if (assessmentModel === "Custom") {
    return "Administrators define exam groups, grading ranges, and report card behavior.";
  }
  return "Term-based exam structure suitable for Term 1, Term 2, unit tests, and finals.";
};

const normalizeDependencyStatus = () => cloneRows(DEFAULT_DEPENDENCY_STATUS);

const normalizeReportCardSections = (sections) => {
  if (!Array.isArray(sections)) return [...DEFAULT_REPORT_CARD_SECTIONS];
  const allowed = new Set(REPORT_CARD_SECTIONS);
  const normalized = [...new Set(sections.map((item) => asTrimmedString(item)).filter(Boolean))]
    .filter((item) => allowed.has(item));
  return normalized.length ? normalized : [...DEFAULT_REPORT_CARD_SECTIONS];
};

const normalizeGpaPoints = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const calculateWeightedGpa = (rows = []) => {
  const entries = rows
    .map((row) => ({
      gpaPoints: asNumber(row.gpaPoints, NaN),
      credits: asNumber(row.credits, NaN),
    }))
    .filter(
      (entry) =>
        Number.isFinite(entry.gpaPoints) &&
        Number.isFinite(entry.credits) &&
        entry.credits > 0
    );

  if (!entries.length) return null;

  const totalCredits = entries.reduce((sum, entry) => sum + entry.credits, 0);
  if (totalCredits <= 0) return null;

  const weightedSum = entries.reduce(
    (sum, entry) => sum + entry.gpaPoints * entry.credits,
    0
  );

  return Number((weightedSum / totalCredits).toFixed(2));
};

const normalizeGradeTable = (
  rows,
  resultDisplayFormat = DEFAULT_RESULT_FORMAT,
  gpaScaleType = DEFAULT_GPA_SCALE_TYPE
) => {
  const defaults = getDefaultGradeTableForFormat(resultDisplayFormat, gpaScaleType);
  const source = Array.isArray(rows) && rows.length ? rows : defaults;
  return source.map((row, index) => {
    const fallback = defaults[index] || defaults[0] || {};
    return {
      rowId: asTrimmedString(row.rowId, `grade-row-${index + 1}`) || `grade-row-${index + 1}`,
      grade: asTrimmedString(row.grade),
      minPercentage: asNumber(
        row.minPercentage ?? row.min,
        fallback.minPercentage ?? 0
      ),
      maxPercentage: asNumber(
        row.maxPercentage ?? row.max,
        fallback.maxPercentage ?? 0
      ),
      description: asTrimmedString(row.description ?? row.desc),
      gpaPoints: normalizeGpaPoints(row.gpaPoints ?? row.gpa ?? fallback.gpaPoints),
      credits: asNumber(row.credits, fallback.credits ?? 1),
    };
  });
};

const normalizeAssessmentWeightage = (rows) => {
  const source =
    Array.isArray(rows) && rows.length ? rows : DEFAULT_ASSESSMENT_WEIGHTAGE;
  return source.map((row, index) => ({
    rowId:
      asTrimmedString(row.rowId, `weightage-row-${index + 1}`) ||
      `weightage-row-${index + 1}`,
    assessmentName: asTrimmedString(row.assessmentName ?? row.name),
    weightValue: asNumber(row.weightValue ?? row.value, 0),
    weightType: "% Weight",
  }));
};

const getRecommendationMessage = (config = {}, wizardDoc = {}) => {
  const board = asTrimmedString(wizardDoc.curriculumBoard).toUpperCase();
  const isCbseK12 =
    wizardDoc.institutionType === "k12_school" || board.includes("CBSE");

  if (
    isCbseK12 &&
    config.assessmentModel === "Term Exams" &&
    config.resultDisplayFormat === "Marks + Grade"
  ) {
    return "For CBSE K12, use Term Exams with Marks + Grade and board-specific report card format.";
  }

  if (config.assessmentModel === "Continuous Assessment") {
    return "Continuous Assessment works best when teachers regularly capture assignments, projects, and activities.";
  }

  if (config.assessmentModel === "Custom") {
    return "Custom assessment works best when your board or institution follows a non-standard grading and reporting structure.";
  }

  return "Use a consistent grade scale and report card format so grading, report cards, and promotion rules stay aligned.";
};

const getSmartChecks = (config = {}) => {
  const checks = [
    "Changing grading after exams are published should create a new version instead of overwriting existing results.",
  ];

  const totalWeight = normalizeAssessmentWeightage(config.assessmentWeightage).reduce(
    (sum, item) => sum + item.weightValue,
    0
  );
  if (totalWeight !== 100) {
    checks.push("Assessment weightage should total 100% before result publishing is enabled.");
  }

  if (config.resultPublishingMode === "Scheduled Publish") {
    checks.push(
      "Scheduled publishing needs a valid release time and approval owner before report cards are released."
    );
  }

  if (config.resultDisplayFormat === "GPA") {
    const previewGpa = calculateWeightedGpa(config.gradeTable);
    if (previewGpa === null) {
      checks.push("Each GPA row needs a valid GPA value and credits greater than 0.");
    } else {
      checks.push(
        `Weighted GPA on the ${config.gpaScaleType || DEFAULT_GPA_SCALE_TYPE} scale: ${previewGpa}.`
      );
    }
  }

  if (config.assessmentModel === "Custom") {
    checks.push(
      "Custom assessment structures should be versioned carefully so historical report cards remain reproducible."
    );
  }

  return checks;
};

const getDefaultStep9State = (wizardDoc = {}) => {
  const assessmentModel = getDefaultAssessmentModel(wizardDoc);
  const base = {
    assessmentModel,
    resultDisplayFormat: DEFAULT_RESULT_FORMAT,
    gpaScaleType: DEFAULT_GPA_SCALE_TYPE,
    gradeScaleScope: DEFAULT_GRADE_SCALE_SCOPE,
    defaultPassingMarks: DEFAULT_PASSING_MARKS,
    gradeTable: cloneRows(
      getDefaultGradeTableForFormat(DEFAULT_RESULT_FORMAT, DEFAULT_GPA_SCALE_TYPE)
    ),
    assessmentWeightage: cloneRows(DEFAULT_ASSESSMENT_WEIGHTAGE),
    reportCardFormat: DEFAULT_REPORT_CARD_FORMAT,
    resultPublishingMode: DEFAULT_PUBLISHING_MODE,
    reportCardSections: [...DEFAULT_REPORT_CARD_SECTIONS],
    dependencyStatus: normalizeDependencyStatus(),
    recommendationMessage: "",
    smartChecks: [],
    currentStep: 9,
    progressPercentage: 82,
    assessmentModelLogic: resolveAssessmentModelLogic(assessmentModel),
    publishingState: "draft",
    approvalWorkflowStatus: "not_requested",
    scheduledPublishAt: null,
    lastPublishedAt: null,
    lastPublishedVersion: null,
    currentVersion: 1,
    versionHistory: [],
    auditLogs: [],
  };

  base.recommendationMessage = getRecommendationMessage(base, wizardDoc);
  base.smartChecks = getSmartChecks(base);
  return base;
};

const normalizeStep9State = (payload = {}, wizardDoc = {}) => {
  const defaults = getDefaultStep9State(wizardDoc);
  const assessmentModel = ASSESSMENT_MODELS.includes(payload.assessmentModel)
    ? payload.assessmentModel
    : defaults.assessmentModel;
  const resultDisplayFormat = RESULT_DISPLAY_FORMATS.includes(payload.resultDisplayFormat)
    ? payload.resultDisplayFormat
    : defaults.resultDisplayFormat;
  const gpaScaleType = GPA_SCALE_TYPES.includes(payload.gpaScaleType)
    ? payload.gpaScaleType
    : defaults.gpaScaleType;
  const gradeScaleScope = GRADE_SCALE_SCOPES.includes(payload.gradeScaleScope)
    ? payload.gradeScaleScope
    : defaults.gradeScaleScope;
  const reportCardFormat = REPORT_CARD_FORMATS.includes(payload.reportCardFormat)
    ? payload.reportCardFormat
    : defaults.reportCardFormat;
  const resultPublishingMode = RESULT_PUBLISHING_MODES.includes(
    payload.resultPublishingMode
  )
    ? payload.resultPublishingMode
    : defaults.resultPublishingMode;

  const normalized = {
    assessmentModel,
    resultDisplayFormat,
    gpaScaleType,
    gradeScaleScope,
    defaultPassingMarks: asNumber(
      payload.defaultPassingMarks ?? payload.passingMarks,
      defaults.defaultPassingMarks
    ),
    gradeTable: normalizeGradeTable(
      payload.gradeTable ?? payload.grades,
      resultDisplayFormat,
      gpaScaleType
    ),
    assessmentWeightage: normalizeAssessmentWeightage(
      payload.assessmentWeightage ?? payload.weightages
    ),
    reportCardFormat,
    resultPublishingMode,
    reportCardSections: normalizeReportCardSections(
      payload.reportCardSections ?? payload.reportSections
    ),
    dependencyStatus: normalizeDependencyStatus(),
    recommendationMessage: "",
    smartChecks: [],
    currentStep: asNumber(payload.currentStep, defaults.currentStep),
    progressPercentage: asNumber(
      payload.progressPercentage,
      defaults.progressPercentage
    ),
    assessmentModelLogic: resolveAssessmentModelLogic(assessmentModel),
    publishingState: asTrimmedString(payload.publishingState, defaults.publishingState) || defaults.publishingState,
    approvalWorkflowStatus:
      asTrimmedString(payload.approvalWorkflowStatus, defaults.approvalWorkflowStatus) ||
      defaults.approvalWorkflowStatus,
    scheduledPublishAt: payload.scheduledPublishAt || null,
    lastPublishedAt: payload.lastPublishedAt || null,
    lastPublishedVersion: payload.lastPublishedVersion ?? defaults.lastPublishedVersion,
    currentVersion: asNumber(payload.currentVersion, defaults.currentVersion),
    versionHistory: Array.isArray(payload.versionHistory) ? payload.versionHistory : [],
    auditLogs: Array.isArray(payload.auditLogs) ? payload.auditLogs : [],
  };

  normalized.recommendationMessage = getRecommendationMessage(normalized, wizardDoc);
  normalized.smartChecks = getSmartChecks(normalized);
  return normalized;
};

const rangesOverlap = (left, right) =>
  left.minPercentage <= right.maxPercentage &&
  right.minPercentage <= left.maxPercentage;

const usesPercentageRanges = (format) =>
  format === "Percentage" || format === "Marks + Grade";

const validateGradeTable = (
  gradeTable,
  errors,
  prefix,
  resultDisplayFormat,
  gpaScaleType = DEFAULT_GPA_SCALE_TYPE
) => {
  if (!Array.isArray(gradeTable) || gradeTable.length === 0) {
    errors.push(`${prefix}At least one scale row is required`);
    return;
  }

  const format = resultDisplayFormat || DEFAULT_RESULT_FORMAT;
  const requiresGrade =
    format === "Grade" || format === "Marks + Grade" || format === "GPA";
  const requiresGpa = format === "GPA";
  const requiresRanges = usesPercentageRanges(format);
  const maxGpa = getGpaScaleMax(gpaScaleType);
  const seenGrades = new Map();
  const seenGpa = new Set();

  gradeTable.forEach((row, index) => {
    const label = `${prefix}Row ${index + 1}: `;

    if (requiresGrade && !row.grade) {
      errors.push(`${label}grade is required`);
    }

    if (!row.description) {
      errors.push(`${label}description is required`);
    }

    if (requiresGpa) {
      if (row.gpaPoints === null || row.gpaPoints === undefined) {
        errors.push(`${label}GPA value is required`);
      } else if (row.gpaPoints < 0 || row.gpaPoints > maxGpa) {
        errors.push(`${label}GPA value must be between 0 and ${maxGpa}`);
      } else {
        const gpaKey = String(row.gpaPoints);
        if (seenGpa.has(gpaKey)) {
          errors.push(`${label}duplicate GPA value "${row.gpaPoints}" is not allowed`);
        }
        seenGpa.add(gpaKey);
      }
      if (!Number.isFinite(row.credits) || row.credits <= 0) {
        errors.push(`${label}credits must be greater than 0`);
      }
    }

    if (requiresRanges) {
      if (
        !Number.isFinite(row.minPercentage) ||
        row.minPercentage < 0 ||
        row.minPercentage > 100
      ) {
        errors.push(`${label}min percentage must be between 0 and 100`);
      }
      if (
        !Number.isFinite(row.maxPercentage) ||
        row.maxPercentage < 0 ||
        row.maxPercentage > 100
      ) {
        errors.push(`${label}max percentage must be between 0 and 100`);
      }
      if (row.minPercentage >= row.maxPercentage) {
        errors.push(`${label}min percentage must be less than max percentage`);
      }
    }

    if (requiresGrade && row.grade) {
      const normalizedGrade = row.grade.toLowerCase();
      if (seenGrades.has(normalizedGrade)) {
        errors.push(`${label}duplicate grade "${row.grade}" is not allowed`);
      } else {
        seenGrades.set(normalizedGrade, row.rowId);
      }
    }
  });

  if (!requiresRanges) return;

  const sorted = [...gradeTable].sort((a, b) => a.minPercentage - b.minPercentage);
  sorted.forEach((row, index) => {
    const next = sorted[index + 1];
    if (!next) return;
    if (rangesOverlap(row, next)) {
      const rowLabel = format === "Percentage" ? row.description || "range" : row.grade;
      const nextLabel =
        format === "Percentage" ? next.description || "next range" : next.grade;
      errors.push(
        `${prefix}Ranges for "${rowLabel}" and "${nextLabel}" cannot overlap`
      );
    }
  });
};

const validateAssessmentWeightage = (weightageRows, errors, prefix) => {
  if (!Array.isArray(weightageRows) || weightageRows.length === 0) {
    errors.push(`${prefix}At least one assessment component is required`);
    return;
  }

  const seenNames = new Set();
  let totalWeight = 0;
  weightageRows.forEach((row, index) => {
    const label = `${prefix}Row ${index + 1}: `;
    if (!row.assessmentName) {
      errors.push(`${label}assessment name is required`);
    }
    const normalizedName = row.assessmentName.toLowerCase();
    if (normalizedName) {
      if (seenNames.has(normalizedName)) {
        errors.push(`${label}duplicate assessment name "${row.assessmentName}" is not allowed`);
      }
      seenNames.add(normalizedName);
    }

    if (
      !Number.isFinite(row.weightValue) ||
      row.weightValue < 0 ||
      row.weightValue > 100
    ) {
      errors.push(`${label}weight value must be between 0 and 100`);
    }

    totalWeight += row.weightValue;
  });

  if (Math.round(totalWeight * 100) / 100 !== 100) {
    errors.push(`${prefix}Total assessment weightage must equal 100%`);
  }
};

const validateStep9Payload = (
  payload = {},
  wizardDoc = {},
  { draft = false, advancedSetup } = {}
) => {
  const sanitized = normalizeStep9State(payload, wizardDoc);
  const errors = [];
  const isAdvancedSetup =
    advancedSetup === undefined
      ? wizardDoc?.selectedSetupType === "advanced"
      : Boolean(advancedSetup);

  if (!draft && !sanitized.assessmentModel) {
    errors.push("assessmentModel is required");
  }

  if (sanitized.resultDisplayFormat === "GPA") {
    if (!GPA_SCALE_TYPES.includes(sanitized.gpaScaleType)) {
      errors.push("gpaScaleType must be 4.0, 5.0, or 10.0");
    }
  } else if (
    !Number.isFinite(sanitized.defaultPassingMarks) ||
    sanitized.defaultPassingMarks < 0 ||
    sanitized.defaultPassingMarks > 100
  ) {
    errors.push("defaultPassingMarks must be between 0 and 100");
  }

  validateGradeTable(
    sanitized.gradeTable,
    errors,
    "",
    sanitized.resultDisplayFormat,
    sanitized.gpaScaleType
  );

  if (isAdvancedSetup) {
    validateAssessmentWeightage(sanitized.assessmentWeightage, errors, "");
    if (!sanitized.reportCardSections.length) {
      errors.push("Select at least one report card section");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
};

const pickSnapshotFields = (config = {}) =>
  PICKED_SNAPSHOT_FIELDS.reduce((acc, key) => {
    acc[key] = config[key];
    return acc;
  }, {});

const gradeConfigChanged = (existingConfig = {}, nextConfig = {}) =>
  JSON.stringify({
    gradeScaleScope: existingConfig.gradeScaleScope,
    defaultPassingMarks: existingConfig.defaultPassingMarks,
    gradeTable: existingConfig.gradeTable,
    assessmentWeightage: existingConfig.assessmentWeightage,
    resultDisplayFormat: existingConfig.resultDisplayFormat,
    gpaScaleType: existingConfig.gpaScaleType,
  }) !==
  JSON.stringify({
    gradeScaleScope: nextConfig.gradeScaleScope,
    defaultPassingMarks: nextConfig.defaultPassingMarks,
    gradeTable: nextConfig.gradeTable,
    assessmentWeightage: nextConfig.assessmentWeightage,
    resultDisplayFormat: nextConfig.resultDisplayFormat,
    gpaScaleType: nextConfig.gpaScaleType,
  });

const createAuditLog = ({
  action,
  message,
  versionNumber,
  actor = "system",
  metadata = {},
}) => ({
  logId: randomUUID(),
  action,
  message,
  versionNumber,
  actor,
  metadata,
  createdAt: new Date(),
});

const createVersionSnapshot = ({
  config,
  action,
  reason,
  actor = "system",
}) => ({
  versionId: randomUUID(),
  versionNumber: config.currentVersion || 1,
  action,
  reason,
  actor,
  snapshot: pickSnapshotFields(config),
  createdAt: new Date(),
});

const applyPublishingAction = ({
  existingConfig = {},
  nextConfig = {},
  publishingAction,
  revertToVersionNumber,
}) => {
  const payload = {
    publishingState: nextConfig.publishingState || existingConfig.publishingState || "draft",
    approvalWorkflowStatus:
      nextConfig.approvalWorkflowStatus ||
      existingConfig.approvalWorkflowStatus ||
      "not_requested",
    scheduledPublishAt: nextConfig.scheduledPublishAt || existingConfig.scheduledPublishAt || null,
    lastPublishedAt: existingConfig.lastPublishedAt || null,
    lastPublishedVersion: existingConfig.lastPublishedVersion || null,
  };

  const action = asTrimmedString(publishingAction).toLowerCase();
  if (!action) return payload;

  if (action === "publish") {
    if (nextConfig.resultPublishingMode === "Auto Publish") {
      payload.publishingState = "published";
      payload.approvalWorkflowStatus = "approved";
    } else {
      payload.publishingState = "approval_pending";
      payload.approvalWorkflowStatus = "pending";
    }
    payload.lastPublishedAt = new Date();
    payload.lastPublishedVersion = nextConfig.currentVersion || existingConfig.currentVersion || 1;
  } else if (action === "schedule") {
    payload.publishingState = "scheduled";
    payload.approvalWorkflowStatus = "scheduled";
    payload.scheduledPublishAt = nextConfig.scheduledPublishAt || existingConfig.scheduledPublishAt || null;
  } else if (action === "revert" && Number.isFinite(Number(revertToVersionNumber))) {
    payload.publishingState = "reverted";
    payload.approvalWorkflowStatus = "reverted";
    payload.lastPublishedVersion = Number(revertToVersionNumber);
  }

  return payload;
};

const buildStep9PersistPayload = ({
  sanitized,
  existingConfig = null,
  wizardDoc = {},
  actor = "system",
  action = "step9_saved",
  publishingAction,
  revertToVersionNumber,
}) => {
  const nextConfig = {
    ...sanitized,
    currentVersion: existingConfig?.currentVersion || sanitized.currentVersion || 1,
    versionHistory: Array.isArray(existingConfig?.versionHistory)
      ? [...existingConfig.versionHistory]
      : [],
    auditLogs: Array.isArray(existingConfig?.auditLogs)
      ? [...existingConfig.auditLogs]
      : [],
  };

  const shouldVersion =
    existingConfig &&
    existingConfig.publishingState === "published" &&
    gradeConfigChanged(existingConfig, nextConfig);

  if (shouldVersion) {
    nextConfig.versionHistory.push(
      createVersionSnapshot({
        config: existingConfig,
        action: "grade_scale_versioned",
        reason:
          "Grade configuration changed after publish. Previous version preserved.",
        actor,
      })
    );
    nextConfig.currentVersion = (existingConfig.currentVersion || 1) + 1;
  }

  const publishingMeta = applyPublishingAction({
    existingConfig,
    nextConfig,
    publishingAction,
    revertToVersionNumber,
  });

  Object.assign(nextConfig, publishingMeta);
  nextConfig.recommendationMessage = getRecommendationMessage(nextConfig, wizardDoc);
  nextConfig.smartChecks = getSmartChecks(nextConfig);
  nextConfig.dependencyStatus = normalizeDependencyStatus();

  nextConfig.auditLogs.push(
    createAuditLog({
      action,
      message:
        action === "grade_scale_patched"
          ? "Grade scale updated successfully"
          : action === "grade_row_deleted"
            ? "Grade row removed successfully"
            : action === "weightage_row_deleted"
              ? "Assessment weightage row removed successfully"
              : "Examination & gradebook setup saved successfully",
      versionNumber: nextConfig.currentVersion,
      actor,
      metadata: {
        assessmentModel: nextConfig.assessmentModel,
        resultDisplayFormat: nextConfig.resultDisplayFormat,
      },
    })
  );

  return nextConfig;
};

const mapWizardToStep9Response = (wizardDoc = {}) => {
  const source = wizardDoc.step9ExaminationGradebook || getDefaultStep9State(wizardDoc);
  const normalized = normalizeStep9State(source, wizardDoc);
  return {
    ...normalized,
    currentVersion: source.currentVersion || normalized.currentVersion || 1,
    versionHistory: Array.isArray(source.versionHistory) ? source.versionHistory : [],
    auditLogs: Array.isArray(source.auditLogs) ? source.auditLogs : [],
  };
};

const removeGradeRow = (config = {}, rowId) => {
  const nextRows = normalizeGradeTable(
    config.gradeTable,
    config.resultDisplayFormat,
    config.gpaScaleType
  ).filter((row) => row.rowId !== rowId);
  return { ...config, gradeTable: nextRows };
};

const removeWeightageRow = (config = {}, rowId) => {
  const nextRows = normalizeAssessmentWeightage(config.assessmentWeightage).filter(
    (row) => row.rowId !== rowId
  );
  return { ...config, assessmentWeightage: nextRows };
};

const calculatePercentage = ({ obtainedMarks, totalMarks }) => {
  const obtained = Number(obtainedMarks);
  const total = Number(totalMarks);
  if (!Number.isFinite(obtained) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Number(((obtained / total) * 100).toFixed(2));
};

const convertPercentageToGrade = (
  percentage,
  gradeTable = DEFAULT_GRADE_TABLE,
  resultDisplayFormat = DEFAULT_RESULT_FORMAT,
  gpaScaleType = DEFAULT_GPA_SCALE_TYPE
) => {
  const normalized = normalizeGradeTable(
    gradeTable,
    resultDisplayFormat,
    gpaScaleType
  ).sort((left, right) => right.minPercentage - left.minPercentage);
  return (
    normalized.find(
      (row) => percentage >= row.minPercentage && percentage <= row.maxPercentage
    ) || null
  );
};

const lookupGpaRowByLetter = (
  letterGrade,
  gradeTable = DEFAULT_GRADE_TABLE,
  gpaScaleType = DEFAULT_GPA_SCALE_TYPE
) => {
  const key = asTrimmedString(letterGrade).toLowerCase();
  if (!key) return null;
  return (
    normalizeGradeTable(gradeTable, "GPA", gpaScaleType).find(
      (row) => row.grade.toLowerCase() === key
    ) || null
  );
};

const generateFinalResult = ({
  obtainedMarks,
  totalMarks,
  gradeTable = DEFAULT_GRADE_TABLE,
  defaultPassingMarks = DEFAULT_PASSING_MARKS,
  resultDisplayFormat = DEFAULT_RESULT_FORMAT,
  gpaScaleType = DEFAULT_GPA_SCALE_TYPE,
  letterGrade = "",
  courseResults = [],
}) => {
  const percentage = calculatePercentage({ obtainedMarks, totalMarks });
  const matchedGrade = convertPercentageToGrade(
    percentage,
    gradeTable,
    resultDisplayFormat,
    gpaScaleType
  );
  const passed = percentage >= Number(defaultPassingMarks || DEFAULT_PASSING_MARKS);

  if (resultDisplayFormat === "GPA") {
    const courseEntries = Array.isArray(courseResults) ? courseResults : [];
    let gpa = null;

    if (courseEntries.length) {
      gpa = calculateWeightedGpa(courseEntries);
    } else if (letterGrade) {
      const row = lookupGpaRowByLetter(letterGrade, gradeTable, gpaScaleType);
      gpa = row?.gpaPoints ?? null;
    } else if (matchedGrade?.gpaPoints != null) {
      gpa = matchedGrade.gpaPoints;
    }

    return {
      gpa: gpa ?? 0,
      gpaScaleType,
      grade: letterGrade || matchedGrade?.grade || "",
      description:
        matchedGrade?.description ||
        lookupGpaRowByLetter(letterGrade, gradeTable, gpaScaleType)?.description ||
        "No matching GPA row found",
      passed,
    };
  }

  const base = {
    percentage,
    grade: matchedGrade?.grade || "",
    description: matchedGrade?.description || "",
    gpa: matchedGrade?.gpaPoints ?? null,
    passed,
  };

  if (resultDisplayFormat === "Percentage") {
    return {
      percentage: base.percentage,
      description: base.description,
      passed: base.passed,
    };
  }

  if (resultDisplayFormat === "Grade") {
    return {
      grade: base.grade || "Ungraded",
      description: base.description || "No matching grade found",
      passed: base.passed,
    };
  }

  return {
    percentage: base.percentage,
    grade: base.grade || "Ungraded",
    description: base.description || "No matching grade range found",
    passed: base.passed,
  };
};

// Future Update:
// Add AI-based performance analytics and
// student prediction engine integration.

module.exports = {
  ASSESSMENT_MODELS,
  RESULT_DISPLAY_FORMATS,
  GRADE_SCALE_SCOPES,
  REPORT_CARD_FORMATS,
  RESULT_PUBLISHING_MODES,
  REPORT_CARD_SECTIONS,
  DEFAULT_GRADE_TABLE,
  DEFAULT_ASSESSMENT_WEIGHTAGE,
  DEFAULT_REPORT_CARD_SECTIONS,
  DEFAULT_DEPENDENCY_STATUS,
  getDefaultStep9State,
  normalizeStep9State,
  validateStep9Payload,
  buildStep9PersistPayload,
  mapWizardToStep9Response,
  removeGradeRow,
  removeWeightageRow,
  getRecommendationMessage,
  getSmartChecks,
  resolveAssessmentModelLogic,
  calculatePercentage,
  convertPercentageToGrade,
  calculateWeightedGpa,
  lookupGpaRowByLetter,
  generateFinalResult,
};
