function validateGoogleAuthBody(body) {
  const errors = [];
  if (!body?.credential || typeof body.credential !== "string") {
    errors.push("credential is required");
  }
  return errors;
}

function validateAdvanceStepBody(body) {
  const errors = [];
  const step = Number(body?.step);
  if (!Number.isFinite(step) || step < 1 || step > 6) {
    errors.push("step must be a number between 1 and 6");
  }
  return errors;
}

module.exports = {
  validateGoogleAuthBody,
  validateAdvanceStepBody,
};
