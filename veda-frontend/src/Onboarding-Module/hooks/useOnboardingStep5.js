import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getEmailVerification,
  sendEmailOtp,
  resendEmailOtp,
  verifyEmailOtp,
} from "../../services/onboardingAPI";
import { ONBOARDING_ROUTES, stepPath } from "../constants/onboarding";
import {
  canAccessOnboardingStep,
  getOnboardingResumePath,
  getPostOnboardingDestination,
} from "../utils/onboardingNavigation";
import {
  computeExpiresAtMs,
  getRemainingSeconds,
} from "../utils/otpTimer";

const OTP_LENGTH = 6;

export function useOnboardingStep5() {
  const navigate = useNavigate();
  const expiresAtMsRef = useRef(null);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [otpExpired, setOtpExpired] = useState(false);
  const [attemptsLocked, setAttemptsLocked] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [pageMessage, setPageMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  const syncTimerFromRef = useCallback(() => {
    const expiresAtMs = expiresAtMsRef.current;
    if (!expiresAtMs) return;

    const remaining = getRemainingSeconds(expiresAtMs);
    setSecondsLeft(remaining);

    if (remaining <= 0) {
      setOtpExpired(true);
      setOtpSent(false);
    } else {
      setOtpExpired(false);
      setOtpSent(true);
    }
  }, []);

  const showError = useCallback((text) => {
    setPageMessage(text ? { type: "error", text } : null);
  }, []);

  const clearPageMessage = useCallback(() => {
    setPageMessage(null);
  }, []);

  const applyOtpTiming = useCallback((payload) => {
    const expiresAtMs = computeExpiresAtMs({
      otpExpiresAt: payload?.otpExpiresAt,
      expiresIn: payload?.expiresIn,
      serverNow: payload?.serverNow,
    });
    expiresAtMsRef.current = expiresAtMs;

    if (!expiresAtMs) return;

    const remaining = getRemainingSeconds(expiresAtMs);
    setSecondsLeft(remaining);
    setOtpExpired(remaining <= 0);
    setOtpSent(remaining > 0);
  }, []);

  const bootstrapOtp = useCallback(async () => {
    const state = await getEmailVerification();
    const onboarding = state?.onboarding;

    if (!canAccessOnboardingStep(5, onboarding)) {
      navigate(getOnboardingResumePath(onboarding), { replace: true });
      return null;
    }

    setEmail(state?.email || "");

    if (state?.emailVerified) {
      setOtpExpired(false);
      setAttemptsLocked(false);
      setOtpSent(false);
      expiresAtMsRef.current = null;
      return { ...state, emailVerified: true };
    }

    setAttemptsLocked(Boolean(state?.attemptsLocked));

    if (state?.hasActiveOtp) {
      applyOtpTiming(state);
      return state;
    }

    if (!state?.hasOtpRecord && !state?.attemptsLocked) {
      const sendResult = await sendEmailOtp();
      applyOtpTiming(sendResult);
      setEmail(sendResult?.email || state?.email || "");
      setOtpExpired(false);
      setAttemptsLocked(false);
      return sendResult;
    }

    setOtpExpired(true);
    setOtpSent(false);
    setSecondsLeft(0);
    expiresAtMsRef.current = null;
    return state;
  }, [applyOtpTiming, navigate]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const state = await bootstrapOtp();
        if (!cancelled && state?.emailVerified) {
          setEmailVerified(true);
        }
      } catch (err) {
        if (!cancelled) {
          showError(
            err.response?.data?.message ||
              "Unable to load email verification. Please refresh the page."
          );
        }
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [bootstrapOtp, showError]);

  useEffect(() => {
    if (initialLoading) return undefined;

    const tick = () => syncTimerFromRef();
    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [initialLoading, syncTimerFromRef]);

  const handleOtpChange = useCallback((value) => {
    setOtp(value);
    setFieldError("");
    clearPageMessage();
  }, [clearPageMessage]);

  const handleResend = useCallback(async () => {
    if (resendLoading || initialLoading) return;
    if (!otpExpired && !attemptsLocked) return;

    setResendLoading(true);
    clearPageMessage();
    setFieldError("");

    try {
      const data = await resendEmailOtp();
      applyOtpTiming(data);
      setOtp("");
      setOtpExpired(false);
      setAttemptsLocked(false);
    } catch (err) {
      const remaining = err.response?.data?.expiresIn;
      if (typeof remaining === "number" && remaining > 0) {
        expiresAtMsRef.current = Date.now() + remaining * 1000;
        setOtpExpired(false);
        syncTimerFromRef();
      }
      showError(
        err.response?.data?.message || "Could not resend the code. Please try again."
      );
    } finally {
      setResendLoading(false);
    }
  }, [
    applyOtpTiming,
    attemptsLocked,
    clearPageMessage,
    initialLoading,
    otpExpired,
    resendLoading,
    showError,
    syncTimerFromRef,
  ]);

  const handleVerify = useCallback(async () => {
    clearPageMessage();
    setFieldError("");

    const cleaned = otp.replace(/\D/g, "");
    if (cleaned.length !== OTP_LENGTH) {
      setFieldError("Enter all 6 digits of the verification code.");
      return;
    }

    if (otpExpired || secondsLeft <= 0) {
      setFieldError("OTP has expired.");
      return;
    }

    if (attemptsLocked) {
      showError(
        "Too many failed attempts. Please request a new OTP to continue."
      );
      return;
    }

    setLoading(true);
    try {
      const data = await verifyEmailOtp({ otp: cleaned });
      const onboarding = data?.onboarding;

      if (onboarding?.isCompleted) {
        navigate(getPostOnboardingDestination(onboarding));
        return;
      }

      const nextStep = data?.currentStep || onboarding?.currentStep || 6;
      navigate(stepPath(nextStep));
    } catch (err) {
      if (err.response?.data?.attemptsLocked) {
        setAttemptsLocked(true);
        setOtpExpired(true);
        expiresAtMsRef.current = null;
        setSecondsLeft(0);
        setOtpSent(false);
      }
      if (err.response?.data?.expired) {
        setOtpExpired(true);
        expiresAtMsRef.current = null;
        setSecondsLeft(0);
        setOtpSent(false);
      }
      showError(
        err.response?.data?.message ||
          "Could not verify the code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [
    attemptsLocked,
    clearPageMessage,
    navigate,
    otp,
    otpExpired,
    secondsLeft,
    showError,
  ]);

  const handleBack = useCallback(() => {
    navigate(ONBOARDING_ROUTES.step4);
  }, [navigate]);

  const handleContinueToStep6 = useCallback(() => {
    navigate(ONBOARDING_ROUTES.step6);
  }, [navigate]);

  const hasActiveOtpSession =
    !initialLoading &&
    otpSent &&
    secondsLeft > 0 &&
    !otpExpired &&
    !attemptsLocked;

  const showExpiredState =
    !initialLoading &&
    !emailVerified &&
    (otpExpired || attemptsLocked) &&
    secondsLeft <= 0;

  const canResend =
    showExpiredState && !resendLoading && !initialLoading;

  const verifyDisabled =
    loading ||
    initialLoading ||
    !hasActiveOtpSession ||
    otp.replace(/\D/g, "").length !== OTP_LENGTH;

  return {
    email,
    otp,
    secondsLeft,
    otpExpired,
    attemptsLocked,
    hasActiveOtpSession,
    showExpiredState,
    fieldError,
    pageMessage,
    loading,
    resendLoading,
    initialLoading,
    verifyDisabled,
    canResend,
    handleOtpChange,
    handleResend,
    handleVerify,
    handleBack,
    emailVerified,
    handleContinueToStep6,
  };
}
