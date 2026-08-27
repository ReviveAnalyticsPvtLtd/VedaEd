import React, { useState } from "react";
import axios from "axios";
import { FiFileText } from "react-icons/fi";
import HelpInfo from "../components/HelpInfo"; 

import { useEffect } from "react";
import { dropdownAPI } from "../services/assignmentAPI";
import { examTimetableAPI } from "../services/examTimetableAPI";
import config from "../config";

const ParentExams = () => {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [selectedExam, setSelectedExam] = useState(null);
  const [allExams, setAllExams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const FILE_BASE_URL = config.SERVER_URL;

  useEffect(() => {
    const fetchParentInfo = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");
        if (!user || !user.refId) return;

        const authHeaders = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`${config.API_BASE_URL}/parents/${user.refId}`, { headers: authHeaders });
        
        if (res.data && res.data.success && res.data.parent.children) {
          const kids = res.data.parent.children;
          setChildren(kids);
          if (kids.length > 0) {
            setSelectedChildId(kids[0]._id);
          }
        }
      } catch (err) {
        console.error("Error fetching parent info:", err);
      }
    };
    fetchParentInfo();
  }, []);

  useEffect(() => {
    fetchExams();
  }, [selectedChildId]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const examsData = await examTimetableAPI.getAll({ studentId: selectedChildId });
      setAllExams(examsData);
      // Auto-select first exam if available
      if (examsData.length > 0) {
        setSelectedExam(examsData[0]);
      } else {
        setSelectedExam(null);
      }
    } catch (err) {
      console.error("Error fetching exams:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          {selectedChildId 
            ? `${children.find(c => c._id === selectedChildId)?.personalInfo?.name || "Child"}'s Exam Timetable` 
            : "Exams Timetable"}
        </h2>
        <div className="flex gap-2">
          {children.length > 1 && (
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="border px-3 py-1 rounded bg-blue-50 text-blue-700 font-medium"
            >
              {children.map((child) => (
                <option key={child._id} value={child._id}>
                  {child.personalInfo?.name || child.name}
                </option>
              ))}
            </select>
          )}
          <HelpInfo
            title="Exams Timetable"
            description={`4.6 Exams Timetable
            
View the complete exam schedule for your child.
          `}
          />
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Exam List</h3>
          {allExams.length > 1 && (
            <select
              className="border p-2 rounded text-sm"
              value={selectedExam?._id || ""}
              onChange={(e) =>
                setSelectedExam(allExams.find((ex) => ex._id === e.target.value))
              }
            >
              {allExams.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.title || ex.examType}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Result */}
        <div className="mt-6">
          {selectedExam ? (
            <div className="border p-4 rounded shadow bg-white flex items-center justify-between">
              <div>
                <p className="font-bold">{selectedExam.title || selectedExam.examType}</p>
                <p className=" text-gray-600">
                  {selectedExam.class?.name} - Section {selectedExam.section?.name}
                </p>
                <p className="text-sm text-gray-400">Uploaded: {new Date(selectedExam.createdAt).toLocaleDateString()}</p>
              </div>
              <a
                href={`${FILE_BASE_URL}/${selectedExam.file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded"
              >
                <FiFileText /> Open PDF
              </a>
            </div>
          ) : (
            <p className="text-gray-500">
              No timetable found. Please select class, section and exam.
            </p>
          )}
      </div>
    </div>
    </div>
  );
};

export default ParentExams;
