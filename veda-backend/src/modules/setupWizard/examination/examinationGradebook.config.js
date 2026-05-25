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

const DEFAULT_GRADE_TABLE = [
  {
    rowId: "grade-a-plus",
    grade: "A+",
    minPercentage: 90,
    maxPercentage: 100,
    description: "Outstanding",
  },
  {
    rowId: "grade-a",
    grade: "A",
    minPercentage: 80,
    maxPercentage: 89,
    description: "Excellent",
  },
  {
    rowId: "grade-b",
    grade: "B",
    minPercentage: 70,
    maxPercentage: 79,
    description: "Very Good",
  },
  {
    rowId: "grade-c",
    grade: "C",
    minPercentage: 60,
    maxPercentage: 69,
    description: "Good",
  },
  {
    rowId: "grade-d",
    grade: "D",
    minPercentage: 33,
    maxPercentage: 59,
    description: "Pass",
  },
];

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
  DEFAULT_GRADE_TABLE,
  DEFAULT_ASSESSMENT_WEIGHTAGE,
  DEFAULT_REPORT_CARD_SECTIONS,
  DEFAULT_DEPENDENCY_STATUS,
};
