import { useLocation } from "react-router-dom";

export default function useTalentPaths() {
  const { pathname } = useLocation();
  const isSuperadmin = pathname.startsWith("/superadmin/hr");

  return {
    talentBase: isSuperadmin
      ? "/superadmin/hr/talent-acquisition"
      : "/hr/talent-acquisition",
    dashboard: isSuperadmin ? "/superadmin/hr/dashboard" : "/hr/dashboard",
  };
}
