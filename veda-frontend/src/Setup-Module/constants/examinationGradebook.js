import {
  FiBarChart2,
  FiBookOpen,
  FiEdit3,
  FiLayers,
  FiSliders,
  FiTarget,
} from "react-icons/fi";

export const STEP_9_TOTAL_STEPS = 13;
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

export const GPA_SCALE_TYPE_OPTIONS = ["4.0", "5.0", "10.0"];

export const getGpaScaleMax = (gpaScaleType = "4.0") => {
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

export const DEFAULT_PERCENTAGE_TABLE = [
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

export const DEFAULT_GRADE_ONLY_TABLE = [
  createGradeRow({ rowId: "grade-a-plus", grade: "A+", description: "Outstanding" }),
  createGradeRow({ rowId: "grade-a", grade: "A", description: "Excellent" }),
  createGradeRow({ rowId: "grade-b", grade: "B", description: "Very Good" }),
  createGradeRow({ rowId: "grade-c", grade: "C", description: "Good" }),
  createGradeRow({ rowId: "grade-d", grade: "D", description: "Pass" }),
];

export const DEFAULT_GRADE_TABLE = [
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

export const DEFAULT_GPA_TABLE_4 = [
  createGradeRow({ rowId: "gpa4-a-plus", grade: "A+", gpaPoints: 4.0, credits: 4, description: "Outstanding" }),
  createGradeRow({ rowId: "gpa4-a", grade: "A", gpaPoints: 3.7, credits: 4, description: "Excellent" }),
  createGradeRow({ rowId: "gpa4-b-plus", grade: "B+", gpaPoints: 3.3, credits: 3, description: "Very Good" }),
  createGradeRow({ rowId: "gpa4-b", grade: "B", gpaPoints: 3.0, credits: 3, description: "Good" }),
  createGradeRow({ rowId: "gpa4-c", grade: "C", gpaPoints: 2.0, credits: 2, description: "Pass" }),
];

export const DEFAULT_GPA_TABLE_5 = [
  createGradeRow({ rowId: "gpa5-a", grade: "A", gpaPoints: 5.0, credits: 4, description: "Outstanding" }),
  createGradeRow({ rowId: "gpa5-b", grade: "B", gpaPoints: 4.0, credits: 3, description: "Very Good" }),
  createGradeRow({ rowId: "gpa5-c", grade: "C", gpaPoints: 3.0, credits: 3, description: "Good" }),
  createGradeRow({ rowId: "gpa5-d", grade: "D", gpaPoints: 2.0, credits: 2, description: "Satisfactory" }),
  createGradeRow({ rowId: "gpa5-e", grade: "E", gpaPoints: 1.0, credits: 1, description: "Pass" }),
];

export const DEFAULT_GPA_TABLE_10 = [
  createGradeRow({ rowId: "gpa10-a-plus", grade: "A+", gpaPoints: 10, credits: 4, description: "Outstanding" }),
  createGradeRow({ rowId: "gpa10-a", grade: "A", gpaPoints: 9, credits: 4, description: "Excellent" }),
  createGradeRow({ rowId: "gpa10-b", grade: "B", gpaPoints: 8, credits: 3, description: "Very Good" }),
  createGradeRow({ rowId: "gpa10-c", grade: "C", gpaPoints: 7, credits: 3, description: "Good" }),
  createGradeRow({ rowId: "gpa10-d", grade: "D", gpaPoints: 6, credits: 2, description: "Pass" }),
];

export const DEFAULT_GPA_TABLE_BY_SCALE = {
  "4.0": DEFAULT_GPA_TABLE_4,
  "5.0": DEFAULT_GPA_TABLE_5,
  "10.0": DEFAULT_GPA_TABLE_10,
};

export const DEFAULT_GPA_TABLE = DEFAULT_GPA_TABLE_4;

export const DEFAULT_GRADE_TABLE_BY_FORMAT = {
  Percentage: DEFAULT_PERCENTAGE_TABLE,
  Grade: DEFAULT_GRADE_ONLY_TABLE,
  "Marks + Grade": DEFAULT_GRADE_TABLE,
  GPA: DEFAULT_GPA_TABLE_4,
};

export const SCALE_TABLE_BY_FORMAT = {
  Percentage: {
    title: "Percentage Range",
    subtitle: "Define percentage bands used for result classification and report cards.",
    addButtonLabel: "Add Range Row",
    emptyRowLabel: "Minimum one range row required",
    columns: [
      { key: "minPercentage", label: "Min %", inputType: "number", min: 0, max: 100 },
      { key: "maxPercentage", label: "Max %", inputType: "number", min: 0, max: 100 },
      { key: "description", label: "Description", inputType: "text" },
    ],
  },
  Grade: {
    title: "Grade Scale",
    subtitle: "Define letter grades and qualitative descriptions shown on results.",
    addButtonLabel: "Add Grade Row",
    emptyRowLabel: "Minimum one grade row required",
    columns: [
      { key: "grade", label: "Grade", inputType: "text" },
      { key: "description", label: "Description", inputType: "text" },
    ],
  },
  "Marks + Grade": {
    title: "Marks Range & Grade Scale",
    subtitle:
      "Define the default grade boundaries. These can be global, grade-wise, or subject-wise.",
    addButtonLabel: "Add Grade Row",
    emptyRowLabel: "Minimum one grade row required",
    columns: [
      { key: "grade", label: "Grade", inputType: "text" },
      { key: "minPercentage", label: "Min %", inputType: "number", min: 0, max: 100 },
      { key: "maxPercentage", label: "Max %", inputType: "number", min: 0, max: 100 },
      { key: "description", label: "Description", inputType: "text" },
    ],
  },
  GPA: {
    title: "GPA Scale",
    subtitle:
      "Define grade points and credits. GPA is calculated as Σ(GPA Value × Credits) ÷ Σ(Credits).",
    addButtonLabel: "Add GPA Row",
    emptyRowLabel: "Minimum one GPA row required",
    hidePassingMarks: true,
    columns: [
      { key: "grade", label: "Grade", inputType: "text" },
      { key: "gpaPoints", label: "GPA Value", inputType: "number", min: 0, step: 0.1 },
      { key: "credits", label: "Credits", inputType: "number", min: 0, step: 0.5 },
      { key: "description", label: "Performance Description", inputType: "text" },
    ],
  },
};

export const getDefaultGradeTableForFormat = (format, gpaScaleType = "4.0") => {
  if (format === "GPA") {
    return DEFAULT_GPA_TABLE_BY_SCALE[gpaScaleType] || DEFAULT_GPA_TABLE_4;
  }
  return DEFAULT_GRADE_TABLE_BY_FORMAT[format] || DEFAULT_GRADE_TABLE;
};

export const getScaleTableConfig = (format, gpaScaleType = "4.0") => {
  const base = SCALE_TABLE_BY_FORMAT[format] || SCALE_TABLE_BY_FORMAT["Marks + Grade"];
  if (format !== "GPA") return base;

  const maxGpa = getGpaScaleMax(gpaScaleType);
  return {
    ...base,
    columns: base.columns.map((column) =>
      column.key === "gpaPoints" ? { ...column, max: maxGpa } : column
    ),
  };
};

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
  gpaScaleType: "4.0",
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
