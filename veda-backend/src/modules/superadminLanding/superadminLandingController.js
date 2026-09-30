const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const SuperadminLanding = require("./superadminLandingModel");

const uploadsDirectory = path.join(__dirname, "../../../public/uploads");

const sendSuccess = (res, data = {}, message = "Operation successful") =>
  res.status(200).json({
    success: true,
    message,
    data,
  });

const sendError = (res, status, message, error) =>
  res.status(status).json({
    success: false,
    message,
    data: error ? { error: error.message || String(error) } : {},
  });

const getSchoolId = (req) => {
  const schoolId = req.user?.schoolId;
  if (!schoolId || !mongoose.isValidObjectId(String(schoolId))) {
    return null;
  }
  return String(schoolId);
};

const NO_SCHOOL_CONTEXT_RESPONSE = {
  success: false,
  code: "NO_SCHOOL_CONTEXT",
  message: "Your account is not linked to a school.",
};

const PROFILE_ALLOWED_FIELDS = [
  "schoolName",
  "shortName",
  "schoolType",
  "board",
  "affiliationNumber",
  "udise",
  "establishmentYear",
  "schoolLevel",
  "medium",
  "genderType",
  "status",
  "sessionStart",
  "sessionEnd",
  "gradingSystem",
  "startTime",
  "endTime",
  "street",
  "area",
  "country",
  "state",
  "district",
  "city",
  "pin",
  "principalName",
  "principalEmail",
  "principalPhone",
  "schoolPhone",
  "altPhone",
  "email",
  "website",
  "management",
  "recognition",
  "authority",
  "motto",
  "subdomain",
  "timezone",
  "language",
  "logo",
];

const sanitizeProfilePayload = (body = {}) => {
  const clean = {};
  for (const key of PROFILE_ALLOWED_FIELDS) {
    if (body[key] !== undefined) {
      clean[key] = body[key];
    }
  }
  return clean;
};

exports.getProfile = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(403).json(NO_SCHOOL_CONTEXT_RESPONSE);
    }

    const document = await SuperadminLanding.findOne({ schoolId }).lean();
    return sendSuccess(res, document?.profile || {});
  } catch (error) {
    return sendError(res, 500, "Failed to fetch profile", error);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(403).json(NO_SCHOOL_CONTEXT_RESPONSE);
    }

    const cleanProfile = sanitizeProfilePayload(req.body);

    const updated = await SuperadminLanding.findOneAndUpdate(
      { schoolId },
      {
        $set: {
          profile: cleanProfile,
        },
        $setOnInsert: {
          schoolId,
          singletonKey: "default",
          theme: {},
          other: {},
        },
      },
      {
        new: true,
        runValidators: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return sendSuccess(res, updated?.profile || {});
  } catch (error) {
    return sendError(res, 500, "Failed to update profile", error);
  }
};

exports.uploadLogo = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(403).json(NO_SCHOOL_CONTEXT_RESPONSE);
    }

    if (!req.file) {
      return sendError(res, 400, "Logo file is required");
    }

    const document = await SuperadminLanding.findOne({ schoolId });
    if (!document) {
      return sendError(
        res,
        400,
        "Profile not found. Save profile before uploading logo."
      );
    }
    const oldLogoPath = document.profile?.logo;
    const newLogoPath = `/uploads/${req.file.filename}`;

    await SuperadminLanding.updateOne(
      { _id: document._id, schoolId },
      { $set: { "profile.logo": newLogoPath } }
    );

    if (oldLogoPath && oldLogoPath !== newLogoPath) {
      const oldFilename = oldLogoPath.replace(/^\/uploads\//, "");
      const oldAbsolutePath = path.join(uploadsDirectory, oldFilename);
      if (fs.existsSync(oldAbsolutePath)) {
        fs.unlinkSync(oldAbsolutePath);
      }
    }

    return sendSuccess(res, { logo: newLogoPath });
  } catch (error) {
    return sendError(res, 500, "Failed to upload logo", error);
  }
};

exports.getTheme = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(403).json(NO_SCHOOL_CONTEXT_RESPONSE);
    }

    const document = await SuperadminLanding.findOne({ schoolId }).lean();
    return sendSuccess(res, document?.theme || {});
  } catch (error) {
    return sendError(res, 500, "Failed to fetch theme", error);
  }
};

exports.updateTheme = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(403).json(NO_SCHOOL_CONTEXT_RESPONSE);
    }

    const document = await SuperadminLanding.findOne({ schoolId });
    if (!document) {
      return sendError(
        res,
        400,
        "Profile not found. Save profile before updating theme."
      );
    }

    const safeTheme =
      typeof req.body === "object" && req.body !== null ? { ...req.body } : {};
    delete safeTheme.schoolId;
    delete safeTheme._id;
    delete safeTheme.singletonKey;

    await SuperadminLanding.updateOne(
      { _id: document._id, schoolId },
      { $set: { theme: safeTheme } }
    );

    return sendSuccess(res, safeTheme);
  } catch (error) {
    return sendError(res, 500, "Failed to update theme", error);
  }
};

exports.getOther = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(403).json(NO_SCHOOL_CONTEXT_RESPONSE);
    }

    const document = await SuperadminLanding.findOne({ schoolId }).lean();
    return sendSuccess(res, document?.other || {});
  } catch (error) {
    return sendError(res, 500, "Failed to fetch other settings", error);
  }
};

exports.updateOther = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(403).json(NO_SCHOOL_CONTEXT_RESPONSE);
    }

    const document = await SuperadminLanding.findOne({ schoolId });
    if (!document) {
      return sendError(
        res,
        400,
        "Profile not found. Save profile before updating other settings."
      );
    }

    const safeOther =
      typeof req.body === "object" && req.body !== null ? { ...req.body } : {};
    delete safeOther.schoolId;
    delete safeOther._id;
    delete safeOther.singletonKey;

    await SuperadminLanding.updateOne(
      { _id: document._id, schoolId },
      { $set: { other: safeOther } }
    );

    return sendSuccess(res, safeOther);
  } catch (error) {
    return sendError(res, 500, "Failed to update other settings", error);
  }
};
