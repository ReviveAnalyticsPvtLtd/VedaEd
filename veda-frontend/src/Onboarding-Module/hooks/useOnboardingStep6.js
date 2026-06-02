import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getOnboardingWorkspace,
  getOnboardingProgress,
  completeOnboarding,
} from "../../services/onboardingAPI";
import { saveAuthSession } from "../../utils/authSession";
import { ONBOARDING_ROUTES } from "../constants/onboarding";
import { getOnboardingExitPath } from "../utils/onboardingNavigation";
import {
  canAccessOnboardingStep,
  getOnboardingResumePath,
} from "../utils/onboardingNavigation";

export function useOnboardingStep6() {
  const navigate = useNavigate();
  const [schoolName, setSchoolName] = useState("");
  const [workspacePreviewUrl, setWorkspacePreviewUrl] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyToast, setCopyToast] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const progressData = await getOnboardingProgress();
        const onboarding = progressData?.onboarding;
        const currentStep = onboarding?.currentStep || 1;
        const completedSteps = onboarding?.completedSteps || [];

        if (!canAccessOnboardingStep(6, onboarding)) {
          if (!cancelled) {
            navigate(getOnboardingResumePath(onboarding), { replace: true });
          }
          return;
        }

        const workspaceData = await getOnboardingWorkspace();
        if (cancelled) return;

        setSchoolName(workspaceData.schoolName || "");
        setWorkspacePreviewUrl(
          workspaceData.workspacePreviewUrl || workspaceData.workspaceUrl || ""
        );
        setAdminEmail(workspaceData.adminEmail || "");
        setOnboardingCompleted(Boolean(workspaceData.onboardingCompleted));
      } catch (err) {
        if (cancelled) return;
        const redirectTo = err.response?.data?.redirectTo;
        if (redirectTo) {
          navigate(redirectTo, { replace: true });
          return;
        }
        setError(
          err.response?.data?.message ||
            "Unable to load your workspace. Please try again."
        );
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleCopyUrl = useCallback(async () => {
    if (!workspacePreviewUrl) return;

    try {
      await navigator.clipboard.writeText(workspacePreviewUrl);
      setCopyToast("Workspace URL copied successfully.");
      setTimeout(() => setCopyToast(""), 3000);
    } catch {
      setCopyToast("Could not copy the URL. Please copy it manually.");
      setTimeout(() => setCopyToast(""), 4000);
    }
  }, [workspacePreviewUrl]);

  const handleGoToDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await completeOnboarding();
      if (data?.token) {
        saveAuthSession(data);
      }
      const exitPath =
        data?.redirect && String(data.redirect).startsWith("/onboarding/")
          ? data.redirect
          : getOnboardingExitPath();
      navigate(exitPath, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not finish onboarding. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleBack = useCallback(() => {
    navigate(ONBOARDING_ROUTES.step5);
  }, [navigate]);

  return {
    schoolName,
    workspacePreviewUrl,
    adminEmail,
    onboardingCompleted,
    loading,
    initialLoading,
    error,
    copyToast,
    handleCopyUrl,
    handleGoToDashboard,
    handleBack,
  };
}
