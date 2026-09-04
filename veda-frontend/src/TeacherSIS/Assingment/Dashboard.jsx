// src/Teacher SIS/AssignmentDashboardUI.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { assignmentAPI, dropdownAPI } from "../../services/assignmentAPI";
import HelpInfo from "../../components/HelpInfo";
import config from "../../config";
import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";

const subjectLabel = (subject) =>
  subject && (subject.subjectName || subject.name);

// Icon Components
const ChevronDownIcon = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const PlusIcon = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const AssignmentDashboardUI = () => {
  // Base URL for uploaded files served from backend
  const FILE_BASE_URL = config.SERVER_URL;

  // State for filters
  const [statusFilter, setStatusFilter] = useState("All status");
  const [classFilter, setClassFilter] = useState("All Class");
  const [subjectFilter, setSubjectFilter] = useState("All Subject");
  const navigate = useNavigate();

  // State for preview modal
  const [previewFile, setPreviewFile] = useState(null);

  // State for assignments and loading
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for classes
  const [classes, setClasses] = useState([]);
  const [subjectGroups, setSubjectGroups] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);

  const subjectsForClassFilter = useMemo(() => {
    if (classFilter === "All Class") {
      if (Array.isArray(allSubjects) && allSubjects.length > 0) {
        return allSubjects;
      }
      const seen = new Map();
      for (const a of assignments) {
        const sub = a.subject;
        if (sub?._id) seen.set(String(sub._id), sub);
      }
      return Array.from(seen.values());
    }
    const selectedClass = classes.find((c) => c.name === classFilter);
    if (!selectedClass?._id) return [];

    const classId = selectedClass._id;
    const groupSubjects = subjectGroups
      .filter((group) => {
        const groupClassId =
          typeof group.classes === "object"
            ? group.classes?._id
            : group.classes;
        return String(groupClassId) === String(classId);
      })
      .flatMap((group) => group.subjects || [])
      .map((subjectItem) => {
        if (subjectItem && typeof subjectItem === "object") return subjectItem;
        return allSubjects.find((sub) => sub._id === subjectItem);
      })
      .filter(Boolean);

    return Array.from(
      new Map(groupSubjects.map((sub) => [String(sub._id), sub])).values()
    );
  }, [classFilter, classes, subjectGroups, allSubjects, assignments]);

  // If the class filter changes, clear subject filter when it no longer applies
  useEffect(() => {
    if (subjectFilter === "All Subject") return;
    const labels = subjectsForClassFilter
      .map(subjectLabel)
      .filter(Boolean);
    if (!labels.includes(subjectFilter)) {
      setSubjectFilter("All Subject");
    }
  }, [classFilter, subjectsForClassFilter, subjectFilter]);

  // Fetch assignments and classes from backend
  useEffect(() => {
    fetchAssignments();
    fetchClasses();
    fetchSubjectFilterMeta();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assignmentAPI.getAssignments();
      setAssignments(data);
    } catch (err) {
      setError("Failed to fetch assignments");
      console.error("Error fetching assignments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await dropdownAPI.getClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  const fetchSubjectFilterMeta = async () => {
    try {
      const [subjectsData, groupsData] = await Promise.all([
        dropdownAPI.getSubjects().catch(() => []),
        dropdownAPI.getSubjectGroups().catch(() => []),
      ]);
      setAllSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      setSubjectGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (err) {
      console.error("Error fetching subject filter data:", err);
    }
  };

  // Filter assignments based on selected filters
  const filteredAssignments = assignments.filter((assignment) => {
    const statusMatch =
      statusFilter === "All status" || assignment.status === statusFilter;
    const classMatch =
      classFilter === "All Class" || assignment.class?.name === classFilter;
    const subjectMatch =
      subjectFilter === "All Subject" ||
      subjectLabel(assignment.subject) === subjectFilter;
    return statusMatch && classMatch && subjectMatch;
  });

  // Calculate statistics
  const stats = {
    active: assignments.filter((a) => a.status === "Active").length,
    pendingReview: assignments.filter((a) => a.status === "Pending Review")
      .length,
    lateSubmission: assignments.filter((a) => a.status === "Late Submission")
      .length,
  };

  // Button handlers
  const handleCreateHomework = () => {
    navigate("/teacher/assignment/create");
  };
  const handleClearFilter = () => {
    setStatusFilter("All status");
    setClassFilter("All Class");
    setSubjectFilter("All Subject");
  };

  const handleEditAssignment = (assignmentId) => {
    // Navigate to create assignment page with edit mode
    const assignment = assignments.find((a) => a._id === assignmentId);
    if (assignment) {
      navigate("/teacher/assignment/create", {
        state: { editAssignment: assignment },
      });
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      try {
        await assignmentAPI.deleteAssignment(assignmentId);
        // Refresh the assignments list
        fetchAssignments();
        alert("Assignment deleted successfully!");
      } catch (error) {
        alert("Failed to delete assignment. Please try again.");
        console.error("Error deleting assignment:", error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Pending Review":
        return "bg-yellow-100 text-yellow-800";
      case "Late Submission":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get preview URL based on file type
  const getPreviewUrl = (fileUrl) => {
    const fileExtension = fileUrl.split(".").pop().toLowerCase();

    // For PDFs, use direct URL
    if (fileExtension === "pdf") {
      return fileUrl;
    }

    // For Word docs (.doc, .docx) and Excel files, use Microsoft Office Online Viewer
    if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(fileExtension)) {
      const encodedUrl = encodeURIComponent(fileUrl);
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
    }

    // For other files, try Google Docs Viewer
    const encodedUrl = encodeURIComponent(fileUrl);
    return `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
  };
  return (
    <div className="p-0 m-0 min-h-screen ">
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Assignment</h2>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateHomework}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Assignment
          </button>
          <HelpInfo
            title="Assignments Dashboard"
            description={`2.1 Teacher Assignments (Assignments Overview)

Manage all assignments for assigned classes. Create, edit, grade, and track assignment submissions in one place.

Sections:
- Assignments List: Display all assignments created by the teacher
- Assignment Status: View pending, submitted, and graded assignments
- Create Assignment Button: Quick access to create new assignments
- Submission Tracking: Monitor which students submitted
- Grading Interface: Grade assignments & give feedback
- Assignment Statistics: Track submission rates & average grades


2.2 Assignments Overview Card

This section displays all assignments created by the teacher along with their status.

Each assignment card includes:
- Assignment title
- Subject and class info
- Due date
- Total submissions received
- Status tags (Pending / Submitted / Graded)
- Quick actions (Edit / View / Grade)


2.3 Assignment Tools & Actions Card

Tools available inside the assignments dashboard:
- Create New Assignment
- View Student Submission List
- Open Grading Interface
- Provide written or file-based feedback
- Track assignment submission percentage
- View performance insights & average scoring trends
- Export submissions and reports as PDF/Excel
`}
            steps={[
              "View list of assignments created for each class",
              "Track submission and grading status in real-time",
              "Open grading interface to review and grade submissions",
              "Create new assignments using the Add Assignment button",
              "Check class-wise and student-wise assignment statistics",
            ]}
          />
        </div>
      </div>
{/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b overflow-x-auto">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
          Overview
        </button>
      </div>
      {/* Stat Cards Section */}
      <div className=" p-0 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white shadow-sm rounded-xl p-4 flex flex-col items-center ">
            <p className="text-sm text-gray-500">Active Number</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-2">
              {stats.active}
            </h3>
          </div>
          <div className="bg-white shadow-sm rounded-xl p-4 flex flex-col items-center ">
            <p className="text-sm text-gray-500">Review Pending</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-2">
              {stats.pendingReview}
            </h3>
          </div>
          <div className="bg-white shadow-sm rounded-xl p-4 flex flex-col items-center ">
            <p className="text-sm text-gray-500">Late Submission</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-2">
              {stats.lateSubmission}
            </h3>
          </div>
        </div>
      </div>
      {/* Assignment Table */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
        <h3 className="text-lg font-semibold mb-4">Assignment List</h3>
        <div className="flex items-end gap-3 w-full mb-4">
          {/* Status */}
          <div className="flex flex-col w-40">
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border px-3 py-2 rounded-md bg-white text-sm"
            >
              <option>All status</option>
              <option>Active</option>
              <option>Pending Review</option>
              <option>Late Submission</option>
            </select>
          </div>

          {/* Class */}
          <div className="flex flex-col w-40">
            <select
              id="class"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="border px-3 py-2 rounded-md bg-white text-sm"
            >
              <option>All Class</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls.name}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject — options follow selected class (subject groups) */}
          <div className="flex flex-col w-40 min-w-[10rem]">
            <select
              id="subject"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="border px-3 py-2 rounded-md bg-white text-sm"
            >
              <option value="All Subject">All Subject</option>
              {subjectsForClassFilter.map((sub) => {
                const label = subjectLabel(sub);
                if (!label) return null;
                return (
                  <option key={sub._id} value={label}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Clear Filter */}
          <button
            onClick={handleClearFilter}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border rounded-md hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Showing {filteredAssignments.length} assignments
        </p>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading assignments...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchAssignments}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <table className="w-full border ">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">S.No</th>
                  <th className="p-2 border">Assignment</th>
                  <th className="p-2 border">Class</th>
                  <th className="p-2 border">Subject</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Due Date</th>
                  <th className="p-2 border">Submissions</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment, idx) => (
                  <tr
                    key={assignment._id}
                    className="text-center hover:bg-gray-50"
                  >
                    {/* Index */}
                    <td className="p-2 border">{idx + 1}</td>

                    {/* Title + Created Date */}
                    <td className="p-2 border text-left">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {assignment.title}
                        </span>
                        <span className="text-xs text-gray-500">
                          Created:{" "}
                          {new Date(assignment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="p-2 border">
                      {assignment.class?.name || "N/A"}
                    </td>

                    {/* Subject */}
                    <td className="p-2 border">
                      {subjectLabel(assignment.subject) || "N/A"}
                    </td>

                    {/* Status */}
                    <td className="p-2 border">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          assignment.status
                        )}`}
                      >
                        {assignment.status}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="p-2 border">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </td>

                    {/* Submissions */}
                    <td className="p-2 border">
                      {assignment.submissions?.length || 0}
                    </td>

                    {/* Actions */}
                    <td className="p-2 border">
                      <div className="flex items-center justify-center gap-2">
                        {assignment.document && (
                          <button
                            onClick={() =>
                              setPreviewFile(
                                `${FILE_BASE_URL}${assignment.document}`
                              )
                            }
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Preview Document"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditAssignment(assignment._id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Edit Assignment"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(assignment._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Assignment"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {filteredAssignments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No assignments found matching your filters.
              </p>
              <button
                onClick={handleClearFilter}
                className="mt-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                Clear filters to see all assignments
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">File Preview</h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex items-center justify-center">
              {getPreviewUrl(previewFile) ? (
                <iframe
                  src={getPreviewUrl(previewFile)}
                  className="w-full h-full border-0"
                  title="File Preview"
                />
              ) : (
                <div className="text-center p-8">
                  <p className="text-gray-600 mb-4">
                    This file type cannot be previewed directly on localhost.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Please download the file to view it.
                  </p>
                  <a
                    href={previewFile}
                    download
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentDashboardUI;
