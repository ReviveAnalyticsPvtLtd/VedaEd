export const TOTAL_STEPS = 13;
export const STEP_1_NUMBER = 1;
export const STEP_1_PROGRESS = 0;
export const STEP_2_NUMBER = 2;
export const STEP_2_PROGRESS = 10;
export const STEP_3_NUMBER = 3;
export const STEP_3_PROGRESS = 22;
export const STEP_4_NUMBER = 4;

export const SETUP_ROUTES = {
  START: "/setup/start",
  step: (stepNumber) => `/setup/step-${stepNumber}`,
};

export const getStepProgress = (stepNumber) =>
  Math.round((stepNumber / TOTAL_STEPS) * 100);

export const SETUP_TYPES = {
  QUICK: "quick",
  ADVANCED: "advanced",
  IMPORT: "import",
};

export const SETUP_EXPERIENCE_OPTIONS = [
  {
    id: SETUP_TYPES.QUICK,
    title: "Quick Setup",
    description: "Minimal questions with smart recommendations.",
    recommended: true,
  },
  {
    id: SETUP_TYPES.ADVANCED,
    title: "Advanced Setup",
    description:
      "Detailed configuration for enterprise schools and multi-campus institutions.",
    recommended: false,
  },
  {
    id: SETUP_TYPES.IMPORT,
    title: "Import Existing Configuration",
    description: "Import from Excel, CSV, or legacy ERP exports.",
    recommended: false,
  },
];

export const ORGANIZATION_TYPES = {
  SINGLE_SCHOOL: "single_school",
  MULTI_CAMPUS: "multi_campus",
  SCHOOL_GROUP: "school_group",
};

export const ORGANIZATION_TYPE_OPTIONS = [
  {
    id: ORGANIZATION_TYPES.SINGLE_SCHOOL,
    title: "Single School",
    description:
      "Best for one independent school with one setup, one admin structure, and one academic configuration.",
    icon: "home",
    features: [
      "One school profile",
      "One academic setup",
      "Simple permissions",
    ],
  },
  {
    id: ORGANIZATION_TYPES.MULTI_CAMPUS,
    title: "Multi-Campus",
    description:
      "Best for one school brand operating across multiple campuses with shared or separate settings.",
    icon: "campus",
    features: [
      "Campus management",
      "Shared templates",
      "Campus-level admins",
    ],
  },
  {
    id: ORGANIZATION_TYPES.SCHOOL_GROUP,
    title: "School Group / Franchise",
    description:
      "Best for trusts, chains, or franchise networks that need central governance and branch-level control.",
    icon: "globe",
    features: ["HQ governance", "Branch setup", "Shared policies"],
  },
];

export const CONFIGURABLE_FEATURES = [
  "School Profile",
  "Academic Structure",
  "Roles & Permissions",
  "Attendance",
  "Fees",
  "Exams",
  "Communication",
  "Dashboards",
];
