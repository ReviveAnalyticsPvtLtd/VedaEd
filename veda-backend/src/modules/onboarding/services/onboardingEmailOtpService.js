const crypto = require("crypto");
const bcrypt = require("bcrypt");

const OnboardingProgress = require("../models/onboardingProgressModel");
const onboardingProgressService = require("./onboardingProgressService");
const { sendEmailVerificationOtp } = require("../../../services/emailService");
const { validateVerifyEmailOtpBody } = require("../validators/emailOtpValidators");

const ONBOARDING_STEP = 5;
const OTP_VALIDITY_MS = 2 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const BCRYPT_ROUNDS = 10;

function generateSecureOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function getRemainingSeconds(otpExpiresAt) {
  if (!otpExpiresAt) return 0;
  return Math.max(0, Math.ceil((new Date(otpExpiresAt).getTime() - Date.now()) / 1000));
}

function isOtpActive(progress) {
  if (!progress?.emailOtpHash || !progress?.otpExpiresAt) return false;
  return Date.now() < new Date(progress.otpExpiresAt).getTime();
}

async function loadProgressOrThrow(userId) {
  const progress = await OnboardingProgress.findOne({ userId });
  if (!progress) {
    const error = new Error("Onboarding progress not found");
    error.statusCode = 404;
    throw error;
  }
  return progress;
}

async function assertEmailVerificationPrerequisites(userId) {
  const progress = await loadProgressOrThrow(userId);

  if (!progress.passwordCreated) {
    const error = new Error("Create your password before verifying your email");
    error.statusCode = 400;
    throw error;
  }

  const email = progress.adminDetails?.email;
  if (!email) {
    const error = new Error("Complete admin details before verifying your email");
    error.statusCode = 400;
    throw error;
  }

  return progress;
}

function buildOtpState(progress) {
  const active = isOtpActive(progress);
  const expiresIn = active ? getRemainingSeconds(progress.otpExpiresAt) : 0;
  const hasOtpRecord = Boolean(progress.emailOtpHash);
  const expired = hasOtpRecord && !active && Boolean(progress.otpExpiresAt);
  const attemptsLocked =
    (progress.otpAttempts || 0) >= MAX_OTP_ATTEMPTS && !active;

  return {
    email: progress.adminDetails?.email || "",
    emailVerified: Boolean(progress.emailVerified),
    hasOtpRecord,
    needsInitialOtp: !hasOtpRecord && !progress.emailVerified,
    serverNow: new Date().toISOString(),
    otpExpiresAt: progress.otpExpiresAt
      ? new Date(progress.otpExpiresAt).toISOString()
      : null,
    otpCreatedAt: progress.otpCreatedAt
      ? new Date(progress.otpCreatedAt).toISOString()
      : null,
    expiresIn,
    hasActiveOtp: active,
    otpExpired: expired,
    otpAttempts: progress.otpAttempts || 0,
    maxAttempts: MAX_OTP_ATTEMPTS,
    attemptsLocked,
    canResend: !active && !progress.emailVerified,
  };
}

async function issueNewOtp(progress) {
  const email = progress.adminDetails.email;
  const plainOtp = generateSecureOtp();
  const emailOtpHash = await bcrypt.hash(plainOtp, BCRYPT_ROUNDS);
  const now = new Date();

  progress.emailOtpHash = emailOtpHash;
  progress.otpCreatedAt = now;
  progress.otpExpiresAt = new Date(now.getTime() + OTP_VALIDITY_MS);
  progress.otpAttempts = 0;
  await progress.save();

  try {
    await sendEmailVerificationOtp({ to: email, otp: plainOtp });
  } catch (mailError) {
    progress.emailOtpHash = undefined;
    progress.otpCreatedAt = undefined;
    progress.otpExpiresAt = undefined;
    progress.otpAttempts = 0;
    await progress.save();

    const error = new Error(
      mailError.message ||
        "Failed to send verification email. Check email configuration."
    );
    error.statusCode = 503;
    throw error;
  }

  return getRemainingSeconds(progress.otpExpiresAt);
}

async function getEmailVerificationState(userId) {
  const progress = await assertEmailVerificationPrerequisites(userId);
  const onboarding = await onboardingProgressService.getProgressForUser(userId);

  return {
    ...buildOtpState(progress),
    onboarding,
  };
}

async function sendEmailOtp(userId) {
  const progress = await assertEmailVerificationPrerequisites(userId);

  if (progress.emailVerified) {
    const error = new Error("Email is already verified");
    error.statusCode = 409;
    throw error;
  }

  if (isOtpActive(progress)) {
    return {
      expiresIn: getRemainingSeconds(progress.otpExpiresAt),
      resent: false,
      ...buildOtpState(progress),
    };
  }

  await issueNewOtp(progress);

  return {
    expiresIn: getRemainingSeconds(progress.otpExpiresAt),
    resent: false,
    ...buildOtpState(progress),
  };
}

async function resendEmailOtp(userId) {
  const progress = await assertEmailVerificationPrerequisites(userId);

  if (progress.emailVerified) {
    const error = new Error("Email is already verified");
    error.statusCode = 409;
    throw error;
  }

  if (isOtpActive(progress)) {
    const error = new Error(
      "Your current OTP is still valid. Wait for it to expire before requesting a new one."
    );
    error.statusCode = 400;
    error.expiresIn = getRemainingSeconds(progress.otpExpiresAt);
    throw error;
  }

  await issueNewOtp(progress);

  return {
    expiresIn: getRemainingSeconds(progress.otpExpiresAt),
    resent: true,
    ...buildOtpState(progress),
  };
}

function invalidateOtp(progress) {
  progress.emailOtpHash = undefined;
  progress.otpCreatedAt = undefined;
  progress.otpExpiresAt = undefined;
}

async function verifyEmailOtp(userId, body) {
  const validation = validateVerifyEmailOtpBody(body);
  if (validation.errors.length) {
    const error = new Error(validation.errors[0]);
    error.statusCode = 400;
    error.errors = validation.errors;
    throw error;
  }

  const progress = await assertEmailVerificationPrerequisites(userId);

  if (progress.emailVerified) {
    const onboarding = await onboardingProgressService.getProgressForUser(userId);
    return {
      verified: true,
      currentStep: onboarding.currentStep,
      onboarding,
    };
  }

  if (!progress.emailOtpHash) {
    const error = new Error("No verification code found. Request a new OTP.");
    error.statusCode = 400;
    throw error;
  }

  if ((progress.otpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
    invalidateOtp(progress);
    await progress.save();
    const error = new Error(
      "Too many failed attempts. Your OTP has been invalidated. Please request a new OTP."
    );
    error.statusCode = 429;
    error.attemptsLocked = true;
    throw error;
  }

  if (!isOtpActive(progress)) {
    invalidateOtp(progress);
    await progress.save();
    const error = new Error("OTP has expired. Please request a new OTP.");
    error.statusCode = 400;
    error.expired = true;
    throw error;
  }

  const matches = await bcrypt.compare(validation.otp, progress.emailOtpHash);

  if (!matches) {
    progress.otpAttempts = (progress.otpAttempts || 0) + 1;
    const attemptsLeft = MAX_OTP_ATTEMPTS - progress.otpAttempts;

    if (progress.otpAttempts >= MAX_OTP_ATTEMPTS) {
      invalidateOtp(progress);
      await progress.save();
      const error = new Error(
        "Too many failed attempts. Your OTP has been invalidated. Please request a new OTP."
      );
      error.statusCode = 429;
      error.attemptsLocked = true;
      throw error;
    }

    await progress.save();
    const error = new Error(
      attemptsLeft === 1
        ? "Invalid code. You have 1 attempt remaining."
        : `Invalid code. You have ${attemptsLeft} attempts remaining.`
    );
    error.statusCode = 400;
    error.attemptsRemaining = attemptsLeft;
    throw error;
  }

  progress.emailVerified = true;
  invalidateOtp(progress);
  progress.otpAttempts = 0;
  await progress.save();

  const onboarding = await onboardingProgressService.advanceProgress(
    userId,
    ONBOARDING_STEP
  );

  return {
    verified: true,
    currentStep: onboarding.currentStep,
    onboarding,
  };
}

module.exports = {
  getEmailVerificationState,
  sendEmailOtp,
  resendEmailOtp,
  verifyEmailOtp,
  issueNewOtp,
};
