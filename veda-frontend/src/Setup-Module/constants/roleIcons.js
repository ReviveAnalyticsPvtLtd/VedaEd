import {
  FiBook,
  FiBriefcase,
  FiHeart,
  FiShield,
  FiTruck,
  FiUser,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import { HiOutlineAcademicCap } from "react-icons/hi2";
import { MdOutlineSchool } from "react-icons/md";
import { RiAdminLine } from "react-icons/ri";

export const ROLE_ICONS = {
  superAdmin: RiAdminLine,
  principal: MdOutlineSchool,
  teacher: HiOutlineAcademicCap,
  student: FiUser,
  parent: FiUsers,
  accountant: FiBriefcase,
  hrAdmin: FiBriefcase,
  coordinator: FiUserCheck,
  transport: FiTruck,
  librarian: FiBook,
  health: FiHeart,
  admissions: FiShield,
};

export const getRoleIcon = (iconKey) => ROLE_ICONS[iconKey] || FiUser;
