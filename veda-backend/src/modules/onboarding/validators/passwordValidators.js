const PASSWORD_MIN_LENGTH = 8;

const PASSWORD_RULES = [
  {
    id: "length",
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
    message: "At least 8 characters",
  },
  {
    id: "uppercase",
    test: (value) => /[A-Z]/.test(value),
    message: "At least 1 uppercase letter",
  },
  {
    id: "lowercase",
    test: (value) => /[a-z]/.test(value),
    message: "At least 1 lowercase letter",
  },
  {
    id: "number",
    test: (value) => /\d/.test(value),
    message: "At least 1 number",
  },
  {
    id: "special",
    test: (value) => /[^A-Za-z0-9]/.test(value),
    message: "At least 1 special character",
  },
];

function evaluatePasswordStrength(password) {
  const value = String(password || "");
  const failedRules = PASSWORD_RULES.filter((rule) => !rule.test(value));
  return {
    valid: failedRules.length === 0,
    failedRules: failedRules.map((rule) => rule.message),
  };
}

function validateCreatePasswordBody(body) {
  const password = String(body?.password || "");
  const confirmPassword = String(body?.confirmPassword || "");
  const fieldErrors = {};
  const errors = [];

  if (!password) {
    fieldErrors.password = "Password is required.";
    errors.push("Password is required.");
  }

  if (!confirmPassword) {
    fieldErrors.confirmPassword = "Confirm password is required.";
    errors.push("Confirm password is required.");
  }

  if (password) {
    const strength = evaluatePasswordStrength(password);
    if (!strength.valid) {
      fieldErrors.password = "Password does not meet security requirements.";
      errors.push("Password does not meet security requirements.");
    }
  }

  if (password && confirmPassword && password !== confirmPassword) {
    fieldErrors.confirmPassword = "Passwords do not match.";
    errors.push("Passwords do not match.");
  }

  return {
    valid: errors.length === 0,
    password,
    confirmPassword,
    errors,
    fieldErrors,
  };
}

module.exports = {
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULES,
  evaluatePasswordStrength,
  validateCreatePasswordBody,
};
