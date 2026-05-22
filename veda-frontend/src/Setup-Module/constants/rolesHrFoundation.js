export const CORE_ROLES = [
  {
    key: "Super Admin",
    icon: "superAdmin",
    description:
      "Full system access, configuration, security, integrations, and school-wide controls.",
    tags: [
      { label: "Required", variant: "required" },
      { label: "Full Access", variant: "neutral" },
    ],
    locked: true,
  },
  {
    key: "Principal",
    icon: "principal",
    description:
      "School-wide oversight, approvals, reports, academic monitoring, and policy control.",
    tags: [
      { label: "Required", variant: "required" },
      { label: "Recommended", variant: "recommended" },
    ],
    locked: true,
  },
  {
    key: "Teacher",
    icon: "teacher",
    description:
      "Attendance, gradebook, homework, timetable, student remarks, and class activities.",
    tags: [{ label: "Required", variant: "required" }],
    locked: true,
  },
  {
    key: "Student",
    icon: "student",
    description:
      "Student portal, timetable, assignments, attendance view, results, and resources.",
    tags: [{ label: "Required", variant: "required" }],
    locked: true,
  },
  {
    key: "Parent",
    icon: "parent",
    description:
      "Parent portal, attendance, fees, announcements, homework, and result visibility.",
    tags: [{ label: "Required", variant: "required" }],
    locked: true,
  },
  {
    key: "Accountant",
    icon: "accountant",
    description:
      "Fee collection, receipts, dues, discounts, scholarships, and finance reports.",
    tags: [{ label: "Required", variant: "required" }],
    locked: true,
  },
];

export const OPTIONAL_ROLES = [
  {
    key: "HR Admin",
    icon: "hrAdmin",
    description:
      "Staff records, onboarding, designations, documents, attendance, and leave setup.",
    tags: [{ label: "Recommended", variant: "recommended" }],
    recommended: true,
  },
  {
    key: "Class Coordinator",
    icon: "coordinator",
    description:
      "Grade-level oversight, class teacher coordination, academic follow-ups, and reports.",
    tags: [{ label: "Optional", variant: "optional" }],
  },
  {
    key: "Transport Manager",
    icon: "transport",
    description:
      "Routes, stops, vehicles, drivers, trip tracking, and transport communication.",
    tags: [{ label: "Transport", variant: "optional" }],
  },
  {
    key: "Librarian",
    icon: "librarian",
    description:
      "Library catalog, issue rules, returns, fines, and book categories.",
    tags: [{ label: "Library", variant: "optional" }],
  },
  {
    key: "Health Officer",
    icon: "health",
    description:
      "Student health profiles, allergies, emergency contacts, and health notes.",
    tags: [{ label: "Health", variant: "optional" }],
  },
  {
    key: "Admissions Officer",
    icon: "admissions",
    description:
      "Admission forms, applications, approvals, document checks, and applicant tracking.",
    tags: [{ label: "Recommended", variant: "recommended" }],
    recommended: true,
  },
];

export const STAFF_CATEGORY_OPTIONS = [
  "Teaching Staff",
  "Administrative Staff",
  "Finance Staff",
  "Support Staff",
  "Transport Staff",
  "Health Staff",
];

export const DEPARTMENT_SETUP_OPTIONS = [
  { value: "recommended", label: "Use Recommended Departments" },
  { value: "manual", label: "Manual Department Setup" },
  { value: "hierarchical", label: "Hierarchical Departments" },
];

export const APPROVAL_WORKFLOW_OPTIONS = [
  { value: "principal", label: "Principal Approval" },
  { value: "department_head", label: "Department Head Approval" },
  { value: "custom", label: "Custom Workflow" },
  { value: "none", label: "No Approval Required" },
];

export const DEPENDENCY_ITEMS = [
  "Teacher Onboarding",
  "Subject Mapping",
  "Timetable",
  "Approvals",
];

export const DEFAULT_STEP7_FORM = {
  optionalRoles: ["HR Admin", "Admissions Officer"],
  permissionSetupStyle: "recommended",
  staffIdFormat: "EMP-{YEAR}-{SEQ}",
  teacherIdFormat: "TCH-{YEAR}-{SEQ}",
  staffCategories: [
    "Teaching Staff",
    "Administrative Staff",
    "Finance Staff",
  ],
  departmentSetup: "manual",
  approvalWorkflow: "custom",
};

export const DEFAULT_PERMISSION_MATRIX = [
  { role: "Principal", academic: "Manage", fees: "View", setup: "Limited", portal: "View" },
  { role: "Teacher", academic: "Manage", fees: "No", setup: "No", portal: "Class" },
  { role: "Parent", academic: "View", fees: "Pay", setup: "No", portal: "Own Child" },
  { role: "Accountant", academic: "View", fees: "Manage", setup: "No", portal: "Finance" },
];

export const MODULE_ROLE_MAP = {
  HR: "HR Admin",
  Transport: "Transport Manager",
  Library: "Librarian",
  Health: "Health Officer",
};
