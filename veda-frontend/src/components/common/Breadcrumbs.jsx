import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { authFetch } from "../../services/apiClient";

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

  "student-profile": "Student Profile",
  "staff-profile": "Staff Profile",
  "parent-profile": "Parent Profile",
  "final-student-profile": "Final Student Profile",
  "final-student-list": "Final Student List",

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
  "vacancy-setup": "Vacancy Setup",
  "application-list": "Application List",
  "status-tracking": "Status Tracking",
  "selected-student": "Selected Student",

  hr: "HR",
  "staff-directory": "Staff Directory",
  payroll: "Payroll",
  "approve-leave": "Approve Leave",

  communication: "Communication",
  logs: "Logs",
  notices: "Notices",
  drafts: "Draft Announcements",
  messages: "Messages",
  complaints: "Complaints",
};

const routeRedirects = {
  "/admin/student-profile": "/admin/students",
  "/superadmin/student-profile": "/superadmin/students",
  "/admission/final-student-profile": "/admission/final-student-list",
};

const isMongoObjectId = (str) => /^[0-9a-fA-F]{24}$/.test(String(str || "").trim());

function getStandardLabel(segment) {
  return (
    breadcrumbLabels[segment] ||
    segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

export function Breadcrumbs() {
  const location = useLocation();
  const [dynamicLabels, setDynamicLabels] = useState({});

  const pathSegments = useMemo(() => {
    return location.pathname.split("/").filter(Boolean);
  }, [location.pathname]);

  // Listen to custom event dispatched by profile components
  useEffect(() => {
    const handleUpdate = (event) => {
      const { segment, label } = event?.detail || {};
      if (segment && label) {
        setDynamicLabels((prev) => {
          if (prev[segment] === label) return prev;
          return { ...prev, [segment]: label };
        });
      }
    };

    window.addEventListener("breadcrumb:update-label", handleUpdate);
    return () => window.removeEventListener("breadcrumb:update-label", handleUpdate);
  }, []);

  // Check location.state and session storage for student ID on path changes
  useEffect(() => {
    const state = location.state;
    if (state && pathSegments.length > 0) {
      const lastSegment = pathSegments[pathSegments.length - 1];
      const stateStdId =
        state.personalInfo?.stdId ||
        state.stdId ||
        state.personalInfo?.studentId ||
        state.studentId ||
        state.student_id ||
        state.studentCode ||
        state.admissionNumber;

      if (stateStdId && isMongoObjectId(lastSegment)) {
        setDynamicLabels((prev) => ({ ...prev, [lastSegment]: stateStdId }));
        try {
          sessionStorage.setItem("breadcrumb_label_" + lastSegment, stateStdId);
        } catch (_) {}
      }
    }
  }, [location.pathname, location.state, pathSegments]);

  // Auto-fetch readable student ID if segment is an ObjectId and not yet resolved
  useEffect(() => {
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (!lastSegment || !isMongoObjectId(lastSegment)) return;

    const isStudentRoute =
      pathSegments.includes("student-profile") ||
      pathSegments.includes("final-student-profile") ||
      pathSegments.includes("students");

    if (!isStudentRoute) return;

    // Check if already in state or sessionStorage
    if (dynamicLabels[lastSegment]) return;
    try {
      const cached = sessionStorage.getItem("breadcrumb_label_" + lastSegment);
      if (cached) {
        setDynamicLabels((prev) => ({ ...prev, [lastSegment]: cached }));
        return;
      }
    } catch (_) {}

    let isMounted = true;
    const fetchStudentId = async () => {
      try {
        const res = await authFetch(`/students/${lastSegment}`);
        if (res.ok) {
          const data = await res.json();
          const raw = data.student ?? data.data ?? data;
          const foundStdId =
            raw?.personalInfo?.stdId ||
            raw?.stdId ||
            raw?.personalInfo?.studentId ||
            raw?.studentId ||
            raw?.admissionNumber;

          if (isMounted && foundStdId) {
            setDynamicLabels((prev) => ({ ...prev, [lastSegment]: foundStdId }));
            try {
              sessionStorage.setItem("breadcrumb_label_" + lastSegment, foundStdId);
            } catch (_) {}
            return;
          }
        }

        // Try admission application endpoint if SIS student not found
        const admRes = await authFetch(`/admission/application/${lastSegment}`);
        if (admRes.ok) {
          const admData = await admRes.json();
          const rawAdm = admData.data ?? admData;
          const foundStdId =
            rawAdm?.personalInfo?.stdId ||
            rawAdm?.stdId ||
            rawAdm?.personalInfo?.studentId ||
            rawAdm?.studentId;

          if (isMounted && foundStdId) {
            setDynamicLabels((prev) => ({ ...prev, [lastSegment]: foundStdId }));
            try {
              sessionStorage.setItem("breadcrumb_label_" + lastSegment, foundStdId);
            } catch (_) {}
          }
        }
      } catch (_) {}
    };

    fetchStudentId();
    return () => {
      isMounted = false;
    };
  }, [pathSegments, dynamicLabels]);

  const resolveSegmentLabel = (segment, index) => {
    // 1. Dynamic label (from state/event/sessionStorage)
    if (dynamicLabels[segment]) {
      return dynamicLabels[segment];
    }

    // 2. Check session storage directly
    try {
      const cached = sessionStorage.getItem("breadcrumb_label_" + segment);
      if (cached) return cached;
    } catch (_) {}

    // 3. If it's a mongo object ID, resolve contextually
    if (isMongoObjectId(segment)) {
      const isStudentRoute =
        pathSegments.includes("student-profile") ||
        pathSegments.includes("final-student-profile") ||
        pathSegments.includes("students");

      if (isStudentRoute) {
        const stateStdId =
          location.state?.personalInfo?.stdId ||
          location.state?.stdId ||
          location.state?.personalInfo?.studentId ||
          location.state?.studentId ||
          location.state?.studentCode ||
          location.state?.admissionNumber;

        if (stateStdId) return stateStdId;
        return "Student Profile";
      }

      if (pathSegments.includes("staff-profile") || pathSegments.includes("staff")) {
        const stateStaffId =
          location.state?.staffId ||
          location.state?.personalInfo?.staffId ||
          location.state?.name;
        if (stateStaffId) return stateStaffId;
        return "Staff Profile";
      }

      if (pathSegments.includes("parent-profile") || pathSegments.includes("parents")) {
        const stateParentId = location.state?.parentId || location.state?.name;
        if (stateParentId) return stateParentId;
        return "Parent Profile";
      }
    }

    // 4. Standard mapping
    return getStandardLabel(segment);
  };

  return (
    <div className="mb-4 flex items-center gap-2 text-sm">
      {pathSegments.map((segment, index) => {
        const rawPath = "/" + pathSegments.slice(0, index + 1).join("/");
        const targetPath = routeRedirects[rawPath] || rawPath;
        const isLast = index === pathSegments.length - 1;
        const label = resolveSegmentLabel(segment, index);

        return (
          <div key={rawPath} className="flex items-center gap-2">
            <span className="text-gray-400">/</span>

            {isLast ? (
              <span className="font-medium text-gray-800">
                {label}
              </span>
            ) : (
              <Link
                to={targetPath}
                className="text-gray-500 hover:text-blue-600 transition"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}