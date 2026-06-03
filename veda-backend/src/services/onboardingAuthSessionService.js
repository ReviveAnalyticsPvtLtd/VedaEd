const User = require("../models/User");
const Role = require("../models/Role");
const OnboardingProgress = require("../modules/onboarding/models/onboardingProgressModel");
const Workspace = require("../modules/workspace/models/workspaceModel");
const onboardingAuthService = require("../modules/onboarding/services/onboardingAuthService");
const onboardingProgressService = require("../modules/onboarding/services/onboardingProgressService");
const { issueNewOtp } = require("../modules/onboarding/services/onboardingEmailOtpService");
const { buildAuthResponse } = require("../utils/authTokens");
const { normalizeEmail } = require("../modules/onboarding/validators/emailSignupValidators");
const { validateCreatePasswordBody } = require("../modules/onboarding/validators/passwordValidators");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function deriveNameFromEmail(email) {
  const local = email.split("@")[0] || "School Admin";
  const cleaned = local.replace(/[._+-]+/g, " ").trim();
  if (cleaned.length >= 3) {
    return cleaned
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }
  return "School Admin";
}

function validateEmailField(email) {
  if (!email) return "Email address is required.";
  if (!EMAIL_REGEX.test(email)) return "Enter a valid email address.";
  return null;
}

async function buildOnboardingSessionPayload(userId) {
  const [progress, workspace] = await Promise.all([
    OnboardingProgress.findOne({ userId }).lean(),
    Workspace.findOne({ userId }).lean(),
  ]);

  const onboarding = onboardingProgressService.formatOnboardingProgress(progress);

  const schoolData = workspace
    ? {
        schoolName: workspace.schoolName || "",
        workspaceSlug: workspace.workspaceSlug || "",
        workspacePreviewUrl: workspace.workspacePreviewUrl || "",
      }
    : null;

  const adminData = progress?.adminDetails
    ? {
        fullName: progress.adminDetails.fullName || "",
        email: progress.adminDetails.email || "",
        countryCode: progress.adminDetails.countryCode || "",
        mobileNumber: progress.adminDetails.mobileNumber || "",
      }
    : null;

  return {
    onboarding,
    schoolData,
    adminData,
    currentStep: onboarding?.currentStep,
    onboardingProgress: progress
      ? {
          currentStep: progress.currentStep,
          completedSteps: progress.completedSteps || [],
          isCompleted: Boolean(progress.isCompleted || progress.onboardingCompleted),
          passwordCreated: Boolean(progress.passwordCreated),
          emailVerified: Boolean(progress.emailVerified),
        }
      : null,
  };
}

async function checkUserExists(emailInput) {
  const email = normalizeEmail(emailInput);
  const emailError = validateEmailField(email);
  if (emailError) {
    const error = new Error(emailError);
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email }).select("authProvider").lean();
  return {
    exists: Boolean(user),
    authProvider: user?.authProvider || null,
  };
}

async function registerWithEmail(body) {
  const email = normalizeEmail(body?.email);
  const emailError = validateEmailField(email);
  const passwordValidation = validateCreatePasswordBody({
    password: body?.password,
    confirmPassword: body?.confirmPassword ?? body?.password,
  });

  const fieldErrors = { ...passwordValidation.fieldErrors };
  const errors = [...passwordValidation.errors];
  if (emailError) {
    fieldErrors.email = emailError;
    errors.push(emailError);
  }

  if (errors.length) {
    const error = new Error([...new Set(errors)][0]);
    error.statusCode = 400;
    error.fieldErrors = fieldErrors;
    error.errors = [...new Set(errors)];
    throw error;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("Account already exists. Please sign in.");
    error.statusCode = 409;
    error.code = "ACCOUNT_EXISTS";
    throw error;
  }

  const adminRole = await Role.findOne({ name: "admin" });
  if (!adminRole) {
    const error = new Error("Admin role is not configured");
    error.statusCode = 500;
    throw error;
  }

  const fullName = deriveNameFromEmail(email);
  const user = await User.create({
    name: fullName,
    email,
    password: passwordValidation.password,
    authProvider: "email",
    roleId: adminRole._id,
    status: "active",
  });
  user.roleId = adminRole;

  await onboardingAuthService.ensurePlatformAdminForUser(user, { name: fullName });
  await onboardingAuthService.markStep1Complete(user._id);

  const progress = await OnboardingProgress.findOne({ userId: user._id });
  if (progress) {
    progress.adminDetails = { fullName, email };
    progress.passwordCreated = true;
    await progress.save();
    try {
      await issueNewOtp(progress);
    } catch (otpError) {
      console.error("register email OTP error:", otpError);
    }
  }

  const authPayload = await buildAuthResponse(user);
  const session = await buildOnboardingSessionPayload(user._id);

  return {
    ...authPayload,
    authProvider: "email",
    ...session,
  };
}

async function loginWithOnboardingSession(user) {
  const authPayload = await buildAuthResponse(user);
  const session = await buildOnboardingSessionPayload(user._id);
  return {
    ...authPayload,
    ...session,
  };
}

module.exports = {
  checkUserExists,
  registerWithEmail,
  loginWithOnboardingSession,
  buildOnboardingSessionPayload,
};
