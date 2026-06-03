const OnboardingProgress = require("../models/onboardingProgressModel");
const Workspace = require("../../workspace/models/workspaceModel");

function getStepCompletionState(progress, workspace) {
  const completedSteps = progress?.completedSteps || [];

  return {
    step1Completed: completedSteps.includes(1),
    step2Completed: Boolean(workspace?.schoolName && workspace?.workspaceSlug),
    step3Completed: Boolean(
      progress?.adminDetails?.fullName &&
        progress?.adminDetails?.email &&
        progress?.adminDetails?.mobileNumber
    ),
    step4Completed: Boolean(progress?.passwordCreated),
    emailVerified: Boolean(progress?.emailVerified),
  };
}

function isReadyForStep6(progress, workspace) {
  const state = getStepCompletionState(progress, workspace);
  return (
    state.step1Completed &&
    state.step2Completed &&
    state.step3Completed &&
    state.step4Completed &&
    state.emailVerified
  );
}

async function loadOnboardingContext(userId) {
  const [progress, workspace] = await Promise.all([
    OnboardingProgress.findOne({ userId }),
    Workspace.findOne({ userId }).lean(),
  ]);

  if (!progress) {
    const error = new Error("Onboarding progress not found");
    error.statusCode = 404;
    throw error;
  }

  return { progress, workspace, steps: getStepCompletionState(progress, workspace) };
}

async function assertReadyForStep6(userId) {
  const { progress, workspace, steps } = await loadOnboardingContext(userId);

  if (!isReadyForStep6(progress, workspace)) {
    const error = new Error(
      "Complete all onboarding steps before accessing the workspace ready page"
    );
    error.statusCode = 403;
    error.code = "ONBOARDING_INCOMPLETE";
    error.steps = steps;
    error.redirectTo = `/onboarding/step-${progress.currentStep || 1}`;
    throw error;
  }

  return { progress, workspace, steps };
}

module.exports = {
  getStepCompletionState,
  isReadyForStep6,
  loadOnboardingContext,
  assertReadyForStep6,
};
