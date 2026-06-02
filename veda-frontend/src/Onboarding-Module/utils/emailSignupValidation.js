import { validateCreatePasswordForm } from "./passwordValidation";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FULL_NAME_MIN_LENGTH = 3;

export function sanitizeSignupEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function sanitizeSignupFullName(value) {
  return String(value || "").trim();
}

export function validateEmailSignupForm({
  fullName,
  email,
  password,
  confirmPassword,
}) {
  const fieldErrors = validateCreatePasswordForm(password, confirmPassword);
  const name = sanitizeSignupFullName(fullName);
  const normalizedEmail = sanitizeSignupEmail(email);

  if (!name) {
    fieldErrors.fullName = "Full name is required.";
  } else if (name.length < FULL_NAME_MIN_LENGTH) {
    fieldErrors.fullName = "Full name must be at least 3 characters.";
  }

  if (!normalizedEmail) {
    fieldErrors.email = "Work email is required.";
  } else if (!EMAIL_REGEX.test(normalizedEmail)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  return fieldErrors;
}
