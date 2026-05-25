import {
  FiBarChart2,
  FiBookOpen,
  FiEdit3,
  FiLayers,
  FiSliders,
  FiTarget,
} from "react-icons/fi";

export const STEP_9_TOTAL_STEPS = 10;
export const STEP_9_NUMBER = 9;
export const STEP_9_PROGRESS = 82;

export const ASSESSMENT_MODEL_OPTIONS = [
  {
    key: "Term Exams",
    title: "Term Exams",
    description:
      "Best for schools using Term 1, Term 2, unit tests, and final exams.",
    icon: FiBookOpen,
  },
  {
    key: "Continuous Assessment",
    title: "Continuous Assessment",
    description:
      "Track assignments, activities, classwork, projects, and regular evaluations.",
    icon: FiBarChart2,
  },
  {
    key: "Unit Test + Final",
    title: "Unit Test + Final",
    description:
      "Simple structure with periodic tests and final exam weightage.",
    icon: FiTarget,
  },
  {
    key: "Custom",
    title: "Custom",
    description:
      "Create your own exam groups, weights, grades, and report card rules.",
    icon: FiSliders,
  },
];

export const RESULT_DISPLAY_OPTIONS = [
  "Percentage",
  "Grade",
  "Marks + Grade",
  "GPA",
];

export const GRADE_SCALE_SCOPE_OPTIONS = [
  "Globally",
  "Grade-wise",
  "Subject-wise",
];

export const REPORT_CARD_FORMAT_OPTIONS = [
  "Board-specific Standard",
  "Modern Analytics",
  "Compact Format",
  "Detailed Academic",
];

export const RESULT_PUBLISHING_OPTIONS = [
  "Admin Approval Required",
  "Auto Publish",
  "Teacher Approval",
  "Scheduled Publish",
];

export const REPORT_CARD_SECTION_OPTIONS = [
  "Scholastic",
  "Attendance",
  "Teacher Remarks",
  "Co-scholastic",
  "Behavior",
];

export const DEPENDENCY_IMPACT_ITEMS = [
  { module: "Gradebook", status: "Feeds" },
  { module: "Report Cards", status: "Feeds" },
  { module: "Promotion Rules", status: "Feeds" },
  { module: "Parent Portal", status: "Feeds" },
];

export const DEFAULT_GRADE_TABLE = [
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

export const DEFAULT_ASSESSMENT_WEIGHTAGE = [
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

export const DEFAULT_REPORT_CARD_SECTIONS = [
  "Scholastic",
  "Attendance",
  "Teacher Remarks",
];

export const DEFAULT_STEP9_FORM = {
  assessmentModel: "Term Exams",
  resultDisplayFormat: "Marks + Grade",
  gradeScaleScope: "Globally",
  defaultPassingMarks: 33,
  gradeTable: DEFAULT_GRADE_TABLE,
  assessmentWeightage: DEFAULT_ASSESSMENT_WEIGHTAGE,
  reportCardFormat: "Board-specific Standard",
  resultPublishingMode: "Admin Approval Required",
  reportCardSections: DEFAULT_REPORT_CARD_SECTIONS,
  dependencyStatus: DEPENDENCY_IMPACT_ITEMS,
  recommendationMessage: "",
  smartChecks: [],
};

export const SECTION_ICONS = {
  gradeScale: FiEdit3,
  weightage: FiLayers,
};
