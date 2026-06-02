import { sanitizeSignupEmail } from "./emailSignupValidation";
import { isPasswordStrong } from "./passwordValidation";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateStep1EmailAuthForm({ email, password, mode }) {
  const fieldErrors = {};
  const normalizedEmail = sanitizeSignupEmail(email);

  if (!normalizedEmail) {
    fieldErrors.email = "Email address is required.";
  } else if (!EMAIL_REGEX.test(normalizedEmail)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (!password) {
    fieldErrors.password = "Password is required.";
  } else if (mode === "register" && !isPasswordStrong(password)) {
    fieldErrors.password = "Password does not meet all security requirements.";
  }

  return fieldErrors;
}
