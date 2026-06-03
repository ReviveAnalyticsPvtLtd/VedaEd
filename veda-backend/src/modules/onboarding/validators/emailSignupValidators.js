const { validateCreatePasswordBody } = require("./passwordValidators");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FULL_NAME_MIN_LENGTH = 3;

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function validateEmailSignupBody(body) {
  const fullName = String(body?.fullName || "").trim();
  const email = normalizeEmail(body?.email);
  const passwordValidation = validateCreatePasswordBody(body);
  const fieldErrors = { ...passwordValidation.fieldErrors };
  const errors = [...passwordValidation.errors];

  if (!fullName) {
    fieldErrors.fullName = "Full name is required.";
    errors.push("Full name is required.");
  } else if (fullName.length < FULL_NAME_MIN_LENGTH) {
    fieldErrors.fullName = "Full name must be at least 3 characters.";
    errors.push("Full name must be at least 3 characters.");
  }

  if (!email) {
    fieldErrors.email = "Work email is required.";
    errors.push("Work email is required.");
  } else if (!EMAIL_REGEX.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
    errors.push("Enter a valid email address.");
  }

  const uniqueErrors = [...new Set(errors)];

  return {
    valid: uniqueErrors.length === 0,
    fullName,
    email,
    password: passwordValidation.password,
    confirmPassword: passwordValidation.confirmPassword,
    errors: uniqueErrors,
    fieldErrors,
  };
}

module.exports = {
  validateEmailSignupBody,
  normalizeEmail,
};
