
import React, { useState, useEffect } from "react";
import api from "../../../services/apiClient";
import { FiSearch } from "react-icons/fi";

import config from "../../../config";

const API = config.API_BASE_URL;

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SuperAdminSISTeacherTimetable = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [showTable, setShowTable] = useState(false);
  const [timetable, setTimetable] = useState({});

  // Load teachers from timetables
 useEffect(() => {
  const fetchTeachers = async () => {
    try {
      const res = await api.get(`/timetables`);

      console.log("TIMETABLE API RESPONSE:", res.data);

      let data = [];

      // handle every possible backend shape
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (Array.isArray(res.data?.data)) {
        data = res.data.data;
      } else if (Array.isArray(res.data?.timetables)) {
        data = res.data.timetables;
      }

      console.log("FINAL TIMETABLE DATA:", data);

      const teacherMap = {};

      data.forEach((item) => {
        const teacher = item?.teacher;

        if (teacher?._id) {
          teacherMap[String(teacher._id)] = {
            _id: String(teacher._id),
            name:
              teacher.personalInfo?.name ||
              teacher.name ||
              "Unnamed",

            teacherCode:
              teacher.personalInfo?.staffId ||
              teacher.teacherCode ||
              "",
          };
        }
      });

      const finalTeachers = Object.values(teacherMap);

      console.log("FINAL TEACHERS:", finalTeachers);

      setTeachers(finalTeachers);
    } catch (err) {
      console.error("FETCH TEACHERS ERROR:", err);
      setTeachers([]);
    }
  };

  fetchTeachers();
}, []);

  // Search timetable
  const handleSearch = async () => {
    if (!selectedTeacher) {
      alert("Please select a teacher");
      return;
    }

    try {
      const res = await api.get(`/timetables`, {
        params: {
          teacherId: selectedTeacher,
        },
      });

      const data = res.data?.data || [];

      const grouped = {};

      DAYS.forEach((d) => {
        grouped[d] = [];
      });

      data.forEach((row) => {
        if (grouped[row.day]) {
          grouped[row.day].push(row);
        }
      });

      setTimetable(grouped);
      setShowTable(true);

      console.log("Teacher timetable:", grouped);
    } catch (err) {
      console.error("Error fetching timetable:", err);
      alert("Error fetching timetable");
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* Top Card */}
      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
        <h2 className="text-lg font-semibold mb-4">
          Teacher Time Table
        </h2>

        <div className="flex items-center gap-4 mb-4">
          {/* Dropdown */}
          <select
            value={selectedTeacher}
            onChange={(e) => {
              console.log("Selected Teacher:", e.target.value);
              setSelectedTeacher(e.target.value);
            }}
            className="border px-3 py-2 rounded-md text-base w-72"
          >
            <option value="">Select Teacher</option>

            {Array.isArray(teachers) &&
              teachers.map((t, index) => (
                <option
                  key={index}
                  value={String(t._id)}
                >
                  {t.name || "Unnamed"}{" "}
                  {t.teacherCode
                    ? `(${t.teacherCode})`
                    : ""}
                </option>
              ))}
          </select>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-6 py-2 rounded-md text-base hover:bg-blue-700"
          >
            <span className="inline-flex items-center gap-1">
              <FiSearch className="text-base" />
              Search
            </span>
          </button>
        </div>
      </div>

      {/* Timetable */}
      {showTable && (
        <div className="bg-white p-3 rounded-lg shadow-sm border">
          {DAYS.map((day) => (
            <div key={day} className="mb-6">
              <h3 className="text-sm font-semibold mb-2">
                {day}
              </h3>

              {timetable[day]?.length > 0 ? (
                <div className="overflow-x-auto mb-4">
                  <table className="w-full border text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="p-2 border text-left">
                          Subject
                        </th>
                        <th className="p-2 border text-left">
                          Class
                        </th>
                        <th className="p-2 border text-left">
                          Section
                        </th>
                        <th className="p-2 border text-left">
                          Time
                        </th>
                        <th className="p-2 border text-left">
                          Room No.
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {timetable[day].map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50"
                        >
                          <td className="p-2 border text-left">
                            {row.subject?.subjectName || "--"}
                          </td>

                          <td className="p-2 border text-left">
                            {row.class?.name || "--"}
                          </td>

                          <td className="p-2 border text-left">
                            {row.section?.name || "--"}
                          </td>

                          <td className="p-2 border text-left">
                            {row.timeFrom} - {row.timeTo}
                          </td>

                          <td className="p-2 border text-left">
                            {row.roomNo || "--"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  No classes assigned
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuperAdminSISTeacherTimetable;         

