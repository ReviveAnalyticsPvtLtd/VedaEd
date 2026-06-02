import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAuthToken } from "../utils/authSession";
import { ONBOARDING_ROUTES, stepPath } from "../Onboarding-Module/constants/onboarding";

/**
 * Protects onboarding steps 2–6. Requires JWT from step 1 (Google auth).
 */
export default function OnboardingRoute() {
  const token = getAuthToken();
  const location = useLocation();

  if (!token) {
    return (
      <Navigate
        to={ONBOARDING_ROUTES.step1}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}

export function redirectToOnboardingStep(step) {
  return <Navigate to={stepPath(step)} replace />;
}
