import { Link, useLocation } from "react-router-dom";

const breadcrumbLabels = {
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
  superadmin: "Super Admin",

  students: "Students",
  student: "Student",
  staff: "Staff",
  parents: "Parents",

  attendance: "Attendance",
  overview: "Overview",
  "by-class": "By Class",
  "by-student": "By Student",

  "classes-schedules": "Classes & Schedules",
  classes: "Classes",
  "subject-group": "Subject Group",
  "assign-teacher": "Assign Teacher",
  timetable: "Timetable",
  "add-class": "Add Class",
  "add-subject": "Add Subject",

  profile: "Profile",
  reports: "Reports",

  fees: "Fees",
  "collect-fees": "Collect Fees",
  "search-payment": "Search Payment",
  "search-due": "Search Due",
  "fee-master": "Fee Master",
  "fee-group": "Fee Group",
  "fee-type": "Fee Type",
  "fee-discount": "Fee Discount",
  "carry-forward": "Carry Forward",
  reminder: "Reminder",

  admission: "Admission",
  "admission-enquiry": "Admission Enquiry",
  "admission-form": "Admission Form",
  "entrance-list": "Entrance List",
  "interview-list": "Interview List",
  "document-verification": "Document Verification",

  hr: "HR",
  "staff-directory": "Staff Directory",
  payroll: "Payroll",
  "approve-leave": "Approve Leave",

  communication: "Communication",
  logs: "Logs",
  notices: "Notices",
  messages: "Messages",
  complaints: "Complaints",
};

function getLabel(segment) {
  return (
    breadcrumbLabels[segment] ||
    segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

export function Breadcrumbs()  {
  const location = useLocation();

  const pathSegments = location.pathname
    .split("/")
    .filter(Boolean);

  return (
    <div className="mb-4 flex items-center gap-2 text-sm">
      {/* HOME */}
      <Link
        to="/"
        className="text-gray-500 hover:text-blue-600 transition"
      >
        Home
      </Link>

      {pathSegments.map((segment, index) => {
        const path = "/" + pathSegments.slice(0, index + 1).join("/");
        const isLast = index === pathSegments.length - 1;

        return (
          <div key={path} className="flex items-center gap-2">
            <span className="text-gray-400">/</span>

            {isLast ? (
              <span className="font-medium text-gray-800">
                {getLabel(segment)}
              </span>
            ) : (
              <Link
                to={path}
                className="text-gray-500 hover:text-blue-600 transition"
              >
                {getLabel(segment)}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}