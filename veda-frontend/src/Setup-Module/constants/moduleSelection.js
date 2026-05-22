export const REQUIRED_MODULE_KEYS = [
  "SIS",
  "Academics",
  "Attendance",
  "Timetable",
  "Exams",
  "Fees",
  "Communication",
  "Reports",
];

export const OPTIONAL_MODULE_KEYS = [
  "Transport",
  "Library",
  "Health",
  "Hostel",
  "LMS",
  "Inventory",
  "HR",
  "Payroll",
];

export const REQUIRED_MODULES = [
  {
    key: "SIS",
    title: "Student Information System",
    description:
      "Student profiles, enrollment, guardians, documents, and academic records.",
    icon: "sis",
    tags: [
      { label: "Required", variant: "required" },
      { label: "Foundation", variant: "neutral" },
    ],
  },
  {
    key: "Academics",
    title: "Academics",
    description:
      "Academic year, grades, sections, subjects, streams, and promotion rules.",
    icon: "academics",
    tags: [
      { label: "Required", variant: "required" },
      { label: "Dependency", variant: "neutral" },
    ],
  },
  {
    key: "Attendance",
    title: "Attendance",
    description:
      "Daily or period-wise attendance, late rules, leave types, and attendance reports.",
    icon: "attendance",
    tags: [{ label: "Required", variant: "required" }],
  },
  {
    key: "Timetable",
    title: "Timetable",
    description:
      "Periods, breaks, working days, teacher allocation, and schedule framework.",
    icon: "timetable",
    tags: [{ label: "Required", variant: "required" }],
  },
  {
    key: "Exams",
    title: "Exams & Gradebook",
    description:
      "Exam patterns, marks entry, grading, report cards, and result publishing.",
    icon: "exams",
    tags: [{ label: "Required", variant: "required" }],
  },
  {
    key: "Fees",
    title: "Fees",
    description:
      "Fee categories, installments, discounts, scholarships, receipts, and dues.",
    icon: "fees",
    tags: [{ label: "Required", variant: "required" }],
  },
  {
    key: "Communication",
    title: "Communication",
    description:
      "Email, SMS, WhatsApp, push notifications, announcements, and alerts.",
    icon: "communication",
    tags: [{ label: "Required", variant: "required" }],
  },
  {
    key: "Reports",
    title: "Dashboards & Reports",
    description:
      "Principal, teacher, parent, student, finance, attendance, and exam dashboards.",
    icon: "reports",
    tags: [{ label: "Required", variant: "required" }],
  },
];

export const OPTIONAL_MODULES = [
  {
    key: "Transport",
    title: "Transport",
    description:
      "Routes, stops, vehicles, drivers, GPS, and parent bus notifications.",
    icon: "transport",
    recommended: true,
    feeLinked: true,
    tags: [
      { label: "Recommended", variant: "recommended" },
      { label: "Fee linked", variant: "link" },
    ],
  },
  {
    key: "Library",
    title: "Library",
    description:
      "Books, issue rules, barcode/RFID, return dates, fines, and categories.",
    icon: "library",
    tags: [{ label: "Optional", variant: "optional" }],
  },
  {
    key: "Health",
    title: "Health",
    description:
      "Student health profiles, blood group, allergies, medication notes, and emergency contacts.",
    icon: "health",
    recommended: true,
    tags: [{ label: "Recommended", variant: "recommended" }],
  },
  {
    key: "Hostel",
    title: "Hostel",
    description:
      "Hostel blocks, rooms, wardens, visitor rules, allocation, and hostel fees.",
    icon: "hostel",
    tags: [{ label: "Optional", variant: "optional" }],
  },
  {
    key: "LMS",
    title: "LMS",
    description:
      "Courses, learning material, assignments, digital content, and activity tracking.",
    icon: "lms",
    tags: [{ label: "Optional", variant: "optional" }],
  },
  {
    key: "Inventory",
    title: "Inventory",
    description:
      "Assets, stock, departments, approvals, consumables, and low-stock alerts.",
    icon: "inventory",
    tags: [{ label: "Optional", variant: "optional" }],
  },
  {
    key: "HR",
    title: "HR",
    description:
      "Staff records, designations, documents, onboarding, leave, and service history.",
    icon: "hr",
    recommended: true,
    tags: [{ label: "Recommended", variant: "recommended" }],
  },
  {
    key: "Payroll",
    title: "Payroll",
    description:
      "Salary structure, deductions, allowances, payslips, and payroll reports.",
    icon: "payroll",
    dependsOn: "HR",
    tags: [
      { label: "Optional", variant: "optional" },
      { label: "Depends on HR", variant: "dependency" },
    ],
  },
];
