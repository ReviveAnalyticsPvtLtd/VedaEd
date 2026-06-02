const crypto = require("crypto");

const User = require("../../../models/User");
const Role = require("../../../models/Role");
const PlatformAdmin = require("../../../models/PlatformAdmin");
const OnboardingProgress = require("../models/onboardingProgressModel");
const { verifyGoogleCredential } = require("./googleAuthService");
const { buildAuthResponse } = require("../../../utils/authTokens");
const { validateEmailSignupBody } = require("../validators/emailSignupValidators");
const onboardingProgressService = require("./onboardingProgressService");

const ONBOARDING_TOTAL_STEPS = onboardingProgressService.ONBOARDING_TOTAL_STEPS;
const { formatOnboardingProgress, getProgressForUser, advanceProgress } =
  onboardingProgressService;
const SCHOOL_ADMIN_TYPE = "School Admin";

const PERMISSION_MODULES = [
  "Students",
  "Exams",
  "Gradebook",
  "Fees",
  "HR",
  "Transport",
  "Communication",
  "Admission",
  "Calendar",
  "SIS",
];

const schoolAdminDefaultPermissions = () =>
  PERMISSION_MODULES.map((module) => ({
    module,
    view: true,
    create: true,
    edit: true,
    delete: false,
  }));

const generateNextEmployeeId = async () => {
  const year = new Date().getFullYear();
  const prefix = `ADM-${year}-`;
  const pattern = new RegExp(`^ADM-${year}-(\\d+)$`);

  const admins = await PlatformAdmin.find({
    employeeId: { $regex: `^ADM-${year}-` },
  })
    .select("employeeId")
    .lean();

  let maxNum = 0;
  for (const admin of admins) {
    const match = admin.employeeId?.match(pattern);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
  }

  return `${prefix}${String(maxNum + 1).padStart(3, "0")}`;
};

const ensurePlatformAdminForUser = async (user, googleProfile) => {
  let platformAdmin = await PlatformAdmin.findOne({
    email: user.email,
    isDraft: false,
  });

  if (platformAdmin) {
    if (!platformAdmin.userId) {
      platformAdmin.userId = user._id;
      await platformAdmin.save();
    }
    return platformAdmin;
  }

  const employeeId = await generateNextEmployeeId();
  platformAdmin = await PlatformAdmin.create({
    userId: user._id,
    fullName: googleProfile.name,
    email: user.email,
    employeeId,
    adminType: SCHOOL_ADMIN_TYPE,
    designation: "School Owner",
    permissions: schoolAdminDefaultPermissions(),
    inviteStatus: "accepted",
    acceptedAt: new Date(),
    status: "active",
    isDraft: false,
  });

  return platformAdmin;
};

const markStep1Complete = async (userId) => {
  let progress = await OnboardingProgress.findOne({ userId });

  if (!progress) {
    progress = await OnboardingProgress.create({
      userId,
      currentStep: 2,
      completedSteps: [1],
    });
    return progress;
  }

  const completedSteps = Array.from(new Set([...(progress.completedSteps || []), 1]));
  progress.completedSteps = completedSteps;
  if (progress.currentStep < 2) progress.currentStep = 2;
  await progress.save();
  return progress;
};

async function authenticateWithGoogle(credential) {
  const googleProfile = await verifyGoogleCredential(credential);
  const adminRole = await Role.findOne({ name: "admin" });
  if (!adminRole) {
    const error = new Error("Admin role is not configured");
    error.statusCode = 500;
    throw error;
  }

  let user = await User.findOne({
    $or: [{ googleId: googleProfile.googleId }, { email: googleProfile.email }],
  }).populate("roleId");

  if (
    user &&
    (user.authProvider === "email" || user.authProvider === "local") &&
    !user.googleId
  ) {
    const error = new Error(
      "An account with this email already exists. Sign in with your password or contact support."
    );
    error.statusCode = 409;
    throw error;
  }

  if (!user) {
    user = await User.create({
      name: googleProfile.name,
      email: googleProfile.email,
      googleId: googleProfile.googleId,
      profilePicture: googleProfile.profilePicture,
      authProvider: "google",
      password: crypto.randomBytes(32).toString("hex"),
      roleId: adminRole._id,
      status: "active",
    });
    user.roleId = adminRole;
    await ensurePlatformAdminForUser(user, googleProfile);
    await markStep1Complete(user._id);
  } else {
    let updated = false;
    if (!user.googleId) {
      user.googleId = googleProfile.googleId;
      updated = true;
    }
    if (googleProfile.profilePicture && user.profilePicture !== googleProfile.profilePicture) {
      user.profilePicture = googleProfile.profilePicture;
      updated = true;
    }
    if (googleProfile.name && user.name !== googleProfile.name) {
      user.name = googleProfile.name;
      updated = true;
    }
    if (user.authProvider !== "google") {
      user.authProvider = "google";
      updated = true;
    }
    if (updated) await user.save();

    if (user.roleId?.name === "admin" || user.roleId?.name === "Admin") {
      await ensurePlatformAdminForUser(user, googleProfile);
    }

    await markStep1Complete(user._id);
    user = await User.findById(user._id).populate("roleId");
  }

  const authPayload = await buildAuthResponse(user);
  const progress = await OnboardingProgress.findOne({ userId: user._id }).lean();

  return {
    ...authPayload,
    onboarding: formatOnboardingProgress(progress),
  };
}

async function authenticateWithEmail(body) {
  const validation = validateEmailSignupBody(body);
  if (!validation.valid) {
    const error = new Error(validation.errors[0]);
    error.statusCode = 400;
    error.fieldErrors = validation.fieldErrors;
    error.errors = validation.errors;
    throw error;
  }

  const { fullName, email, password } = validation;

  const existingUser = await User.findOne({ email }).populate("roleId");
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

  const user = await User.create({
    name: fullName,
    email,
    password,
    authProvider: "email",
    roleId: adminRole._id,
    status: "active",
  });
  user.roleId = adminRole;

  await ensurePlatformAdminForUser(user, { name: fullName });
  await markStep1Complete(user._id);

  let progress = await OnboardingProgress.findOne({ userId: user._id });
  if (progress) {
    progress.adminDetails = {
      fullName,
      email,
    };
    progress.passwordCreated = true;
    await progress.save();

    try {
      const { issueNewOtp } = require("./onboardingEmailOtpService");
      await issueNewOtp(progress);
    } catch (otpError) {
      console.error("onboarding email signup OTP error:", otpError);
    }
  }

  const authPayload = await buildAuthResponse(user);
  const progressLean = await OnboardingProgress.findOne({ userId: user._id }).lean();

  return {
    ...authPayload,
    authProvider: "email",
    onboarding: formatOnboardingProgress(progressLean),
  };
}

module.exports = {
  authenticateWithGoogle,
  authenticateWithEmail,
  getProgressForUser,
  advanceProgress,
  markStep1Complete,
  ensurePlatformAdminForUser,
  formatOnboardingProgress,
  ONBOARDING_TOTAL_STEPS,
};
