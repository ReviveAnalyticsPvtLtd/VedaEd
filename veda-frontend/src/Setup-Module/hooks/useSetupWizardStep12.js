import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSetupReview,
  getSetupWizard,
  launchSchoolSetup,
} from "../../services/setupWizardAPI";
import { SETUP_ROUTES, STEP_12_NUMBER } from "../constants/setupWizard";
import { buildSetupReview } from "../utils/setupReview";
import { formatSlugAsName } from "../../Onboarding-Module/utils/workspaceSlug";
import { clearAuthSession } from "../../utils/authSession";

const SPLASH_DURATION_MS = 2800;
const LOGIN_PAGE = "/";

export function useSetupWizardStep12() {
  const navigate = useNavigate();
  const splashTimerRef = useRef(null);
  const [reviewData, setReviewData] = useState(null);
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [toast, setToast] = useState("");

  const resolveSchoolName = useCallback((name, slug) => {
    return name?.trim() || formatSlugAsName(slug) || "";
  }, []);

  const loadReview = useCallback(async () => {
    const wizardRes = await getSetupWizard();
    if (wizardRes?.success && wizardRes?.data) {
      const derived = buildSetupReview(wizardRes.data);
      setReviewData(derived);
      setSchoolName(
        resolveSchoolName(wizardRes.data?.schoolName, wizardRes.data?.workspaceSlug)
      );
      if (derived?.isLaunched) setLaunched(true);
      return true;
    }
    return false;
  }, [resolveSchoolName]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ok = await loadReview();
        if (!cancelled && !ok) {
          const reviewRes = await getSetupReview();
          if (reviewRes?.success) {
            setReviewData(reviewRes.data);
            if (!cancelled) {
              setSchoolName(
                resolveSchoolName(
                  reviewRes.data?.schoolName,
                  reviewRes.data?.workspaceSlug
                )
              );
            }
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
  }, [loadReview, resolveSchoolName]);

  useEffect(() => {
    return () => {
      if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
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
      const launchName = resolveSchoolName(
        res?.data?.schoolName || res?.schoolName,
        res?.data?.workspaceSlug || res?.workspaceSlug
      );
      if (launchName) setSchoolName(launchName);
      setLaunched(true);
      setShowSplash(true);
      splashTimerRef.current = setTimeout(() => {
        clearAuthSession();
        navigate(LOGIN_PAGE, { replace: true });
      }, SPLASH_DURATION_MS);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to launch school setup";
      setToast(`❌ ${msg}`);
    } finally {
      setLaunching(false);
    }
  }, [confirmed, navigate, resolveSchoolName]);

  const handleBack = useCallback(() => {
    navigate(SETUP_ROUTES.step(11));
  }, [navigate]);

  return {
    reviewData,
    schoolName,
    loading,
    launching,
    launched,
    showSplash,
    confirmed,
    setConfirmed,
    toast,
    handleLaunch,
    handleBack,
  };
}
