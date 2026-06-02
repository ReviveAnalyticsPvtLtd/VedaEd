const bcrypt = require("bcrypt");

const User = require("../../../models/User");
const OnboardingProgress = require("../models/onboardingProgressModel");
const onboardingAuthService = require("./onboardingAuthService");
const { validateCreatePasswordBody } = require("../validators/passwordValidators");

const ONBOARDING_STEP = 4;
const BCRYPT_ROUNDS = 12;

async function assertAdminDetailsComplete(userId) {
  const progress = await OnboardingProgress.findOne({ userId }).lean();
  const details = progress?.adminDetails;

  if (!details?.fullName || !details?.email || !details?.mobileNumber) {
    const error = new Error("Complete admin details before continuing");
    error.statusCode = 400;
    throw error;
  }

  return progress;
}

async function getCreatePasswordState(userId) {
  const [progress, user] = await Promise.all([
    OnboardingProgress.findOne({ userId }).lean(),
    User.findById(userId).select("authProvider").lean(),
  ]);

  return {
    passwordCreated: Boolean(progress?.passwordCreated),
    authProvider: user?.authProvider || "email",
    onboarding: await onboardingAuthService.getProgressForUser(userId),
  };
}

async function createPasswordAndAdvance(userId, body) {
  await assertAdminDetailsComplete(userId);

  const validation = validateCreatePasswordBody(body);
  if (!validation.valid) {
    const error = new Error(validation.errors[0]);
    error.statusCode = 400;
    error.fieldErrors = validation.fieldErrors;
    error.errors = validation.errors;
    throw error;
  }

  const progress = await OnboardingProgress.findOne({ userId });
  if (!progress) {
    const error = new Error("Onboarding progress not found");
    error.statusCode = 404;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const emailSignupHasPassword =
    (user.authProvider === "email" || user.authProvider === "local") &&
    Boolean(user.password);

  if (progress.passwordCreated || emailSignupHasPassword) {
    if (!progress.passwordCreated) {
      progress.passwordCreated = true;
      await progress.save();
    }
    const onboarding = await onboardingAuthService.advanceProgress(
      userId,
      ONBOARDING_STEP
    );
    return {
      currentStep: onboarding.currentStep,
      onboarding,
      passwordCreated: true,
      skipped: true,
    };
  }

  const passwordHash = await bcrypt.hash(validation.password, BCRYPT_ROUNDS);

  user.password = passwordHash;
  await user.save();

  progress.passwordHash = passwordHash;
  progress.passwordCreated = true;
  await progress.save();

  const onboarding = await onboardingAuthService.advanceProgress(
    userId,
    ONBOARDING_STEP
  );

  return {
    currentStep: onboarding.currentStep,
    onboarding,
    passwordCreated: true,
  };
}

module.exports = {
  getCreatePasswordState,
  createPasswordAndAdvance,
};
