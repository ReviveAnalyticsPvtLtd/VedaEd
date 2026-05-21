/**
 * Rule-based curriculum recommendation definitions.
 * Keep in sync with veda-frontend/src/Setup-Module/recommendation/recommendationRules.config.js
 *
 * Future Update:
 * Replace static rule engine with AI-based recommendation engine
 * using institution analytics and setup patterns.
 */

export const INSTITUTION = {
  PRESCHOOL: "preschool",
  K12: "k12_school",
  HIGHER_SECONDARY: "higher_secondary",
};

/** Higher priority = evaluated first */
export const RECOMMENDATION_RULES = [
  {
    id: "cbse_k12_india_full",
    priority: 100,
    match: {
      institutionTypes: [INSTITUTION.K12],
      countries: ["India"],
      boards: ["CBSE"],
      gradeRanges: ["full_k12", "grade_1_12", "includes_senior"],
    },
    output: {
      recommendationType: "cbse_k12_template",
      title: "CBSE K12 Template",
      baseConfidence: 94,
      examStructure: "2-term exam structure",
      resultFormat: "Marks + Grade result format",
      subjectFramework: "Standard subject framework",
      gradeSystem: "Grade 1–12 progression",
      streamConfiguration: "Streams for Grade 11–12",
      attendanceSetup: "Daily class attendance with period tracking",
    },
  },
  {
    id: "icse_k12_india",
    priority: 95,
    match: {
      institutionTypes: [INSTITUTION.K12],
      countries: ["India"],
      boards: ["ICSE"],
      gradeRanges: ["full_k12", "grade_1_12", "k12_without_senior", "includes_senior"],
    },
    output: {
      recommendationType: "icse_k12_template",
      title: "ICSE K12 Template",
      baseConfidence: 92,
      examStructure: "2-term + internal assessment structure",
      resultFormat: "Marks + descriptive grade bands",
      subjectFramework: "ICSE subject groups with electives",
      gradeSystem: "Class-based Grade 1–10 + ICSE board exams",
      streamConfiguration: "Science / Commerce / Arts for senior grades",
      attendanceSetup: "Subject-wise attendance for secondary",
    },
  },
  {
    id: "state_board_k12_india",
    priority: 90,
    match: {
      institutionTypes: [INSTITUTION.K12],
      countries: ["India"],
      boards: ["State Board"],
      gradeRanges: ["full_k12", "grade_1_12", "k12_without_senior", "includes_senior"],
    },
    output: {
      recommendationType: "state_board_k12_template",
      title: "State Board K12 Template",
      baseConfidence: 88,
      examStructure: "State term exams + annual board pattern",
      resultFormat: "Marks-based with state grading scale",
      subjectFramework: "State syllabus subject framework",
      gradeSystem: "Regional grade naming with promotion rules",
      streamConfiguration: "Senior stream setup when Grade 11–12 included",
      attendanceSetup: "Standard daily attendance",
    },
  },
  {
    id: "ib_k12_global",
    priority: 88,
    match: {
      institutionTypes: [INSTITUTION.K12, INSTITUTION.HIGHER_SECONDARY],
      countries: ["India", "United States", "United Kingdom", "United Arab Emirates", "Singapore", "Australia", "Canada"],
      boards: ["IB"],
      gradeRanges: null,
    },
    output: {
      recommendationType: "ib_programme_template",
      title: "IB Programme Template",
      baseConfidence: 91,
      examStructure: "Continuous assessment + IB exam cycles",
      resultFormat: "IB grade scale (1–7) with CAS tracking",
      subjectFramework: "PYP / MYP / DP pathway by grade band",
      gradeSystem: "Programme-based grade mapping",
      streamConfiguration: "DP subject groups & HL/SL electives",
      attendanceSetup: "Session-based attendance with CAS hours",
    },
  },
  {
    id: "cambridge_k12",
    priority: 86,
    match: {
      institutionTypes: [INSTITUTION.K12, INSTITUTION.HIGHER_SECONDARY],
      countries: ["India", "United Kingdom", "United Arab Emirates", "Singapore", "Australia"],
      boards: ["Cambridge"],
      gradeRanges: null,
    },
    output: {
      recommendationType: "cambridge_k12_template",
      title: "Cambridge K12 Template",
      baseConfidence: 90,
      examStructure: "Checkpoint & IGCSE/A-Level exam cycles",
      resultFormat: "Cambridge grading (A*–G / 9–1)",
      subjectFramework: "Cambridge subject catalogue",
      gradeSystem: "Stage-based year groups",
      streamConfiguration: "A-Level streams for senior secondary",
      attendanceSetup: "Lesson-based attendance",
    },
  },
  {
    id: "american_curriculum_us",
    priority: 85,
    match: {
      institutionTypes: [INSTITUTION.K12],
      countries: ["United States", "United Arab Emirates"],
      boards: ["Common Core", "State Standards", "AP", "American"],
      gradeRanges: null,
    },
    output: {
      recommendationType: "american_k12_template",
      title: "American K12 Template",
      baseConfidence: 89,
      examStructure: "Semester + standardized testing windows",
      resultFormat: "GPA + letter grades",
      subjectFramework: "Core + elective credit system",
      gradeSystem: "K–12 grade levels with credits",
      streamConfiguration: "AP / honors tracks for upper grades",
      attendanceSetup: "Homeroom + period attendance",
    },
  },
  {
    id: "uk_national_curriculum",
    priority: 84,
    match: {
      institutionTypes: [INSTITUTION.K12],
      countries: ["United Kingdom"],
      boards: ["National Curriculum", "British"],
      gradeRanges: null,
    },
    output: {
      recommendationType: "uk_national_template",
      title: "UK National Curriculum Template",
      baseConfidence: 88,
      examStructure: "Key Stage assessments + GCSE/A-Level",
      resultFormat: "Levels / GCSE grades",
      subjectFramework: "Key Stage subject framework",
      gradeSystem: "Year groups (Reception–Year 13)",
      streamConfiguration: "A-Level pathways for sixth form",
      attendanceSetup: "Registration-based attendance",
    },
  },
  {
    id: "uae_moe_cbse",
    priority: 83,
    match: {
      institutionTypes: [INSTITUTION.K12],
      countries: ["United Arab Emirates"],
      boards: ["MOE UAE", "CBSE", "British"],
      gradeRanges: null,
    },
    output: {
      recommendationType: "uae_k12_template",
      title: "UAE K12 Template",
      baseConfidence: 87,
      examStructure: "MOE / board-aligned term structure",
      resultFormat: "Marks + competency bands",
      subjectFramework: "UAE + selected board subjects",
      gradeSystem: "Grade 1–12 with Arabic integration",
      streamConfiguration: "Senior streams per selected board",
      attendanceSetup: "Daily attendance with ministry reporting",
    },
  },
  {
    id: "preschool_global",
    priority: 80,
    match: {
      institutionTypes: [INSTITUTION.PRESCHOOL],
      countries: null,
      boards: null,
      gradeRanges: null,
    },
    output: {
      recommendationType: "preschool_early_years_template",
      title: "Early Years Preschool Template",
      baseConfidence: 90,
      examStructure: "No board exam structure",
      resultFormat: "Observation-based progress",
      subjectFramework: "Activity & developmental domains",
      gradeSystem: "Nursery / LKG / UKG groups",
      streamConfiguration: "Not applicable",
      attendanceSetup: "Guardian pickup + daily check-in",
      extraFeatures: [
        "Activity tracking",
        "Parent activity reports",
      ],
    },
  },
  {
    id: "higher_secondary_senior",
    priority: 78,
    match: {
      institutionTypes: [INSTITUTION.HIGHER_SECONDARY],
      countries: null,
      boards: null,
      gradeRanges: ["senior_secondary", "grade_11_12", "includes_senior"],
    },
    output: {
      recommendationType: "senior_secondary_template",
      title: "Senior Secondary Template",
      baseConfidence: 89,
      examStructure: "Board exam preparation terms",
      resultFormat: "Marks + grade with stream results",
      subjectFramework: "Stream-based electives",
      gradeSystem: "Grade 11–12 with promotion rules",
      streamConfiguration: "Science / Commerce / Arts streams",
      attendanceSetup: "Subject-period attendance",
    },
  },
  {
    id: "k12_primary_only",
    priority: 50,
    match: {
      institutionTypes: [INSTITUTION.K12],
      countries: null,
      boards: null,
      gradeRanges: ["primary_only", "grade_1_5"],
    },
    output: {
      recommendationType: "primary_school_template",
      title: "Primary School Template",
      baseConfidence: 82,
      examStructure: "Term-wise formative assessments",
      resultFormat: "Marks + descriptive feedback",
      subjectFramework: "Core primary subjects",
      gradeSystem: "Grade 1–5 class structure",
      streamConfiguration: "Not required",
      attendanceSetup: "Class teacher daily attendance",
    },
  },
  {
    id: "fallback_generic",
    priority: 1,
    match: {
      institutionTypes: null,
      countries: null,
      boards: null,
      gradeRanges: null,
    },
    output: {
      recommendationType: "generic_school_template",
      title: "Flexible School Template",
      baseConfidence: 70,
      examStructure: "Configurable term exam structure",
      resultFormat: "Configurable grading scale",
      subjectFramework: "Core subject framework",
      gradeSystem: "Custom grade levels",
      streamConfiguration: "Optional stream setup",
      attendanceSetup: "Standard daily attendance",
    },
  },
];

export const SMART_CHECK_RULES = [
  {
    id: "senior_streams",
    when: (ctx) => ctx.includesSenior,
    message:
      "Streams and electives setup will be enabled in future steps.",
  },
  {
    id: "senior_streams_alt",
    when: (ctx) =>
      ctx.includesSenior &&
      ctx.institutionType === INSTITUTION.K12,
    message:
      "Grades include 11–12, so VedaSchool will ask about streams and electives in the academic setup.",
  },
  {
    id: "preschool_observation",
    when: (ctx) => ctx.institutionType === INSTITUTION.PRESCHOOL,
    message:
      "Attendance and observation-based reporting will be recommended.",
  },
  {
    id: "preschool_no_exams",
    when: (ctx) => ctx.institutionType === INSTITUTION.PRESCHOOL,
    message:
      "Preschool mode focuses on activities and observations rather than formal board exams.",
  },
  {
    id: "higher_secondary_board",
    when: (ctx) => ctx.institutionType === INSTITUTION.HIGHER_SECONDARY,
    message:
      "Higher secondary setup will prioritize streams, electives, and board exam workflows.",
  },
  {
    id: "primary_range",
    when: (ctx) =>
      ctx.gradeCategories.includes("primary_only") ||
      ctx.gradeCategories.includes("grade_1_5"),
    message:
      "Primary grade range detected — section-based classes and formative assessments will be prioritized.",
  },
  {
    id: "ib_pathway",
    when: (ctx) => ctx.normalizedBoard === "IB",
    message:
      "IB programme pathways (PYP/MYP/DP) will be mapped based on your grade span in later steps.",
  },
  {
    id: "incomplete_selection",
    when: (ctx) => !ctx.isComplete,
    message:
      "Complete institution type, country, board, and grade range for a higher-confidence recommendation.",
  },
];

