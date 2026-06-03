import {
  DEFAULT_STEP9_FORM,
  DEPENDENCY_IMPACT_ITEMS,
  getDefaultGradeTableForFormat,
  getGpaScaleMax,
  getScaleTableConfig,
  GPA_SCALE_TYPE_OPTIONS,
  RESULT_DISPLAY_OPTIONS,
} from "../constants/examinationGradebook";

export const createLocalRowId = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const NUMERIC_ROW_KEYS = new Set([
  "minPercentage",
  "maxPercentage",
  "gpaPoints",
  "credits",
]);

export const calculateWeightedGpa = (rows = []) => {
  const entries = rows
    .map((row) => ({
      gpaPoints: toNumber(row.gpaPoints, NaN),
      credits: toNumber(row.credits, NaN),
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

export const normalizeGradeTable = (
  rows,
  resultDisplayFormat,
  gpaScaleType = DEFAULT_STEP9_FORM.gpaScaleType
) => {
  const format = resultDisplayFormat || DEFAULT_STEP9_FORM.resultDisplayFormat;
  const defaults = getDefaultGradeTableForFormat(format, gpaScaleType);
  const source = Array.isArray(rows) && rows.length ? rows : defaults;

  return source.map((row, index) => {
    const fallback = defaults[index] || defaults[0] || {};
    const gpaRaw = row.gpaPoints ?? row.gpa ?? fallback.gpaPoints;
    const gpaPoints =
      gpaRaw === null || gpaRaw === undefined || gpaRaw === ""
        ? null
        : toNumber(gpaRaw, null);

    return {
      rowId: row.rowId || createLocalRowId(`grade-${index + 1}`),
      grade: String(row.grade || "").trim(),
      minPercentage: toNumber(row.minPercentage ?? row.min, fallback.minPercentage ?? 0),
      maxPercentage: toNumber(row.maxPercentage ?? row.max, fallback.maxPercentage ?? 0),
      description: String((row.description ?? row.desc) || "").trim(),
      gpaPoints,
      credits: toNumber(row.credits, fallback.credits ?? 1),
    };
  });
};

const normalizeWeightage = (rows) => {
  const source =
    Array.isArray(rows) && rows.length ? rows : DEFAULT_STEP9_FORM.assessmentWeightage;
  return source.map((row, index) => ({
    rowId: row.rowId || createLocalRowId(`weight-${index + 1}`),
    assessmentName: String((row.assessmentName ?? row.name) || "").trim(),
    weightValue: toNumber(row.weightValue ?? row.value, 0),
    weightType: "% Weight",
  }));
};

const normalizeSections = (sections) => {
  if (!Array.isArray(sections) || !sections.length) {
    return [...DEFAULT_STEP9_FORM.reportCardSections];
  }
  return [...new Set(sections.map((item) => String(item || "").trim()).filter(Boolean))];
};

export const mapWizardDataToStep9Form = (step9Data = {}, wizardData = {}) => {
  const assessmentModel =
    step9Data.assessmentModel ||
    (wizardData.institutionType === "k12_school" ||
    String(wizardData.curriculumBoard || "").toUpperCase().includes("CBSE")
      ? "Term Exams"
      : DEFAULT_STEP9_FORM.assessmentModel);

  const resultDisplayFormat =
    step9Data.resultDisplayFormat || DEFAULT_STEP9_FORM.resultDisplayFormat;
  const gpaScaleType = GPA_SCALE_TYPE_OPTIONS.includes(step9Data.gpaScaleType)
    ? step9Data.gpaScaleType
    : DEFAULT_STEP9_FORM.gpaScaleType;

  return {
    assessmentModel,
    resultDisplayFormat,
    gpaScaleType,
    gradeScaleScope:
      step9Data.gradeScaleScope || DEFAULT_STEP9_FORM.gradeScaleScope,
    defaultPassingMarks:
      step9Data.defaultPassingMarks ?? DEFAULT_STEP9_FORM.defaultPassingMarks,
    gradeTable: normalizeGradeTable(
      step9Data.gradeTable,
      resultDisplayFormat,
      gpaScaleType
    ),
    assessmentWeightage: normalizeWeightage(step9Data.assessmentWeightage),
    reportCardFormat:
      step9Data.reportCardFormat || DEFAULT_STEP9_FORM.reportCardFormat,
    resultPublishingMode:
      step9Data.resultPublishingMode || DEFAULT_STEP9_FORM.resultPublishingMode,
    reportCardSections: normalizeSections(step9Data.reportCardSections),
    dependencyStatus:
      step9Data.dependencyStatus?.length
        ? step9Data.dependencyStatus
        : DEPENDENCY_IMPACT_ITEMS,
    recommendationMessage: step9Data.recommendationMessage || "",
    smartChecks: step9Data.smartChecks || [],
    currentVersion: step9Data.currentVersion || 1,
  };
};

export const buildStep9Payload = (
  form,
  { draft = false, stepMeta = {}, completedSteps = [] } = {}
) => ({
  draft,
  assessmentModel: form.assessmentModel,
  resultDisplayFormat: form.resultDisplayFormat,
  gpaScaleType: form.gpaScaleType,
  gradeScaleScope: form.gradeScaleScope,
  defaultPassingMarks: Number(form.defaultPassingMarks),
  gradeTable: form.gradeTable.map((row) => ({
    rowId: row.rowId,
    grade: row.grade,
    minPercentage: Number(row.minPercentage),
    maxPercentage: Number(row.maxPercentage),
    description: row.description,
    gpaPoints:
      row.gpaPoints === null || row.gpaPoints === undefined || row.gpaPoints === ""
        ? null
        : Number(row.gpaPoints),
    credits: Number(row.credits ?? 0),
  })),
  assessmentWeightage: form.assessmentWeightage.map((row) => ({
    rowId: row.rowId,
    assessmentName: row.assessmentName,
    weightValue: Number(row.weightValue),
    weightType: "% Weight",
  })),
  reportCardFormat: form.reportCardFormat,
  resultPublishingMode: form.resultPublishingMode,
  reportCardSections: form.reportCardSections,
  currentStep: stepMeta.currentStep ?? 9,
  progressPercentage: stepMeta.progressPercentage ?? 82,
  completedSteps,
});

const getScaleRowCountLabel = (format, count) => {
  if (format === "Percentage") return `${count} percentage range${count === 1 ? "" : "s"}`;
  if (format === "GPA") return `${count} GPA band${count === 1 ? "" : "s"}`;
  return `${count} grade${count === 1 ? "" : "s"}`;
};

export const getExamSummary = (form) => {
  const format = form.resultDisplayFormat;
  const rowCount = form.gradeTable?.length || 0;
  const scaleConfig = getScaleTableConfig(format, form.gpaScaleType);
  const previewGpa =
    format === "GPA" ? calculateWeightedGpa(form.gradeTable) : null;

  return {
    model: form.assessmentModel,
    resultType: format === "GPA" ? `GPA (${form.gpaScaleType} scale)` : format,
    passing:
      format === "GPA"
        ? previewGpa !== null
          ? `Preview GPA ${previewGpa}`
          : "Configure credits to preview GPA"
        : `${Number(form.defaultPassingMarks || 0)}%`,
    scale: `${form.gradeScaleScope} · ${getScaleRowCountLabel(format, rowCount)}`,
    scaleDetail: scaleConfig.title,
    previewGpa,
  };
};

export const getWeightageTotal = (weightages = []) =>
  weightages.reduce((sum, item) => sum + toNumber(item.weightValue), 0);

export const getRecommendationText = (form, wizardMeta = {}, serverText = "") => {
  if (serverText) return serverText;

  const board = String(wizardMeta.curriculumBoard || "").toUpperCase();
  const isCbseK12 =
    wizardMeta.institutionType === "k12_school" || board.includes("CBSE");

  if (
    isCbseK12 &&
    form.assessmentModel === "Term Exams" &&
    form.resultDisplayFormat === "Marks + Grade"
  ) {
    return "For CBSE K12, use Term Exams with Marks + Grade and board-specific report card format.";
  }

  if (form.resultDisplayFormat === "GPA") {
    return `Use the ${form.gpaScaleType} GPA scale with credit-weighted rows so semester GPA can be calculated consistently.`;
  }

  if (form.resultDisplayFormat === "Percentage") {
    return "Percentage ranges should cover the full 0–100 scale without gaps or overlaps.";
  }

  if (form.resultDisplayFormat === "Grade") {
    return "Letter grades should match what teachers, students, and parents see on report cards.";
  }

  if (form.assessmentModel === "Continuous Assessment") {
    return "Continuous Assessment is ideal when teachers regularly capture assignments, projects, and class activities.";
  }

  if (form.assessmentModel === "Custom") {
    return "Custom assessment is best when your board or institution uses a non-standard grading and report card structure.";
  }

  return "Use one consistent grade scale so gradebook, report cards, and promotion rules remain aligned.";
};

export const getSmartChecks = (
  form,
  serverChecks = [],
  { advancedSetup = true } = {}
) => {
  if (serverChecks?.length) return serverChecks;

  const checks = [
    "Changing grading after exams are published should create a new version instead of overwriting existing results.",
  ];

  if (advancedSetup) {
    const total = getWeightageTotal(form.assessmentWeightage);
    if (Math.round(total * 100) / 100 !== 100) {
      checks.push("Assessment weightage should total 100% before results are published.");
    }

    if (form.resultPublishingMode === "Scheduled Publish") {
      checks.push(
        "Scheduled publishing needs a release time and approval owner before report cards are shared."
      );
    }
  }

  if (form.resultDisplayFormat === "GPA") {
    const previewGpa = calculateWeightedGpa(form.gradeTable);
    if (previewGpa === null) {
      checks.push("Each GPA row needs a valid GPA value and credits greater than 0.");
    } else {
      checks.push(
        `Sample weighted GPA on the ${form.gpaScaleType} scale: ${previewGpa} (Σ points×credits ÷ Σ credits).`
      );
    }
  }

  if (form.assessmentModel === "Custom") {
    checks.push("Custom grading rules should be versioned carefully so historical report cards remain reproducible.");
  }

  return checks;
};

export const resolveDependencyStatus = (dependencyStatus) =>
  dependencyStatus?.length ? dependencyStatus : DEPENDENCY_IMPACT_ITEMS;

const usesPercentageRanges = (format) =>
  format === "Percentage" || format === "Marks + Grade";

const validatePercentageRange = (row) => {
  const issues = [];
  if (row.minPercentage < 0 || row.minPercentage > 100) {
    issues.push("Min % must be between 0 and 100");
  }
  if (row.maxPercentage < 0 || row.maxPercentage > 100) {
    issues.push("Max % must be between 0 and 100");
  }
  if (row.minPercentage >= row.maxPercentage) {
    issues.push("Min % must be less than Max %");
  }
  return issues;
};

const buildGradeRowError = (row, format, duplicateKeys, gpaScaleType) => {
  const issues = [];
  const scaleConfig = getScaleTableConfig(format, gpaScaleType);
  const columnKeys = scaleConfig.columns.map((col) => col.key);
  const maxGpa = getGpaScaleMax(gpaScaleType);

  if (columnKeys.includes("grade") && !row.grade) {
    issues.push("Grade is required");
  }

  if (columnKeys.includes("description") && !row.description) {
    issues.push("Description is required");
  }

  if (columnKeys.includes("gpaPoints")) {
    if (row.gpaPoints === null || row.gpaPoints === undefined || row.gpaPoints === "") {
      issues.push("GPA value is required");
    } else if (row.gpaPoints < 0 || row.gpaPoints > maxGpa) {
      issues.push(`GPA value must be between 0 and ${maxGpa}`);
    }
  }

  if (columnKeys.includes("credits")) {
    if (!Number.isFinite(Number(row.credits)) || Number(row.credits) <= 0) {
      issues.push("Credits must be greater than 0");
    }
  }

  if (usesPercentageRanges(format)) {
    issues.push(...validatePercentageRange(row));
  }

  if (columnKeys.includes("grade") && row.grade && duplicateKeys.grades?.has(row.grade.toLowerCase())) {
    issues.push(`Duplicate grade "${row.grade}"`);
  }

  if (
    columnKeys.includes("gpaPoints") &&
    row.gpaPoints !== null &&
    duplicateKeys.gpa?.has(String(row.gpaPoints))
  ) {
    issues.push(`Duplicate GPA value "${row.gpaPoints}"`);
  }

  return issues.join(". ");
};

const collectDuplicateKeys = (gradeTable, format) => {
  const scaleConfig = getScaleTableConfig(format);
  const columnKeys = scaleConfig.columns.map((col) => col.key);
  const duplicates = { grades: new Set(), gpa: new Set() };

  if (columnKeys.includes("grade")) {
    const seen = new Set();
    gradeTable.forEach((row) => {
      const key = String(row.grade || "").trim().toLowerCase();
      if (!key) return;
      if (seen.has(key)) duplicates.grades.add(key);
      seen.add(key);
    });
  }

  if (columnKeys.includes("gpaPoints")) {
    const seen = new Set();
    gradeTable.forEach((row) => {
      if (row.gpaPoints === null || row.gpaPoints === undefined || row.gpaPoints === "") {
        return;
      }
      const key = String(row.gpaPoints);
      if (seen.has(key)) duplicates.gpa.add(key);
      seen.add(key);
    });
  }

  return duplicates;
};

export const validateStep9Form = (form, { advancedSetup = true } = {}) => {
  const errors = {
    gradeTableRows: {},
    assessmentWeightageRows: {},
  };
  const format = form.resultDisplayFormat;

  if (!form.assessmentModel) {
    errors.assessmentModel = "Select an assessment model";
  }

  if (!RESULT_DISPLAY_OPTIONS.includes(format)) {
    errors.resultDisplayFormat = "Select a valid result display format";
  }

  if (format === "GPA" && !GPA_SCALE_TYPE_OPTIONS.includes(form.gpaScaleType)) {
    errors.gpaScaleType = "Select a GPA scale type (4.0, 5.0, or 10.0)";
  }

  const passing = Number(form.defaultPassingMarks);
  if (
    format !== "GPA" &&
    (!Number.isFinite(passing) || passing < 0 || passing > 100)
  ) {
    errors.defaultPassingMarks = "Passing marks must be between 0 and 100";
  }

  const duplicateKeys = collectDuplicateKeys(form.gradeTable, format);

  form.gradeTable.forEach((row) => {
    const message = buildGradeRowError(row, format, duplicateKeys, form.gpaScaleType);
    if (message) {
      errors.gradeTableRows[row.rowId] = message;
    }
  });

  if (usesPercentageRanges(format)) {
    const sortedRows = [...form.gradeTable].sort(
      (left, right) => Number(left.minPercentage) - Number(right.minPercentage)
    );
    sortedRows.forEach((row, index) => {
      const next = sortedRows[index + 1];
      if (!next) return;
      if (Number(row.maxPercentage) >= Number(next.minPercentage)) {
        const rowLabel =
          format === "Percentage" ? row.description || "range" : row.grade || "range";
        const nextLabel =
          format === "Percentage" ? next.description || "next range" : next.grade || "next range";

        errors.gradeTableRows[row.rowId] = [
          errors.gradeTableRows[row.rowId],
          `Overlaps with ${nextLabel}`,
        ]
          .filter(Boolean)
          .join(". ");
        errors.gradeTableRows[next.rowId] = [
          errors.gradeTableRows[next.rowId],
          `Overlaps with ${rowLabel}`,
        ]
          .filter(Boolean)
          .join(". ");
      }
    });
  }

  if (!form.gradeTable.length) {
    const scaleConfig = getScaleTableConfig(format);
    errors.gradeTable = `Add at least one ${scaleConfig.addButtonLabel.replace("Add ", "").toLowerCase()}`;
  }

  if (advancedSetup) {
    const seenAssessments = new Set();
    const duplicateAssessments = new Set();
    form.assessmentWeightage.forEach((row) => {
      const key = String(row.assessmentName || "").trim().toLowerCase();
      if (!key) return;
      if (seenAssessments.has(key)) duplicateAssessments.add(key);
      seenAssessments.add(key);
    });

    form.assessmentWeightage.forEach((row) => {
      const issues = [];
      if (!row.assessmentName) issues.push("Assessment name is required");
      if (
        !Number.isFinite(Number(row.weightValue)) ||
        Number(row.weightValue) < 0 ||
        Number(row.weightValue) > 100
      ) {
        issues.push("Weight must be between 0 and 100");
      }
      if (
        row.assessmentName &&
        duplicateAssessments.has(row.assessmentName.toLowerCase())
      ) {
        issues.push(`Duplicate assessment "${row.assessmentName}"`);
      }
      if (issues.length) {
        errors.assessmentWeightageRows[row.rowId] = issues.join(". ");
      }
    });

    if (!form.assessmentWeightage.length) {
      errors.assessmentWeightage = "Add at least one assessment component";
    }

    const totalWeight = getWeightageTotal(form.assessmentWeightage);
    if (Math.round(totalWeight * 100) / 100 !== 100) {
      errors.assessmentWeightageTotal = "Total weightage must equal 100%";
    }

    if (!form.reportCardSections?.length) {
      errors.reportCardSections = "Select at least one report card section";
    }
  }

  return errors;
};

export const createEmptyGradeRow = (format, gpaScaleType = "4.0") => {
  const base = {
    rowId: createLocalRowId("grade"),
    grade: "",
    minPercentage: 0,
    maxPercentage: 0,
    description: "",
    gpaPoints: null,
    credits: 1,
  };

  if (format === "GPA") {
    return { ...base, gpaPoints: 0, credits: 1 };
  }

  return base;
};

export const isNumericGradeField = (key) => NUMERIC_ROW_KEYS.has(key);
