/** Core roles — always enabled; cannot be toggled off */
const CORE_ROLE_KEYS = [
  "Super Admin",
  "Principal",
  "Teacher",
  "Student",
  "Parent",
  "Accountant",
];

/** Optional operational roles */
const OPTIONAL_ROLE_KEYS = [
  "HR Admin",
  "Class Coordinator",
  "Transport Manager",
  "Librarian",
  "Health Officer",
  "Admissions Officer",
];

const REQUIRED_ROLE_SET = new Set(CORE_ROLE_KEYS);

const VALID_PERMISSION_STYLES = ["recommended", "custom"];

const VALID_STAFF_CATEGORIES = [
  "Teaching Staff",
  "Administrative Staff",
  "Finance Staff",
  "Support Staff",
  "Transport Staff",
  "Health Staff",
];

const VALID_DEPARTMENT_SETUP = [
  "recommended",
  "manual",
  "hierarchical",
  "",
];

const VALID_APPROVAL_WORKFLOW = [
  "principal",
  "department_head",
  "custom",
  "none",
  "",
];

/** Base permission matrix for recommended setup */
const BASE_PERMISSION_MATRIX = [
  {
    role: "Principal",
    academic: "Manage",
    fees: "View",
    setup: "Limited",
    portal: "View",
  },
  {
    role: "Teacher",
    academic: "Manage",
    fees: "No",
    setup: "No",
    portal: "Class",
  },
  {
    role: "Parent",
    academic: "View",
    fees: "Pay",
    setup: "No",
    portal: "Own Child",
  },
  {
    role: "Accountant",
    academic: "View",
    fees: "Manage",
    setup: "No",
    portal: "Finance",
  },
];

/** Module key (step 5) → optional role recommendation */
const MODULE_ROLE_MAP = {
  HR: "HR Admin",
  Transport: "Transport Manager",
  Library: "Librarian",
  Health: "Health Officer",
};

const DEPENDENCY_ITEMS = [
  "Teacher Onboarding",
  "Subject Mapping",
  "Timetable",
  "Approvals",
];

const ID_FORMAT_REGEX = /^[A-Za-z0-9_{}-]+$/;

module.exports = {
  CORE_ROLE_KEYS,
  OPTIONAL_ROLE_KEYS,
  REQUIRED_ROLE_SET,
  VALID_PERMISSION_STYLES,
  VALID_STAFF_CATEGORIES,
  VALID_DEPARTMENT_SETUP,
  VALID_APPROVAL_WORKFLOW,
  BASE_PERMISSION_MATRIX,
  MODULE_ROLE_MAP,
  DEPENDENCY_ITEMS,
  ID_FORMAT_REGEX,
};
