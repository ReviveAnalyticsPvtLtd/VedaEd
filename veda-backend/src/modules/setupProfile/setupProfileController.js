const SetupWizard = require("../setupWizard/setupWizardModel");

const PROFILE_FIELDS =
  "organizationType schoolName schoolCode establishedYear website schoolLogo " +
  "logoFrameShape primaryThemeColor address country institutionType " +
  "curriculumCountry curriculumBoard gradeFrom gradeTo languagePreference " +
  "recommendationType recommendationConfidence recommendationRules " +
  "enabledModules disabledModules";

const EDITABLE_FIELDS = [
  "organizationType",
  "schoolName",
  "establishedYear",
  "website",
  "schoolLogo",
  "logoFrameShape",
  "primaryThemeColor",
  "address",
  "country",
  "institutionType",
  "curriculumCountry",
  "curriculumBoard",
  "gradeFrom",
  "gradeTo",
  "languagePreference",
  "enabledModules",
  "disabledModules",
];

/** GET /api/setup-profile — fetch the logged-in superadmin's own setup data */
exports.getSetupProfile = async (req, res) => {
  try {
    const doc = await SetupWizard.findOne({ userId: req.user.userId }).select(
      PROFILE_FIELDS
    );
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Setup profile not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    console.error("getSetupProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch setup profile",
      error: error.message,
    });
  }
};

/** PUT /api/setup-profile — update only the logged-in superadmin's own data, whitelist-only fields */
exports.updateSetupProfile = async (req, res) => {
  try {
    const filtered = {};
    for (const key of EDITABLE_FIELDS) {
      if (req.body[key] !== undefined) filtered[key] = req.body[key];
    }
    if (Object.keys(filtered).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No editable fields provided",
      });
    }

    const doc = await SetupWizard.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: filtered },
      { new: true, runValidators: true }
    ).select(PROFILE_FIELDS);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Setup profile not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: doc,
      message: "Setup profile updated",
    });
  } catch (error) {
    console.error("updateSetupProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update setup profile",
      error: error.message,
    });
  }
};