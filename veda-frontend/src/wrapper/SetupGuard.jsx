import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAuthToken } from "../utils/authSession";
import { getSetupProgress } from "../services/setupWizardAPI";

/**
 * Protects admin/superadmin routes by requiring the setup wizard to be completed.
 * Redirects to /setup/start when the user has not launched their school setup.
 */
export default function SetupGuard({ requireSetup }) {
  const location = useLocation();
  const [status, setStatus] = useState("loading"); // "loading" | "completed" | "incomplete" | "error"

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getSetupProgress();
        if (cancelled) return;
        const completed = res?.data?.setupStatus === "completed";
        setStatus(completed ? "completed" : "incomplete");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const token = getAuthToken();
  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-gray-500">Checking setup status…</div>
      </div>
    );
  }

  if (status === "error") {
    // If we cannot verify setup status, do not block — fall through to the route.
    return <Outlet />;
  }

  if (requireSetup && status === "incomplete") {
    return (
      <Navigate to="/setup/start" replace state={{ from: location.pathname }} />
    );
  }

  return <Outlet />;
}
