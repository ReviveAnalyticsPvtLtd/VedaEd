import React, { useState, useEffect } from "react";
import { FiUpload, FiTrash2, FiFileText, FiEdit2 } from "react-icons/fi";
import HelpInfo from "../components/HelpInfo";
import { dropdownAPI } from "../services/assignmentAPI"; // Reusing for class/section
import { examTimetableAPI } from "../services/examTimetableAPI";
import config from "../config";

const TeacherExams = () => {
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [examType, setExamType] = useState("");
  const [title, setTitle] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  
  const [examList, setExamList] = useState([]);
  const [classes, setClasses] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const examTypes = ["Unit Test", "Half Yearly", "Final Exam", "Other"];
  const FILE_BASE_URL = config.SERVER_URL;

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const updateSectionsByClass = async () => {
      if (!classId) {
        setSections(allSections);
        if (sectionId) setSectionId("");
        return;
      }

      const selectedClass = classes.find((cls) => cls._id === classId);
      let nextSections = [];

      if (selectedClass && Array.isArray(selectedClass.sections)) {
        nextSections = selectedClass.sections
          .map((sec) => {
            if (sec && typeof sec === "object") return sec;
            return allSections.find((s) => s._id === sec);
          })
          .filter(Boolean);
      }

      // Fallback: explicit API call when class payload does not include sections
      if (nextSections.length === 0) {
        try {
          const sectionsByClass = await dropdownAPI.getSectionsByClass(classId);
          nextSections = Array.isArray(sectionsByClass) ? sectionsByClass : [];
        } catch (error) {
          console.error("Error fetching sections by class:", error);
          nextSections = [];
        }
      }

      setSections(nextSections);

      if (!nextSections.some((sec) => sec._id === sectionId)) {
        setSectionId("");
      }
    };

    updateSectionsByClass();
  }, [classId, classes, allSections, sectionId]);

  const fetchInitialData = async () => {
    // Fetch Classes
    try {
      const classesData = await dropdownAPI.getClasses();
      setClasses(classesData);
    } catch (error) {
       console.error("Error fetching classes:", error);
    }

    // Fetch Sections
    try {
      const sectionsData = await dropdownAPI.getSections();
      setAllSections(sectionsData);
      setSections(sectionsData);
    } catch (error) {
       console.error("Error fetching sections:", error);
    }

    // Fetch Exam Timetables
    try {
      const timetablesData = await examTimetableAPI.getAll();
      setExamList(timetablesData);
    } catch (error) {
      console.error("Error fetching exam timetables:", error);
      // Do not alert here to allow other data to show
    }
  };

  const resetForm = () => {
    setTitle("");
    setClassId("");
    setSectionId("");
    setExamType("");
    setPdfFile(null);
    setEditingId(null);
  };

  const handleSave = async () => {
    setUploadError("");

    const needsFile = !editingId;
    if (!classId || !sectionId || !examType || !title || (needsFile && !pdfFile)) {
      const validationMessage = needsFile
        ? "Please select all fields and upload a file."
        : "Please select all required fields.";
      setUploadError(validationMessage);
      alert(validationMessage);
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("classId", classId);
      formData.append("sectionId", sectionId);
      formData.append("examType", examType);
      if (pdfFile) formData.append("file", pdfFile);

      if (editingId) {
        await examTimetableAPI.update(editingId, formData);
      } else {
        await examTimetableAPI.upload(formData);
      }
      
      // Refresh list
      const updatedList = await examTimetableAPI.getAll();
      setExamList(updatedList);
      
      // Reset form
      resetForm();
      setUploadError("");
      alert(editingId ? "Exam timetable updated successfully!" : "Exam timetable uploaded successfully!");
    } catch (error) {
      const errorMessage = error.message || "Upload failed";
      setUploadError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exam) => {
    setUploadError("");
    setEditingId(exam._id);
    setTitle(exam.title || "");
    setClassId(exam.class?._id || "");
    setSectionId(exam.section?._id || "");
    setExamType(exam.examType || "");
    setPdfFile(null);
  };

  const handleCancelEdit = () => {
    setUploadError("");
    resetForm();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this timetable?")) return;
    try {
      await examTimetableAPI.delete(id);
      setExamList(prev => prev.filter(item => item._id !== id));
    } catch (error) {
      alert("Failed to delete");
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Teacher Exam Timetable</h2>

        <HelpInfo
          title="Teacher Exams"
          description={`2.1 Teacher Exams (Exams Overview)
Manage exam schedules, create exam papers...`} 
          steps={[
            "View and upload exam timetables",
            "Select Class, Section and Exam Type",
            "Upload PDF file for the schedule"
          ]}
        />
      </div>
{/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b overflow-x-auto">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
          Overview
        </button>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">
          {editingId ? "Update Exam Timetable" : "Upload New Exam Timetable"}
        </h3>

        {uploadError && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {uploadError}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3 mb-6 bg-gray-50 p-4 rounded-lg border">
            {/* Title */}
            <div className="flex flex-col">
              <label className="block mb-1 text-sm font-medium">Title</label>
              <input
                type="text"
                placeholder="e.g. Unit Test 1 Schedule"
                className="border px-3 py-2 rounded-md bg-white w-[200px]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Class */}
            <div className="flex flex-col">
              <label className="block mb-1 text-sm font-medium">Class</label>
              <select
                className="border px-3 py-2 rounded-md bg-white w-[150px]"
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
            </div>

            {/* Section */}
            <div className="flex flex-col">
              <label className="block mb-1 text-sm font-medium">Section</label>
              <select
                className="border px-3 py-2 rounded-md bg-white w-[150px]"
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
            </div>

            {/* Exam Type */}
            <div className="flex flex-col">
              <label className="block mb-1 text-sm font-medium">Exam Type</label>
              <select
                className="border px-3 py-2 rounded-md bg-white w-[150px]"
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
              >
                <option value="">Select Type</option>
                {examTypes.map((type, idx) => (
                  <option key={idx} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div className="flex flex-col">
              <label className="block mb-1 text-sm font-medium">
                {editingId ? "Replace PDF (Optional)" : "Upload PDF"}
              </label>
              <input
                type="file"
                accept="application/pdf"
                className="border px-2 py-1.5 rounded-md bg-white w-[200px]"
                onChange={(e) => setPdfFile(e.target.files[0])}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                className={`flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleSave}
                disabled={loading}
              >
                <FiUpload /> {loading ? (editingId ? "Updating..." : "Uploading...") : (editingId ? "Update" : "Upload")}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
            </div>
        </div>

        {/* Uploaded List */}
        <div>
          <h4 className="text-md font-semibold mb-3">Uploaded Timetables</h4>
          {examList.length === 0 ? (
            <p className="text-gray-500 italic p-4 text-center border rounded-lg border-dashed">No exam timetables uploaded yet.</p>
          ) : (
            <div className="grid gap-3">
              {examList.map((exam) => (
                <div
                  key={exam._id}
                  className="flex justify-between items-center border p-4 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <FiFileText size={24} />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-800">{exam.title}</h5>
                      <div className="flex gap-2 text-sm text-gray-500 mt-1">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-600">
                             {exam.class?.name} - {exam.section?.name}
                        </span>
                        <span>•</span>
                        <span>{exam.examType}</span>
                        <span>•</span>
                        <span>{new Date(exam.createdAt).toLocaleDateString()}</span>
                      </div>
                      <a
                        href={`${FILE_BASE_URL}/${exam.file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline text-sm mt-1 inline-block"
                      >
                        View Document
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      onClick={() => handleEdit(exam)}
                      title="Edit"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      onClick={() => handleDelete(exam._id)}
                      title="Delete"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherExams;
