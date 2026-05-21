import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSetupWizard,
  saveOrganizationType,
} from "../../services/setupWizardAPI";
import {
  ORGANIZATION_TYPES,
  SETUP_ROUTES,
  STEP_2_NUMBER,
  STEP_2_PROGRESS,
} from "../constants/setupWizard";

const VALID_ORG_TYPES = Object.values(ORGANIZATION_TYPES);

export function useSetupWizardStep2() {
  const navigate = useNavigate();
  const [organizationType, setOrganizationType] = useState(
    ORGANIZATION_TYPES.SINGLE_SCHOOL
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getSetupWizard();
        if (!cancelled && res?.success && res?.data?.organizationType) {
          const saved = res.data.organizationType;
          if (VALID_ORG_TYPES.includes(saved)) {
            setOrganizationType(saved);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load setup progress:", err);
          setToast("❌ Unable to load saved progress. Please try again.");
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
      organizationType,
      currentStep: advancing ? STEP_2_NUMBER + 1 : STEP_2_NUMBER,
      progressPercentage: STEP_2_PROGRESS,
      completedSteps: advancing ? [1, 2] : [1],
    }),
    [organizationType]
  );

  const persistStep = useCallback(
    async (options) => {
      if (!organizationType || !VALID_ORG_TYPES.includes(organizationType)) {
        setToast("❌ Please select an organization type to continue.");
        return false;
      }

      setSaving(true);
      setToast("");
      try {
        const res = await saveOrganizationType(buildPayload(options));
        if (!res?.success) {
          throw new Error(res?.message || "Failed to save");
        }
        return true;
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to save organization type";
        setToast(`❌ ${msg}`);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [buildPayload, organizationType]
  );

  const handleSaveContinue = useCallback(async () => {
    const ok = await persistStep({ advancing: true });
    if (ok) {
      setToast("Progress saved successfully");
      navigate(SETUP_ROUTES.step(3));
    }
  }, [persistStep, navigate]);

  const handleBack = useCallback(() => {
    navigate(SETUP_ROUTES.step(1));
  }, [navigate]);

  const handleSaveExit = useCallback(async () => {
    const ok = await persistStep({ advancing: false });
    if (ok) {
      setToast("Draft saved. You can continue setup later.");
      navigate(SETUP_ROUTES.START);
    }
  }, [persistStep, navigate]);

  return {
    organizationType,
    setOrganizationType,
    loading,
    saving,
    toast,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  };
}
