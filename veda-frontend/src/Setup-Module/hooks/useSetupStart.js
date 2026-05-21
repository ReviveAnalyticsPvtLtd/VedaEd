import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSetupProgress,
  initializeSetup,
} from "../../services/setupWizardAPI";
import { SETUP_ROUTES } from "../constants/setupWizard";

export function useSetupStart() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [progress, setProgress] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getSetupProgress();
        if (!cancelled && res?.success) {
          setHasDraft(Boolean(res.hasDraft));
          setProgress(res.data || null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load setup progress:", err);
          setToast(" Unable to check setup progress. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStartSetup = useCallback(async () => {
    setActionLoading(true);
    setToast("");
    try {
      const res = await initializeSetup();
      if (!res?.success) {
        throw new Error(res?.message || "Failed to start setup");
      }
      navigate(SETUP_ROUTES.step(1));
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to initialize setup";
      setToast(`❌ ${msg}`);
    } finally {
      setActionLoading(false);
    }
  }, [navigate]);

  const handleResumeSetup = useCallback(() => {
    const step = progress?.currentStep || 1;
    navigate(SETUP_ROUTES.step(step));
  }, [navigate, progress]);

  return {
    loading,
    actionLoading,
    hasDraft,
    progress,
    toast,
    handleStartSetup,
    handleResumeSetup,
  };
}
