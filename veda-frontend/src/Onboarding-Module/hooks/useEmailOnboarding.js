import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { emailOnboardingAuth } from "../../services/onboardingAPI";
import { saveAuthSession } from "../../utils/authSession";
import { ONBOARDING_ROUTES } from "../constants/onboarding";
import { getPostOnboardingDestination } from "../utils/onboardingNavigation";
import {
  sanitizeSignupEmail,
  sanitizeSignupFullName,
  validateEmailSignupForm,
} from "../utils/emailSignupValidation";

export function useEmailOnboarding() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [accountExists, setAccountExists] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFullNameChange = useCallback((value) => {
    setFullName(value);
    setFieldErrors((prev) => ({ ...prev, fullName: "" }));
    setAccountExists(false);
  }, []);

  const handleEmailChange = useCallback((value) => {
    setEmail(value);
    setFieldErrors((prev) => ({ ...prev, email: "" }));
    setAccountExists(false);
  }, []);

  const handlePasswordChange = useCallback((value) => {
    setPassword(value);
    setFieldErrors((prev) => ({ ...prev, password: "" }));
  }, []);

  const handleConfirmPasswordChange = useCallback((value) => {
    setConfirmPassword(value);
    setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setFormError("");
    setAccountExists(false);

    const errors = validateEmailSignupForm({
      fullName,
      email,
      password,
      confirmPassword,
    });

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const data = await emailOnboardingAuth({
        fullName: sanitizeSignupFullName(fullName),
        email: sanitizeSignupEmail(email),
        password,
        confirmPassword,
      });

      if (!data?.token) {
        throw new Error(data?.message || "Registration failed");
      }

      saveAuthSession(data);

      const onboarding = data.onboarding;
      if (onboarding?.isCompleted) {
        navigate(getPostOnboardingDestination(onboarding), { replace: true });
        return;
      }

      const next = onboarding?.nextPath || ONBOARDING_ROUTES.step2;
      navigate(next, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const code = err.response?.data?.code;
      const message =
        err.response?.data?.message ||
        err.message ||
        "Could not create your account. Please try again.";

      if (status === 409 || code === "ACCOUNT_EXISTS") {
        setAccountExists(true);
        setFormError("Account already exists. Please sign in.");
      } else {
        const serverFieldErrors = err.response?.data?.fieldErrors;
        if (serverFieldErrors && typeof serverFieldErrors === "object") {
          setFieldErrors((prev) => ({ ...prev, ...serverFieldErrors }));
        }
        setFormError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [fullName, email, password, confirmPassword, navigate]);

  return {
    fullName,
    email,
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    fieldErrors,
    formError,
    accountExists,
    loading,
    handleFullNameChange,
    handleEmailChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
    toggleShowConfirmPassword: () => setShowConfirmPassword((prev) => !prev),
    handleSubmit,
  };
}
