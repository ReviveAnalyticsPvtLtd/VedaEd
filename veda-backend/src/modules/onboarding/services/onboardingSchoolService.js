const workspaceService = require("../../workspace/services/workspaceService");
const onboardingAuthService = require("./onboardingAuthService");

const ONBOARDING_STEP = 2;

async function getSchoolInformation(userId) {
  return workspaceService.getWorkspaceByUserId(userId);
}

async function saveSchoolInformationAndAdvance(userId, payload) {
  const workspace = await workspaceService.saveSchoolInformation(userId, payload);
  const onboarding = await onboardingAuthService.advanceProgress(
    userId,
    ONBOARDING_STEP
  );

  return { workspace, onboarding };
}

module.exports = {
  getSchoolInformation,
  saveSchoolInformationAndAdvance,
};
