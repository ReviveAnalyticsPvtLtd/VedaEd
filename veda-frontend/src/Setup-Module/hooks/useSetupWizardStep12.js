import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSetupReview,
  getSetupWizard,
  launchSchoolSetup,
} from "../../services/setupWizardAPI";
import { SETUP_ROUTES, STEP_12_NUMBER } from "../constants/setupWizard";

// Derive review data locally from the wizard document
// so the page is always live — not static fallbacks
function buildReviewFromWizard(doc) {
  if (!doc) return null;

  const completed = Array.isArray(doc.completedSteps) ? doc.completedSteps : [];

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
      desc: "Core roles, optional roles, staff categories, permissions configured.",
      done: completed.includes(7),
    },
    {
      key: "attendance",
      label: "Attendance",
      desc: "Hybrid mode, late rules, leave approvals, parent alerts configured.",
      done: completed.includes(8),
    },
    {
      key: "exams",
      label: "Exams & Gradebook",
      desc: "Term exams, marks + grade, report card, grade scale configured.",
      done: completed.includes(9),
    },
    {
      key: "fees",
      label: "Fees",
      desc: "Quarterly fees, categories, late fee, discounts, reminders configured.",
      done: Boolean(doc.feeCollectionFrequency),
    },
    {
      key: "communication",
      label: "Communication",
      desc: "Channels, triggers, message templates, documents configured.",
      done:
        doc.communicationChannels != null &&
        typeof doc.communicationChannels === "object" &&
        Object.keys(doc.communicationChannels).length > 0,
    },
    {
      key: "optionalModules",
      label: "Optional Modules",
      desc: "Transport / Library / Health mini setup can run after launch.",
      done: false,
      later: true,
    },
  ];

  const doneSections = sections.filter((s) => s.done && !s.later);
  const totalSections = sections.filter((s) => !s.later).length;
  const readinessScore = Math.min(
    94,
    Math.round((doneSections.length / totalSections) * 100)
  );

  const warnings = [];
  if (!doc.gradeFrom || !doc.gradeTo) {
    warnings.push(
      "Subject details may need review. Review subject lists before timetable creation."
    );
  }
  warnings.push(
    "Optional modules not fully configured. Transport, Library, Health, and other optional modules can be configured using mini setup wizards after launch."
  );

  return {
    readinessScore,
    sectionsComplete: doneSections.length,
    totalSections,
    warnings,
    blockingIssues: 0,
    sections,
    isLaunched: doc.setupStatus === "completed",
    launchedAt: doc.launchedAt || null,
  };
}

export function useSetupWizardStep12() {
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Try the dedicated review endpoint first; fall back to raw wizard doc
        const [reviewRes, wizardRes] = await Promise.allSettled([
          getSetupReview(),
          getSetupWizard(),
        ]);

        if (cancelled) return;

        // Prefer the review endpoint if it succeeded
        if (reviewRes.status === "fulfilled" && reviewRes.value?.success) {
          setReviewData(reviewRes.value.data);
          if (reviewRes.value.data?.isLaunched) setLaunched(true);
        } else if (
          wizardRes.status === "fulfilled" &&
          wizardRes.value?.success &&
          wizardRes.value?.data
        ) {
          // Build review data locally from the wizard document
          const derived = buildReviewFromWizard(wizardRes.value.data);
          setReviewData(derived);
          if (derived?.isLaunched) setLaunched(true);
        } else {
          setToast("Unable to load setup review. Please try again.");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load setup review:", err);
          setToast("Unable to load setup review. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLaunch = useCallback(async () => {
    if (!confirmed) {
      setToast("❌ Please confirm the setup is ready to launch.");
      return;
    }

    setLaunching(true);
    setToast("");
    try {
      const res = await launchSchoolSetup({
        launchConfirmed: true,
        currentStep: STEP_12_NUMBER,
        progressPercentage: 100,
        completedSteps: Array.from({ length: STEP_12_NUMBER }, (_, i) => i + 1),
      });
      if (!res?.success) throw new Error(res?.message || "Launch failed");
      setLaunched(true);
      setToast("School setup launched successfully!");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to launch school setup";
      setToast(`❌ ${msg}`);
    } finally {
      setLaunching(false);
    }
  }, [confirmed]);

  const handleBack = useCallback(() => {
    navigate(SETUP_ROUTES.step(11));
  }, [navigate]);

  const handleOpenChecklist = useCallback(() => {
    navigate("/setup/start");
  }, [navigate]);

  return {
    reviewData,
    loading,
    launching,
    launched,
    confirmed,
    setConfirmed,
    toast,
    handleLaunch,
    handleBack,
    handleOpenChecklist,
  };
}
