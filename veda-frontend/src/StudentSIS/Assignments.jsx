import React, { useState, useEffect } from "react";
import {
  FiUpload,
  FiDownload,
  FiTrash2,
  FiClock,
  FiCheckCircle,
  FiBookOpen,
  FiEye,
} from "react-icons/fi";
import { format, isPast, parseISO } from "date-fns";
import HelpInfo from "../components/HelpInfo";
import { assignmentAPI } from "../services/assignmentAPI";
import config from "../config";

const FILE_BASE_URL = config.SERVER_URL;

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assignmentAPI.getAssignments();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to fetch assignments");
      console.error("Error fetching assignments:", err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (assignmentId, file) => {
    setFiles({ ...files, [assignmentId]: file });
  };

  const handleSubmit = async (assignmentId) => {
    const file = files[assignmentId];
    if (!file) {
      alert("Please select a file to upload");
      return;
    }

    try {
      // TODO: Implement actual submission API call
      // For now, update local state
      setAssignments((prev) =>
        prev.map((a) =>
          a._id === assignmentId
            ? { ...a, submitted: true, studentFile: file.name }
            : a
        )
      );
      setFiles({ ...files, [assignmentId]: null });
      alert("✅ Assignment submitted successfully!");
    } catch (error) {
      console.error("Error submitting assignment:", error);
      alert("Failed to submit assignment. Please try again.");
    }
  };

  const handleDelete = (assignmentId) => {
    if (window.confirm("Are you sure you want to delete this submission?")) {
      setAssignments((prev) =>
        prev.map((a) =>
          a._id === assignmentId
            ? { ...a, submitted: false, studentFile: null }
            : a
        )
      );
    }
  };

  const handleDownload = (documentPath) => {
    if (documentPath) {
      const fileUrl = `${FILE_BASE_URL}${documentPath}`;
      window.open(fileUrl, "_blank");
    }
  };

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
    <div className="p-0 m-0 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Assignments</h2>

        <HelpInfo
          title="Assignments Help"
          description={`Page Description: View and manage all assignments assigned to you. Download teacher files, upload your work, and track whether submissions are pending, submitted, or late.


2.1 Assignment Board

See every assignment card with subject, assignment type, and formatted due date.
Identify pending, submitted, or late tasks at a glance.

Sections:
- Assignment Cards: Each card displays assignment title, subject name, and assignment type (Homework/Project)
- Due Date & Late Indicator: Shows due date with clock icon and red "(Late)" badge when overdue
- Submission Status: Highlights "Submitted" with green badge or "Pending" with yellow text
- Teacher File Download: Download teacher-provided files by clicking the download link
- Upload Panel: Choose a file and click "Submit" to upload your answer before the deadline
- Submitted File View: After submission, see the uploaded file name with option to delete
- Delete & Resubmit: Remove uploaded file to resubmit a different attempt if needed`}
        />
      </div>

      {/* Main container */}
      <div className="bg-white p-3 rounded-lg shadow-sm border">
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
        ) : assignments.length === 0 ? (
          <p className="text-gray-500">No assignments assigned yet.</p>
        ) : (
          <div className="space-y-4">
            {assignments.map((a) => {
              const hasSubmission = a.submissions && a.submissions.length > 0;
              const dueDate = a.dueDate
                ? typeof a.dueDate === "string"
                  ? parseISO(a.dueDate)
                  : new Date(a.dueDate)
                : null;
              const isLate = !hasSubmission && dueDate && isPast(dueDate);
              const documentName = a.document
                ? a.document.split("/").pop()
                : null;

              return (
                <div
                  key={a._id}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
                >
                  {/* Top Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {a.title}
                      </h3>
                      <p className="text-gray-500">
                        {a.subject?.subjectName || a.subject?.name || "N/A"} •{" "}
                        {a.assignmentType || "Homework"}
                        {a.class?.name && ` • ${a.class.name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiClock className="text-gray-500" />
                      <span className="font-medium">
                        {dueDate
                          ? format(dueDate, "dd MMM yyyy")
                          : "No due date"}
                      </span>
                      {isLate && (
                        <span className="text-red-600 ml-2">(Late)</span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mb-3">
                    {hasSubmission ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <FiCheckCircle /> Submitted
                      </span>
                    ) : (
                      <span className="text-yellow-600">Pending</span>
                    )}
                  </div>

                  {/* Description */}
                  {a.description && (
                    <div className="mb-3 text-sm text-gray-600">
                      {a.description}
                    </div>
                  )}

                  {/* Teacher File */}
                  <div className="mb-3">
                    {a.document ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(a.document)}
                          className="flex items-center gap-2 text-blue-600 hover:underline"
                        >
                          <FiDownload /> {documentName}
                        </button>
                        <button
                          onClick={() =>
                            setPreviewFile(`${FILE_BASE_URL}${a.document}`)
                          }
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          title="Preview Document"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">No file attached</span>
                    )}
                  </div>

                  {/* Upload Section */}
                  <div>
                    {!hasSubmission ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="file"
                          onChange={(e) =>
                            handleFileChange(a._id, e.target.files[0])
                          }
                          className="border px-2 py-1 rounded flex-1"
                          disabled={isLate}
                        />
                        <button
                          onClick={() => handleSubmit(a._id)}
                          disabled={isLate || !files[a._id]}
                          className={`flex items-center justify-center gap-2 px-4 py-2 rounded text-white font-medium ${
                            isLate || !files[a._id]
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          <FiUpload /> Submit
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-gray-100 border px-3 py-2 rounded-md">
                        <span className="text-gray-700">
                          📂 {a.submissions[0]?.document?.split("/").pop() || "Submitted"}
                        </span>
                        <button
                          onClick={() => handleDelete(a._id)}
                          className="text-red-600 hover:text-red-800 flex items-center gap-1"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
}
