export const TOTAL_STEPS = 13;
export const STEP_1_NUMBER = 1;
export const STEP_1_PROGRESS = 0;

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
