export const TERM_OPTIONS = ["2 Terms", "3 Terms", "Quarters", "Custom"];

export const ACADEMIC_YEAR_PATTERNS = [
  { value: "apr_mar", label: "April – March" },
  { value: "jun_may", label: "June – May" },
  { value: "aug_jun", label: "August – June" },
];

const CURRENT_YEAR = new Date().getFullYear();
const NEXT_YEAR = CURRENT_YEAR + 1;
const toAcademicYearLabel = (startYear) => `${startYear}-${startYear + 1}`;

export const PATTERN_DATE_PRESETS = {
  apr_mar: {
    start: `${CURRENT_YEAR}-04-01`,
    end: `${NEXT_YEAR}-03-31`,
    label: toAcademicYearLabel(CURRENT_YEAR),
  },
  jun_may: {
    start: `${CURRENT_YEAR}-06-01`,
    end: `${NEXT_YEAR}-05-31`,
    label: toAcademicYearLabel(CURRENT_YEAR),
  },
  aug_jun: {
    start: `${CURRENT_YEAR}-08-01`,
    end: `${NEXT_YEAR}-06-30`,
    label: toAcademicYearLabel(CURRENT_YEAR),
  },
};

export const STREAM_OPTIONS = [
  "Science",
  "Commerce",
  "Arts / Humanities",
  "Vocational",
];

export const SECTION_MODE_OPTIONS = [
  {
    id: "auto",
    title: "Auto-create Sections",
    description:
      "System recommends sections using expected students and section size.",
  },
  {
    id: "manual",
    title: "Manual Sections",
    description: "Admin enters section names and structure manually.",
  },
];

export const SUBJECT_FRAMEWORK_OPTIONS = [
  {
    key: "recommended_template",
    title: "Use Recommended Template",
    description:
      "Apply CBSE/K12 subject templates based on grades and streams.",
  },
  {
    key: "manual",
    title: "Create Manually",
    description: "Enter subjects, electives, and groups manually.",
  },
  {
    key: "excel_import",
    title: "Import from Excel",
    description: "Upload existing subject structure from a spreadsheet.",
  },
  {
    key: "configure_later",
    title: "Configure Later",
    description: "Continue setup, but timetable and exams may remain locked.",
  },
];

export const DEPENDENCY_MODULES = [
  "Attendance",
  "Timetable",
  "Exams",
  "Fees",
];

export const DEFAULT_ACADEMIC_FORM = {
  academicYear: toAcademicYearLabel(CURRENT_YEAR),
  academicYearPattern: "apr_mar",
  academicYearStart: `${CURRENT_YEAR}-04-01`,
  academicYearEnd: `${NEXT_YEAR}-03-31`,
  termStructure: "2 Terms",
  gradeFrom: "Grade 1",
  gradeTo: "Grade 12",
  expectedStudents: 1200,
  maxStudentsPerSection: 40,
  sectionMode: "auto",
  subjectFramework: "recommended_template",
  streams: ["Science", "Commerce", "Arts / Humanities"],
};

// Future Update:
// Add AI-generated academic structure recommendation
// based on curriculum and school size.
