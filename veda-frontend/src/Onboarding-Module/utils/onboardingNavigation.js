import { ONBOARDING_ROUTES, stepPath } from "../constants/onboarding";

const clampStep = (step) => Math.min(Math.max(Number(step) || 2, 2), 6);

/**
 * Highest step the user has reached in the wizard.
 */
export function getHighestReachedStep(onboarding) {
  if (!onboarding) return 2;
  const completed = onboarding.completedSteps || [];
  const current = onboarding.currentStep || 1;
  const fromCompleted = completed.length ? Math.max(...completed) : 0;
  return Math.max(current, fromCompleted, onboarding.isCompleted ? 6 : 0);
}

/**
 * Next step route inside the onboarding module only (never admin-front).
 */
export function getPostOnboardingDestination(onboarding) {
  const highest = getHighestReachedStep(onboarding);
  if (onboarding?.isCompleted || onboarding?.onboardingCompleted) {
    return ONBOARDING_ROUTES.step6;
  }
  return stepPath(clampStep(onboarding?.currentStep || highest));
}

/**
 * Resume path after login — stays within onboarding until user exits from step 6.
 */
export function getOnboardingResumePath(onboarding) {
  if (onboarding?.isCompleted || onboarding?.onboardingCompleted) {
    return ONBOARDING_ROUTES.step6;
  }
  if (onboarding?.nextPath && onboarding.nextPath.startsWith("/onboarding/")) {
    return onboarding.nextPath;
  }
  return stepPath(clampStep(onboarding?.currentStep || 2));
}

/**
 * Explicit exit from onboarding (after complete API or process-pending).
 */
export function getOnboardingExitPath() {
  return ONBOARDING_ROUTES.processPending;
}

/**
 * Whether the user may open a given onboarding step (including going back).
 */
export function canAccessOnboardingStep(step, onboarding) {
  if (!onboarding) return step === 2;
  if (step < 2 || step > 6) return false;

  const highest = getHighestReachedStep(onboarding);
  return step <= highest;
}

/**
 * Apply auth + onboarding API response and return navigation target.
 */
export function resolvePathAfterAuth(data) {
  const onboarding = data?.onboarding;
  if (!onboarding) {
    return ONBOARDING_ROUTES.step2;
  }
  return getOnboardingResumePath(onboarding);
}
