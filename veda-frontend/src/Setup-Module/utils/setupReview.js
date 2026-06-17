import { SETUP_TYPES, STEP_12_NUMBER } from "../constants/setupWizard";
import {
  getSmartChecks,
  getWeightageTotal,
  mapWizardDataToStep9Form,
  validateStep9Form,
} from "./examinationGradebook";

const LAUNCH_STEP_TOTAL = STEP_12_NUMBER - 1;

const hasValidationErrors = (errors = {}) =>
  Object.entries(errors).some(([key, value]) => {
    if (key === "gradeTableRows" || key === "assessmentWeightageRows") {
      return Object.values(value || {}).some(Boolean);
    }
    return Boolean(value);
  });

const flattenValidationMessages = (errors = {}) => {
  const messages = [];
  Object.entries(errors).forEach(([key, value]) => {
    if (key === "gradeTableRows" || key === "assessmentWeightageRows") {
      Object.values(value || {})
        .filter(Boolean)
        .forEach((message) => messages.push(message));
      return;
    }
    if (value) messages.push(value);
  });
  return messages;
};

const isAdvancedSetup = (doc) => doc?.selectedSetupType === SETUP_TYPES.ADVANCED;

const getStep9Form = (doc) =>
  mapWizardDataToStep9Form(doc?.step9ExaminationGradebook || {}, doc || {});

const isExamSectionComplete = (doc) => {
  if (!doc?.completedSteps?.includes(9)) return false;

  const step9 = doc.step9ExaminationGradebook;
  if (!step9?.assessmentModel || !step9?.resultDisplayFormat) return false;
  if (!Array.isArray(step9.gradeTable) || !step9.gradeTable.length) return false;

  const form = getStep9Form(doc);
  const advancedSetup = isAdvancedSetup(doc);

  if (advancedSetup) {
    const totalWeight = getWeightageTotal(form.assessmentWeightage);
    if (Math.round(totalWeight * 100) / 100 !== 100) return false;
    if (!form.reportCardSections?.length) return false;
  }

  const errors = validateStep9Form(form, { advancedSetup });
  return !hasValidationErrors(errors);
};

const getExamSectionDesc = (doc) => {
  const step9 = doc?.step9ExaminationGradebook;
  const format = step9?.resultDisplayFormat || "Marks + Grade";
  const scope = step9?.gradeScaleScope || "Globally";

  if (isAdvancedSetup(doc)) {
    return `${step9?.assessmentModel || "Term Exams"}, ${format}, report card, and ${scope.toLowerCase()} grade scale configured.`;
  }

  return `${step9?.assessmentModel || "Term Exams"}, ${format}, and ${scope.toLowerCase()} grade scale configured.`;
};

const collectStep9Issues = (doc) => {
  const warnings = [];
  const blocking = [];

  if (!doc?.completedSteps?.includes(9)) {
    blocking.push("Complete Examination & Gradebook (Step 9) before launch.");
    return { warnings, blocking };
  }

  const form = getStep9Form(doc);
  const advancedSetup = isAdvancedSetup(doc);
  const errors = validateStep9Form(form, { advancedSetup });
  const validationMessages = flattenValidationMessages(errors);

  if (validationMessages.length) {
    blocking.push(
      `Examination & Gradebook has ${validationMessages.length} issue(s) to fix in Step 9.`
    );
    validationMessages.slice(0, 3).forEach((message) => warnings.push(message));
    if (validationMessages.length > 3) {
      warnings.push(`…and ${validationMessages.length - 3} more grade scale issue(s).`);
    }
  }

  getSmartChecks(form, [], { advancedSetup }).forEach((message) => {
    if (!warnings.includes(message)) warnings.push(message);
  });

  if (advancedSetup) {
    const totalWeight = getWeightageTotal(form.assessmentWeightage);
    if (Math.round(totalWeight * 100) / 100 !== 100) {
      warnings.push("Assessment weightage should total 100% before results are published.");
    }
  }

  return { warnings, blocking };
};

export const buildSetupReview = (doc) => {
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
        (doc.communicationChannels != null &&
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
  const blocking = [];

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
  blocking.push(...step9Issues.blocking);

  if (!doc.schoolName || !doc.schoolCode) {
    blocking.push("School profile is incomplete. Add school name and code.");
  }

  if (!completed.includes(7)) blocking.push("Complete Roles & HR (Step 7).");
  if (!completed.includes(8)) blocking.push("Complete Attendance (Step 8).");

  const uniqueBlocking = [...new Set(blocking)];
  const launchReady = uniqueBlocking.length === 0 && readinessScore >= 80;

  return {
    schoolName: doc.schoolName || "",
    workspaceSlug: doc.workspaceSlug || "",
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
