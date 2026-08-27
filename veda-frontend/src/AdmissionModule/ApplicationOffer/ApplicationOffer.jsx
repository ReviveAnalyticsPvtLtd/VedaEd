import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../../config";
import {
  FiUser,
  FiMail,
  FiSend,
  FiX,
  FiSearch,
  FiFilter,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiEye,
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
  offer_sent: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    icon: <FiMail />,
    label: "Offer Sent",
  },
};


  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.icon} {config.label}
    </span>
  );
};

// Standard Admission Offer Template
const ADMISSION_OFFER_TEMPLATE = {
  id: "tpl1",
  name: "Standard Admission Offer",
  subject: "Congratulations! Admission Offer Letter - {{student_name}}",
  content: `Dear {{parent_name}},

Congratulations! We are pleased to inform you that {{student_name}} has been selected for admission to {{class_name}} at our institution.

**Admission Details:**
- Student Name: {{student_name}}
- Application ID: {{application_id}}
- Class: {{class_name}}
- Academic Year: {{academic_year}}
- Admission Date: {{admission_date}}

**Next Steps:**
- Pay the admission fee

We look forward to welcoming {{student_name}} to our institution.

Best regards,
Admission Office
{{school_name}}`,
};

const mapApiStudentToOfferStudent = (student) => ({
  _id: student._id,
  personalInfo: {
    name: student.personalInfo?.name || "Unknown Student",
    stdId: student.applicationId || "N/A",
    class: student.personalInfo?.classApplied ||  "N/A",
  },
  parents: student.parents || {},
  email: student.contactInfo?.email || "N/A",
  phone: student.contactInfo?.phone || "N/A",
  offerStatus: student.offerStatus || "pending",
  offerSentAt: student.offerSentAt || null,
  selectedDate: student.updatedAt || student.createdAt || null,
});

export default function ApplicationOffer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewMessage, setPreviewMessage] = useState("");
  const [admissionFrom, setAdmissionFrom] = useState("");
const [admissionTo, setAdmissionTo] = useState("");
const [schoolName, setSchoolName] = useState("");
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    offer_sent: 0,
    
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
      return studentMatch && student.offerStatus === statusFilter;
    });

    setFilteredStudents(filtered);
  }, [students, searchTerm, statusFilter]);
const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;

const paginatedStudents = filteredStudents.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, statusFilter]);
  const calculateStats = useCallback(() => {
  let total = students.length;
  let pending = 0;
  let offer_sent = 0;

  students.forEach((student) => {
    if (student.offerStatus === "pending") {
      pending++;
    } else if (student.offerStatus === "offer_sent") {
      offer_sent++;
    }
  });

  setStats({
    total,
    pending,
    offer_sent,
  });
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
      const res = await axios.get(
        `${config.API_BASE_URL}/admission/application/selected`
      );
      if (res.data.success && Array.isArray(res.data.data)) {
        setStudents(res.data.data.map(mapApiStudentToOfferStudent));
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error("Error fetching selected students:", err);
      setStudents([]);
      alert("Unable to fetch selected students.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      }
      return [...prev, studentId];
    });
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s) => s._id));
    }
  };

  const replaceTemplateVariables = (template, student) => {
    let content = template.content;
    let subject = template.subject;

    const variables = {
      student_name: student.personalInfo?.name || "Student",
      parent_name: student.parents?.father?.name || "Parent",
      application_id: student.personalInfo?.stdId || "N/A",
      class_name: student.personalInfo?.class || "N/A",
      academic_year:
        new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
     admission_date:
  admissionFrom && admissionTo
    ? `${admissionFrom} to ${admissionTo}`
    : "To be announced",

      
     school_name: schoolName || "School Name",

      scholarship_percentage: student.testScore > 90 ? "25" : "15",
    };

    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      content = content.replace(regex, variables[key]);
      subject = subject.replace(regex, variables[key]);
    });

    return { content, subject };
  };

  const handlePreviewOffer = (student) => {
    const { content, subject } = replaceTemplateVariables(
      ADMISSION_OFFER_TEMPLATE,
      student
    );
    setPreviewMessage(content);
    setShowPreviewModal(true);
  };

  const handleSendOffer = async (studentIds) => {
    setLoading(true);
    try {
      const studentsToSend = students.filter((s) => studentIds.includes(s._id));
      const offerSentAt = new Date().toISOString();

      await Promise.all(
        studentsToSend.map(async (student) => {
          const { content, subject } = replaceTemplateVariables(
            ADMISSION_OFFER_TEMPLATE,
            student
          );

          await axios.put(
            `${config.API_BASE_URL}/admission/application/${student._id}`,
            {
              offerStatus: "offer_sent",
              offerSentAt,
              offerSubject: subject,
              offerContent: content,
            }
          );
        })
      );

      const updatedStudents = students.map((student) =>
        studentIds.includes(student._id)
          ? { ...student, offerStatus: "offer_sent", offerSentAt }
          : student
      );

      setStudents(updatedStudents);
      setSelectedStudents([]);
      setShowTemplateModal(false);
      alert(
        `Offer letters sent successfully to ${studentsToSend.length} student(s)!`
      );
    } catch (err) {
      console.error("Error sending offers:", err);
      alert("Error sending offers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen mb-14">
      

      {/* Page title */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-bold">Application Offer</h2>
        <HelpInfo
          title="Application Offer Help"
          description={`1.1 Overview

This page manages the offer process for student applications, tracking their selection status and communicating offers.

2.1 Offer Status Summary

- Total Selected: Number of students shortlisted for offers.
- Pending: Applications for which offers are yet to be sent.
- Offer Sent: Applications for which offer letters have been dispatched.
- Accepted: Students who have accepted the offer.
- Rejected: Students who have declined the offer.

3.1 Search and Filter

Use the search bar to find applications by student name or ID. Filter applications by status to view specific groups.

4.1 Application Details List

Each entry includes:

- Student Name, ID, and Class for identification.
- Email and Phone for communication.
- Current Status of the offer process (Pending, Offer Sent, Accepted, Rejected).
- Test Score and Interview Score reflecting applicant evaluation.
- Selected Date indicating when the student was shortlisted.
- Options to Preview Offer and Send Offer to manage communications.

Use this page to efficiently track and manage application offers and ensure timely communication with candidates.`}
        />
      </div>
 {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
          Overview
        </button>
      </div>
     
        {/* ================= STATISTICS SECTION ================= */}
<div className="mb-8">
  <div className="grid grid-cols-3 gap-4">
    
    {/* Total Selected */}
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">
            Total Selected
          </p>
          <p className="text-2xl font-bold text-gray-800">
            {stats.total}
          </p>
        </div>
        <FiCheckCircle className="text-blue-500 text-3xl" />
      </div>
    </div>

    {/* Pending */}
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">
            Pending
          </p>
          <p className="text-2xl font-bold text-gray-800">
            {stats.pending}
          </p>
        </div>
        <FiClock className="text-yellow-500 text-3xl" />
      </div>
    </div>

    {/* Offer Sent */}
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">
            Offer Sent
          </p>
          <p className="text-2xl font-bold text-gray-800">
            {stats.offer_sent}
          </p>
        </div>
        <FiMail className="text-blue-500 text-3xl" />
      </div>
    </div>

  </div>
</div>


        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
          <div className="flex gap-4 items-center mb-3">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="offer_sent">Offer Sent</option>
                
              </select>
            </div>
          </div>
       

        {/* Selected Students Actions */}
        {selectedStudents.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3 ">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiCheckCircle className="text-blue-600" />
                <span className="font-medium text-blue-900">
                  {selectedStudents.length} student(s) selected
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedStudents([])}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Selection
                </button>
                <button
                  onClick={() => {
                    if (selectedStudents.length > 0) {
                      setShowTemplateModal(true);
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  <FiSend /> Send Offer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main content box */}
       {/* Students Table */}
<div className="overflow-x-auto">
  <table className="min-w-full w-full border border-gray-200 text-sm border-collapse">
    <thead className="bg-gray-100">
      <tr>
        <th className="p-2 border text-center">
          <input
            type="checkbox"
            checked={
              selectedStudents.length === filteredStudents.length &&
              filteredStudents.length > 0
            }
            onChange={handleSelectAll}
          />
        </th>
        <th className="p-2 border text-center">S.No</th>
        <th className="p-2 border text-left">Student Name</th>
        <th className="p-2 border text-left">Application ID</th>
        <th className="p-2 border text-left">Class</th>
        <th className="p-2 border text-left">Email</th>
        <th className="p-2 border text-left">Phone</th>
        <th className="p-2 border text-left">Selected Date</th>
        <th className="p-2 border text-left">Status</th>
        <th className="p-2 border text-center">Actions</th>
      </tr>
    </thead>

    <tbody>
    {paginatedStudents.map((student, index) => (
        <tr key={student._id} className="hover:bg-gray-50">
          <td className="p-2 border text-center">
            <input
              type="checkbox"
              checked={selectedStudents.includes(student._id)}
              onChange={() => handleSelectStudent(student._id)}
            />
          </td>
<td className="p-2 border text-center font-medium">
  {(currentPage - 1) * itemsPerPage + index + 1}
</td>
          <td className="p-2 border font-medium">
            {student.personalInfo?.name || "Unknown Student"}
          </td>

          <td className="p-2 border">
            {student.personalInfo?.stdId || "N/A"}
          </td>

          <td className="p-2 border">
            {student.personalInfo?.class || "N/A"}
          </td>

          <td className="p-2 border">
            {student.email || "N/A"}
          </td>

          <td className="p-2 border">
            {student.phone || "N/A"}
          </td>

          <td className="p-2 border">
            {student.selectedDate
              ? new Date(student.selectedDate).toLocaleDateString()
              : "N/A"}
          </td>

          <td className="p-2 border">
            <StatusBadge status={student.offerStatus} />
          </td>

          <td className="p-2 border text-center">
            <div className="flex justify-center gap-2">
              <button
                onClick={() => handlePreviewOffer(student)}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 flex items-center gap-1"
              >
                <FiEye size={14} /> 
              </button>

              <button
                onClick={() => {
                  setSelectedStudents([student._id]);
                  setShowTemplateModal(true);
                }}
                className="px-3 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 flex items-center gap-1"
              >
                <FiSend size={14} /> 
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
  {totalPages > 1 && (
  <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
    <p>
      Page {currentPage} of {totalPages}
    </p>

    <div className="flex gap-2">
      <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage((p) => p - 1)}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Previous
      </button>

      <button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage((p) => p + 1)}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
)}
  {/* FIXED BOTTOM NAVIGATION */}
<div className="fixed bottom-4 left-[calc(16rem+1rem)] right-8 flex justify-between z-40">
  <button
    onClick={() => navigate("/admission/selected-student")}
    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
  >
    Back
  </button>

  <button
    onClick={() => navigate("/admission/registration-fees")}
    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
  >
    Next →
  </button>
</div>
</div>

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowTemplateModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Send Offer Letter</h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block  font-medium mb-2">
                Template:{" "}
                <span className="font-normal text-gray-600">
                  {ADMISSION_OFFER_TEMPLATE.name}
                </span>
              </label>
            </div>

            <div className="mb-4">
              <label className="block  font-medium mb-2">
                Selected Students ({selectedStudents.length}):
              </label>
              <div className="border rounded-lg p-3 max-h-40 overflow-auto">
                {students
                  .filter((s) => selectedStudents.includes(s._id))
                  .map((student) => (
                    <div
                      key={student._id}
                      className=" text-gray-700 py-1"
                    >
                      {student.personalInfo?.name} ({student.email})
                    </div>
                  ))}
              </div>
            </div>
<div className="mb-4 grid grid-cols-2 gap-4">
  <div>
    <label className="block font-medium mb-1">
      Admission From Date
    </label>
    <input
      type="date"
      value={admissionFrom}
      onChange={(e) => setAdmissionFrom(e.target.value)}
      className="w-full border px-3 py-2 rounded-lg"
    />
  </div>

  <div>
    <label className="block font-medium mb-1">
      Admission To Date
    </label>
    <input
      type="date"
      value={admissionTo}
      onChange={(e) => setAdmissionTo(e.target.value)}
      className="w-full border px-3 py-2 rounded-lg"
    />
  </div>
</div>

<div className="mb-4">
  <label className="block font-medium mb-1">
    School Name
  </label>
  <input
    type="text"
    value={schoolName}
    onChange={(e) => setSchoolName(e.target.value)}
    placeholder="Enter school name"
    className="w-full border px-3 py-2 rounded-lg"
  />
</div>


            <div className="mb-3">
              <label className="block  font-medium mb-2">
                Email Subject (Preview):
              </label>
              <div className="border rounded-lg p-3 bg-gray-50 ">
                {selectedStudents.length > 0 &&
                  replaceTemplateVariables(
                    ADMISSION_OFFER_TEMPLATE,
                    students.find((s) => selectedStudents.includes(s._id))
                  ).subject}
              </div>
            </div>

            <div className="mb-3">
              <label className="block  font-medium mb-2">
                Message Content (Preview):
              </label>
              <textarea
                value={
                  selectedStudents.length > 0
                    ? replaceTemplateVariables(
                        ADMISSION_OFFER_TEMPLATE,
                        students.find((s) => selectedStudents.includes(s._id))
                      ).content
                    : ""
                }
                readOnly
                rows="12"
                className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono  bg-gray-50"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendOffer(selectedStudents)}
                disabled={loading || selectedStudents.length === 0}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <FiSend /> Send to {selectedStudents.length} Student(s)
                  </>
                )}
              </button>
            </div>
          </div>
          
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Offer Letter Preview</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="border rounded-lg p-6 bg-gray-50">
              <div className="whitespace-pre-wrap ">
                {previewMessage}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
