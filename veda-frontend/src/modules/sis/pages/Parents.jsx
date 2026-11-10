import ParentsList from "../../../components/parents/ParentsList";
import useAccess from "../../../access/useAccess";
import sisModule from "../module.config";
import { SIS_PATHS } from "../routes";

/**
 * Shared SIS Parents page.
 *
 * The real list implementation stays in `components/parents/ParentsList` for
 * now. This page is the single module entry point for both roles and resolves
 * the parent profile path from the current role's module base path.
 */
export default function Parents() {
  const { basePath } = useAccess();
  const moduleBasePath = basePath(sisModule.id);
  const parentProfileBasePath = `${moduleBasePath}/${SIS_PATHS.parents}`;

  return <ParentsList profileBasePath={parentProfileBasePath} />;
}
