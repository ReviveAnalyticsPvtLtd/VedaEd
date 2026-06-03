const User = require("../../../models/User");
const PlatformAdmin = require("../../../models/PlatformAdmin");
const OnboardingProgress = require("../models/onboardingProgressModel");
const Workspace = require("../../workspace/models/workspaceModel");
const onboardingAuthService = require("./onboardingAuthService");
const {
  validateAdminDetailsBody,
  formatFullPhone,
  ADMIN_DETAILS_FIELD_ERRORS,
} = require("../validators/adminDetailsValidators");

const ONBOARDING_STEP = 3;

function formatAdminDetails(doc) {
  if (!doc) return null;
  const details = doc.adminDetails;
  if (!details?.fullName && !details?.email && !details?.mobileNumber) {
    return null;
  }
  return {
    fullName: details.fullName || "",
    email: details.email || "",
    countryCode: details.countryCode || "+91",
    mobileNumber: details.mobileNumber || "",
  };
}

async function assertSchoolInformationComplete(userId) {
  const workspace = await Workspace.findOne({ userId }).lean();
  if (!workspace?.schoolName) {
    const error = new Error("Complete school information before continuing");
    error.statusCode = 400;
    throw error;
  }
}

async function checkEmailUniqueness(email, userId) {
  const existingUser = await User.findOne({
    email,
    _id: { $ne: userId },
  }).lean();

  if (existingUser) {
    const error = new Error("This email is already registered");
    error.statusCode = 409;
    error.fieldErrors = { email: "Enter a valid email address." };
    throw error;
  }

  const existingAdmin = await PlatformAdmin.findOne({
    email,
    userId: { $ne: userId },
    isDraft: false,
  }).lean();

  if (existingAdmin) {
    const error = new Error("An admin account with this email already exists");
    error.statusCode = 409;
    error.fieldErrors = { email: "Enter a valid email address." };
    throw error;
  }
}

async function checkMobileUniqueness(fullPhone, countryCode, mobileNumber, userId) {
  if (!fullPhone) return;

  const existingAdmin = await PlatformAdmin.findOne({
    userId: { $ne: userId },
    isDraft: false,
    phone: fullPhone,
  }).lean();

  if (existingAdmin) {
    const message = ADMIN_DETAILS_FIELD_ERRORS.mobileAlreadyRegistered;
    const error = new Error(message);
    error.statusCode = 409;
    error.fieldErrors = { mobileNumber: message };
    throw error;
  }

  const progressWithPhone = await OnboardingProgress.findOne({
    userId: { $ne: userId },
    "adminDetails.mobileNumber": mobileNumber,
    "adminDetails.countryCode": countryCode,
  }).lean();

  if (progressWithPhone) {
    const message = ADMIN_DETAILS_FIELD_ERRORS.mobileAlreadyRegistered;
    const error = new Error(message);
    error.statusCode = 409;
    error.fieldErrors = { mobileNumber: message };
    throw error;
  }
}

async function getAdminDetails(userId) {
  const [progress, user] = await Promise.all([
    OnboardingProgress.findOne({ userId }).lean(),
    User.findById(userId).select("name email authProvider").lean(),
  ]);

  const saved = formatAdminDetails(progress);
  const profile = {
    fullName: user?.name || "",
    email: user?.email || "",
  };

  return {
    adminDetails: saved,
    profile,
    authProvider: user?.authProvider || "email",
    onboarding: await onboardingAuthService.getProgressForUser(userId),
  };
}

async function saveAdminDetailsAndAdvance(userId, body) {
  await assertSchoolInformationComplete(userId);

  const validation = validateAdminDetailsBody(body);
  if (!validation.valid) {
    const error = new Error(validation.errors[0]);
    error.statusCode = 400;
    error.fieldErrors = validation.fieldErrors;
    error.errors = validation.errors;
    throw error;
  }

  const { fullName, email, countryCode, mobileNumber } = validation;
  const fullPhone = formatFullPhone(countryCode, mobileNumber);

  await checkEmailUniqueness(email, userId);
  await checkMobileUniqueness(fullPhone, countryCode, mobileNumber, userId);

  let progress = await OnboardingProgress.findOne({ userId });
  if (!progress) {
    const error = new Error("Onboarding progress not found");
    error.statusCode = 404;
    throw error;
  }

  progress.adminDetails = {
    fullName,
    email,
    countryCode,
    mobileNumber,
  };
  await progress.save();

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  user.name = fullName;
  user.email = email;
  await user.save();

  const platformAdmin = await PlatformAdmin.findOne({
    userId,
    isDraft: false,
  });

  if (platformAdmin) {
    platformAdmin.fullName = fullName;
    platformAdmin.email = email;
    platformAdmin.phone = fullPhone;
    await platformAdmin.save();
  }

  const onboarding = await onboardingAuthService.advanceProgress(
    userId,
    ONBOARDING_STEP
  );

  return {
    currentStep: onboarding.currentStep,
    onboarding,
    adminDetails: {
      fullName,
      email,
      countryCode,
      mobileNumber,
    },
  };
}

module.exports = {
  getAdminDetails,
  saveAdminDetailsAndAdvance,
};
