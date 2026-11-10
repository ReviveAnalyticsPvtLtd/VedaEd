import React from "react";
import TimetableTabs from "../../components/timetable/TimetableTabs";
import TeacherTimetable from "../../components/timetable/TeacherTimetable";
import ClassTimetable from "./ClassTimetable";
import "../../components/timetable/timetableBuilder.css";

const Timetable = () => (
  <TimetableTabs
    classView={<ClassTimetable />}
    teacherView={<TeacherTimetable />}
  />
);

export default Timetable;
