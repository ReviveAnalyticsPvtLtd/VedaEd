import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { checkUserExists, registerWithEmail, loginWithEmail } from "../../services/authAPI";
import { saveAuthSession } from "../../utils/authSession";
import { sanitizeSignupEmail } from "../utils/emailSignupValidation";
import { validateStep1EmailAuthForm } from "../utils/step1EmailAuthValidation";
import { resolvePathAfterAuth } from "../utils/onboardingNavigation";
import { evaluatePasswordRequirements } from "../utils/passwordValidation";

export function useStep1EmailAuth() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null);

  const handleEmailChange = useCallback((value) => {
    setEmail(value);
    setFieldErrors((prev) => ({ ...prev, email: "" }));
    setFormError("");
  }, []);

  const handlePasswordChange = useCallback((value) => {
    setPassword(value);
    setFieldErrors((prev) => ({ ...prev, password: "" }));
    setFormError("");
  }, []);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
    setFormError("");
    setFieldErrors({});
  }, []);

  const runAuth = useCallback(
    async (authMode) => {
      setFormError("");
      setMode(authMode);

      const errors = validateStep1EmailAuthForm({ email, password, mode: authMode });
      if (Object.keys(errors).length) {
        setFieldErrors(errors);
        return;
      }

      const normalizedEmail = sanitizeSignupEmail(email);
      setLoading(true);

      try {
        const existsResult = await checkUserExists(normalizedEmail);
        const exists = Boolean(existsResult?.exists);

        if (authMode === "register") {
          if (exists) {
            setFormError("Account already exists. Please sign in.");
            setFieldErrors((prev) => ({
              ...prev,
              email: "This email is already registered.",
            }));
            return;
          }

          const strength = evaluatePasswordRequirements(password);
          if (!strength.every((rule) => rule.met)) {
            setFieldErrors((prev) => ({
              ...prev,
              password: "Password does not meet all security requirements.",
            }));
            return;
          }

          const data = await registerWithEmail({
            email: normalizedEmail,
            password,
          });
          if (!data?.token) {
            throw new Error(data?.message || "Registration failed");
          }
          saveAuthSession(data);
          navigate(resolvePathAfterAuth(data), { replace: true });
          return;
        }

        if (!exists) {
          setFormError("No account found for this email. Create an account instead.");
          setFieldErrors((prev) => ({
            ...prev,
            email: "No account found with this email.",
          }));
          return;
        }

        const data = await loginWithEmail({
          email: normalizedEmail,
          password,
        });
        if (!data?.token) {
          throw new Error(data?.message || "Sign in failed");
        }
        saveAuthSession(data);
        navigate(resolvePathAfterAuth(data), { replace: true });
      } catch (err) {
        const serverFieldErrors = err.response?.data?.fieldErrors;
        if (serverFieldErrors && typeof serverFieldErrors === "object") {
          setFieldErrors((prev) => ({ ...prev, ...serverFieldErrors }));
        }
        setFormError(
          err.response?.data?.message ||
            err.message ||
            (authMode === "register"
              ? "Could not create your account."
              : "Sign in failed. Check your email and password.")
        );
      } finally {
        setLoading(false);
        setMode(null);
      }
    },
    [email, password, navigate]
  );

  const handleCreateAccount = useCallback(() => {
    runAuth("register");
  }, [runAuth]);

  const handleSignIn = useCallback(() => {
    runAuth("login");
  }, [runAuth]);

  return {
    expanded,
    toggleExpanded,
    email,
    password,
    showPassword,
    fieldErrors,
    formError,
    loading,
    mode,
    handleEmailChange,
    handlePasswordChange,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
    handleCreateAccount,
    handleSignIn,
  };
}
