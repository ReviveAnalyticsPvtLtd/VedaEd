import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSetupWizard, saveFeeSetup } from "../../services/setupWizardAPI";
import {
  SETUP_ROUTES,
  STEP_9_NUMBER,
  STEP_10_NUMBER,
  STEP_10_PROGRESS,
  STEP_11_NUMBER,
  WIZARD_STEP_PATH,
} from "../constants/setupWizard";

// ─── Base categories always present ───────────────────────────────────────
const BASE_CATEGORIES = [
  {
    key: "tuition",
    name: "Tuition Fee",
    type: "Recurring",
    appliesTo: "All Students",
    status: "Required",
    source: "core",
    enabled: true,
  },
  {
    key: "admission",
    name: "Admission Fee",
    type: "One-time",
    appliesTo: "New Admissions",
    status: "Required",
    source: "core",
    enabled: true,
  },
  {
    key: "exam",
    name: "Exam Fee",
    type: "Term-wise",
    appliesTo: "All Students",
    status: "Required",
    source: "core",
    enabled: true,
  },
];

// ─── Module-driven categories (added when module is enabled in step 5) ────
const MODULE_CATEGORIES = [
  {
    key: "transport",
    name: "Transport Fee",
    type: "Optional",
    appliesTo: "Transport Students",
    status: "Optional",
    source: "module",
    requiredModule: "Transport",
    enabled: false,
  },
  {
    key: "library",
    name: "Library Fee",
    type: "Annual",
    appliesTo: "All Students",
    status: "Optional",
    source: "module",
    requiredModule: "Library",
    enabled: false,
  },
  {
    key: "health",
    name: "Health & Medical Fee",
    type: "Annual",
    appliesTo: "All Students",
    status: "Optional",
    source: "module",
    requiredModule: "Health",
    enabled: false,
  },
  {
    key: "hostel",
    name: "Hostel Fee",
    type: "Recurring",
    appliesTo: "Hostel Students",
    status: "Optional",
    source: "module",
    requiredModule: "Hostel",
    enabled: false,
  },
  {
    key: "lms",
    name: "LMS / Digital Content Fee",
    type: "Annual",
    appliesTo: "All Students",
    status: "Optional",
    source: "module",
    requiredModule: "LMS",
    enabled: false,
  },
];

// ─── Role-driven categories (added when role is enabled in step 7) ────────
const ROLE_CATEGORIES = [
  {
    key: "activity",
    name: "Activity Fee",
    type: "Annual",
    appliesTo: "All Students",
    status: "Optional",
    source: "role",
    requiredRole: "Class Coordinator",
    enabled: false,
  },
];

/**
 * Build the full category list by merging base + module-driven + role-driven.
 * enabledModules  — from step 5 (e.g. ["Transport","Library","Health"])
 * optionalRoles   — from step 7 (e.g. ["Transport Manager","Class Coordinator"])
 * savedCategories — previously saved by the user in step 10
 */
function buildCategories(enabledModules = [], optionalRoles = [], savedCategories = []) {
  const savedMap = {};
  savedCategories.forEach((c) => {
    if (c.key) savedMap[c.key] = c;
  });

  const all = [
    ...BASE_CATEGORIES,
    ...MODULE_CATEGORIES.map((cat) => ({
      ...cat,
      enabled: enabledModules.includes(cat.requiredModule),
    })),
    ...ROLE_CATEGORIES.map((cat) => ({
      ...cat,
      enabled: optionalRoles.includes(cat.requiredRole),
    })),
  ];

  return all.map((cat) => {
    const saved = savedMap[cat.key];
    return {
      ...cat,
      // Preserve user's enabled toggle if they previously saved it
      enabled: saved ? saved.enabled : cat.enabled,
      // Preserve user's custom type/appliesTo/status if they edited
      type: saved?.type || cat.type,
      appliesTo: saved?.appliesTo || cat.appliesTo,
      status: saved?.status || cat.status,
    };
  });
}

const DEFAULT_FORM = {
  feeCollectionFrequency: "quarterly",
  feeCategories: buildCategories([], []),
  discounts: {
    siblingDiscount: false,
    meritScholarship: false,
    needBasedConcession: false,
    staffChildDiscount: false,
  },
  lateFeeType: "fixed_amount",
  lateFeeValue: 100,
  graceDays: 7,
  partialPayment: "allow",
  refundPolicy: "manual_refund_approval",
  paymentModes: "online_offline",
  feeReminders: {
    beforeDueDate: true,
    onDueDate: true,
    afterDueDate: true,
    lowBalanceReminder: false,
    scholarshipApprovalAlert: false,
  },
  // Context from previous steps (read-only display)
  enabledModules: [],
  optionalRoles: [],
  termStructure: "",
  curriculumBoard: "",
};

function mapSavedToForm(data, enabledModules, optionalRoles) {
  const savedCategories = Array.isArray(data.feeCategories) ? data.feeCategories : [];
  return {
    feeCollectionFrequency: data.feeCollectionFrequency || "quarterly",
    feeCategories: buildCategories(enabledModules, optionalRoles, savedCategories),
    discounts: {
      siblingDiscount: Boolean(data.discounts?.siblingDiscount),
      meritScholarship: Boolean(data.discounts?.meritScholarship),
      needBasedConcession: Boolean(data.discounts?.needBasedConcession),
      staffChildDiscount: Boolean(data.discounts?.staffChildDiscount),
    },
    lateFeeType: data.lateFeeType || "fixed_amount",
    lateFeeValue: data.lateFeeValue ?? 100,
    graceDays: data.graceDays ?? 7,
    partialPayment: data.partialPayment || "allow",
    refundPolicy: data.refundPolicy || "manual_refund_approval",
    paymentModes: data.paymentModes || "online_offline",
    feeReminders: {
      beforeDueDate: data.feeReminders?.beforeDueDate ?? true,
      onDueDate: data.feeReminders?.onDueDate ?? true,
      afterDueDate: data.feeReminders?.afterDueDate ?? true,
      lowBalanceReminder: data.feeReminders?.lowBalanceReminder ?? false,
      scholarshipApprovalAlert: data.feeReminders?.scholarshipApprovalAlert ?? false,
    },
    enabledModules,
    optionalRoles,
    termStructure: data.termStructure || "",
    curriculumBoard: data.curriculumBoard || "",
  };
}

export function useSetupWizardStep10() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getSetupWizard();
        if (!cancelled && res?.success && res?.data) {
          const data = res.data;
          const completedSteps = data.completedSteps || [];

          // Always read context from previous steps (modules + roles)
          const enabledModules = Array.isArray(data.enabledModules)
            ? data.enabledModules
            : [];
          const optionalRoles = Array.isArray(data.optionalRoles)
            ? data.optionalRoles
            : [];

          if (completedSteps.includes(STEP_10_NUMBER)) {
            // Resume: restore saved form + rebuild categories with current modules/roles
            setForm(mapSavedToForm(data, enabledModules, optionalRoles));
          } else {
            // Fresh: build categories from modules/roles, rest is defaults
            setForm((prev) => ({
              ...prev,
              feeCategories: buildCategories(enabledModules, optionalRoles, []),
              enabledModules,
              optionalRoles,
              termStructure: data.termStructure || "",
              curriculumBoard: data.curriculumBoard || "",
            }));
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load setup progress:", err);
          setToast("Unable to load saved progress. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const updateField = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const updateDiscount = useCallback((key, value) => {
    setForm((prev) => ({
      ...prev,
      discounts: { ...prev.discounts, [key]: value },
    }));
  }, []);

  const updateReminder = useCallback((key, value) => {
    setForm((prev) => ({
      ...prev,
      feeReminders: { ...prev.feeReminders, [key]: value },
    }));
  }, []);

  // Toggle a category's enabled state
  const toggleCategory = useCallback((key) => {
    setForm((prev) => ({
      ...prev,
      feeCategories: prev.feeCategories.map((cat) =>
        cat.key === key ? { ...cat, enabled: !cat.enabled } : cat
      ),
    }));
  }, []);

  const buildPayload = useCallback(
    ({ advancing = false } = {}) => ({
      // Only save the enabled categories to the backend
      feeCollectionFrequency: form.feeCollectionFrequency,
      feeCategories: form.feeCategories
        .filter((c) => c.enabled)
        .map(({ key, name, type, appliesTo, status, source }) => ({
          key, name, type, appliesTo, status, source,
        })),
      discounts: form.discounts,
      lateFeeType: form.lateFeeType,
      lateFeeValue: form.lateFeeValue,
      graceDays: form.graceDays,
      partialPayment: form.partialPayment,
      refundPolicy: form.refundPolicy,
      paymentModes: form.paymentModes,
      feeReminders: form.feeReminders,
      currentStep: advancing ? STEP_11_NUMBER : STEP_10_NUMBER,
      progressPercentage: STEP_10_PROGRESS,
      completedSteps: advancing
        ? Array.from({ length: STEP_10_NUMBER }, (_, i) => i + 1)
        : Array.from({ length: STEP_10_NUMBER - 1 }, (_, i) => i + 1),
    }),
    [form]
  );

  const persistStep = useCallback(
    async ({ advancing = false } = {}) => {
      setSaving(true);
      setToast("");
      try {
        const res = await saveFeeSetup(buildPayload({ advancing }));
        if (!res?.success) throw new Error(res?.message || "Failed to save");
        setToast(advancing ? "Progress saved successfully" : "Draft saved");
        return true;
      } catch (err) {
        const msg =
          err?.response?.data?.message || err?.message || "Failed to save fee setup";
        setToast(`❌ ${msg}`);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [buildPayload]
  );

  const handleSaveContinue = useCallback(async () => {
    const ok = await persistStep({ advancing: true });
    if (ok) navigate(WIZARD_STEP_PATH(STEP_11_NUMBER));
  }, [persistStep, navigate]);

  const handleBack = useCallback(() => {
    navigate(WIZARD_STEP_PATH(STEP_9_NUMBER));
  }, [navigate]);

  const handleSaveExit = useCallback(async () => {
    const ok = await persistStep({ advancing: false });
    if (ok) navigate(SETUP_ROUTES.START);
  }, [persistStep, navigate]);

  // Derived counts for sidebar
  const enabledCategoryCount = form.feeCategories.filter((c) => c.enabled).length;

  return {
    form,
    loading,
    saving,
    toast,
    enabledCategoryCount,
    updateField,
    updateDiscount,
    updateReminder,
    toggleCategory,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  };
}
