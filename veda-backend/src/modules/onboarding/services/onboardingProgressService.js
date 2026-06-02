const OnboardingProgress = require("../models/onboardingProgressModel");

const ONBOARDING_TOTAL_STEPS = 6;

function formatOnboardingProgress(progress) {
  if (!progress) {
    return {
      currentStep: 2,
      totalSteps: ONBOARDING_TOTAL_STEPS,
      isCompleted: false,
      completedSteps: [1],
      nextPath: "/onboarding/step-2",
    };
  }

  const isCompleted = !!(progress.isCompleted || progress.onboardingCompleted);
  const currentStep = progress.currentStep || 1;

  return {
    currentStep,
    totalSteps: ONBOARDING_TOTAL_STEPS,
    isCompleted,
    onboardingCompleted: isCompleted,
    completedSteps: progress.completedSteps || [],
    nextPath: isCompleted
      ? "/onboarding/step-6"
      : `/onboarding/step-${Math.min(Math.max(currentStep, 2), ONBOARDING_TOTAL_STEPS)}`,
  };
}

async function getProgressForUser(userId) {
  const progress = await OnboardingProgress.findOne({ userId }).lean();
  return formatOnboardingProgress(progress);
}

async function advanceProgress(userId, targetStep) {
  const progress = await OnboardingProgress.findOne({ userId });
  if (!progress) {
    const error = new Error("Onboarding progress not found");
    error.statusCode = 404;
    throw error;
  }

  const step = Number(targetStep);
  if (!Number.isFinite(step) || step < 1 || step > ONBOARDING_TOTAL_STEPS) {
    const error = new Error("Invalid onboarding step");
    error.statusCode = 400;
    throw error;
  }

  const completedSteps = Array.from(
    new Set([...(progress.completedSteps || []), step])
  );
  progress.completedSteps = completedSteps;
  progress.currentStep = Math.min(step + 1, ONBOARDING_TOTAL_STEPS);

  if (step >= ONBOARDING_TOTAL_STEPS) {
    progress.isCompleted = true;
    progress.completedAt = new Date();
    progress.currentStep = ONBOARDING_TOTAL_STEPS;
  }

  await progress.save();
  return formatOnboardingProgress(progress.toObject());
}

module.exports = {
  ONBOARDING_TOTAL_STEPS,
  formatOnboardingProgress,
  getProgressForUser,
  advanceProgress,
};
