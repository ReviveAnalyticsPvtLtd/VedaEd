import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { filterModulesByPermission } from "../utils/adminPermissions";
import {
  FiUsers,
  FiMessageCircle,
  FiCalendar,
  FiBriefcase,
  FiClipboard,
  FiBookOpen,
  FiChevronDown,
  FiTruck,
} from "react-icons/fi";

const MODULES = [
  {
    name: "Admin SIS",
    icon: <FiUsers />,
    subs: [
      { label: "Students", path: "/admin/students" },
      { label: "Staff", path: "/admin/staff" },
      { label: "Parents", path: "/admin/parents" },
      { label: "Attendance", path: "/admin/attendance" },
      { label: "Reports", path: "/admin/reports" },
    ],
  },
  {
    name: "Communication",
    icon: <FiMessageCircle />,
    subs: [
      { label: "Logs", path: "/communication/logs" },
      { label: "Notices", path: "/communication/notices" },
      { label: "Messages", path: "/communication/messages" },
      { label: "Complaints", path: "/communication/complaints" },
    ],
  },
  {
  name: "Admin Calendar",
  icon: <FiCalendar />,
  subs: [
    { label: "Annual Calendar", path: "/admin/calendar/annual" },
    { label: "Event Setup", path: "/admin/calendar/event-setup" },
    { label: "Annual Year Setup", path: "/admin/calendar/year-setup" },
  ],
},
  {
    name: "HR Module",
    icon: <FiBriefcase />,
    subs: [
      { label: "Staff Directory", path: "/hr/staff-directory" },
      { label: "Attendance", path: "/hr/staff-attendance" },
      { label: "Payroll", path: "/hr/payroll" },
      { label: "Approve Leave", path: "/hr/approve-leave" },
    ],
  },
  {
    name: "Receptionist",
    icon: <FiClipboard />,
    subs: [
      { label: "Admission Enquiry", path: "/receptionist/admission-enquiry" },
      { label: "Visitor Book", path: "/receptionist/visitor-book" },
      { label: "Student Details", path: "/receptionist/student-details" },
    ],
  },
  {
    name: "Admission",
    icon: <FiBookOpen />,
    subs: [
      { label: "Dashboard", path: "/admission" },
      { label: "Applications", path: "/admission/application-list" },
      { label: "Status Tracking", path: "/admission/status-tracking" },
      { label: "Vacancy Setup", path: "/admission/vacancy-setup" },
    ],
  },
    /* ================= NEW TRANSPORT MODULE ================= */

  {
    name: "Transport Module",
    icon: <FiTruck />,
    subs: [
      { label: "Dashboard", path: "/admin/transport" },
      { label: "Fees Master", path: "/admin/transport/fees-master" },
      { label: "Pickup Point", path: "/admin/transport/pickup-point" },
      { label: "Routes", path: "/admin/transport/routes" },
      { label: "Vehicles", path: "/admin/transport/vehicles" },
      { label: "Assign Vehicle", path: "/admin/transport/assign-vehicle" },
      { label: "Route Pickup Point", path: "/admin/transport/route-pickup-point" },
      { label: "Student Transport Fees", path: "/admin/transport/student-transport-fees" },
    ],
  },
];

export default function AdminSidebar() {
  const [open, setOpen] = useState(null);
  const navigate = useNavigate();
  const visibleModules = useMemo(() => filterModulesByPermission(MODULES), []);

  return (
    <aside className="w-64 bg-white shadow-md overflow-y-auto pt-16 ">

      {/* Main Section */}
      <div className="px-4 text-sm text-gray-500 font-semibold">
        Main
      </div>

      <div
        onClick={() => navigate("/admin-front")}
        className="px-6 py-2 text-gray-800 font-medium cursor-pointer hover:text-indigo-600"
      >
        Dashboard
      </div>
      <div
        onClick={() => navigate("/admin-front/profile")}
        className="px-6 py-2 text-gray-600 text-sm cursor-pointer hover:text-indigo-600"
      >
        Profile & Password
      </div>

      {/* Module Heading */}
      <div className="px-4 mt-4 text-sm text-gray-500 font-semibold">
        Module
      </div>

      {/* Modules */}
      {visibleModules.map((mod) => (
        <div key={mod.name}>
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-indigo-50"
            onClick={() => setOpen(open === mod.name ? null : mod.name)}
          >
            <div className="flex items-center gap-3">
              {mod.icon}
              <span className="font-medium">{mod.name}</span>
            </div>
            <FiChevronDown
              className={`transition ${
                open === mod.name ? "rotate-180" : ""
              }`}
            />
          </div>

          {open === mod.name && (
            <div className="ml-8">
              {mod.subs.map((s) => (
                <div
                  key={s.path}
                  onClick={() => navigate(s.path)}
                  className="py-2 text-sm cursor-pointer text-gray-600 hover:text-indigo-600"
                >
                  {s.label}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </aside>
  );
}
