import {
  formatGradeRange,
  includesSeniorGrades,
  isValidGradeRange,
} from "../recommendation/gradeUtils";
import { PATTERN_DATE_PRESETS } from "../constants/academicStructure";

export { formatGradeRange, includesSeniorGrades, isValidGradeRange };

export function estimateSections(expectedStudents, maxStudentsPerSection) {
  const expected = Number(expectedStudents);
  const max = Number(maxStudentsPerSection);
  if (!Number.isFinite(expected) || expected < 1) return 0;
  if (!Number.isFinite(max) || max < 1) return 0;
  return Math.ceil(expected / max);
}

export function applyPatternDates(pattern, currentForm = {}) {
  const preset = PATTERN_DATE_PRESETS[pattern];
  if (!preset) return currentForm;
  return {
    ...currentForm,
    academicYearPattern: pattern,
    academicYearStart: preset.start,
    academicYearEnd: preset.end,
    academicYear: preset.label,
  };
}

export function getAcademicRecommendationText(curriculumBoard, institutionType) {
  const board = curriculumBoard || "CBSE";
  const type =
    institutionType === "k12_school"
      ? "K12"
      : institutionType === "higher_secondary"
        ? "higher secondary"
        : institutionType === "preschool"
          ? "early years"
          : "school";

  return `For ${board} ${type}, we recommend April–March academic year, 2 terms, Grade-wise subjects, and streams for Grade 11–12.`;
}

export function getDependencyStatus(form) {
  const ready =
    Boolean(form.academicYear?.trim()) &&
    Boolean(form.gradeFrom?.trim()) &&
    Boolean(form.gradeTo?.trim()) &&
    isValidGradeRange(form.gradeFrom, form.gradeTo) &&
    form.subjectFramework !== "configure_later";

  return ready ? "Depends" : "Pending";
}

export function getSmartCheckMessages(form) {
  const messages = [];

  if (includesSeniorGrades(form.gradeFrom, form.gradeTo)) {
    messages.push(
      "Streams are enabled because Grade 11–12 is part of your academic structure."
    );
  }

  if (form.subjectFramework === "configure_later") {
    messages.push(
      "Subject setup deferred. Timetable and exams may remain locked."
    );
  }

  return messages;
}

export function mapWizardDataToAcademicForm(data) {
  if (!data) return null;
  const normalizedAcademicYear = String(data.academicYear || "").replace(
    /[–—]/g,
    "-"
  );

  return {
    academicYear: normalizedAcademicYear,
    academicYearPattern: data.academicYearPattern || "apr_mar",
    academicYearStart: data.academicYearStart || "",
    academicYearEnd: data.academicYearEnd || "",
    termStructure: data.termStructure || "2 Terms",
    gradeFrom: data.gradeFrom || "",
    gradeTo: data.gradeTo || "",
    expectedStudents:
      data.expectedStudents != null ? data.expectedStudents : 1200,
    maxStudentsPerSection:
      data.maxStudentsPerSection != null ? data.maxStudentsPerSection : 40,
    sectionMode: data.sectionMode || "auto",
    subjectFramework: data.subjectFramework || "recommended_template",
    streams: Array.isArray(data.streams) ? data.streams : [],
  };
}
