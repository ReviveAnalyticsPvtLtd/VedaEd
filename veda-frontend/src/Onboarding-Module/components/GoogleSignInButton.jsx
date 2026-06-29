import React, { useEffect, useRef, useState } from "react";
import { GoogleLogin, useGoogleOAuth } from "@react-oauth/google";
import { isGoogleOAuthConfigured } from "../../config/googleOAuth";
import { CustomGoogleButton } from "./GoogleSignInButtonParts";

const GSI_LOAD_TIMEOUT_MS = 6000;

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
  const [timedOut, setTimedOut] = useState(false);
  const containerRef = useRef(null);
  const [buttonWidth, setButtonWidth] = useState(400);

  useEffect(() => {
    if (scriptLoadedSuccessfully) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), GSI_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [scriptLoadedSuccessfully]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const width = el.offsetWidth;
      if (width > 0) setButtonWidth(Math.round(width));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  if (!scriptLoadedSuccessfully && timedOut) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        <p className="font-medium">Couldn't load Google Sign-In</p>
        <p className="mt-1 text-red-800">
          The Google script didn't load. This is usually caused by an ad blocker or
          privacy extension blocking <code className="rounded bg-red-100 px-1">accounts.google.com</code>,
          or no network access. Disable any blocking extension and retry, or use email below.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 font-semibold text-red-900 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {!scriptLoadedSuccessfully ? (
        <CustomGoogleButton disabled loading />
      ) : (
        <div
          ref={containerRef}
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
            width={buttonWidth}
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
