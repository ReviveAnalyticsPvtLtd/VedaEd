import {
  DEFAULT_COUNTRY_CODE,
  FIELD_ERRORS,
  ONBOARDING_COUNTRY_CODES,
} from "../constants/adminDetails";

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const FULL_NAME_REGEX = /^[A-Za-z]+(?:[ A-Za-z]+)*$/;

export function sanitizeFullName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

export function sanitizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function sanitizeMobileDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function getCountryCodeOption(countryCode) {
  const normalized = String(countryCode || DEFAULT_COUNTRY_CODE).trim();
  return (
    ONBOARDING_COUNTRY_CODES.find((c) => c.value === normalized) ||
    ONBOARDING_COUNTRY_CODES[0]
  );
}

export function validateFullName(fullName) {
  const trimmed = sanitizeFullName(fullName);
  if (!trimmed || trimmed.length < 3 || trimmed.length > 100) {
    return FIELD_ERRORS.fullName;
  }
  if (!FULL_NAME_REGEX.test(trimmed)) {
    return FIELD_ERRORS.fullName;
  }
  return "";
}

export function validateEmail(email) {
  const normalized = sanitizeEmail(email);
  if (!normalized || normalized.length > 254 || !EMAIL_REGEX.test(normalized)) {
    return FIELD_ERRORS.email;
  }
  return "";
}

export function validateMobileNumber(countryCode, mobileNumber) {
  const option = getCountryCodeOption(countryCode);
  const digits = sanitizeMobileDigits(mobileNumber);

  if (!digits) {
    return option.dial === "91"
      ? FIELD_ERRORS.mobileNumber
      : "Enter a valid mobile number.";
  }

  if (digits.length < option.min || digits.length > option.max) {
    return option.dial === "91"
      ? FIELD_ERRORS.mobileNumber
      : `Enter a valid mobile number (${option.min}-${option.max} digits).`;
  }

  return "";
}

export function validateAdminDetailsForm({ fullName, email, countryCode, mobileNumber }) {
  const fieldErrors = {};

  const fullNameError = validateFullName(fullName);
  if (fullNameError) fieldErrors.fullName = fullNameError;

  const emailError = validateEmail(email);
  if (emailError) fieldErrors.email = emailError;

  const mobileError = validateMobileNumber(countryCode, mobileNumber);
  if (mobileError) fieldErrors.mobileNumber = mobileError;

  return fieldErrors;
}
