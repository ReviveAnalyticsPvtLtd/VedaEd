const OTP_PATTERN = /^\d{6}$/;

function validateVerifyEmailOtpBody(body) {
  const errors = [];
  const otp = String(body?.otp || "").trim();

  if (!OTP_PATTERN.test(otp)) {
    errors.push("Enter the 6-digit verification code.");
  }

  return { errors, otp };
}

module.exports = { validateVerifyEmailOtpBody };
