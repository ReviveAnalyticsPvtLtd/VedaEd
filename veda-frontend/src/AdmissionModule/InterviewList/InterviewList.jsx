import React, { useState, useEffect, useMemo } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import * as XLSX from "xlsx";
import HelpInfo from "../../components/HelpInfo";
import { toastBannerClassName } from "../../utils/toastMessageStyle";
import { getInterviewCandidates, scheduleInterview, updateInterviewResult, declareInterviewResult } from "../../api/admissionExamAPI";
import { useNavigate } from "react-router-dom";
export default function InterviewList() {
  /* ================= MODAL ================= */
  const [openModal, setOpenModal] = useState(false);
  const [selectedStudentForSchedule, setSelectedStudentForSchedule] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState("All");
  const [bulkAction, setBulkAction] = useState("");
  const [selectedApplicationIds, setSelectedApplicationIds] = useState([]);
  /* ================= FILTER ================= */
  const [classFilter, setClassFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  /* ================= DATA ================= */
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
// PAGINATION
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;
  // Fetch Data
  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const data = await getInterviewCandidates();
      setStudents(data);
    } catch (error) {
      console.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const [form, setForm] = useState({
    interviewType: "Student + Parent",
    date: "",
    time: "",
    slot: "10 mins",
    teacher: "",
    venue: "",
    sms: true,
    whatsapp: false,
    email: true,
  });

  const totalCandidates = students.length;
  const scheduledCount = students.filter(s => s.status === "Scheduled").length;
  const pendingCount = students.filter(s => s.status !== "Scheduled" && s.status !== "Completed").length;
  const normalizeClassValue = (value = "") =>
    String(value)
      .toLowerCase()
      .replace(/^(class\s*)+/i, "")
      .trim();

  const formatClassLabel = (value = "") => {
    const normalized = normalizeClassValue(value);
    return normalized ? `Class ${normalized}` : "Unknown";
  };

  const formatDateTimeDayMonthYear = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  const normalizeStatusValue = (value = "") =>
    String(value).trim().toLowerCase();

  const availableClassOptions = useMemo(() => {
    const classes = (students || [])
      .map((s) => s.classApplied)
      .filter(Boolean)
      .map((value) => formatClassLabel(value));

    return [...new Set(classes)].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
  }, [students]);

  const showToastMessage = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  /* ================= OPEN MODAL ================= */
  const handleOpenSchedule = (student = null) => {
    if (!student && bulkAction === "schedule" && selectedApplicationIds.length === 0) {
      showToastMessage("Please select at least one application to schedule.");
      return;
    }

    if (!student && bulkAction !== "schedule") {
      showToastMessage("Select 'Schedule' in Bulk Action to enable application selection.");
      return;
    }

    if (student) {
      setSelectedStudentForSchedule(student);
    } else {
      setSelectedStudentForSchedule(null);
    }
    setOpenModal(true);
  };

  /* ================= CONFIRM SCHEDULE ================= */
  const handleConfirmSchedule = async () => {
    if (!form.date || !form.time || !form.teacher || !form.venue) {
      showToastMessage("Please fill all fields");
      return;
    }

    try {
        const studentsToSchedule = selectedStudentForSchedule
            ? [selectedStudentForSchedule]
            : students.filter((s) =>
                selectedApplicationIds.includes(s.applicationIdRef || s.applicationId)
              );

        if (studentsToSchedule.length === 0) {
            showToastMessage("Please select at least one application for scheduling.");
            return;
        }

        const promises = studentsToSchedule.map(student => 
            scheduleInterview({
                applicationIdRef: student.applicationIdRef,
                date: form.date,
                time: form.time,
                duration: form.slot,
                teacher: form.teacher,
                venue: form.venue,
                type: form.interviewType,
                sms: form.sms,
                whatsapp: form.whatsapp,
                email: form.email
            })
        );

        await Promise.all(promises);
        
        showToastMessage("Schedule updated successfully!");
        setOpenModal(false);
        setSelectedApplicationIds([]);
        fetchCandidates(); // Refresh

    } catch (error) {
        console.error(error);
        showToastMessage("Failed to schedule interview.");
    }
  };

  const handleUpdateResult = async (student, field, value) => {
      try {
          if (student._id) {
             await updateInterviewResult(student._id, { [field]: value });
          } else {
             await declareInterviewResult({
                 applicationId: student.applicationIdRef,
                 [field]: value
             });
          }
          fetchCandidates();
      } catch (error) {
          showToastMessage("Failed to update result.");
      }
  };

  /* ================= FILTERED LIST ================= */
const filteredStudents = students.filter((s) => {
  const normalizedStudentClass = normalizeClassValue(s.classApplied);
  const normalizedFilterClass = normalizeClassValue(classFilter);
  const matchesClass =
    classFilter === "All" || normalizedStudentClass === normalizedFilterClass;

  const matchesSearch =
    String(s.name || "").toLowerCase().includes(searchQuery.toLowerCase());

  const normalizedStatus = normalizeStatusValue(s.status);
  const matchesStatus =
    statusFilter === "All" ||
    (statusFilter === "Pending"
      ? normalizedStatus !== "scheduled" && normalizedStatus !== "completed"
      : normalizedStatus === normalizeStatusValue(statusFilter));

  return matchesClass && matchesSearch && matchesStatus;
});
const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

const paginatedStudents = filteredStudents.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);
  const isSelectionEnabled = bulkAction === "schedule" || bulkAction === "export";
  const allFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((student) =>
      selectedApplicationIds.includes(student.applicationIdRef || student.applicationId)
    );

  const handleBulkActionChange = (value) => {
    setBulkAction(value);
    if (!value) {
      setSelectedApplicationIds([]);
    }
  };

  const handleSelectApplication = (candidateId) => {
    setSelectedApplicationIds((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    const filteredIds = filteredStudents.map(
      (student) => student.applicationIdRef || student.applicationId
    );
    setSelectedApplicationIds((prev) =>
      allFilteredSelected
        ? prev.filter((id) => !filteredIds.includes(id))
        : [...new Set([...prev, ...filteredIds])]
    );
  };

  const handleExportSelected = () => {
    if (selectedApplicationIds.length === 0) {
      showToastMessage("Please select at least one application to export.");
      return;
    }

    const selectedStudents = students.filter((student) =>
      selectedApplicationIds.includes(student.applicationIdRef || student.applicationId)
    );

    const dataToExport = selectedStudents.map((student) => ({
      ApplicationID: student.applicationId,
      StudentName: student.name,
      Class: student.classApplied,
      DateTime: formatDateTimeDayMonthYear(student.interviewDateTime),
      Interviewer: student.interviewer || "",
      Attendance: student.attendance || "Pending",
      Status: student.status || "",
      Result: student.result || "Not Declared",
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Interview");
    XLSX.writeFile(wb, "InterviewSelected.xlsx");
  };
useEffect(() => {
  setCurrentPage(1);
}, [searchQuery, classFilter, statusFilter]);
  return (
    <div className="p-0 m-0 min-h-screen mb-14">
      {toastMessage && (
        <div
          role="status"
          className={`mb-4 px-3 py-2 rounded-md border text-sm font-semibold ${toastBannerClassName(toastMessage)}`}
        >
          {toastMessage}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <h2 className="text-2xl font-bold">Interview</h2>
        <HelpInfo
          title="Interview List Help"
          description="Manage interview schedules and tracking results."
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
          Overview
        </button>
      </div>

      {/* SUMMARY BOXES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 mt-4">
        <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div>
            <p className="text-sm text-gray-500">Total Candidates</p>
            <p className="text-xl font-bold">{totalCandidates}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div>
            <p className="text-sm text-gray-500">Scheduled</p>
            <p className="text-xl font-bold">{scheduledCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div>
            <p className="text-sm text-gray-500">Pending Schedule</p>
            <p className="text-xl font-bold">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Main content box */}
      <div className="p-0 mb-8" >
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Interview Candidates List</h3>

          {/* Top controls */}
          <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center mb-4 gap-3">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
              <input
                type="text"
                placeholder="Search student name..."
                className="border rounded-md px-2 py-1.5 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <select
                className="border px-3 py-2 rounded-md text-sm w-full sm:w-auto"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <option value="All">All Classes</option>
                {availableClassOptions.map((className) => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>

             <select
  className="border px-3 py-2 rounded-md text-sm w-full sm:w-auto"
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
>
  <option value="All">All Status</option>
  <option value="Pending">Pending</option>
  <option value="Scheduled">Scheduled</option>
  <option value="Completed">Completed</option>
</select>
              
              <select
                className="border px-3 py-2 rounded-md text-sm w-full sm:w-auto"
                value={bulkAction}
                onChange={(e) => handleBulkActionChange(e.target.value)}
              >
                <option value="">Bulk Action</option>
                <option value="schedule">Schedule</option>
                <option value="export">Export</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {bulkAction === "export" && (
                <button
                  onClick={handleExportSelected}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 w-full sm:w-auto"
                >
                  Export Selected
                </button>
              )}
              <button
                onClick={() => handleOpenSchedule()}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full sm:w-auto"
              >
                <FiPlus /> Schedule Interview
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto text-sm rounded-xl border border-gray-200">
          <table className="w-full min-w-[980px]">
            <thead className="bg-gray-100 font-semibold">
              <tr>
               <th className="p-2 border text-center">
  <input
    type="checkbox"
    checked={allFilteredSelected}
    onChange={handleSelectAll}
  />
</th>

<th className="p-2 border text-center">S.No</th>
                <th className="p-2 border text-left">Application ID</th>
                <th className="p-2 border text-left">Student Name</th>
                <th className="p-2 border text-left">Class</th>
                <th className="p-2 border text-left">Date & Time</th>
                <th className="p-2 border text-left">Interviewer(s)</th>
                <th className="p-2 border text-left">Attendance</th>
                <th className="p-2 border text-left">Result</th>
                <th className="p-2 border text-left">Status</th>
                <th className="p-2 border text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                   <tr>
                      <td colSpan={isSelectionEnabled ? 10 : 9} className="text-center py-4">Loading...</td>
                   </tr>
              ) : filteredStudents.length === 0 ? (
                  <tr>
                      <td colSpan={isSelectionEnabled ? 10 : 9} className="text-center py-4">No candidates found</td>
                  </tr>
              ) : (
              paginatedStudents.map((s, index) => (
                <tr key={s.applicationId} className="border-b hover:bg-gray-50">
                 <td className="p-2 border text-center">
  <input
    type="checkbox"
    checked={selectedApplicationIds.includes(
      s.applicationIdRef || s.applicationId
    )}
    onChange={() =>
      handleSelectApplication(s.applicationIdRef || s.applicationId)
    }
  />
</td>
<td className="p-2 border text-center font-semibold">
  {(currentPage - 1) * itemsPerPage + index + 1}
</td>
                  <td className="p-2 border">{s.applicationId || "-"}</td>
                  <td className="p-2 border">{s.name}</td>
                  <td className="p-2 border">{formatClassLabel(s.classApplied)}</td>
                  <td className="p-2 border">{formatDateTimeDayMonthYear(s.interviewDateTime)}</td>
                  <td className="p-2 border">{s.interviewer || "-"}</td>
                  <td className="p-2 border text-center">
                    <select 
                        value={s.attendance} 
                        onChange={(e) => handleUpdateResult(s, 'attendance', e.target.value)}
                        disabled={s.status !== "Scheduled" && s.status !== "Completed"}
                        className={`px-2 py-1 rounded text-xs border ${
                            s.attendance === 'Present' ? 'bg-green-100 text-green-700' : 
                            s.attendance === 'Absent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                    >
                        <option>Pending</option>
                        <option>Present</option>
                        <option>Absent</option>
                    </select>
                  </td>
                  <td className="p-2 border">
                    <select
                      value={s.result}
                      onChange={(e) => handleUpdateResult(s, 'result', e.target.value)}
                      disabled={
                        s.attendance !== "Present" ||
                        (s.status !== "Scheduled" && s.status !== "Completed")
                      }
                      className="border rounded-md px-1 py-0.5 text-xs w-full"
                    >
                      <option>Not Declared</option>
                      <option>Qualified</option>
                      <option>Disqualified</option>
                    </select>
                  </td>
                  <td className="p-2 border text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      s.status === "Scheduled" ? "bg-blue-100 text-blue-700" : 
                      s.status === "Completed" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {s.status}
                    </span>
                  </td>
                <td className="p-2 border">
  <div className="flex items-center justify-center">
    <FiTrash2 className="cursor-pointer text-red-600" />
  </div>
</td>
                </tr>
              )))}
            </tbody>
          </table>
          </div>
{/* Pagination */}
<div className="flex flex-col sm:flex-row justify-between sm:items-center mt-4 text-sm gap-2">
  <p className="text-gray-600">
    Page {currentPage} of {totalPages || 1}
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
      disabled={currentPage === totalPages || totalPages === 0}
      onClick={() => setCurrentPage((p) => p + 1)}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Next
    </button>
  </div>
</div>
        </div>
        
        {/* Bottom Navigation Buttons */}
<div className="fixed bottom-4 left-4 right-4 md:left-[calc(16rem+1rem)] md:right-8 flex flex-col sm:flex-row justify-between gap-2 z-40">
  <button
    onClick={() => navigate("/admission/entrance-list")}
    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 w-full sm:w-auto"
  >
     Back
  </button>

  <button
    onClick={() => navigate("/admission/Document-Verification")}
    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold w-full sm:w-auto"
  >
    Next →
  </button>
</div>
      </div>

      {/* Schedule Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-[700px] relative overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
              <h2 className="text-lg font-bold text-gray-800">Schedule Interview</h2>
              <button onClick={() => setOpenModal(false)} className="text-gray-400 hover:text-red-500">
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Select Scope */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Interview Type</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none bg-white"
                    value={form.interviewType}
                    onChange={(e) => setForm({ ...form, interviewType: e.target.value })}
                  >
                    <option>Student + Parent</option>
                    <option>Student Only</option>
                    <option>Parent Only</option>
                  </select>
                </div>
              </div>

              {/* Interview Details */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold border-b pb-1 text-gray-700">Interview Details</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Date</label>
                    <input
                      type="date"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none"
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Time</label>
                    <input
                      type="time"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none"
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Slot Duration</label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none bg-white"
                      value={form.slot}
                      onChange={(e) => setForm({...form, slot: e.target.value})}
                    >
                      <option>10 mins</option>
                      <option>15 mins</option>
                      <option>30 mins</option>
                      <option>60 mins</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Teachers</label>
                    <input
                      type="text"
                      placeholder="e.g. Mr. Kartike"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none"
                      onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Venue</label>
                    <input
                      type="text"
                      placeholder="Main Block, School Campus"
                      className="w-full border border-blue-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none bg-blue-50/10"
                      onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold border-b pb-1 text-gray-700">Notification Settings</h4>
                <div className="flex gap-8 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input type="checkbox" checked={form.sms} onChange={e => setForm({...form, sms: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                    Send SMS
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input type="checkbox" checked={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                    WhatsApp
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input type="checkbox" checked={form.email} onChange={e => setForm({...form, email: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                    Email Notification
                  </label>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                   <p className="text-[10px] uppercase font-bold text-blue-400 mb-1">Message Template (Preview)</p>
                   <p className="text-sm text-blue-800 font-bold">
                    Hello! Your interview is scheduled on {form.date || "____"} at {form.time || "____"}. Venue: {form.venue || "____"}.
                   </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setOpenModal(false)}
                className="px-6 py-2 border rounded-md text-gray-600 font-bold bg-white shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmSchedule}
                className="px-6 py-2 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm"
              >
                Confirm & Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
