const ASSESSMENT_MODELS = [
  "Term Exams",
  "Continuous Assessment",
  "Unit Test + Final",
  "Custom",
];

const RESULT_DISPLAY_FORMATS = [
  "Percentage",
  "Grade",
  "Marks + Grade",
  "GPA",
];

const GRADE_SCALE_SCOPES = ["Globally", "Grade-wise", "Subject-wise"];

const REPORT_CARD_FORMATS = [
  "Board-specific Standard",
  "Modern Analytics",
  "Compact Format",
  "Detailed Academic",
];

const RESULT_PUBLISHING_MODES = [
  "Admin Approval Required",
  "Auto Publish",
  "Teacher Approval",
  "Scheduled Publish",
];

const REPORT_CARD_SECTIONS = [
  "Scholastic",
  "Attendance",
  "Teacher Remarks",
  "Co-scholastic",
  "Behavior",
];

const DEPENDENCY_IMPACT_ITEMS = [
  "Gradebook",
  "Report Cards",
  "Promotion Rules",
  "Parent Portal",
];

const GPA_SCALE_TYPES = ["4.0", "5.0", "10.0"];

const getGpaScaleMax = (gpaScaleType = "4.0") => {
  const parsed = Number(String(gpaScaleType).replace(/[^\d.]/g, ""));
  return parsed === 5 ? 5 : parsed === 10 ? 10 : 4;
};

const createGradeRow = ({
  rowId,
  grade = "",
  minPercentage = 0,
  maxPercentage = 0,
  description = "",
  gpaPoints = null,
  credits = 1,
}) => ({
  rowId,
  grade,
  minPercentage,
  maxPercentage,
  description,
  gpaPoints,
  credits,
});

const DEFAULT_PERCENTAGE_TABLE = [
  createGradeRow({
    rowId: "pct-outstanding",
    minPercentage: 90,
    maxPercentage: 100,
    description: "Outstanding",
  }),
  createGradeRow({
    rowId: "pct-excellent",
    minPercentage: 75,
    maxPercentage: 89,
    description: "Excellent",
  }),
  createGradeRow({
    rowId: "pct-good",
    minPercentage: 60,
    maxPercentage: 74,
    description: "Good",
  }),
  createGradeRow({
    rowId: "pct-pass",
    minPercentage: 33,
    maxPercentage: 59,
    description: "Pass",
  }),
];

const DEFAULT_GRADE_ONLY_TABLE = [
  createGradeRow({ rowId: "grade-a-plus", grade: "A+", description: "Outstanding" }),
  createGradeRow({ rowId: "grade-a", grade: "A", description: "Excellent" }),
  createGradeRow({ rowId: "grade-b", grade: "B", description: "Very Good" }),
  createGradeRow({ rowId: "grade-c", grade: "C", description: "Good" }),
  createGradeRow({ rowId: "grade-d", grade: "D", description: "Pass" }),
];

const DEFAULT_GRADE_TABLE = [
  createGradeRow({
    rowId: "grade-a-plus",
    grade: "A+",
    minPercentage: 90,
    maxPercentage: 100,
    description: "Outstanding",
  }),
  createGradeRow({
    rowId: "grade-a",
    grade: "A",
    minPercentage: 80,
    maxPercentage: 89,
    description: "Excellent",
  }),
  createGradeRow({
    rowId: "grade-b",
    grade: "B",
    minPercentage: 70,
    maxPercentage: 79,
    description: "Very Good",
  }),
  createGradeRow({
    rowId: "grade-c",
    grade: "C",
    minPercentage: 60,
    maxPercentage: 69,
    description: "Good",
  }),
  createGradeRow({
    rowId: "grade-d",
    grade: "D",
    minPercentage: 33,
    maxPercentage: 59,
    description: "Pass",
  }),
];

const DEFAULT_GPA_TABLE_4 = [
  createGradeRow({ rowId: "gpa4-a-plus", grade: "A+", gpaPoints: 4.0, credits: 4, description: "Outstanding" }),
  createGradeRow({ rowId: "gpa4-a", grade: "A", gpaPoints: 3.7, credits: 4, description: "Excellent" }),
  createGradeRow({ rowId: "gpa4-b-plus", grade: "B+", gpaPoints: 3.3, credits: 3, description: "Very Good" }),
  createGradeRow({ rowId: "gpa4-b", grade: "B", gpaPoints: 3.0, credits: 3, description: "Good" }),
  createGradeRow({ rowId: "gpa4-c", grade: "C", gpaPoints: 2.0, credits: 2, description: "Pass" }),
];

const DEFAULT_GPA_TABLE_5 = [
  createGradeRow({ rowId: "gpa5-a", grade: "A", gpaPoints: 5.0, credits: 4, description: "Outstanding" }),
  createGradeRow({ rowId: "gpa5-b", grade: "B", gpaPoints: 4.0, credits: 3, description: "Very Good" }),
  createGradeRow({ rowId: "gpa5-c", grade: "C", gpaPoints: 3.0, credits: 3, description: "Good" }),
  createGradeRow({ rowId: "gpa5-d", grade: "D", gpaPoints: 2.0, credits: 2, description: "Satisfactory" }),
  createGradeRow({ rowId: "gpa5-e", grade: "E", gpaPoints: 1.0, credits: 1, description: "Pass" }),
];

const DEFAULT_GPA_TABLE_10 = [
  createGradeRow({ rowId: "gpa10-a-plus", grade: "A+", gpaPoints: 10, credits: 4, description: "Outstanding" }),
  createGradeRow({ rowId: "gpa10-a", grade: "A", gpaPoints: 9, credits: 4, description: "Excellent" }),
  createGradeRow({ rowId: "gpa10-b", grade: "B", gpaPoints: 8, credits: 3, description: "Very Good" }),
  createGradeRow({ rowId: "gpa10-c", grade: "C", gpaPoints: 7, credits: 3, description: "Good" }),
  createGradeRow({ rowId: "gpa10-d", grade: "D", gpaPoints: 6, credits: 2, description: "Pass" }),
];

const DEFAULT_GPA_TABLE_BY_SCALE = {
  "4.0": DEFAULT_GPA_TABLE_4,
  "5.0": DEFAULT_GPA_TABLE_5,
  "10.0": DEFAULT_GPA_TABLE_10,
};

const DEFAULT_GPA_TABLE = DEFAULT_GPA_TABLE_4;

const DEFAULT_GRADE_TABLE_BY_FORMAT = {
  Percentage: DEFAULT_PERCENTAGE_TABLE,
  Grade: DEFAULT_GRADE_ONLY_TABLE,
  "Marks + Grade": DEFAULT_GRADE_TABLE,
  GPA: DEFAULT_GPA_TABLE_4,
};

const getDefaultGradeTableForFormat = (format, gpaScaleType = "4.0") => {
  if (format === "GPA") {
    return DEFAULT_GPA_TABLE_BY_SCALE[gpaScaleType] || DEFAULT_GPA_TABLE_4;
  }
  return DEFAULT_GRADE_TABLE_BY_FORMAT[format] || DEFAULT_GRADE_TABLE;
};

const DEFAULT_ASSESSMENT_WEIGHTAGE = [
  {
    rowId: "weight-unit-test",
    assessmentName: "Unit Test",
    weightValue: 20,
    weightType: "% Weight",
  },
  {
    rowId: "weight-internal-assessment",
    assessmentName: "Internal Assessment",
    weightValue: 20,
    weightType: "% Weight",
  },
  {
    rowId: "weight-final-exam",
    assessmentName: "Final Exam",
    weightValue: 60,
    weightType: "% Weight",
  },
];

const DEFAULT_REPORT_CARD_SECTIONS = [
  "Scholastic",
  "Attendance",
  "Teacher Remarks",
];

const DEFAULT_DEPENDENCY_STATUS = DEPENDENCY_IMPACT_ITEMS.map((module) => ({
  module,
  status: "Feeds",
}));

module.exports = {
  ASSESSMENT_MODELS,
  RESULT_DISPLAY_FORMATS,
  GRADE_SCALE_SCOPES,
  REPORT_CARD_FORMATS,
  RESULT_PUBLISHING_MODES,
  REPORT_CARD_SECTIONS,
  DEPENDENCY_IMPACT_ITEMS,
  DEFAULT_PERCENTAGE_TABLE,
  DEFAULT_GRADE_ONLY_TABLE,
  DEFAULT_GRADE_TABLE,
  GPA_SCALE_TYPES,
  getGpaScaleMax,
  DEFAULT_GPA_TABLE,
  DEFAULT_GPA_TABLE_BY_SCALE,
  DEFAULT_GRADE_TABLE_BY_FORMAT,
  getDefaultGradeTableForFormat,
  DEFAULT_ASSESSMENT_WEIGHTAGE,
  DEFAULT_REPORT_CARD_SECTIONS,
  DEFAULT_DEPENDENCY_STATUS,
};
