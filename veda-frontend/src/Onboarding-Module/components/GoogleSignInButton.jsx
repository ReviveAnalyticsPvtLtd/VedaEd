import React from "react";
import { GoogleLogin, useGoogleOAuth } from "@react-oauth/google";
import { isGoogleOAuthConfigured } from "../../config/googleOAuth";
import { CustomGoogleButton } from "./GoogleSignInButtonParts";

/**
 * "Continue with Google" using @react-oauth/google (returns ID token credential).
 */
export default function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
  loading = false,
}) {
  const { scriptLoadedSuccessfully } = useGoogleOAuth();
  const configured = isGoogleOAuthConfigured();

  if (!configured) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">Google sign-in is not configured</p>
        <p className="mt-1 text-amber-800">
          Add <code className="rounded bg-amber-100 px-1">REACT_APP_GOOGLE_CLIENT_ID</code> to{" "}
          <code className="rounded bg-amber-100 px-1">veda-frontend/.env</code> and restart{" "}
          <code className="rounded bg-amber-100 px-1">npm start</code>.
        </p>
      </div>
    );
  }

  const handleError = () => {
    if (onError) onError();
  };

  return (
    <div className="w-full">
      {!scriptLoadedSuccessfully ? (
        <CustomGoogleButton disabled loading />
      ) : (
        <div
          className={`onboarding-google-login relative w-full ${
            disabled || loading ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <GoogleLogin
            onSuccess={onSuccess}
            onError={handleError}
            useOneTap={false}
            type="standard"
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            logo_alignment="left"
            width="400"
            containerProps={{
              className: "flex w-full justify-center",
              style: { width: "100%" },
            }}
          />
        </div>
      )}

      {loading && (
        <div
          className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-600"
          aria-live="polite"
        >
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          Signing in with Google…
        </div>
      )}
    </div>
  );
}
