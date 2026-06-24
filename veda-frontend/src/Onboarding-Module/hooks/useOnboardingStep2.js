import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSchoolInformation,
  saveSchoolInformation,
} from "../../services/onboardingAPI";
import { checkWorkspaceAvailability } from "../../services/workspaceAPI";
import {
  generateWorkspaceSlug,
  buildWorkspacePreviewUrl,
  isSlugLongEnough,
} from "../utils/workspaceSlug";
import { ONBOARDING_ROUTES, stepPath } from "../constants/onboarding";
import {
  canAccessOnboardingStep,
  getOnboardingResumePath,
  getPostOnboardingDestination,
} from "../utils/onboardingNavigation";
import { getOnboardingProgress } from "../../services/onboardingAPI";

export function useOnboardingStep2() {
  const navigate = useNavigate();
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [availabilityHint, setAvailabilityHint] = useState("");

  const workspaceSlug = useMemo(
    () => generateWorkspaceSlug(schoolName),
    [schoolName]
  );

  const workspacePreviewUrl = useMemo(
    () => buildWorkspacePreviewUrl(workspaceSlug),
    [workspaceSlug]
  );

  useEffect(() => {
    let cancelled = false;

    const loadExisting = async () => {
      try {
        const progressRes = await getOnboardingProgress();
        const onboarding = progressRes?.onboarding;
        if (!cancelled) {
          if (
            (onboarding?.isCompleted || onboarding?.onboardingCompleted) &&
            !canAccessOnboardingStep(2, onboarding)
          ) {
            navigate(getOnboardingResumePath(onboarding), { replace: true });
            return;
          }
          if (!canAccessOnboardingStep(2, onboarding)) {
            navigate(getOnboardingResumePath(onboarding), { replace: true });
            return;
          }
        }

        const data = await getSchoolInformation();
        if (!cancelled && data?.workspace?.schoolName) {
          setSchoolName(data.workspace.schoolName);
        }
      } catch {
        // No saved data yet — expected for first visit
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    loadExisting();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!schoolName.trim()) {
      setAvailabilityHint("");
      return;
    }

    if (!isSlugLongEnough(workspaceSlug)) {
      setAvailabilityHint("");
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await checkWorkspaceAvailability({
          schoolName: schoolName.trim(),
          workspaceSlug,
        });
        if (cancelled) return;
        if (result.available === false) {
          setAvailabilityHint(
            result.reason || "This workspace name is already taken."
          );
        } else {
          setAvailabilityHint("");
        }
      } catch {
        if (!cancelled) setAvailabilityHint("");
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [schoolName, workspaceSlug]);

  const handleSchoolNameChange = useCallback((value) => {
    setSchoolName(value);
    setFieldError("");
    setError("");
  }, []);

  const handleContinue = useCallback(async () => {
    const trimmed = schoolName.trim();
    setFieldError("");
    setError("");

    if (!trimmed) {
      setFieldError("School name is required");
      return;
    }

    if (!isSlugLongEnough(workspaceSlug)) {
      setFieldError("Enter a longer school name to generate a valid workspace URL");
      return;
    }

    if (availabilityHint) {
      setFieldError(availabilityHint);
      return;
    }

    setLoading(true);
    try {
      const check = await checkWorkspaceAvailability({
        schoolName: trimmed,
        workspaceSlug,
      });

      if (!check.available) {
        setFieldError(
          check.reason || "This workspace name is already taken. Try a different name."
        );
        return;
      }

      const data = await saveSchoolInformation({
        schoolName: trimmed,
        workspaceSlug,
      });

      localStorage.setItem("workspaceDomain", buildWorkspacePreviewUrl(workspaceSlug));

      const onboarding = data?.onboarding;
      if (onboarding?.isCompleted) {
        navigate(getPostOnboardingDestination(onboarding));
        return;
      }

      const nextStep = onboarding?.currentStep || 3;
      navigate(stepPath(nextStep));
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        "Could not save school information. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [schoolName, workspaceSlug, availabilityHint, navigate]);

  const handleBack = useCallback(() => {
    navigate(ONBOARDING_ROUTES.step1);
  }, [navigate]);

  return {
    schoolName,
    workspaceSlug,
    workspacePreviewUrl,
    loading,
    initialLoading,
    error,
    fieldError,
    availabilityHint,
    handleSchoolNameChange,
    handleContinue,
    handleBack,
  };
}
