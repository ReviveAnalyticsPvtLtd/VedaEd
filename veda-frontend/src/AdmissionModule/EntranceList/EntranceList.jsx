import React, { useState, useEffect, useMemo } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import * as XLSX from "xlsx";
import HelpInfo from "../../components/HelpInfo";
import { toastBannerClassName } from "../../utils/toastMessageStyle";
import {
  getEntranceCandidates,
  scheduleEntranceExam,
  updateEntranceResult,
  declareEntranceResult,
  getVacancies
} from "../../api/admissionExamAPI";
import { useNavigate } from "react-router-dom";
export default function EntranceList() {
  const navigate = useNavigate();
  /* ================= MODAL ================= */
  const [openModal, setOpenModal] = useState(false);
  const [selectedStudentForSchedule, setSelectedStudentForSchedule] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

const [statusFilter, setStatusFilter] = useState("All");
  const [bulkAction, setBulkAction] = useState("");
  const [selectedApplicationIds, setSelectedApplicationIds] = useState([]);
  /* ================= FILTER ================= */
  const [classFilter, setClassFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  /* ================= DATA ================= */
  const [students, setStudents] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;
  // Fetch Data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [candidatesData, vacancyRes] = await Promise.all([
        getEntranceCandidates(),
        getVacancies()
      ]);
      setStudents(candidatesData || []);
      setVacancies(vacancyRes?.success ? vacancyRes.data || [] : []);
    } catch (error) {
      console.error("Failed to load entrance data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const data = await getEntranceCandidates();
      setStudents(data);
    } catch (error) {
      console.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const showToastMessage = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const [form, setForm] = useState({
    examType: "Oral",
    date: "",
    time: "",
    slot: "10 mins",
    examiner: "",
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
    const vacancyClasses = (vacancies || [])
      .filter((v) => (v.availableSeats || 0) > 0 && v.status !== "Closed")
      .map((v) => v.className);

    const studentClasses = (students || []).map((s) => s.classApplied);
    const classes = [...vacancyClasses, ...studentClasses]
      .filter(Boolean)
      .map((value) => formatClassLabel(value));

    return [...new Set(classes)].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
  }, [vacancies, students]);

  /* ================= OPEN MODAL ================= */
  // We might want to clear form or pre-fill it
  const handleOpenSchedule = (student = null) => {
    if (!student && bulkAction === "schedule" && selectedApplicationIds.length === 0) {
      showToastMessage("Please select at least one application to schedule.");
      return;
    }

    if (!student && bulkAction !== "schedule") {
      showToastMessage("Select 'Schedule' in Bulk Action to enable application selection.");
      return;
    }

    setSelectedStudentForSchedule(student || null);
    setOpenModal(true);
  };

  /* ================= CONFIRM SCHEDULE ================= */
  const handleConfirmSchedule = async () => {
    if (!form.date || !form.time || !form.examiner || !form.venue) {
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
            scheduleEntranceExam({
                applicationIdRef: student.applicationIdRef,
                date: form.date,
                time: form.time,
                duration: form.slot,
                examiner: form.examiner,
                venue: form.venue,
                type: form.examType,
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
        showToastMessage("Failed to schedule exam.");
    }
  };

  const handleUpdateResult = async (student, field, value) => {
      try {
          const isResultDeclared = (resultValue) =>
            resultValue === "Qualified" || resultValue === "Disqualified";

          const nextAttendance = field === "attendance" ? value : (student.attendance || "Pending");
          const payload = { [field]: value };

          if (field === "attendance") {
            if (value !== "Present") {
              payload.result = "Not Declared";
              payload.status = "Scheduled";
            } else if (isResultDeclared(student.result)) {
              payload.status = "Completed";
            } else {
              payload.status = "Scheduled";
            }
          }

          if (field === "result") {
            payload.status =
              nextAttendance === "Present" && isResultDeclared(value)
                ? "Completed"
                : "Scheduled";
          }

          if (student._id) {
             // Exam exists, update it
             await updateEntranceResult(student._id, payload);
          } else {
             // Exam doesn't exist, create it via declareResult
             await declareEntranceResult({
                 applicationId: student.applicationIdRef,
                 ...payload
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

  const studentName = String(s.name || "").toLowerCase();
  const matchesSearch =
    studentName.includes(searchQuery.toLowerCase());

  const normalizedStatus = normalizeStatusValue(s.status);
  const matchesStatus =
    statusFilter === "All" ||
    (statusFilter === "Pending"
      ? normalizedStatus !== "scheduled" && normalizedStatus !== "completed"
      : normalizedStatus === normalizeStatusValue(statusFilter));

  return matchesClass && matchesSearch && matchesStatus;
});

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
      DateTime: formatDateTimeDayMonthYear(student.entranceDateTime),
      Examiner: student.examiner || "",
      Attendance: student.attendance || "Pending",
      Status: student.status || "",
      Result: student.result || "Not Declared",
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "EntranceExam");
    XLSX.writeFile(wb, "EntranceExamSelected.xlsx");
  };
const totalPages =
  Math.ceil(filteredStudents.length / itemsPerPage) || 1;

const paginatedStudents = useMemo(() => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredStudents.slice(startIndex, endIndex);
}, [filteredStudents, currentPage]);
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
      {/* Breadcrumb */}
      <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <span>Admission &gt;</span>
        <span>Entrance List</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <h2 className="text-2xl font-bold">Entrance Exam</h2>
        <HelpInfo
          title="Entrance List Help"
          description="Manage entrance exam schedules and qualifying results."
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        <button className="pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
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

      {/* MAIN CONTENT */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-8">
        <h3 className="text-lg font-semibold mb-4">Entrance Candidates List</h3>

        {/* TOP CONTROLS */}
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center mb-4 gap-3">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            <input
              type="text"
              placeholder="Search student name..."
              className="border rounded-md px-2 py-1.5 w-full sm:w-64"
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
  <option value="Scheduled">Scheduled</option>
  <option value="Completed">Completed</option>
  <option value="Pending">Pending</option>
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
              <FiPlus /> Schedule Entrance Exam
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[980px]">
          <thead className="bg-gray-100 font-semibold">
            <tr>
              

<th className="p-2 border text-center w-10">
  <input
    type="checkbox"
    checked={allFilteredSelected}
    onChange={handleSelectAll}
    disabled={!isSelectionEnabled}
  />
</th>
                 <th className="p-2 border text-center w-12">S.No</th>
              <th className="p-2 border">Application ID</th>
              <th className="p-2 border">Student Name</th>
              <th className="p-2 border">Class</th>
              <th className="p-2 border">Date & Time</th>
              <th className="p-2 border">Examiner(s)</th>
              <th className="p-2 border">Attendance</th>
              <th className="p-2 border">Result</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Action</th>
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
              <tr key={s.applicationId} className="hover:bg-gray-50">
               <td className="p-2 border text-center">
  <input
    type="checkbox"
    checked={selectedApplicationIds.includes(
      s.applicationIdRef || s.applicationId
    )}
    onChange={() =>
      handleSelectApplication(s.applicationIdRef || s.applicationId)
    }
    disabled={!isSelectionEnabled}
  />
</td><td className="p-2 border text-center font-semibold">
  {(currentPage - 1) * itemsPerPage + index + 1}
</td>
                <td className="p-2 border font-semibold text-gray-700">
                  {s.applicationId}
                </td>

                <td className="p-2 border">{s.name}</td>
                <td className="p-2 border">{formatClassLabel(s.classApplied)}</td>
                <td className="p-2 border">{formatDateTimeDayMonthYear(s.entranceDateTime)}</td>
                <td className="p-2 border">{s.examiner || "-"}</td>
                <td className="p-2 border">
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
                <td className="p-2 border">
                    <span className={`px-2 py-1 rounded text-xs ${
                      s.status === "Scheduled" ? "bg-blue-100 text-blue-700" :
                      s.status === "Completed" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {s.status}
                    </span>
                </td>
                <td className="p-2 border text-center ">
                 
                  <FiTrash2 className="cursor-pointer text-red-600" />
                </td>
              </tr>
            )))}
          </tbody>
        </table>
        </div>
        {/* ================= SIMPLE PAGINATION ================= */}
{filteredStudents.length > itemsPerPage && (
  <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-4 gap-2">
    <p className="text-sm text-gray-600">
      Page {currentPage} of {totalPages}
    </p>

    <div className="flex gap-2">
      <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(currentPage - 1)}
        className="px-4 py-1 border rounded disabled:opacity-50"
      >
        Previous
      </button>

      <button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(currentPage + 1)}
        className="px-4 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
)}
        {/* BACK & NEXT BUTTONS – BOTTOM (NOT FIXED) */}
<div className="fixed bottom-4 left-4 right-4 md:left-[calc(16rem+1rem)] md:right-8 flex flex-col sm:flex-row justify-between gap-2 z-40">
  {/* BACK */}
  <button
    onClick={() => navigate("/admission/application-list")}
    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 w-full sm:w-auto"
  >
    Back
  </button>

  {/* NEXT */}
  <button
    onClick={() => navigate("/admission/interview-list")}
    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 w-full sm:w-auto"
  >
    Next
  </button>
</div>
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-[700px] relative overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
                         <h2 className="text-lg font-bold text-gray-800">Schedule Entrance</h2>
                         <button onClick={() => setOpenModal(false)} className="text-gray-400 hover:text-red-500">
                           <FiX size={20} />
                         </button>
                       </div>
           
                       <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-6">
                          <div>
  <label className="block text-sm font-semibold text-gray-600 mb-1">
    Exam Type
  </label>
  <select
    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
    value={form.examType}
    onChange={(e) => setForm({ ...form, examType: e.target.value })}
  >
    <option value="Oral">Oral</option>
    <option value="Theory">Theory</option>
  </select>
</div>

                         </div>
           
                   
                         <div className="space-y-4">
                           <h4 className="text-sm font-bold border-b pb-1 text-gray-700">Entrance Details</h4>
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
                               <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Examiner</label>
                               <input
                                 type="text"
                                 placeholder="e.g. Mr. Smith"
                                 className="w-full border rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                 onChange={(e) => setForm({ ...form, examiner: e.target.value })}
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
                              Hello! Your Entrance Exam is scheduled on {form.date || "____"} at {form.time || "____"}. Venue: {form.venue || "____"}.
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
