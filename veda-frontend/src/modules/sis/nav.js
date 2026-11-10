import {
  FiBarChart2,
  FiCalendar,
  FiCheckSquare,
  FiHome,
  FiUser,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import { SIS_PATHS } from "./routes";

/**
 * SIS navigation.
 *
 * Paths are relative to the module base path. The shared sidebar resolves them
 * against the current role's base path (admin vs superadmin).
 *
 * `roles` is optional: when omitted the item is visible to every role that can
 * access the module. Only genuinely role-specific items should set it.
 */
const SIS_NAV = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: SIS_PATHS.dashboard,
    icon: FiHome,
  },
  {
    key: "students",
    label: "Students",
    path: SIS_PATHS.students,
    icon: FiUsers,
  },
  {
    key: "parents",
    label: "Parents",
    path: SIS_PATHS.parents,
    icon: FiUser,
  },
  {
    key: "staff",
    label: "Staff",
    path: SIS_PATHS.staff,
    icon: FiUserCheck,
  },
  {
    key: "classes-schedules",
    label: "Classes & Schedule",
    path: SIS_PATHS.classesSchedules,
    icon: FiCalendar,
  },
  {
    key: "attendance",
    label: "Attendance",
    path: SIS_PATHS.attendance,
    icon: FiCheckSquare,
  },
  {
    key: "reports",
    label: "Reports",
    path: SIS_PATHS.reports,
    icon: FiBarChart2,
  },
  {
    key: "profile",
    label: "Profile",
    path: SIS_PATHS.profile,
    icon: FiUser,
    // The superadmin SIS area does not have a personal profile route yet.
    roles: ["admin", "staff"],
  },
];

export default SIS_NAV;
