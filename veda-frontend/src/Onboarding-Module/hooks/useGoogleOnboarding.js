import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { googleOnboardingAuth } from "../../services/onboardingAPI";
import { saveAuthSession } from "../../utils/authSession";
import { resolvePathAfterAuth } from "../utils/onboardingNavigation";

export function useGoogleOnboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSuccess = useCallback(
    async (credentialResponse) => {
      const credential = credentialResponse?.credential;
      if (!credential) {
        setError("Google did not return a valid credential. Please try again.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await googleOnboardingAuth(credential);
        if (!data?.token) {
          throw new Error(data?.message || "Authentication failed");
        }

        saveAuthSession(data);

        navigate(resolvePathAfterAuth(data), { replace: true });
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Google sign-in failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  const handleGoogleError = useCallback(() => {
    setError("Google sign-in was cancelled or failed. Please try again.");
  }, []);

  return {
    loading,
    error,
    setError,
    handleGoogleSuccess,
    handleGoogleError,
  };
}
