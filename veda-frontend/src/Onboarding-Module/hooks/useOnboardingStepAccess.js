import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getOnboardingProgress } from "../../services/onboardingAPI";
import { ONBOARDING_ROUTES } from "../constants/onboarding";
import {
  canAccessOnboardingStep,
  getOnboardingResumePath,
} from "../utils/onboardingNavigation";

/**
 * Ensures the user may view this step; redirects only when step is ahead of progress.
 */
export function useOnboardingStepAccess(stepNumber) {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [onboarding, setOnboarding] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    const verify = async () => {
      try {
        const data = await getOnboardingProgress();
        if (cancelled) return;

        const progress = data?.onboarding;

        if (!canAccessOnboardingStep(stepNumber, progress)) {
          navigate(getOnboardingResumePath(progress), { replace: true });
          return;
        }

        setOnboarding(progress);
        setReady(true);
      } catch {
        if (!cancelled) {
          navigate(ONBOARDING_ROUTES.step1, { replace: true });
        }
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [stepNumber, navigate, location.pathname]);

  return { ready, onboarding };
}
