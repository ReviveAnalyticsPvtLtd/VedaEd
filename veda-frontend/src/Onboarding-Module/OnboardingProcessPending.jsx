import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getOnboardingProgress } from "../services/onboardingAPI";
import { ONBOARDING_ROUTES } from "./constants/onboarding";

/**
 * Temporary hold page after step 6 — admin dashboard access is not enabled yet.
 */
export default function OnboardingProcessPending() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const guard = async () => {
      try {
        const data = await getOnboardingProgress();
        const onboarding = data?.onboarding;
        if (cancelled) return;

        if (!onboarding?.isCompleted && !onboarding?.onboardingCompleted) {
          navigate(ONBOARDING_ROUTES.step6, { replace: true });
        }
      } catch {
        if (!cancelled) {
          navigate(ONBOARDING_ROUTES.step1, { replace: true });
        }
      }
    };

    guard();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold tracking-wide text-blue-600">
          VEDASCHOOL
        </p>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Thank you for completing onboarding
        </h1>
        <p className="mt-4 text-base text-slate-600">
          Your setup is recorded. The process will continue — we will enable
          dashboard access for your school workspace shortly.
        </p>
        <p className="mt-8 text-sm text-slate-400">
          You can close this tab and return later, or stay on this page for
          updates.
        </p>
      </div>
    </div>
  );
}
