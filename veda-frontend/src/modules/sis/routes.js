/**
 * SIS module relative route paths.
 *
 * Phase 1 keeps the actual route elements in App.js. These constants are the
 * single source of truth for relative SIS paths and are consumed by nav.js.
 * Later phases will add the route element tree here and render it through
 * routes/renderModuleRoutes.jsx.
 */
export const SIS_PATHS = {
  dashboard: "",
  students: "students",
  studentProfile: "student-profile/:id",
  staff: "staff",
  staffProfile: "staff-profile/:id",
  parents: "parents",
  parentProfile: "parent-profile/:parentId",
  classesSchedules: "classes-schedules",
  classes: "classes",
  subjectGroup: "subject-group",
  assignTeacher: "assign-teacher",
  timetable: "timetable",
  addClass: "add-class",
  addSubject: "add-subject",
  classDetail: "class-detail",
  classTimetable: "class-timetable",
  teacherTimetable: "teacher-timetable",
  attendance: "attendance",
  reports: "reports",
  profile: "profile",
};

export default SIS_PATHS;
