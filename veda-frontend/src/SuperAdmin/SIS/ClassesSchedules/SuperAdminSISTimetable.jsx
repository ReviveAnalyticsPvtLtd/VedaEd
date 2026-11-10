import React from "react";
import TimetableTabs from "../../../components/timetable/TimetableTabs";
import TeacherTimetable from "../../../components/timetable/TeacherTimetable";
import TimetableBuilder from "../../../components/timetable/TimetableBuilder";
import "../../../components/timetable/timetableBuilder.css";

const SuperAdminSISTimetable = () => (
  <TimetableTabs
    classView={<TimetableBuilder />}
    teacherView={<TeacherTimetable />}
  />
);

export default SuperAdminSISTimetable;
