import React, { useState, useEffect } from "react";
import { FiFileText, FiSearch } from "react-icons/fi";
import HelpInfo from "../components/HelpInfo";
import { dropdownAPI } from "../services/assignmentAPI";
import { examTimetableAPI } from "../services/examTimetableAPI";
import config from "../config";

const StudentExams = () => {
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [examType, setExamType] = useState("");
  const [selectedExam, setSelectedExam] = useState(null);

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [allExams, setAllExams] = useState([]);
  const [examTypes] = useState(["Unit Test", "Half Yearly", "Final Exam", "Other"]);
  
  const FILE_BASE_URL = config.SERVER_URL;

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch Classes
      try {
        const classesData = await dropdownAPI.getClasses();
        setClasses(classesData);
      } catch (err) { console.error("Error fetching classes", err); }

      // Fetch Sections
      try {
        const sectionsData = await dropdownAPI.getSections();
        setSections(sectionsData);
      } catch (err) { console.error("Error fetching sections", err); }
      
      // Fetch All Exams
      try {
        const examsData = await examTimetableAPI.getAll();
        setAllExams(examsData);
      } catch (err) { console.error("Error fetching exams", err); }

    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const handleSearch = () => {
    // Filter exams based on selection
    // Note: database returns populated class/section, so we check their _id
    const found = allExams.find((ex) => {
      const matchClass = classId ? ex.class?._id === classId : true;
      const matchSection = sectionId ? ex.section?._id === sectionId : true;
      const matchType = examType ? ex.examType === examType : true;
      return matchClass && matchSection && matchType;
    });

    if (found) {
      setSelectedExam(found);
    } else {
      setSelectedExam(null);
      alert("No timetable found for the selected criteria.");
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Exam Timetable</h2>

        <HelpInfo
          title="Exam Timetable Help"
          description={`Page Description: Search and download exam timetables...`}
          steps={[
             "Select Class, Section, and Exam Type",
             "Click Search to find the schedule",
             "Download the PDF"
          ]}
        />
      </div>

      {/* Main container */}
      <div className="bg-white p-3 rounded-lg shadow-sm border">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <select
            className="border p-2 rounded"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </select>

          <select
            className="border p-2 rounded"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
          >
            <option value="">Select Section</option>
            {sections.map((sec) => (
              <option key={sec._id} value={sec._id}>
                {sec.name}
              </option>
            ))}
          </select>

          <select
            className="border p-2 rounded"
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
          >
            <option value="">Select Exam Title</option>
            {examTypes.map((type, idx) => (
              <option key={idx} value={type}>
                {type}
              </option>
            ))}
          </select>

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded shadow flex items-center gap-2 justify-center"
            onClick={handleSearch}
          >
            <FiSearch /> Search
          </button>
        </div>

        {/* Result */}
        <div className="mt-6">
          {selectedExam ? (
            <div className="border p-4 rounded shadow bg-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg">{selectedExam.title || selectedExam.examType}</h4>
                <p className="text-gray-600">
                  {selectedExam.class?.name} - Section {selectedExam.section?.name}
                </p>
                <div className="text-sm text-gray-500 mt-1">
                   Uploaded: {new Date(selectedExam.createdAt).toLocaleDateString()}
                </div>
              </div>
              <a
                href={`${FILE_BASE_URL}/${selectedExam.file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
              >
                <FiFileText /> Open PDF
              </a>
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded border border-dashed">
                <p className="text-gray-500">
                  Please select a Class, Section, and Exam Type to search for a timetable.
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentExams;
