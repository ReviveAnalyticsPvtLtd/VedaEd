const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const FULL_NAME_REGEX = /^[A-Za-z]+(?:[ A-Za-z]+)*$/;

/** National digit length by dial code (without +) */
const PHONE_RULES_BY_DIAL = {
  91: { min: 10, max: 10 },
  1: { min: 10, max: 10 },
  44: { min: 10, max: 11 },
  61: { min: 9, max: 9 },
  971: { min: 9, max: 9 },
  65: { min: 8, max: 8 },
  49: { min: 10, max: 11 },
  33: { min: 9, max: 9 },
  81: { min: 10, max: 11 },
  86: { min: 11, max: 11 },
  92: { min: 10, max: 10 },
  880: { min: 10, max: 10 },
  977: { min: 10, max: 10 },
  94: { min: 9, max: 9 },
};

const DEFAULT_PHONE_RULE = { min: 6, max: 15 };

const ADMIN_DETAILS_FIELD_ERRORS = {
  mobileInvalidIndia: "Enter a valid 10-digit mobile number.",
  mobileAlreadyRegistered: "This mobile number is already registered.",
};

function normalizeDialCode(countryCode) {
  const raw = String(countryCode || "").trim();
  if (!raw) return "";
  return raw.replace(/\D/g, "");
}

function sanitizeFullName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function sanitizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function sanitizeMobileNumber(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeCountryCode(value) {
  const dial = normalizeDialCode(value);
  return dial ? `+${dial}` : "";
}

function getPhoneRule(dialDigits) {
  return PHONE_RULES_BY_DIAL[dialDigits] || DEFAULT_PHONE_RULE;
}

function validateFullName(fullName) {
  const errors = [];
  const trimmed = sanitizeFullName(fullName);

  if (!trimmed) {
    errors.push("Enter a valid name.");
    return { errors, fullName: "" };
  }

  if (trimmed.length < 3 || trimmed.length > 100) {
    errors.push("Enter a valid name.");
    return { errors, fullName: trimmed };
  }

  if (!FULL_NAME_REGEX.test(trimmed)) {
    errors.push("Enter a valid name.");
    return { errors, fullName: trimmed };
  }

  return { errors, fullName: trimmed };
}

function validateEmail(email) {
  const errors = [];
  const normalized = sanitizeEmail(email);

  if (!normalized) {
    errors.push("Enter a valid email address.");
    return { errors, email: "" };
  }

  if (normalized.length > 254 || !EMAIL_REGEX.test(normalized)) {
    errors.push("Enter a valid email address.");
    return { errors, email: normalized };
  }

  return { errors, email: normalized };
}

function validateMobile(countryCode, mobileNumber) {
  const errors = [];
  const dialDigits = normalizeDialCode(countryCode);
  const national = sanitizeMobileNumber(mobileNumber);
  const normalizedCountryCode = normalizeCountryCode(countryCode);

  if (!dialDigits) {
    errors.push("Enter a valid 10-digit mobile number.");
    return { errors, countryCode: "", mobileNumber: national };
  }

  if (!national) {
    errors.push(
      dialDigits === "91"
        ? "Enter a valid 10-digit mobile number."
        : "Enter a valid mobile number."
    );
    return {
      errors,
      countryCode: normalizedCountryCode,
      mobileNumber: national,
    };
  }

  const rule = getPhoneRule(dialDigits);
  if (national.length < rule.min || national.length > rule.max) {
    errors.push(
      dialDigits === "91"
        ? "Enter a valid 10-digit mobile number."
        : `Enter a valid mobile number (${rule.min}-${rule.max} digits).`
    );
    return {
      errors,
      countryCode: normalizedCountryCode,
      mobileNumber: national,
    };
  }

  return {
    errors,
    countryCode: normalizedCountryCode,
    mobileNumber: national,
  };
}

function validateAdminDetailsBody(body) {
  const fieldErrors = {};
  const messages = [];

  const nameResult = validateFullName(body?.fullName);
  if (nameResult.errors.length) {
    fieldErrors.fullName = nameResult.errors[0];
    messages.push(nameResult.errors[0]);
  }

  const emailResult = validateEmail(body?.email);
  if (emailResult.errors.length) {
    fieldErrors.email = emailResult.errors[0];
    messages.push(emailResult.errors[0]);
  }

  const mobileResult = validateMobile(body?.countryCode, body?.mobileNumber);
  if (mobileResult.errors.length) {
    fieldErrors.mobileNumber = mobileResult.errors[0];
    messages.push(mobileResult.errors[0]);
  }

  return {
    valid: messages.length === 0,
    errors: messages,
    fieldErrors,
    fullName: nameResult.fullName,
    email: emailResult.email,
    countryCode: mobileResult.countryCode,
    mobileNumber: mobileResult.mobileNumber,
  };
}

function formatFullPhone(countryCode, mobileNumber) {
  const dial = normalizeDialCode(countryCode);
  const national = sanitizeMobileNumber(mobileNumber);
  if (!dial || !national) return "";
  return `+${dial}${national}`;
}

module.exports = {
  validateAdminDetailsBody,
  validateFullName,
  validateEmail,
  validateMobile,
  sanitizeFullName,
  sanitizeEmail,
  sanitizeMobileNumber,
  normalizeCountryCode,
  formatFullPhone,
  normalizeDialCode,
  ADMIN_DETAILS_FIELD_ERRORS,
};
