export const TERM_OPTIONS = ["2 Terms", "3 Terms", "Quarters", "Custom"];

export const ACADEMIC_YEAR_PATTERNS = [
  { value: "apr_mar", label: "April – March" },
  { value: "jun_may", label: "June – May" },
  { value: "aug_jun", label: "August – June" },
];

export const PATTERN_DATE_PRESETS = {
  apr_mar: { start: "2026-04-01", end: "2027-03-31", label: "2026–2027" },
  jun_may: { start: "2026-06-01", end: "2027-05-31", label: "2026–2027" },
  aug_jun: { start: "2026-08-01", end: "2027-06-30", label: "2026–2027" },
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
  academicYear: "2026–2027",
  academicYearPattern: "apr_mar",
  academicYearStart: "2026-04-01",
  academicYearEnd: "2027-03-31",
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
