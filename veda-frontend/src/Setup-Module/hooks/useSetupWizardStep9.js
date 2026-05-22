import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFeesSetup,
  saveFeesSetup,
} from "../../services/setupWizardAPI";
import {
  STEP_8_NUMBER,
  STEP_8_PROGRESS,
  STEP_9_NUMBER,
  STEP_9_PROGRESS,
  TOTAL_STEPS,
  WIZARD_STEP_PATH,
} from "../constants/setupWizard";
import { toastBannerClassName } from "../../utils/toastMessageStyle";

const START_PATH = "/setup/start";

export function useSetupWizardStep9() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [feesEnabled, setFeesEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getFeesSetup();
        if (!cancelled && res?.success && res?.data) {
          setFeesEnabled(res.data.feesModuleEnabled !== false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load step 9:", err);
          setToast("Unable to load saved progress.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistStep = useCallback(
    async ({ advancing = false, draft = false } = {}) => {
      setSaving(true);
      setToast("");

      try {
        const res = await saveFeesSetup({
          draft,
          feesModuleEnabled: feesEnabled,
          currentStep: STEP_9_NUMBER,
          progressPercentage: STEP_9_PROGRESS,
          completedSteps: advancing
            ? [1, 2, 3, 4, 5, 6, 7, 8, 9]
            : [1, 2, 3, 4, 5, 6, 7, 8],
        });

        if (!res?.success) {
          throw new Error(res?.message || "Failed to save");
        }

        setToast(
          advancing
            ? "Fees setup saved. Continue to the next step when ready."
            : "Draft saved"
        );
        return true;
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to save fees setup";
        setToast(msg);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [feesEnabled]
  );

  const handleSaveContinue = useCallback(async () => {
    const ok = await persistStep({ advancing: true });
    if (ok) {
      setToast(
        "Step 9 saved. Exams and remaining setup steps will be available in the next release."
      );
    }
  }, [persistStep]);

  const handleBack = useCallback(() => {
    navigate(WIZARD_STEP_PATH(STEP_8_NUMBER));
  }, [navigate]);

  const handleSaveExit = useCallback(async () => {
    const ok = await persistStep({ advancing: false, draft: true });
    if (ok) {
      setToast("Draft saved. You can continue setup later.");
      navigate(START_PATH);
    }
  }, [persistStep, navigate]);

  return {
    loading,
    saving,
    toast,
    toastBannerClassName,
    feesEnabled,
    setFeesEnabled,
    totalSteps: TOTAL_STEPS,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  };
}
