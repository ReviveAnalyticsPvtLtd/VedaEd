export const ONBOARDING_TOTAL_STEPS = 6;

export const ONBOARDING_ROUTES = {
  step1: "/onboarding/step-1",
  step2: "/onboarding/step-2",
  step3: "/onboarding/step-3",
  step4: "/onboarding/step-4",
  step5: "/onboarding/step-5",
  step6: "/onboarding/step-6",
  processPending: "/onboarding/process-pending",
  email: "/onboarding/email",
  setupStart: "/setup/start",
  dashboard: "/admin-front",
};

export const stepPath = (step) => `/onboarding/step-${step}`;
