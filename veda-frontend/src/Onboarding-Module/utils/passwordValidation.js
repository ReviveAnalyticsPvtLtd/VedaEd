export const PASSWORD_REQUIREMENTS = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (value) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "One number",
    test: (value) => /\d/.test(value),
  },
  {
    id: "special",
    label: "One special character",
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

export function evaluatePasswordRequirements(password) {
  const value = String(password || "");
  return PASSWORD_REQUIREMENTS.map((rule) => ({
    id: rule.id,
    label: rule.label,
    met: rule.test(value),
  }));
}

export function isPasswordStrong(password) {
  return evaluatePasswordRequirements(password).every((rule) => rule.met);
}

export function validateCreatePasswordForm(password, confirmPassword) {
  const fieldErrors = {};

  if (!password) {
    fieldErrors.password = "Password is required.";
  } else if (!isPasswordStrong(password)) {
    fieldErrors.password = "Password does not meet all security requirements.";
  }

  if (!confirmPassword) {
    fieldErrors.confirmPassword = "Confirm password is required.";
  } else if (password && password !== confirmPassword) {
    fieldErrors.confirmPassword = "Passwords do not match.";
  }

  return fieldErrors;
}
