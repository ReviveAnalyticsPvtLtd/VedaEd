const User = require("../../../models/User");
const PlatformAdmin = require("../../../models/PlatformAdmin");
const School = require("../../../models/School");
const WorkspaceSubscription = require("../../../models/WorkspaceSubscription");
const Workspace = require("../../workspace/models/workspaceModel");
const OnboardingProgress = require("../models/onboardingProgressModel");
const {
  assertReadyForStep6,
  loadOnboardingContext,
} = require("../utils/onboardingPrerequisites");
const { buildFullAuthSession } = require("../../../utils/authTokens");
const {
  SUBSCRIPTION_STATUS,
  PAYMENT_STATUS,
} = require("../../workspace/constants/workspaceConstants");

const ADMIN_DASHBOARD_PATH =
  process.env.ONBOARDING_DASHBOARD_PATH || "/admin-front";

async function linkSchoolAndSubscription(userId, workspaceDoc) {
  let school = await School.findOne({ workspaceId: workspaceDoc._id });
  if (!school) {
    school = await School.create({
      name: workspaceDoc.schoolName,
      ownerUserId: userId,
      workspaceId: workspaceDoc._id,
      status: "created",
    });
  }

  let subscription = await WorkspaceSubscription.findOne({
    workspaceId: workspaceDoc._id,
  });

  if (!subscription) {
    subscription = await WorkspaceSubscription.create({
      workspaceId: workspaceDoc._id,
      schoolId: school._id,
      userId,
      workspaceAccess: false,
      subscriptionStatus: SUBSCRIPTION_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
    });
  }

  workspaceDoc.schoolId = school._id;
  workspaceDoc.subscriptionId = subscription._id;
  workspaceDoc.workspaceStatus = "created";
  workspaceDoc.workspaceUrl = workspaceDoc.workspacePreviewUrl;
  workspaceDoc.workspaceAccess = false;
  workspaceDoc.subscriptionStatus = SUBSCRIPTION_STATUS.PENDING;
  workspaceDoc.paymentStatus = PAYMENT_STATUS.PENDING;
  await workspaceDoc.save();

  const user = await User.findById(userId);
  if (user) {
    user.schoolId = school._id;
    user.status = "active";
    await user.save();
  }

  const platformAdmin = await PlatformAdmin.findOne({
    userId,
    isDraft: false,
  });
  if (platformAdmin) {
    platformAdmin.school = workspaceDoc.schoolName;
    platformAdmin.status = "active";
    await platformAdmin.save();
  }

  return { school, subscription };
}

async function markOnboardingCompleted(progress) {
  const completedSteps = Array.from(
    new Set([...(progress.completedSteps || []), 5, 6])
  );
  progress.completedSteps = completedSteps;
  progress.currentStep = 6;
  progress.isCompleted = true;
  progress.onboardingCompleted = true;
  progress.completedAt = progress.completedAt || new Date();
  progress.onboardingCompletedAt = progress.onboardingCompletedAt || new Date();
  await progress.save();
  return progress;
}

function formatWorkspaceReadyPayload({ progress, workspace, adminDetails }) {
  return {
    schoolName: workspace.schoolName,
    workspaceSlug: workspace.workspaceSlug,
    workspacePreviewUrl: workspace.workspacePreviewUrl,
    workspaceUrl: workspace.workspaceUrl || workspace.workspacePreviewUrl,
    adminName: adminDetails?.fullName || "",
    adminEmail: adminDetails?.email || "",
    onboardingCompleted: Boolean(progress.isCompleted || progress.onboardingCompleted),
  };
}

async function finalizeOnboardingForUser(userId) {
  const { progress, workspace } = await assertReadyForStep6(userId);

  if (!workspace) {
    const error = new Error("Workspace not found. Complete school information first.");
    error.statusCode = 404;
    throw error;
  }

  const workspaceDoc = await Workspace.findOne({ userId });
  if (!workspaceDoc) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  await linkSchoolAndSubscription(userId, workspaceDoc);
  await markOnboardingCompleted(progress);

  const refreshedWorkspace = await Workspace.findOne({ userId }).lean();
  const refreshedProgress = await OnboardingProgress.findOne({ userId }).lean();

  return formatWorkspaceReadyPayload({
    progress: refreshedProgress,
    workspace: refreshedWorkspace,
    adminDetails: refreshedProgress.adminDetails,
  });
}

async function getWorkspaceReadyInfo(userId) {
  const { progress, workspace } = await loadOnboardingContext(userId);

  if (!workspace) {
    const error = new Error("Workspace not found. Complete school information first.");
    error.statusCode = 404;
    throw error;
  }

  const workspaceDoc = await Workspace.findOne({ userId });
  if (!workspaceDoc) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  // Prepare workspace data for step 6 display only — do not mark onboarding complete here.
  await linkSchoolAndSubscription(userId, workspaceDoc);

  const refreshedProgress = await OnboardingProgress.findOne({ userId }).lean();
  const refreshedWorkspace = await Workspace.findOne({ userId }).lean();

  return formatWorkspaceReadyPayload({
    progress: refreshedProgress,
    workspace: refreshedWorkspace,
    adminDetails: refreshedProgress.adminDetails,
  });
}

async function completeOnboardingAndAuthenticate(userId) {
  const { progress } = await loadOnboardingContext(userId);

  if (!progress.isCompleted && !progress.onboardingCompleted) {
    await finalizeOnboardingForUser(userId);
  }

  const latestProgress = await OnboardingProgress.findOne({ userId }).lean();
  if (!latestProgress?.isCompleted && !latestProgress?.onboardingCompleted) {
    const error = new Error("Onboarding is not complete yet");
    error.statusCode = 400;
    throw error;
  }

  const workspace = await Workspace.findOne({ userId }).lean();
  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  const user = await User.findById(userId).populate("roleId");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const authSession = await buildFullAuthSession(user);

  return {
    ...authSession,
    onboardingCompleted: true,
    workspaceUrl: workspace.workspaceUrl || workspace.workspacePreviewUrl,
    redirect: ADMIN_DASHBOARD_PATH,
  };
}

module.exports = {
  finalizeOnboardingForUser,
  getWorkspaceReadyInfo,
  completeOnboardingAndAuthenticate,
  ADMIN_DASHBOARD_PATH,
};
