import {
  FiActivity,
  FiBarChart2,
  FiBook,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiHome,
  FiLayers,
  FiMessageSquare,
  FiMonitor,
  FiPackage,
  FiTruck,
  FiUsers,
} from "react-icons/fi";

export const MODULE_ICONS = {
  sis: FiUsers,
  academics: FiBookOpen,
  attendance: FiCheckCircle,
  timetable: FiCalendar,
  exams: FiFileText,
  fees: FiCreditCard,
  communication: FiMessageSquare,
  reports: FiBarChart2,
  transport: FiTruck,
  library: FiBook,
  health: FiActivity,
  hostel: FiHome,
  lms: FiMonitor,
  inventory: FiPackage,
  hr: FiBriefcase,
  payroll: FiDollarSign,
};

export const getModuleIcon = (iconKey) =>
  MODULE_ICONS[iconKey] || FiLayers;
