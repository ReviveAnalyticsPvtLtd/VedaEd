import { Navigate } from "react-router-dom";
import { ONBOARDING_ROUTES } from "./constants/onboarding";

/** Legacy route — email auth lives on step 1. */
export default function OnboardingEmail() {
  return <Navigate to={ONBOARDING_ROUTES.step1} replace />;
}
