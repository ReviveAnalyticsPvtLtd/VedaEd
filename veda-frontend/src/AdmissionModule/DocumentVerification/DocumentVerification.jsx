import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../../config";
import {
  FiFileText,
  FiEye,
  FiX,
  FiSearch,
  FiFilter,
  FiDownload,
  FiAlertCircle,
  FiClock,
  FiUser,
  FiBookOpen,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import HelpInfo from "../../components/HelpInfo";

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      icon: <FiClock />,
      label: "Pending",
    },
    Pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      icon: <FiClock />,
      label: "Pending",
    },
    verified: {
      bg: "bg-green-100",
      text: "text-green-800",
      icon: <FiCheckCircle />,
      label: "Verified",
    },
    Verified: {
      bg: "bg-green-100",
      text: "text-green-800",
      icon: <FiCheckCircle />,
      label: "Verified",
    },
    rejected: {
      bg: "bg-red-100",
      text: "text-red-800",
      icon: <FiXCircle />,
      label: "Rejected",
    },
    Rejected: {
      bg: "bg-red-100",
      text: "text-red-800",
      icon: <FiXCircle />,
      label: "Rejected",
    },
  };

  const config = statusConfig[status] || statusConfig.Pending;

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.icon} {config.label}
    </span>
  );
};


export default function DocumentVerification() {
  const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 5; // 👈 ek page me 5 students
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationComment, setVerificationComment] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("Pending");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
  });

  const filterStudents = useCallback(() => {
    let filtered = students.filter((student) => {
      const nameMatch = student.personalInfo?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const idMatch = student.personalInfo?.stdId
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const studentMatch = nameMatch || idMatch;

      if (statusFilter === "all") return studentMatch;

      const hasDocumentsWithStatus = student.documents?.some(
        (doc) => (doc.verificationStatus || "").toLowerCase() === statusFilter.toLowerCase()
      );
      return studentMatch && hasDocumentsWithStatus;
    });

    setFilteredStudents(filtered);
  }, [students, searchTerm, statusFilter]);
const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

const paginatedStudents = filteredStudents.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);
  const calculateStats = useCallback(() => {
    let total = 0;
    let pending = 0;
    let verified = 0;
    let rejected = 0;

    students.forEach((student) => {
      if (student.documents && student.documents.length > 0) {
        student.documents.forEach((doc) => {
          total++;
          const status = (doc.verificationStatus || "Pending").toLowerCase();
          if (status === "pending") pending++;
          else if (status === "verified") verified++;
          else if (status === "rejected") rejected++;
        });
      }
    });

    setStats({ total, pending, verified, rejected });
  }, [students]);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [filterStudents]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const [applicationsRes, interviewRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/admission/application`),
        axios.get(`${config.API_BASE_URL}/admission/interview`),
      ]);

      const qualifiedInterviewApplicationIds = new Set(
        (Array.isArray(interviewRes?.data) ? interviewRes.data : [])
          .filter(
            (candidate) =>
              String(candidate?.result || "").toLowerCase() === "qualified" &&
              candidate?.applicationIdRef
          )
          .map((candidate) => String(candidate.applicationIdRef))
      );

      if (applicationsRes.data.success && Array.isArray(applicationsRes.data.data)) {
        // Map application data to structure expected by UI
        const mappedData = applicationsRes.data.data.map((app) => ({
             _id: app._id,
             // Use applicationId for display if available, else standard ID
             personalInfo: {
                 name: app.personalInfo?.name || "N/A",
                 stdId: app.applicationId || "N/A", 
                 rollNo: "N/A", // Not assigned yet
                 class: app.personalInfo?.classApplied ||  "N/A",
                 section: "N/A",
             },
             documents: (app.documents || []).map(doc => ({
                 _id: doc._id || doc.name, // Fallback ID
                 name: doc.name,
                 path: doc.path,
                 size: doc.size,
                 uploadedAt: doc.uploadedAt,
                 verificationStatus: doc.verificationStatus || "pending", // You might need to add this field to your doc schema if valid status is per-doc
                 verifiedBy: "",
                 verifiedAt: null,
                 comment: "",
                 type: doc.type // preserve type
             }))
        }));

        // Document Verification should only include students with Interview Result = Qualified.
        const qualifiedStudents = mappedData.filter((app) =>
          qualifiedInterviewApplicationIds.has(String(app._id))
        );

        // Filter out apps with no documents to keep the list actionable.
        const appsWithDocs = qualifiedStudents.filter((app) => app.documents.length > 0);
        setStudents(appsWithDocs);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      // setStudents([]); // Clear on error or keep empty
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewDocument = async (doc, studentId) => {
    try {
      if (doc.path) {
          // Construct URL properly. Assuming backend serves 'uploads' statically
          // If path is absolute or relative, ensure it maps to http://localhost:5000/uploads/...
          // The backend saves path like 'public\uploads\file.pdf' or similar. 
          // We need to normalize it.
          // For now, let's assume backend serves /uploads.
          
          let cleanPath = doc.path.replace(/\\/g, "/"); // Normalize windows slashes
          // If path contains 'public/uploads', strip it or adjust
          if (cleanPath.includes("public/")) {
              cleanPath = cleanPath.split("public/")[1];
          }
          
          const fileUrl = `http://localhost:5000/${cleanPath}`;
          setPreviewDoc({ ...doc, url: fileUrl, studentId });
      }
    } catch (err) {
      console.error("Error previewing document:", err);
    }
  };

  const handleOpenVerificationModal = (doc, student) => {
    setSelectedDocument(doc);
    setSelectedStudent(student);
    setVerificationStatus(doc.verificationStatus || "pending");
    setVerificationComment(doc.comment || "");
    setShowVerificationModal(true);
  };

  const handleVerifyDocument = async () => {
    if (!selectedDocument || !selectedStudent) return;

    setLoading(true);
    try {
      // Update document verification status via API
      const res = await axios.put(
        `${config.API_BASE_URL}/admission/application/${selectedStudent._id}/document/${selectedDocument._id}/verify`,
        {
          status: verificationStatus,
          comment: verificationComment,
        }
      );

      if (res.data.success) {
        // Update local state
        const updatedStudents = students.map((student) => {
          if (student._id === selectedStudent._id) {
            const updatedDocs = student.documents.map((doc) => {
              if (doc._id === selectedDocument._id) {
                return {
                  ...doc,
                  verificationStatus,
                  comment: verificationComment,
                  verifiedBy: "Admin",
                  verifiedAt: new Date(),
                };
              }
              return doc;
            });
            return { ...student, documents: updatedDocs };
          }
          return student;
        });

        setStudents(updatedStudents);
        setShowVerificationModal(false);
        setSelectedDocument(null);
        setSelectedStudent(null);
        setVerificationComment("");
      }
    } catch (err) {
      console.error("Error verifying document:", err);
      alert("Failed to update document status");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (doc) => {
    if (!doc?.path) return;

    try {
      let cleanPath = doc.path.replace(/\\/g, "/");
      if (cleanPath.includes("public/")) {
        cleanPath = cleanPath.split("public/")[1];
      }
      const fileUrl = `http://localhost:5000/${cleanPath}`;

      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = doc.name || "document";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Error downloading document:", err);
      alert("Failed to download document");
    }
  };

  const getDocumentType = (fileName) => {
    const ext = fileName.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif"].includes(ext)) return "Image";
    if (ext === "pdf") return "PDF";
    if (["doc", "docx"].includes(ext)) return "Word";
    return "Document";
  };

  const formatDateDayMonthYear = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="p-0 m-0 min-h-screen mb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <h2 className="text-2xl font-bold">Document Verification</h2>
        <HelpInfo
          title="Document Verification Help"
          description={`1.1 Overview

This page is used to verify and manage student documents submitted for admission or academic purposes. It provides a clear status overview and detailed document information.

2.1 Document Status Summary

- Total Documents: Total number of documents uploaded by students.
- Pending: Documents awaiting verification.
- Verified: Documents that have been checked and approved.
- Rejected: Documents that did not meet verification criteria and were rejected.

3.1 Document Search and Filters

Use the search bar to find documents by student name or ID. Filter documents based on their status (All, Pending, Verified, Rejected).

4.1 Document Details List

For each student, you will see:

- Student Name, Class, ID, and Roll Number for identification.
- Documents Count: Number of documents uploaded by the student.
- Document File Name with format (e.g., PDF) and size.
- Upload Date: When the document was submitted.
- Verification Date: When the document was verified (if applicable).
- Note: Any remarks related to the verification.
- Status: Current verification status — Pending, Verified, or Rejected.

Use this page to carefully verify each document and update the status accordingly.`}
        />
      </div>

      <div className="bg-white p-4 rounded-lg border">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className=" text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.total}
                </p>
              </div>
              <FiFileText className="text-blue-500 text-3xl" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.pending}
                </p>
              </div>
              <FiClock className="text-yellow-500 text-3xl" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className=" text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.verified}
                </p>
              </div>
              <FiCheckCircle className="text-green-500 text-3xl" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className=" text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.rejected}
                </p>
              </div>
              <FiXCircle className="text-red-500 text-3xl" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-3">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name or ID..."
                value={searchTerm}
               onChange={(e) => {
  setSearchTerm(e.target.value);
  setCurrentPage(1);
}}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <FiFilter className="text-gray-500" />
              <select
                value={statusFilter}
               onChange={(e) => {
  setStatusFilter(e.target.value);
  setCurrentPage(1);
}}
                className="border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full lg:w-auto"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

       <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
  <table className="w-full border-collapse min-w-[980px]">
    <thead className="bg-gray-100 text-left">
      <tr className="text-sm text-gray-700">
         <th className="p-3 border text-center">S.No</th>
        <th className="p-3 border">Student</th>
        <th className="p-3 border">Class</th>
        <th className="p-3 border">Student ID</th>
        <th className="p-3 border">Document</th>
        <th className="p-3 border">Type</th>
        <th className="p-3 border">Uploaded</th>
        <th className="p-3 border">Status</th>
        <th className="p-3 border text-center">Actions</th>
      </tr>
    </thead>

   <tbody>
  {paginatedStudents.map((student) =>
    student.documents.map((doc, index) => (
      <tr key={doc._id} className="text-sm hover:bg-gray-50">
{/* S.No — sirf first row */}
{index === 0 ? (
  <td
    className="p-3 border text-center font-semibold"
    rowSpan={student.documents.length}
  >
    {(currentPage - 1) * itemsPerPage +
      paginatedStudents.indexOf(student) +
      1}
  </td>
) : null}
        {/* NAME — sirf first row */}
        {index === 0 ? (
          <td
            className="p-3 border"
            rowSpan={student.documents.length}
          >
            <div className="font-medium">
              {student.personalInfo.name}
            </div>
          </td>
        ) : null}

        {/* CLASS — sirf first row */}
        {index === 0 ? (
          <td
            className="p-3 border"
            rowSpan={student.documents.length}
          >
            {student.personalInfo.class}
          </td>
        ) : null}

        {/* ID — sirf first row */}
        {index === 0 ? (
          <td
            className="p-3 border"
            rowSpan={student.documents.length}
          >
            {student.personalInfo.stdId}
          </td>
        ) : null}

        {/* DOCUMENT NAME */}
        <td className="p-3 border">
          {doc.name}
        </td>

        {/* TYPE */}
        <td className="p-3 border">
          {getDocumentType(doc.name)}
        </td>

        {/* UPLOADED DATE */}
        <td className="p-3 border">{formatDateDayMonthYear(doc.uploadedAt)}</td>

        {/* STATUS */}
        <td className="p-3 border">
          <StatusBadge status={doc.verificationStatus} />
        </td>

        {/* ACTIONS — SAME AS BEFORE (HAR ROW ME) */}
        <td className="p-3 border text-center">
          <div className="flex justify-center gap-2">
            <button
              onClick={() => handlePreviewDocument(doc, student._id)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
            >
              <FiEye />
            </button>

            <button
              onClick={() => handleDownloadDocument(doc)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              <FiDownload />
            </button>

            <button
              onClick={() =>
                handleOpenVerificationModal(doc, student)
              }
              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
            >
              <FiAlertCircle />
            </button>
          </div>
        </td>

      </tr>
    ))
  )}
</tbody>
  </table>
  
</div>
<div className="flex flex-col sm:flex-row justify-between sm:items-center px-4 py-3 gap-2">
  <span className="text-sm text-gray-600">
    Page {currentPage} of {totalPages || 1}
  </span>

  <div className="flex gap-2">
    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((p) => p - 1)}
      className="px-4 py-1 border rounded disabled:opacity-50"
    >
      Previous
    </button>

    <button
      disabled={currentPage === totalPages || totalPages === 0}
      onClick={() => setCurrentPage((p) => p + 1)}
      className="px-4 py-1 border rounded disabled:opacity-50"
    >
      Next
    </button>
  </div>
</div>


                
      {/* Document Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white p-6 rounded-lg max-w-4xl max-h-[90vh] overflow-auto w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">{previewDoc.name}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              {previewDoc.isDummy ? (
                <div className="text-center py-12">
                  <FiFileText className="mx-auto text-5xl text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2 font-medium">
                    Dummy Data Preview
                  </p>
                  <p className="text-gray-500  mb-3">
                    This is sample data for demonstration purposes.
                  </p>
                  <p className="text-gray-600  mb-3">
                    <strong>Document:</strong> {previewDoc.name}
                  </p>
                  <p className="text-gray-500 ">
                    When connected to backend, actual document preview will be
                    shown here.
                  </p>
                </div>
              ) : previewDoc.path?.endsWith(".pdf") ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-[70vh] border rounded"
                  title={previewDoc.name}
                />
              ) : previewDoc.path?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.name}
                  className="max-w-full h-auto mx-auto"
                />
              ) : (
                <div className="text-center py-12">
                  <FiFileText className="mx-auto text-5xl text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-3">
                    Preview not available for this file type
                  </p>
                  <button
                    onClick={() => handleDownloadDocument(previewDoc)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 mx-auto"
                  >
                    <FiDownload /> Download to view
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && selectedDocument && selectedStudent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowVerificationModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Verify Document</h3>
              <button
                onClick={() => setShowVerificationModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="mb-3">
              <p className=" text-gray-600 mb-2">Student:</p>
              <p className="font-medium">
                {selectedStudent.personalInfo?.name}
              </p>
            </div>

            <div className="mb-3">
              <p className="text-gray-600 mb-2">Document:</p>
              <p className="font-medium">{selectedDocument.name}</p>
            </div>

            <div className="mb-3">
              <label className="block font-medium mb-2">
                Verification Status *
              </label>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value)}
                className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block  font-medium mb-2">
                Comment / Notes
              </label>
              <textarea
                value={verificationComment}
                onChange={(e) => setVerificationComment(e.target.value)}
                rows="4"
                placeholder="Add any comments or notes about this document..."
                className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowVerificationModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyDocument}
                disabled={loading}
                className={`px-6 py-2 rounded-lg text-white flex items-center gap-2 ${
                  verificationStatus === "verified"
                    ? "bg-green-500 hover:bg-green-600"
                    : verificationStatus === "rejected"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                } disabled:opacity-50`}
              >
                {loading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    {verificationStatus === "verified" ? (
                      <>
                        <FiCheckCircle /> Verify Document
                      </>
                    ) : verificationStatus === "rejected" ? (
                      <>
                        <FiXCircle /> Reject Document
                      </>
                    ) : (
                      <>
                        <FiClock /> Update Status
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    {/* Bottom Navigation – Back & Next (NOT FIXED) */}
<div className="fixed bottom-4 left-4 right-4 md:left-[calc(16rem+1rem)] md:right-8 flex flex-col sm:flex-row justify-between gap-2 z-40">

  {/* BACK */}
  <button
    onClick={() => navigate("/admission/interview-list")}
    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 w-full sm:w-auto"
  >
    Back
  </button>

  {/* NEXT */}
  <button
    onClick={() => navigate("/admission/selected-student")}
    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold w-full sm:w-auto"
  >
    Next →
  </button>
</div>
    </div>
  );
}
