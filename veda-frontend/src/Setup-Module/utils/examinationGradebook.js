import {
  DEFAULT_ASSESSMENT_WEIGHTAGE,
  DEFAULT_GRADE_TABLE,
  DEFAULT_REPORT_CARD_SECTIONS,
  DEFAULT_STEP9_FORM,
  DEPENDENCY_IMPACT_ITEMS,
  RESULT_DISPLAY_OPTIONS,
} from "../constants/examinationGradebook";

export const createLocalRowId = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeGradeTable = (rows) => {
  const source = Array.isArray(rows) && rows.length ? rows : DEFAULT_GRADE_TABLE;
  return source.map((row, index) => ({
    rowId: row.rowId || createLocalRowId(`grade-${index + 1}`),
    grade: String(row.grade || "").trim(),
    minPercentage: toNumber(row.minPercentage ?? row.min, 0),
    maxPercentage: toNumber(row.maxPercentage ?? row.max, 0),
    description: String((row.description ?? row.desc) || "").trim(),
  }));
};

const normalizeWeightage = (rows) => {
  const source =
    Array.isArray(rows) && rows.length ? rows : DEFAULT_ASSESSMENT_WEIGHTAGE;
  return source.map((row, index) => ({
    rowId: row.rowId || createLocalRowId(`weight-${index + 1}`),
    assessmentName: String((row.assessmentName ?? row.name) || "").trim(),
    weightValue: toNumber(row.weightValue ?? row.value, 0),
    weightType: "% Weight",
  }));
};

const normalizeSections = (sections) => {
  if (!Array.isArray(sections) || !sections.length) {
    return [...DEFAULT_REPORT_CARD_SECTIONS];
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

  return {
    assessmentModel,
    resultDisplayFormat:
      step9Data.resultDisplayFormat || DEFAULT_STEP9_FORM.resultDisplayFormat,
    gradeScaleScope:
      step9Data.gradeScaleScope || DEFAULT_STEP9_FORM.gradeScaleScope,
    defaultPassingMarks:
      step9Data.defaultPassingMarks ?? DEFAULT_STEP9_FORM.defaultPassingMarks,
    gradeTable: normalizeGradeTable(step9Data.gradeTable),
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
  gradeScaleScope: form.gradeScaleScope,
  defaultPassingMarks: Number(form.defaultPassingMarks),
  gradeTable: form.gradeTable.map((row) => ({
    rowId: row.rowId,
    grade: row.grade,
    minPercentage: Number(row.minPercentage),
    maxPercentage: Number(row.maxPercentage),
    description: row.description,
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

export const getExamSummary = (form) => ({
  model: form.assessmentModel,
  resultType: form.resultDisplayFormat,
  passing: `${Number(form.defaultPassingMarks || 0)}%`,
  scale: form.gradeScaleScope,
});

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

  if (form.assessmentModel === "Continuous Assessment") {
    return "Continuous Assessment is ideal when teachers regularly capture assignments, projects, and class activities.";
  }

  if (form.assessmentModel === "Custom") {
    return "Custom assessment is best when your board or institution uses a non-standard grading and report card structure.";
  }

  return "Use one consistent grade scale so gradebook, report cards, and promotion rules remain aligned.";
};

export const getSmartChecks = (form, serverChecks = []) => {
  if (serverChecks?.length) return serverChecks;

  const checks = [
    "Changing grading after exams are published should create a new version instead of overwriting existing results.",
  ];

  const total = getWeightageTotal(form.assessmentWeightage);
  if (Math.round(total * 100) / 100 !== 100) {
    checks.push("Assessment weightage should total 100% before results are published.");
  }

  if (form.resultPublishingMode === "Scheduled Publish") {
    checks.push("Scheduled publishing needs a release time and approval owner before report cards are shared.");
  }

  if (form.assessmentModel === "Custom") {
    checks.push("Custom grading rules should be versioned carefully so historical report cards remain reproducible.");
  }

  return checks;
};

export const resolveDependencyStatus = (dependencyStatus) =>
  dependencyStatus?.length ? dependencyStatus : DEPENDENCY_IMPACT_ITEMS;

const buildGradeRowError = (row, duplicateGrades) => {
  const issues = [];
  if (!row.grade) issues.push("Grade is required");
  if (!row.description) issues.push("Description is required");
  if (row.minPercentage < 0 || row.minPercentage > 100) {
    issues.push("Min % must be between 0 and 100");
  }
  if (row.maxPercentage < 0 || row.maxPercentage > 100) {
    issues.push("Max % must be between 0 and 100");
  }
  if (row.minPercentage >= row.maxPercentage) {
    issues.push("Min % must be less than Max %");
  }
  if (duplicateGrades.has(row.grade.toLowerCase())) {
    issues.push(`Duplicate grade "${row.grade}"`);
  }
  return issues.join(". ");
};

export const validateStep9Form = (form) => {
  const errors = {
    gradeTableRows: {},
    assessmentWeightageRows: {},
  };

  if (!form.assessmentModel) {
    errors.assessmentModel = "Select an assessment model";
  }

  if (!RESULT_DISPLAY_OPTIONS.includes(form.resultDisplayFormat)) {
    errors.resultDisplayFormat = "Select a valid result display format";
  }

  const passing = Number(form.defaultPassingMarks);
  if (!Number.isFinite(passing) || passing < 0 || passing > 100) {
    errors.defaultPassingMarks = "Passing marks must be between 0 and 100";
  }

  const duplicateGrades = new Set();
  const seenGrades = new Set();
  form.gradeTable.forEach((row) => {
    const key = String(row.grade || "").trim().toLowerCase();
    if (!key) return;
    if (seenGrades.has(key)) duplicateGrades.add(key);
    seenGrades.add(key);
  });

  form.gradeTable.forEach((row) => {
    const message = buildGradeRowError(row, duplicateGrades);
    if (message) {
      errors.gradeTableRows[row.rowId] = message;
    }
  });

  const sortedRows = [...form.gradeTable].sort(
    (left, right) => Number(left.minPercentage) - Number(right.minPercentage)
  );
  sortedRows.forEach((row, index) => {
    const next = sortedRows[index + 1];
    if (!next) return;
    if (Number(row.maxPercentage) >= Number(next.minPercentage)) {
      errors.gradeTableRows[row.rowId] = [
        errors.gradeTableRows[row.rowId],
        `Overlaps with ${next.grade || "next"} range`,
      ]
        .filter(Boolean)
        .join(". ");
      errors.gradeTableRows[next.rowId] = [
        errors.gradeTableRows[next.rowId],
        `Overlaps with ${row.grade || "previous"} range`,
      ]
        .filter(Boolean)
        .join(". ");
    }
  });

  if (!form.gradeTable.length) {
    errors.gradeTable = "Add at least one grade row";
  }

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

  return errors;
};
