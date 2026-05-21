const { randomUUID } = require("crypto");
const SetupWizard = require("./setupWizardModel");

const VALID_SETUP_TYPES = ["quick", "advanced", "import"];
const VALID_ORGANIZATION_TYPES = [
  "single_school",
  "multi_campus",
  "school_group",
];

const getSetupStatus = (doc) => doc?.setupStatus || doc?.status || "draft";

const formatSetupDoc = (doc) => {
  if (!doc) return null;
  return {
    setupId: doc.setupId,
    currentStep: doc.currentStep,
    completedSteps: doc.completedSteps || [],
    progressPercentage: doc.progressPercentage,
    setupStatus: getSetupStatus(doc),
    selectedSetupType: doc.selectedSetupType,
    organizationType: doc.organizationType,
    schoolName: doc.schoolName,
    schoolCode: doc.schoolCode,
    establishedYear: doc.establishedYear,
    website: doc.website,
    schoolLogo: doc.schoolLogo,
    primaryThemeColor: doc.primaryThemeColor,
    address: doc.address,
    country: doc.country,
    state: doc.state,
    city: doc.city,
    postalCode: doc.postalCode,
    timezone: doc.timezone,
    currency: doc.currency,
    officialEmail: doc.officialEmail,
    phoneNumber: doc.phoneNumber,
    supportEmail: doc.supportEmail,
    emergencyContact: doc.emergencyContact,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const validateStepProgress = (currentStep, progressPercentage, res) => {
  const step = Number(currentStep);
  if (!Number.isFinite(step) || step < 1 || step > 13) {
    res.status(400).json({
      success: false,
      message: "currentStep must be a number between 1 and 13",
    });
    return null;
  }

  const progress = Number(progressPercentage);
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
    res.status(400).json({
      success: false,
      message: "progressPercentage must be a number between 0 and 100",
    });
    return null;
  }

  return { step, progress };
};

const upsertSetupDoc = async (payload) => {
  let doc = await SetupWizard.findOne();
  if (doc) {
    doc = await SetupWizard.findByIdAndUpdate(doc._id, payload, {
      new: true,
      runValidators: true,
    });
  } else {
    doc = await SetupWizard.create({
      setupId: randomUUID(),
      selectedSetupType: "quick",
      ...payload,
    });
  }
  return doc;
};

const hasResumableDraft = (doc) => {
  if (!doc || getSetupStatus(doc) !== "draft") return false;
  const completed = doc.completedSteps?.length > 0;
  const progressed = doc.currentStep > 1 || doc.progressPercentage > 0;
  return completed || progressed;
};

/** GET /api/setup-wizard/progress — fetch existing setup progress */
exports.getSetupProgress = async (req, res) => {
  try {
    const doc = await SetupWizard.findOne().sort({ updatedAt: -1 });
    return res.status(200).json({
      success: true,
      data: formatSetupDoc(doc),
      hasDraft: hasResumableDraft(doc),
      message: doc ? "Setup progress loaded" : "No setup progress found",
    });
  } catch (error) {
    console.error("getSetupProgress error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch setup progress",
      error: error.message,
    });
  }
};

/** GET /api/setup-wizard — fetch saved wizard progress for prefill (step pages) */
exports.getSetupWizard = async (req, res) => {
  try {
    const doc = await SetupWizard.findOne().sort({ updatedAt: -1 });
    return res.status(200).json({
      success: true,
      data: doc,
      hasDraft: hasResumableDraft(doc),
      message: doc ? "Setup progress loaded" : "No setup progress found",
    });
  } catch (error) {
    console.error("getSetupWizard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch setup progress",
      error: error.message,
    });
  }
};

/** POST /api/setup-wizard/initialize — create or reset setup session */
exports.initializeSetup = async (req, res) => {
  try {
    const payload = {
      setupId: randomUUID(),
      currentStep: 1,
      completedSteps: [],
      progressPercentage: 0,
      setupStatus: "draft",
      selectedSetupType: "quick",
    };

    const existing = await SetupWizard.findOne();
    let doc;
    if (existing) {
      doc = await SetupWizard.findByIdAndUpdate(existing._id, payload, {
        new: true,
        runValidators: true,
      });
    } else {
      doc = await SetupWizard.create(payload);
    }

    return res.status(201).json({
      success: true,
      data: formatSetupDoc(doc),
      message: "Setup session initialized successfully",
    });
  } catch (error) {
    console.error("initializeSetup error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to initialize setup",
      error: error.message,
    });
  }
};

/** POST /api/setup-wizard — save step 1 (upsert single document) */
exports.saveSetupWizard = async (req, res) => {
  try {
    const { selectedSetupType, currentStep, progressPercentage, completedSteps } =
      req.body;

    if (!selectedSetupType || !VALID_SETUP_TYPES.includes(selectedSetupType)) {
      return res.status(400).json({
        success: false,
        message: "selectedSetupType must be one of: quick, advanced, import",
      });
    }

    const step = Number(currentStep);
    if (!Number.isFinite(step) || step < 1 || step > 13) {
      return res.status(400).json({
        success: false,
        message: "currentStep must be a number between 1 and 13",
      });
    }

    const progress = Number(progressPercentage);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: "progressPercentage must be a number between 0 and 100",
      });
    }

    const completed = Array.isArray(completedSteps)
      ? completedSteps.filter((n) => Number.isFinite(Number(n)))
      : [];

    const payload = {
      selectedSetupType,
      currentStep: step,
      progressPercentage: progress,
      setupStatus: "draft",
      completedSteps: completed,
    };

    let doc = await SetupWizard.findOne();
    if (doc) {
      doc = await SetupWizard.findByIdAndUpdate(doc._id, payload, {
        new: true,
        runValidators: true,
      });
    } else {
      doc = await SetupWizard.create({
        setupId: randomUUID(),
        ...payload,
      });
    }

    return res.status(200).json({
      success: true,
      data: doc,
      message: "Setup wizard step saved successfully",
    });
  } catch (error) {
    console.error("saveSetupWizard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save setup progress",
      error: error.message,
    });
  }
};

/** POST /api/setup-wizard/step-2 — save organization type (step 2) */
exports.saveStep2OrganizationType = async (req, res) => {
  try {
    const { organizationType, currentStep, progressPercentage, completedSteps } =
      req.body;

    if (
      !organizationType ||
      !VALID_ORGANIZATION_TYPES.includes(organizationType)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "organizationType must be one of: single_school, multi_campus, school_group",
      });
    }

    const step = Number(currentStep);
    if (!Number.isFinite(step) || step < 1 || step > 13) {
      return res.status(400).json({
        success: false,
        message: "currentStep must be a number between 1 and 13",
      });
    }

    const progress = Number(progressPercentage);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: "progressPercentage must be a number between 0 and 100",
      });
    }

    const completed = Array.isArray(completedSteps)
      ? completedSteps.filter((n) => Number.isFinite(Number(n)))
      : [];

    const payload = {
      organizationType,
      currentStep: step,
      progressPercentage: progress,
      setupStatus: "draft",
      completedSteps: completed,
    };

    let doc = await SetupWizard.findOne();
    if (doc) {
      doc = await SetupWizard.findByIdAndUpdate(doc._id, payload, {
        new: true,
        runValidators: true,
      });
    } else {
      doc = await SetupWizard.create({
        setupId: randomUUID(),
        selectedSetupType: "quick",
        ...payload,
      });
    }

    return res.status(200).json({
      success: true,
      data: doc,
      message: "Organization type saved successfully",
    });
  } catch (error) {
    console.error("saveStep2OrganizationType error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save organization type",
      error: error.message,
    });
  }
};

/** POST /api/setup-wizard/step-3/logo — upload school logo */
exports.uploadSchoolLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Use PNG, JPG, or SVG.",
      });
    }

    const schoolLogo = `/uploads/${req.file.filename}`;
    const doc = await upsertSetupDoc({ schoolLogo, setupStatus: "draft" });

    return res.status(200).json({
      success: true,
      data: { schoolLogo, setupId: doc.setupId },
      message: "School logo uploaded successfully",
    });
  } catch (error) {
    console.error("uploadSchoolLogo error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload school logo",
      error: error.message,
    });
  }
};

/** POST /api/setup-wizard/step-3 — save school profile (step 3) */
exports.saveStep3SchoolProfile = async (req, res) => {
  try {
    const {
      schoolName,
      schoolCode,
      establishedYear,
      website,
      schoolLogo,
      primaryThemeColor,
      address,
      country,
      state,
      city,
      postalCode,
      timezone,
      currency,
      officialEmail,
      phoneNumber,
      supportEmail,
      emergencyContact,
      currentStep,
      progressPercentage,
      completedSteps,
    } = req.body;

    const progressMeta = validateStepProgress(currentStep, progressPercentage, res);
    if (!progressMeta) return;

    const isDraft = req.body.draft === true || req.body.draft === "true";
    const trimmedName = String(schoolName || "").trim();
    const trimmedCode = String(schoolCode || "").trim();
    const trimmedCountry = String(country || "").trim();
    const trimmedTimezone = String(timezone || "").trim();
    const trimmedCurrency = String(currency || "").trim();
    const trimmedAddress = String(address || "").trim();
    const themeColor = String(primaryThemeColor || "#2563EB").trim();

    if (!isDraft) {
      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: "School name is required",
        });
      }

      if (!trimmedCode) {
        return res.status(400).json({
          success: false,
          message: "School code is required",
        });
      }

      if (!trimmedAddress) {
        return res.status(400).json({
          success: false,
          message: "Address is required",
        });
      }

      if (!trimmedCountry) {
        return res.status(400).json({
          success: false,
          message: "Country is required",
        });
      }

      if (!trimmedTimezone) {
        return res.status(400).json({
          success: false,
          message: "Time zone is required",
        });
      }

      if (!trimmedCurrency) {
        return res.status(400).json({
          success: false,
          message: "Currency is required",
        });
      }
    }

    if (themeColor && !HEX_COLOR_REGEX.test(themeColor)) {
      return res.status(400).json({
        success: false,
        message: "primaryThemeColor must be a valid hex color",
      });
    }

    const yearStr = String(establishedYear || "").trim();
    if (yearStr) {
      const yearNum = Number(yearStr);
      if (
        !Number.isInteger(yearNum) ||
        yearNum < 1800 ||
        yearNum > new Date().getFullYear() + 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Established year must be a valid year",
        });
      }
    }

    const completed = Array.isArray(completedSteps)
      ? completedSteps.filter((n) => Number.isFinite(Number(n)))
      : [];

    const payload = {
      schoolName: trimmedName,
      schoolCode: trimmedCode,
      establishedYear: yearStr,
      website: String(website || "").trim(),
      schoolLogo: String(schoolLogo || "").trim(),
      primaryThemeColor: themeColor,
      address: trimmedAddress,
      country: trimmedCountry,
      state: String(state || "").trim(),
      city: String(city || "").trim(),
      postalCode: String(postalCode || "").trim(),
      timezone: trimmedTimezone,
      currency: trimmedCurrency,
      officialEmail: String(officialEmail || "").trim(),
      phoneNumber: String(phoneNumber || "").trim(),
      supportEmail: String(supportEmail || "").trim(),
      emergencyContact: String(emergencyContact || "").trim(),
      currentStep: progressMeta.step,
      progressPercentage: progressMeta.progress,
      setupStatus: "draft",
      completedSteps: completed,
    };

    const doc = await upsertSetupDoc(payload);

    return res.status(200).json({
      success: true,
      data: doc,
      message: "School profile saved successfully",
    });
  } catch (error) {
    console.error("saveStep3SchoolProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save school profile",
      error: error.message,
    });
  }
};
