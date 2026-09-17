import React, { useState, useEffect } from "react";
import { FiFileText } from "react-icons/fi";
import HelpInfo from "../components/HelpInfo";
import { examTimetableAPI } from "../services/examTimetableAPI";
import config from "../config";

const EXAM_TYPES = ["Unit Test", "Half Yearly", "Final Exam", "Other"];

const StudentExams = () => {
  const [timetables, setTimetables] = useState([]);
  const [examType, setExamType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const FILE_BASE_URL = config.SERVER_URL;

  useEffect(() => {
    const fetchTimetables = async () => {
      try {
        // Backend identifies the logged-in student and their class/section,
        // returning only the relevant exam timetables. Sign-in token is sent by authFetch.
        const data = await examTimetableAPI.getAll();
        setTimetables(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching exam timetables:", err);
        setError("Failed to load exam timetables. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchTimetables();
  }, []);

  const filteredTimetables = examType
    ? timetables.filter((t) => t.examType === examType)
    : timetables;

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Exam Timetable</h2>

        <HelpInfo
          title="Exam Timetable Help"
          description={`Page Description: View exam timetables for your class and section.`}
          steps={[
             "Timetables are loaded automatically for your class",
             "Use the filter to pick an exam type",
             "Open a PDF to view the schedule"
          ]}
        />
      </div>

      {/* Main container */}
      <div className="bg-white p-3 rounded-lg shadow-sm border">
        {/* Exam Type Filter */}
        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm font-medium text-gray-600">Filter by Exam:</label>
          <select
            className="border p-2 rounded w-64"
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
          >
            <option value="">All Exam Types</option>
            {EXAM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading timetables...</p>
        ) : error ? (
          <p className="text-center text-red-500 py-8">{error}</p>
        ) : filteredTimetables.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No exam timetables found for your class.
          </p>
        ) : (
          <div className="grid gap-3">
            {filteredTimetables.map((exam) => (
              <div
                key={exam._id}
                className="border p-4 rounded shadow bg-white flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-lg">{exam.title || exam.examType}</h4>
                  <p className="text-gray-600">
                    {exam.class?.name} - Section {exam.section?.name}
                  </p>
                  <div className="text-sm text-gray-500 mt-1">
                    Uploaded: {new Date(exam.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <a
                  href={`${FILE_BASE_URL}/uploads/${exam.file.split("/").pop()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
                >
                  <FiFileText /> Open PDF
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentExams;