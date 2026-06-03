const { validateStep9Payload } = require("./examination/examinationGradebookService");

const SETUP_TYPES = { QUICK: "quick", ADVANCED: "advanced", IMPORT: "import" };
const LAUNCH_STEP_TOTAL = 11;

const isAdvancedSetup = (doc) => doc?.selectedSetupType === SETUP_TYPES.ADVANCED;

const getWeightageTotal = (rows = []) =>
  rows.reduce((sum, row) => sum + Number(row.weightValue || 0), 0);

const isExamSectionComplete = (doc) => {
  if (!doc?.completedSteps?.includes(9)) return false;

  const step9 = doc.step9ExaminationGradebook;
  if (!step9?.assessmentModel || !step9?.resultDisplayFormat) return false;
  if (!Array.isArray(step9.gradeTable) || !step9.gradeTable.length) return false;

  const validation = validateStep9Payload(step9, doc, {
    draft: false,
    advancedSetup: isAdvancedSetup(doc),
  });
  if (!validation.valid) return false;

  if (isAdvancedSetup(doc)) {
    if (getWeightageTotal(step9.assessmentWeightage) !== 100) return false;
    if (!step9.reportCardSections?.length) return false;
  }

  return true;
};

const getExamSectionDesc = (doc) => {
  const step9 = doc?.step9ExaminationGradebook || {};
  const format = step9.resultDisplayFormat || "Marks + Grade";
  const scope = step9.gradeScaleScope || "Globally";

  if (isAdvancedSetup(doc)) {
    return `${step9.assessmentModel || "Term Exams"}, ${format}, report card, and ${scope.toLowerCase()} grade scale configured.`;
  }

  return `${step9.assessmentModel || "Term Exams"}, ${format}, and ${scope.toLowerCase()} grade scale configured.`;
};

const collectStep9Issues = (doc) => {
  const warnings = [];
  const blocking = [];

  if (!doc?.completedSteps?.includes(9)) {
    blocking.push("Complete Examination & Gradebook (Step 9) before launch.");
    return { warnings, blocking };
  }

  const validation = validateStep9Payload(doc.step9ExaminationGradebook || {}, doc, {
    draft: false,
    advancedSetup: isAdvancedSetup(doc),
  });

  if (!validation.valid) {
    blocking.push(
      `Examination & Gradebook has ${validation.errors.length} issue(s) to fix in Step 9.`
    );
    validation.errors.slice(0, 4).forEach((message) => warnings.push(message));
  }

  const step9 = doc.step9ExaminationGradebook || {};
  if (isAdvancedSetup(doc) && getWeightageTotal(step9.assessmentWeightage) !== 100) {
    warnings.push("Assessment weightage should total 100% before results are published.");
  }

  return { warnings, blocking };
};

const buildSetupReview = (doc) => {
  if (!doc) return null;

  const completed = Array.isArray(doc.completedSteps) ? doc.completedSteps : [];
  const advancedSetup = isAdvancedSetup(doc);

  const sections = [
    {
      key: "schoolProfile",
      label: "School Profile",
      desc: "Name, branding, localization, contacts configured.",
      done: Boolean(doc.schoolName && doc.schoolCode && doc.address),
    },
    {
      key: "academicStructure",
      label: "Academic Structure",
      desc: "Academic year, grades, sections, streams, subjects mode configured.",
      done: Boolean(doc.gradeFrom && doc.gradeTo),
    },
    {
      key: "rolesHR",
      label: "Roles & HR",
      desc: advancedSetup
        ? "Core roles, optional roles, staff categories, permissions configured."
        : "Core roles and staff categories configured.",
      done: completed.includes(7),
    },
    {
      key: "attendance",
      label: "Attendance",
      desc: advancedSetup
        ? "Hybrid mode, late rules, leave approvals, parent alerts configured."
        : "Attendance mode and core rules configured.",
      done: completed.includes(8),
    },
    {
      key: "exams",
      label: "Exams & Gradebook",
      desc: getExamSectionDesc(doc),
      done: isExamSectionComplete(doc),
    },
    {
      key: "fees",
      label: "Fees",
      desc: "Fee structure, categories, and collection rules configured.",
      done: Boolean(doc.feeCollectionFrequency) || completed.includes(10),
    },
    {
      key: "communication",
      label: "Communication",
      desc: "Channels, triggers, message templates, documents configured.",
      done:
        (doc.communicationChannels &&
          typeof doc.communicationChannels === "object" &&
          Object.keys(doc.communicationChannels).length > 0) ||
        completed.includes(11),
    },
    {
      key: "optionalModules",
      label: "Optional Modules",
      desc: "Transport / Library / Health mini setup can run after launch.",
      done: false,
      later: true,
    },
  ];

  const mandatorySections = sections.filter((section) => !section.later);
  const doneMandatory = mandatorySections.filter((section) => section.done);

  const wizardStepsComplete = completed.filter(
    (step) => Number(step) >= 1 && Number(step) <= LAUNCH_STEP_TOTAL
  ).length;

  const readinessScore = mandatorySections.length
    ? Math.round((doneMandatory.length / mandatorySections.length) * 100)
    : 0;

  const warnings = [];

  if (!doc.gradeFrom || !doc.gradeTo) {
    warnings.push(
      "Subject details may need review. Review subject lists before timetable creation."
    );
  }

  warnings.push(
    "Optional modules not fully configured. Transport, Library, Health, and other optional modules can be configured using mini setup wizards after launch."
  );

  if (!advancedSetup) {
    warnings.push(
      "Quick setup hides assessment weightage and report card options. Switch to Advanced Setup in Step 1 to configure them."
    );
  }

  const step9Issues = collectStep9Issues(doc);
  step9Issues.warnings.forEach((message) => {
    if (!warnings.includes(message)) warnings.push(message);
  });

  const blocking = [...step9Issues.blocking];
  if (!doc.schoolName || !doc.schoolCode) {
    blocking.push("School profile is incomplete. Add school name and code.");
  }
  if (!completed.includes(7)) blocking.push("Complete Roles & HR (Step 7).");
  if (!completed.includes(8)) blocking.push("Complete Attendance (Step 8).");

  const uniqueBlocking = [...new Set(blocking)];
  const launchReady = uniqueBlocking.length === 0 && readinessScore >= 80;

  return {
    readinessScore,
    sectionsComplete: wizardStepsComplete,
    totalSections: LAUNCH_STEP_TOTAL,
    configSectionsComplete: doneMandatory.length,
    configSectionsTotal: mandatorySections.length,
    warnings,
    blockingIssues: uniqueBlocking.length,
    blockingMessages: uniqueBlocking,
    launchReady,
    launchStatusLabel: launchReady
      ? "Launch Ready"
      : uniqueBlocking.length
        ? "Action Required"
        : "Review Warnings",
    setupType: doc.selectedSetupType || SETUP_TYPES.QUICK,
    isAdvancedSetup: advancedSetup,
    sections,
    isLaunched: doc.setupStatus === "completed",
    launchedAt: doc.launchedAt || null,
  };
};

module.exports = { buildSetupReview };
