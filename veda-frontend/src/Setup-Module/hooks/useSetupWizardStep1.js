import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSetupWizard,
  saveSetupProgress,
} from "../../services/setupWizardAPI";
import {
  SETUP_TYPES,
  SETUP_ROUTES,
  STEP_1_NUMBER,
  getStepProgress,
} from "../constants/setupWizard";

export function useSetupWizardStep1() {
  const navigate = useNavigate();
  const [selectedSetupType, setSelectedSetupType] = useState(SETUP_TYPES.QUICK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getSetupWizard();
        if (!cancelled && res?.success && res?.data?.selectedSetupType) {
          setSelectedSetupType(res.data.selectedSetupType);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load setup progress:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const buildPayload = useCallback(
    ({ advancing = false } = {}) => ({
      selectedSetupType,
      currentStep: advancing ? STEP_1_NUMBER + 1 : STEP_1_NUMBER,
      progressPercentage: getStepProgress(STEP_1_NUMBER),
      completedSteps: [STEP_1_NUMBER],
    }),
    [selectedSetupType]
  );

  const persistStep = useCallback(async (options) => {
    setSaving(true);
    setToast("");
    try {
      const res = await saveSetupProgress(buildPayload(options));
      if (!res?.success) {
        throw new Error(res?.message || "Failed to save");
      }
      return true;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save setup progress";
      setToast(`❌ ${msg}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [buildPayload]);

  const handleSaveContinue = useCallback(async () => {
    const ok = await persistStep({ advancing: true });
    if (ok) {
      setToast("Progress saved successfully");
      navigate(SETUP_ROUTES.step(2));
    }
  }, [persistStep, navigate]);

  const handleSaveExit = useCallback(async () => {
    const ok = await persistStep({ advancing: false });
    if (ok) {
      setToast("Draft saved. You can continue setup later.");
      navigate(SETUP_ROUTES.START);
    }
  }, [persistStep, navigate]);

  return {
    selectedSetupType,
    setSelectedSetupType,
    loading,
    saving,
    toast,
    handleSaveContinue,
    handleSaveExit,
  };
}
