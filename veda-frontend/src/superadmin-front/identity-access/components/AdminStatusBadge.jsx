import { adminStatusBadgeClass, getAdminStatusDisplay } from "../utils/adminStatusDisplay";

export default function AdminStatusBadge({ admin }) {
  const { label, tone } = getAdminStatusDisplay(admin);
  return <span className={adminStatusBadgeClass(tone)}>{label}</span>;
}
