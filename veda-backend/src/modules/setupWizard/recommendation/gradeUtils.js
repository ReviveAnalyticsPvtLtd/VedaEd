const GRADE_ORDER = {
  Nursery: 0,
  LKG: 1,
  UKG: 2,
  "Grade 1": 3,
  "Grade 2": 4,
  "Grade 3": 5,
  "Grade 4": 6,
  "Grade 5": 7,
  "Grade 6": 8,
  "Grade 7": 9,
  "Grade 8": 10,
  "Grade 9": 11,
  "Grade 10": 12,
  "Grade 11": 13,
  "Grade 12": 14,
};

function getGradeOrder(gradeLabel) {
  if (!gradeLabel) return -1;
  return GRADE_ORDER[gradeLabel] ?? -1;
}

function formatGradeRange(gradeFrom, gradeTo) {
  if (!gradeFrom && !gradeTo) return "";
  if (gradeFrom === gradeTo) return gradeFrom;
  return `${gradeFrom}–${gradeTo}`;
}

function getGradeRangeCategory(gradeFrom, gradeTo) {
  const from = getGradeOrder(gradeFrom);
  const to = getGradeOrder(gradeTo);
  if (from < 0 || to < 0 || to < from) return ["unknown"];

  const categories = [];

  if (to <= 2) categories.push("preschool", "early_years");
  if (from >= 3 && to <= 7) categories.push("primary_only", "grade_1_5");
  if (from >= 8 && to <= 12 && to < 13) categories.push("grade_6_10");
  if (from >= 3 && to <= 12 && to < 13) categories.push("k12_without_senior");
  if (from >= 3 && to >= 12 && to < 13) categories.push("grade_1_10");
  if (from >= 3 && to >= 14) categories.push("full_k12", "grade_1_12");
  if (from >= 13 && to >= 13) categories.push("senior_secondary", "grade_11_12");
  if (to >= 13 && from < 13) categories.push("includes_senior");

  return [...new Set(categories)];
}

function includesSeniorGrades(gradeFrom, gradeTo) {
  const from = getGradeOrder(gradeFrom);
  const to = getGradeOrder(gradeTo);
  return to >= 13 && from <= 14;
}

function isValidGradeRange(gradeFrom, gradeTo) {
  const from = getGradeOrder(gradeFrom);
  const to = getGradeOrder(gradeTo);
  return from >= 0 && to >= 0 && to >= from;
}

module.exports = {
  getGradeOrder,
  formatGradeRange,
  getGradeRangeCategory,
  includesSeniorGrades,
  isValidGradeRange,
};
