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

const DEFAULT_CATEGORIES = [
  { name: "Tuition Fee", type: "Recurring", appliesTo: "All Students", status: "Required" },
  { name: "Admission Fee", type: "One-time", appliesTo: "New Admissions", status: "Required" },
  { name: "Exam Fee", type: "Term-wise", appliesTo: "All Students", status: "Required" },
  { name: "Transport Fee", type: "Optional", appliesTo: "Transport Students", status: "Optional" },
  { name: "Activity Fee", type: "Annual", appliesTo: "All Students", status: "Optional" },
];

const DEFAULT_FORM = {
  feeCollectionFrequency: "quarterly",
  feeCategories: DEFAULT_CATEGORIES,
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
};

function mapSavedToForm(data) {
  if (!data) return { ...DEFAULT_FORM };
  return {
    feeCollectionFrequency: data.feeCollectionFrequency || "quarterly",
    feeCategories:
      Array.isArray(data.feeCategories) && data.feeCategories.length > 0
        ? data.feeCategories
        : DEFAULT_CATEGORIES,
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
          const completedSteps = res.data.completedSteps || [];
          // Only prefill if step 10 was previously completed (resume flow)
          if (completedSteps.includes(10)) {
            setForm(mapSavedToForm(res.data));
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

  const buildPayload = useCallback(
    ({ advancing = false } = {}) => ({
      ...form,
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

  return {
    form,
    loading,
    saving,
    toast,
    updateField,
    updateDiscount,
    updateReminder,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  };
}
