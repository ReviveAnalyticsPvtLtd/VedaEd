import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSetupReview,
  getSetupWizard,
  launchSchoolSetup,
} from "../../services/setupWizardAPI";
import { SETUP_ROUTES, STEP_12_NUMBER } from "../constants/setupWizard";
import { buildSetupReview } from "../utils/setupReview";

export function useSetupWizardStep12() {
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [toast, setToast] = useState("");

  const loadReview = useCallback(async () => {
    const wizardRes = await getSetupWizard();
    if (wizardRes?.success && wizardRes?.data) {
      const derived = buildSetupReview(wizardRes.data);
      setReviewData(derived);
      if (derived?.isLaunched) setLaunched(true);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ok = await loadReview();
        if (!cancelled && !ok) {
          const reviewRes = await getSetupReview();
          if (reviewRes?.success) {
            setReviewData(reviewRes.data);
            if (reviewRes.data?.isLaunched) setLaunched(true);
          } else {
            setToast("Unable to load setup review. Please try again.");
          }
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
  }, [loadReview]);

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
