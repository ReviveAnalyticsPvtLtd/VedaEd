import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAdminDetails,
  saveAdminDetails,
} from "../../services/onboardingAPI";
import { ONBOARDING_ROUTES, stepPath } from "../constants/onboarding";
import {
  canAccessOnboardingStep,
  getOnboardingResumePath,
  getPostOnboardingDestination,
} from "../utils/onboardingNavigation";
import {
  DEFAULT_COUNTRY_CODE,
  STEP3_DRAFT_KEY,
} from "../constants/adminDetails";
import {
  sanitizeEmail,
  sanitizeFullName,
  sanitizeMobileDigits,
  validateAdminDetailsForm,
} from "../utils/adminDetailsValidation";

function readDraft() {
  try {
    const raw = sessionStorage.getItem(STEP3_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDraft(values) {
  try {
    sessionStorage.setItem(STEP3_DRAFT_KEY, JSON.stringify(values));
  } catch {
    // ignore quota errors
  }
}

function clearDraft() {
  sessionStorage.removeItem(STEP3_DRAFT_KEY);
}

export function useOnboardingStep3() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [mobileNumber, setMobileNumber] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getAdminDetails();
        if (cancelled) return;

        const onboarding = data?.onboarding;

        if (
          (onboarding?.isCompleted || onboarding?.onboardingCompleted) &&
          !canAccessOnboardingStep(3, onboarding)
        ) {
          navigate(getOnboardingResumePath(onboarding), { replace: true });
          return;
        }

        if (!canAccessOnboardingStep(3, onboarding)) {
          navigate(getOnboardingResumePath(onboarding), { replace: true });
          return;
        }

        const draft = readDraft();
        const saved = data?.adminDetails;
        const profile = data?.profile || {};

        const resolved = saved || draft || {};
        const useGooglePrefill =
          !saved &&
          !draft &&
          (data?.authProvider === "google" || data?.authProvider === "email");

        setFullName(
          resolved.fullName ||
            (useGooglePrefill ? profile.fullName : "") ||
            ""
        );
        setEmail(
          resolved.email || (useGooglePrefill ? profile.email : "") || ""
        );
        setCountryCode(resolved.countryCode || DEFAULT_COUNTRY_CODE);
        setMobileNumber(resolved.mobileNumber || "");
      } catch {
        if (!cancelled) {
          setFormError("Unable to load your details. Please refresh the page.");
        }
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const persistDraft = useCallback(() => {
    writeDraft({
      fullName,
      email,
      countryCode,
      mobileNumber,
    });
  }, [fullName, email, countryCode, mobileNumber]);

  const handleFullNameChange = useCallback((value) => {
    setFullName(value);
    setFieldErrors((prev) => ({ ...prev, fullName: "" }));
  }, []);

  const handleEmailChange = useCallback((value) => {
    setEmail(value);
    setFieldErrors((prev) => ({ ...prev, email: "" }));
  }, []);

  const handleCountryCodeChange = useCallback((value) => {
    setCountryCode(value);
    setFieldErrors((prev) => ({ ...prev, mobileNumber: "" }));
  }, []);

  const handleMobileNumberChange = useCallback((value) => {
    setMobileNumber(sanitizeMobileDigits(value));
    setFieldErrors((prev) => ({ ...prev, mobileNumber: "" }));
  }, []);

  const handleContinue = useCallback(async () => {
    setFormError("");
    const errors = validateAdminDetailsForm({
      fullName,
      email,
      countryCode,
      mobileNumber,
    });

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: sanitizeFullName(fullName),
        email: sanitizeEmail(email),
        countryCode,
        mobileNumber: sanitizeMobileDigits(mobileNumber),
      };

      const data = await saveAdminDetails(payload);
      clearDraft();

      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          user.name = payload.fullName;
          user.email = payload.email;
          localStorage.setItem("user", JSON.stringify(user));
        }
      } catch {
        // ignore local session update errors
      }

      const onboarding = data?.onboarding;
      if (onboarding?.isCompleted) {
        navigate(getPostOnboardingDestination(onboarding));
        return;
      }

      const nextStep = data?.currentStep || onboarding?.currentStep || 4;
      navigate(stepPath(nextStep));
    } catch (err) {
      const serverFieldErrors = err.response?.data?.fieldErrors;
      if (serverFieldErrors && typeof serverFieldErrors === "object") {
        setFieldErrors((prev) => ({ ...prev, ...serverFieldErrors }));
      }
      setFormError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0] ||
          "Could not save your details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [fullName, email, countryCode, mobileNumber, navigate]);

  const handleBack = useCallback(() => {
    persistDraft();
    navigate(ONBOARDING_ROUTES.step2);
  }, [navigate, persistDraft]);

  return {
    fullName,
    email,
    countryCode,
    mobileNumber,
    fieldErrors,
    formError,
    loading,
    initialLoading,
    handleFullNameChange,
    handleEmailChange,
    handleCountryCodeChange,
    handleMobileNumberChange,
    handleContinue,
    handleBack,
  };
}
