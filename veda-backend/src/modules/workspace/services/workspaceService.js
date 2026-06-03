const Workspace = require("../models/workspaceModel");
const {
  generateWorkspaceSlug,
  buildWorkspacePreviewUrl,
} = require("../utils/workspaceSlug");
const {
  validateWorkspaceSlug,
  validateSchoolName,
} = require("../validators/workspaceValidators");
const {
  SUBSCRIPTION_STATUS,
  PAYMENT_STATUS,
} = require("../constants/workspaceConstants");

function formatWorkspace(doc) {
  if (!doc) return null;
  const w = doc.toObject ? doc.toObject() : doc;
  return {
    schoolName: w.schoolName,
    workspaceSlug: w.workspaceSlug,
    workspacePreviewUrl: w.workspacePreviewUrl,
    workspaceUrl: w.workspaceUrl || w.workspacePreviewUrl,
    workspaceStatus: w.workspaceStatus || "draft",
    customDomain: w.customDomain || "",
    workspaceAccess: w.workspaceAccess,
    subscriptionStatus: w.subscriptionStatus,
    paymentStatus: w.paymentStatus,
    subscriptionExpiresAt: w.subscriptionExpiresAt,
    schoolId: w.schoolId,
    subscriptionId: w.subscriptionId,
  };
}

function isWorkspaceAccessActive(workspace) {
  if (!workspace) return false;
  if (workspace.subscriptionStatus !== SUBSCRIPTION_STATUS.ACTIVE) return false;
  if (workspace.paymentStatus !== PAYMENT_STATUS.PAID) return false;
  if (!workspace.workspaceAccess) return false;
  if (
    workspace.subscriptionExpiresAt &&
    new Date(workspace.subscriptionExpiresAt) < new Date()
  ) {
    return false;
  }
  return true;
}

async function checkWorkspaceAvailability({ schoolName, workspaceSlug }, userId) {
  const nameResult = validateSchoolName(schoolName);
  if (nameResult.errors.length) {
    const error = new Error(nameResult.errors[0]);
    error.statusCode = 400;
    error.errors = nameResult.errors;
    throw error;
  }

  const slugResult = validateWorkspaceSlug(workspaceSlug, {
    schoolName: nameResult.trimmed,
  });
  if (slugResult.errors.length) {
    const error = new Error(slugResult.errors[0]);
    error.statusCode = 400;
    error.errors = slugResult.errors;
    throw error;
  }

  const existing = await Workspace.findOne({
    workspaceSlug: slugResult.slug,
  }).lean();

  if (existing && String(existing.userId) !== String(userId)) {
    return {
      available: false,
      reason: "This workspace name is already taken. Try a different school name.",
    };
  }

  return { available: true };
}

async function getWorkspaceByUserId(userId) {
  const workspace = await Workspace.findOne({ userId }).lean();
  return formatWorkspace(workspace);
}

async function saveSchoolInformation(userId, { schoolName, workspaceSlug }) {
  const nameResult = validateSchoolName(schoolName);
  if (nameResult.errors.length) {
    const error = new Error(nameResult.errors[0]);
    error.statusCode = 400;
    error.errors = nameResult.errors;
    throw error;
  }

  const expectedSlug = generateWorkspaceSlug(nameResult.trimmed);
  const slugToUse = workspaceSlug
    ? String(workspaceSlug).trim().toLowerCase()
    : expectedSlug;

  const slugResult = validateWorkspaceSlug(slugToUse, {
    schoolName: nameResult.trimmed,
  });
  if (slugResult.errors.length) {
    const error = new Error(slugResult.errors[0]);
    error.statusCode = 400;
    error.errors = slugResult.errors;
    throw error;
  }

  const availability = await checkWorkspaceAvailability(
    {
      schoolName: nameResult.trimmed,
      workspaceSlug: slugResult.slug,
    },
    userId
  );

  if (!availability.available) {
    const error = new Error(availability.reason);
    error.statusCode = 409;
    throw error;
  }

  const workspacePreviewUrl = buildWorkspacePreviewUrl(slugResult.slug);

  const workspace = await Workspace.findOneAndUpdate(
    { userId },
    {
      userId,
      schoolName: nameResult.trimmed,
      workspaceSlug: slugResult.slug,
      workspacePreviewUrl,
      workspaceUrl: workspacePreviewUrl,
      workspaceStatus: "draft",
      workspaceAccess: false,
      subscriptionStatus: SUBSCRIPTION_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return formatWorkspace(workspace);
}

module.exports = {
  formatWorkspace,
  isWorkspaceAccessActive,
  checkWorkspaceAvailability,
  getWorkspaceByUserId,
  saveSchoolInformation,
  generateWorkspaceSlug,
  buildWorkspacePreviewUrl,
};
