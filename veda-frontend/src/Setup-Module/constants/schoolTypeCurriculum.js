export const INSTITUTION_TYPES = {
  PRESCHOOL: "preschool",
  K12: "k12_school",
  HIGHER_SECONDARY: "higher_secondary",
};

export const INSTITUTION_TYPE_OPTIONS = [
  {
    id: INSTITUTION_TYPES.PRESCHOOL,
    title: "Preschool",
    description:
      "Early years, daycare, activities, guardian pickup, and observation-based progress.",
    icon: "preschool",
  },
  {
    id: INSTITUTION_TYPES.K12,
    title: "K12 School",
    description:
      "Grades, sections, subjects, attendance, exams, report cards, and parent portals.",
    icon: "k12",
  },
  {
    id: INSTITUTION_TYPES.HIGHER_SECONDARY,
    title: "Higher Secondary",
    description:
      "Grade 11-12, streams, electives, board exam preparation, and promotion rules.",
    icon: "higher_secondary",
  },
];

/** Instruction languages — English only active for now */
export const LANGUAGE_PREFERENCES = {
  ENGLISH: "english",
  HINDI: "hindi",
  REGIONAL: "regional",
  OTHER: "other",
};

export const LANGUAGE_SUPPORT_OPTIONS = [
  {
    id: LANGUAGE_PREFERENCES.ENGLISH,
    label: "English",
    enabled: true,
  },
  {
    id: LANGUAGE_PREFERENCES.HINDI,
    label: "Hindi",
    enabled: false,
  },
  {
    id: LANGUAGE_PREFERENCES.REGIONAL,
    label: "Regional Language",
    enabled: false,
  },
  {
    id: LANGUAGE_PREFERENCES.OTHER,
    label: "Other",
    enabled: false,
  },
];

export const GRADE_OPTIONS = [
  { value: "Nursery", label: "Nursery", order: 0 },
  { value: "LKG", label: "LKG", order: 1 },
  { value: "UKG", label: "UKG", order: 2 },
  { value: "Grade 1", label: "Grade 1", order: 3 },
  { value: "Grade 2", label: "Grade 2", order: 4 },
  { value: "Grade 3", label: "Grade 3", order: 5 },
  { value: "Grade 4", label: "Grade 4", order: 6 },
  { value: "Grade 5", label: "Grade 5", order: 7 },
  { value: "Grade 6", label: "Grade 6", order: 8 },
  { value: "Grade 7", label: "Grade 7", order: 9 },
  { value: "Grade 8", label: "Grade 8", order: 10 },
  { value: "Grade 9", label: "Grade 9", order: 11 },
  { value: "Grade 10", label: "Grade 10", order: 12 },
  { value: "Grade 11", label: "Grade 11", order: 13 },
  { value: "Grade 12", label: "Grade 12", order: 14 },
];

// Future Update:
// Add multilingual curriculum and language support here
// — load board labels and curriculum metadata from i18n / locale API.

/** Boards / curricula keyed by country display name */
export const CURRICULUM_BOARDS_BY_COUNTRY = {
  India: ["CBSE", "ICSE", "State Board", "IB", "Cambridge"],
  "United States": ["Common Core", "State Standards", "AP", "IB"],
  "United Kingdom": ["National Curriculum", "Cambridge", "IB"],
  "United Arab Emirates": ["MOE UAE", "CBSE", "British", "IB", "American"],
  Singapore: ["MOE Singapore", "IB", "Cambridge"],
  Australia: ["Australian Curriculum", "IB", "Cambridge"],
  Canada: ["Provincial Curriculum", "IB", "French Immersion"],
};

export const DEFAULT_SCHOOL_TYPE_FORM = {
  institutionType: INSTITUTION_TYPES.K12,
  country: "",
  curriculumBoard: "",
  gradeFrom: "Grade 1",
  gradeTo: "Grade 12",
  languagePreference: LANGUAGE_PREFERENCES.ENGLISH,
};

export const INSTITUTION_DEFAULT_GRADES = {
  [INSTITUTION_TYPES.PRESCHOOL]: { from: "Nursery", to: "UKG" },
  [INSTITUTION_TYPES.K12]: { from: "Grade 1", to: "Grade 12" },
  [INSTITUTION_TYPES.HIGHER_SECONDARY]: { from: "Grade 11", to: "Grade 12" },
};
