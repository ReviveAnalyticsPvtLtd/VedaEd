import { useState, useEffect, useCallback } from "react";

import { useNavigate } from "react-router-dom";

import {
  advanceOnboardingStep,
  getCreatePassword,
  saveCreatePassword,
} from "../../services/onboardingAPI";

import { ONBOARDING_ROUTES, stepPath } from "../constants/onboarding";

import {

  canAccessOnboardingStep,

  getOnboardingResumePath,

  getPostOnboardingDestination,

} from "../utils/onboardingNavigation";

import { validateCreatePasswordForm } from "../utils/passwordValidation";



export function useOnboardingStep4() {

  const navigate = useNavigate();

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});

  const [formError, setFormError] = useState("");

  const [loading, setLoading] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);

  const [passwordAlreadySet, setPasswordAlreadySet] = useState(false);



  useEffect(() => {

    let cancelled = false;



    const load = async () => {

      try {

        const data = await getCreatePassword();

        if (cancelled) return;



        const onboarding = data?.onboarding;



        if (
          (onboarding?.isCompleted || onboarding?.onboardingCompleted) &&
          !canAccessOnboardingStep(4, onboarding)
        ) {
          navigate(getOnboardingResumePath(onboarding), { replace: true });
          return;
        }

        if (!canAccessOnboardingStep(4, onboarding)) {

          navigate(getOnboardingResumePath(onboarding), { replace: true });

          return;

        }



        const alreadySet =

          Boolean(data?.passwordCreated) ||

          data?.authProvider === "email" ||

          data?.authProvider === "local";

        setPasswordAlreadySet(alreadySet);

      } catch {

        if (!cancelled) {

          setFormError("Unable to load your account setup. Please refresh the page.");

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



  const handlePasswordChange = useCallback((value) => {

    setPassword(value);

    setFieldErrors((prev) => ({ ...prev, password: "" }));

  }, []);



  const handleConfirmPasswordChange = useCallback((value) => {

    setConfirmPassword(value);

    setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));

  }, []);



  const goToStep5 = useCallback(

    (data) => {

      const onboarding = data?.onboarding;

      if (onboarding?.isCompleted) {

        navigate(getPostOnboardingDestination(onboarding));

        return;

      }

      const nextStep = data?.currentStep || onboarding?.currentStep || 5;

      navigate(stepPath(nextStep));

    },

    [navigate]

  );



  const handleContinue = useCallback(async () => {

    if (passwordAlreadySet) {
      setLoading(true);
      try {
        const data = await advanceOnboardingStep(4);
        goToStep5({
          onboarding: data?.onboarding,
          currentStep: data?.onboarding?.currentStep,
        });
      } catch {
        goToStep5({ onboarding: { currentStep: 5 } });
      } finally {
        setLoading(false);
      }
      return;
    }



    setFormError("");

    const errors = validateCreatePasswordForm(password, confirmPassword);



    if (Object.keys(errors).length) {

      setFieldErrors(errors);

      return;

    }



    setLoading(true);

    try {

      const data = await saveCreatePassword({ password, confirmPassword });

      goToStep5(data);

    } catch (err) {

      const serverFieldErrors = err.response?.data?.fieldErrors;

      if (serverFieldErrors && typeof serverFieldErrors === "object") {

        setFieldErrors((prev) => ({ ...prev, ...serverFieldErrors }));

      }

      setFormError(

        err.response?.data?.message ||

          err.response?.data?.errors?.[0] ||

          "Could not save your password. Please try again."

      );

    } finally {

      setLoading(false);

    }

  }, [password, confirmPassword, passwordAlreadySet, goToStep5]);



  const handleBack = useCallback(() => {

    navigate(ONBOARDING_ROUTES.step3);

  }, [navigate]);



  return {

    password,

    confirmPassword,

    showPassword,

    showConfirmPassword,

    fieldErrors,

    formError,

    loading,

    initialLoading,

    passwordAlreadySet,

    handlePasswordChange,

    handleConfirmPasswordChange,

    toggleShowPassword: () => setShowPassword((prev) => !prev),

    toggleShowConfirmPassword: () => setShowConfirmPassword((prev) => !prev),

    handleContinue,

    handleBack,

  };

}

