import ParentProfileView from "../../../components/parents/ParentProfile";
import useAccess from "../../../access/useAccess";
import sisModule from "../module.config";
import { SIS_PATHS } from "../routes";

/**
 * Shared SIS Parent Profile page.
 *
 * The real profile implementation stays in `components/parents/ParentProfile`
 * for now. The back link always returns to the role-specific Parents list.
 */
export default function ParentProfile() {
  const { basePath } = useAccess();
  const moduleBasePath = basePath(sisModule.id);
  const parentsPath = `${moduleBasePath}/${SIS_PATHS.parents}`;

  return <ParentProfileView backPath={parentsPath} />;
}
