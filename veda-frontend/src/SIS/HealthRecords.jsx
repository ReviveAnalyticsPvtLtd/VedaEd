import React, { useState, useEffect } from "react";
import {
  FiHeart,
  FiUser,
  FiEdit,
  FiClipboard,
  FiAlertCircle,
  FiActivity,
  FiShield,
  FiDownload,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import axios from "axios";
import config from "../config";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Pagination from "../components/common/Pagination";

// Helper to map Backend Student Object -> Frontend State Object
const mapStudentToState = (s) => {
  const p = s.personalInfo || {};
  const h = s.health || {};
  return {
    _id: s._id, // Keep real ID for updates
    id: s.id || s._id, // For key props
    name: p.name || "",
    class: p.class || "", // class name populated
    section: p.section || "",
    roll: p.rollNo || "",
    blood: (p.bloodGroup || h.bloodGroup || "").trim(),
    height: h.height || 0,
    weight: h.weight || 0,
    allergies: h.allergies || "None",
    chronic: h.chronic || "None",
    medication: h.medication || "None",
    vaccination: h.vaccination || "Up to Date",
    notes: h.notes || "",
    campReport: h.campReport || { bp: "", hb: "", eye: "", dental: "", notes: "" },
    history: h.history || [],
  };
};

export default function HealthRecords() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openCamp, setOpenCamp] = useState(false);
  const [showHistoryId, setShowHistoryId] = useState(null);

  const rowsPerPage = 10;

  const [editForm, setEditForm] = useState({
    name: "",
    class: "",
    roll: "",
    blood: "",
    height: 0,
    weight: 0,
    allergies: "",
    chronic: "",
    medication: "",
    vaccination: "",
    notes: "",
  });

  const [campForm, setCampForm] = useState({
    bp: "",
    hb: "",
    eye: "",
    dental: "",
    notes: "",
  });

  const [classList, setClassList] = useState([]);

  // FETCH STUDENTS AND CLASSES
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.API_BASE_URL}/students`);
      if (res.data.success) {
        const mapped = res.data.students.map(mapStudentToState);
        setStudents(mapped);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/classes`);
      if (res.data.success) {
        setClassList(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching classes", err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  /* ------------ ADD FUNCTIONS ------------ */
  const [addSelection, setAddSelection] = useState({
    class: "",
    section: "",
    studentId: ""
  });

  const handleAdd = () => {
    setAddSelection({ class: "", section: "", studentId: "" });
    setEditForm({
      name: "",
      class: "",
      roll: "",
      blood: "",
      height: 0,
      weight: 0,
      allergies: "",
      chronic: "",
      medication: "",
      vaccination: "",
      notes: "",
    });
    setSelectedStudent(null);
    setOpenAdd(true);
  };

  const handleAddClassChange = (e) => {
    setAddSelection({ ...addSelection, class: e.target.value, section: "", studentId: "" });
    setSelectedStudent(null);
  };

  const handleAddSectionChange = (e) => {
    setAddSelection({ ...addSelection, section: e.target.value, studentId: "" });
    setSelectedStudent(null);
  };

  const handleAddStudentChange = (e) => {
    const sId = e.target.value;
    const stu = students.find(s => s._id === sId);
    setAddSelection({ ...addSelection, studentId: sId });

    if (stu) {
      setSelectedStudent(stu);
      setEditForm({
        name: stu.name,
        class: stu.class,
        roll: stu.roll,
        blood: stu.blood,
        height: stu.height,
        weight: stu.weight,
        allergies: stu.allergies,
        chronic: stu.chronic,
        medication: stu.medication,
        vaccination: stu.vaccination,
        notes: stu.notes,
      });
    } else {
      setSelectedStudent(null);
    }
  };

  const saveAddViaUpdate = async () => {
    if (!selectedStudent) {
      alert("Please select a student first.");
      return;
    }

    const payload = {
      personalInfo: {
        name: selectedStudent.name,
        class: selectedStudent.class,
        section: selectedStudent.section,
        rollNo: selectedStudent.roll,
        bloodGroup: editForm.blood,
      },
      health: {
        height: Number(editForm.height),
        weight: Number(editForm.weight),
        bloodGroup: editForm.blood,
        allergies: editForm.allergies,
        chronic: editForm.chronic,
        medication: editForm.medication,
        vaccination: editForm.vaccination,
        notes: editForm.notes,
      }
    };

    try {
      const res = await axios.put(`${config.API_BASE_URL}/students/${selectedStudent._id}/health`, payload);
      if (res.data.success) {
        await fetchStudents();
        setOpenAdd(false);
        alert("Health record updated successfully!");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update record");
    }
  };

  /* ------------ EDIT FUNCTIONS ------------ */
  const handleEdit = (stu) => {
    setSelectedStudent(stu);
    setEditForm({
      name: stu.name,
      class: stu.class,
      roll: stu.roll,
      blood: stu.blood,
      height: stu.height,
      weight: stu.weight,
      allergies: stu.allergies,
      chronic: stu.chronic,
      medication: stu.medication,
      vaccination: stu.vaccination,
      notes: stu.notes,
    });
    setOpenEdit(true);
  };

  const updateField = (key, val) => {
    setEditForm({ ...editForm, [key]: val });
  };

  const saveChanges = async () => {
    if (!selectedStudent) return;
    const payload = {
      personalInfo: {
        name: editForm.name,
        class: editForm.class,
        rollNo: editForm.roll,
        bloodGroup: editForm.blood,
      },
      health: {
        height: Number(editForm.height),
        weight: Number(editForm.weight),
        bloodGroup: editForm.blood,
        allergies: editForm.allergies,
        chronic: editForm.chronic,
        medication: editForm.medication,
        vaccination: editForm.vaccination,
        notes: editForm.notes,
      }
    };

    try {
      const res = await axios.put(`${config.API_BASE_URL}/students/${selectedStudent._id}/health`, payload);
      if (res.data.success) {
        await fetchStudents();
        setOpenEdit(false);
        setSelectedStudent(null);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update record");
    }
  };

  /* ------------ DELETE FUNCTION ------------ */
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student? (This will remove the entire student record)")) {
      try {
        const res = await axios.delete(`${config.API_BASE_URL}/students/${id}`);
        if (res.data.success) {
          setStudents(students.filter((s) => s._id !== id));
        }
      } catch (err) {
        console.error(err);
        alert("Failed to delete student");
      }
    }
  };

  /* ------------ CAMP FUNCTIONS  */
  const handleCamp = (stu) => {
    setSelectedStudent(stu);
    setCampForm({ ...stu.campReport });
    setOpenCamp(true);
  };

  const updateCampField = (key, val) => {
    setCampForm({ ...campForm, [key]: val });
  };

  const saveCamp = async () => {
    if (!selectedStudent) return;

    const currentHealth = {
      height: selectedStudent.height,
      weight: selectedStudent.weight,
      bloodGroup: selectedStudent.blood,
      allergies: selectedStudent.allergies,
      chronic: selectedStudent.chronic,
      medication: selectedStudent.medication,
      vaccination: selectedStudent.vaccination,
      notes: selectedStudent.notes,
      history: selectedStudent.history,
      campReport: campForm
    };

    try {
      const res = await axios.put(`${config.API_BASE_URL}/students/${selectedStudent._id}/health`, {
        health: currentHealth
      });
      if (res.data.success) {
        await fetchStudents();
        setOpenCamp(false);
        setSelectedStudent(null);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save camp report");
    }
  };

  const exportCampPDF = () => {
    if (!selectedStudent) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Doctor Health Camp Report - ${selectedStudent.name}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Class: ${selectedStudent.class}`, 14, 30);
    doc.text(`BP: ${campForm.bp || "N/A"}`, 14, 40);
    doc.text(`HB: ${campForm.hb || "N/A"}`, 14, 50);
    doc.text(`Eye Test: ${campForm.eye || "N/A"}`, 14, 60);
    doc.text(`Dental: ${campForm.dental || "N/A"}`, 14, 70);
    doc.text(`Notes: ${campForm.notes || "N/A"}`, 14, 80);
    doc.save(`${selectedStudent.name}_HealthCampReport.pdf`);
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.class.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredStudents.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage));

  const calcBMI = (h, w) => {
    if (!h || !w) return "";
    const meters = h / 100;
    return (w / (meters * meters)).toFixed(1);
  };

  const summaryData = [
    {
      label: "Total Students",
      value: students.length,
      bg: "bg-blue-50",
      icon: <FiUser className="text-blue-600" />,
    },
    {
      label: "Allergies Reported",
      value: students.filter((s) => s.allergies !== "None").length,
      bg: "bg-red-50",
      icon: <FiAlertCircle className="text-red-600" />,
    },
    {
      label: "Chronic Conditions",
      value: students.filter((s) => s.chronic !== "None").length,
      bg: "bg-orange-50",
      icon: <FiActivity className="text-orange-600" />,
    },
    {
      label: "Pending Vaccinations",
      value: students.filter((s) => s.vaccination.includes("Pending")).length,
      bg: "bg-yellow-50",
      icon: <FiShield className="text-yellow-600" />,
    },
  ];

  if (loading) {
    return <div className="p-10 text-center">Loading Health Records...</div>;
  }

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* ----------------- Container 1: Header + Filters ----------------- */}
      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold mt-0">Health Report</h2>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
            >
              <FiPlus /> Add Record
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:justify-between gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by student name or class..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border px-3 py-1 rounded-md "
            />
          </div>
        </div>
      </div>

      {/* ----------------- Container 2: Summary Cards ----------------- */}
      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryData.map((item, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-lg border shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{item.icon}</div>
                <div>
                  <p className="text-gray-500">{item.label}</p>
                  <p className=" font-semibold mt-2">{item.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ----------------- Container 3: Table ----------------- */}
      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
        <h3 className="text-lg font-semibold mb-3 mt-0">All Student Health Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full ">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-center">Class</th>
                <th className="px-4 py-3 text-center">Roll</th>
                <th className="px-4 py-3 text-center">Blood</th>
                <th className="px-4 py-3 text-center">Height</th>
                <th className="px-4 py-3 text-center">Weight</th>
                <th className="px-4 py-3 text-center">BMI</th>
                <th className="px-4 py-3 text-center">Allergies</th>
                <th className="px-4 py-3 text-center">Chronic</th>
                <th className="px-4 py-3 text-center">Medication</th>
                <th className="px-4 py-3 text-center">Vaccination</th>
                <th className="px-4 py-3 text-left">Notes</th>
                <th className="px-4 py-3 text-center">Actions</th>
                <th className="px-4 py-3 text-center">Camp</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-6 text-center text-gray-500">
                    No health records found.
                  </td>
                </tr>
              ) : (
                currentRows.map((stu) => (
                  <React.Fragment key={stu.id}>
                    <tr className="border-t hover:bg-blue-50">
                      <td className="px-4 py-3 font-medium">{stu.name}</td>
                      <td className="px-4 py-3 text-center">{stu.class}</td>
                      <td className="px-4 py-3 text-center">{stu.roll}</td>
                      <td className="px-4 py-3 text-center">{stu.blood}</td>
                      <td className="px-4 py-3 text-center">{stu.height} cm</td>
                      <td className="px-4 py-3 text-center">{stu.weight} kg</td>
                      <td className="px-4 py-3 text-center">{calcBMI(stu.height, stu.weight)}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-md text-xs ${
                            stu.allergies !== "None"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {stu.allergies}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-md text-xs ${
                            stu.chronic !== "None"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {stu.chronic}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{stu.medication}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-md text-xs ${
                            stu.vaccination.includes("Pending")
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {stu.vaccination}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{stu.notes}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleEdit(stu)}
                            title="Edit"
                          >
                            <FiEdit />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-800"
                            onClick={() =>
                              setShowHistoryId(showHistoryId === stu.id ? null : stu.id)
                            }
                            title="History"
                          >
                            <FiClipboard />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDelete(stu._id)}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleCamp(stu)}
                          className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                        >
                          Camp
                        </button>
                      </td>
                    </tr>

                    {/* History Row */}
                    {showHistoryId === stu.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={14} className="px-4 py-4">
                          <h4 className="font-semibold mb-2">Health History - {stu.name}</h4>
                          {stu.history.length === 0 ? (
                            <p className="text-gray-500">No history available.</p>
                          ) : (
                            <ul className="list-disc pl-5 space-y-1">
                              {stu.history.map((h, i) => (
                                <li key={i}>
                                  <span className="font-semibold">{h.date}:</span> {h.issue} —{" "}
                                  {h.action}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Add Modal */}
      {openAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FiPlus /> Update Student Health
            </h3>

            {/* CASCADING DROPDOWNS */}
            <div className="grid grid-cols-3 gap-3 bg-blue-50 p-3 rounded mb-2">
              {/* Class Dropdown */}
              <div>
                <label className="text-xs font-semibold text-gray-600">Select Class</label>
                <select
                  className="w-full border p-2 rounded mt-1"
                  value={addSelection.class}
                  onChange={handleAddClassChange}
                >
                  <option value="">-- Class --</option>
                  {classList.map(c => (
                    <option key={c._id || c.id || c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Section Dropdown */}
              <div>
                <label className="text-xs font-semibold text-gray-600">Select Section</label>
                <select
                  className="w-full border p-2 rounded mt-1"
                  value={addSelection.section}
                  onChange={handleAddSectionChange}
                  disabled={!addSelection.class}
                >
                  <option value="">-- Section --</option>
                  {addSelection.class && classList.find(c => c.name === addSelection.class)?.sections.map((sec, i) => (
                    <option key={i} value={typeof sec === 'string' ? sec : sec.name}>
                      {typeof sec === 'string' ? sec : sec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Dropdown */}
              <div>
                <label className="text-xs font-semibold text-gray-600">Select Student</label>
                <select
                  className="w-full border p-2 rounded mt-1"
                  value={addSelection.studentId}
                  onChange={handleAddStudentChange}
                  disabled={!addSelection.section}
                >
                  <option value="">-- Student --</option>
                  {students
                    .filter(s => s.class === addSelection.class && (s.section || "A") === addSelection.section)
                    .map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.roll || '-'})</option>
                    ))
                  }
                </select>
              </div>
            </div>

            {/* Helper text */}
            {!selectedStudent && (
              <div className="text-center text-gray-500 py-4 italic">
                Please select a student from the dropdowns above to proceed.
              </div>
            )}

            {/* FORM */}
            {selectedStudent && (
              <>
                <div className="w-full bg-gray-100 p-2 rounded mb-2 flex justify-between text-sm">
                  <span><strong>Name:</strong> {selectedStudent.name}</span>
                  <span><strong>Roll:</strong> {selectedStudent.roll}</span>
                  <span><strong>ID:</strong> {selectedStudent.id}</span>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <input
                    className="border p-3 rounded"
                    value={editForm.blood}
                    onChange={(e) => updateField("blood", e.target.value)}
                    placeholder="Blood Group"
                  />
                  <input
                    className="border p-3 rounded"
                    value={editForm.height}
                    onChange={(e) => updateField("height", e.target.value)}
                    placeholder="Height (cm)"
                    type="number"
                  />
                  <input
                    className="border p-3 rounded"
                    value={editForm.weight}
                    onChange={(e) => updateField("weight", e.target.value)}
                    placeholder="Weight (kg)"
                    type="number"
                  />
                  <input
                    className="border p-3 rounded"
                    value={editForm.allergies}
                    onChange={(e) => updateField("allergies", e.target.value)}
                    placeholder="Allergies"
                  />
                  <input
                    className="border p-3 rounded"
                    value={editForm.chronic}
                    onChange={(e) => updateField("chronic", e.target.value)}
                    placeholder="Chronic Issue"
                  />
                  <input
                    className="border p-3 rounded"
                    value={editForm.medication}
                    onChange={(e) => updateField("medication", e.target.value)}
                    placeholder="Medication"
                  />
                  <input
                    className="border p-3 rounded"
                    value={editForm.vaccination}
                    onChange={(e) => updateField("vaccination", e.target.value)}
                    placeholder="Vaccination Status"
                  />
                </div>
                <textarea
                  className="border p-3 rounded w-full"
                  rows="3"
                  value={editForm.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Medical Notes"
                ></textarea>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setOpenAdd(false)}
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveAddViaUpdate}
                    disabled={!selectedStudent}
                    className={`px-4 py-2 text-white rounded ${!selectedStudent ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    Save / Update Record
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {openEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FiEdit /> Update Health — {selectedStudent?.name}
            </h3>
            <div className="grid grid-cols-2 gap-5">
              <input
                className="border p-3 rounded"
                value={editForm.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Student Name"
                disabled
              />
              <input
                className="border p-3 rounded"
                value={editForm.class}
                onChange={(e) => updateField("class", e.target.value)}
                placeholder="Class"
                disabled
              />
              <input
                className="border p-3 rounded"
                value={editForm.roll}
                onChange={(e) => updateField("roll", e.target.value)}
                placeholder="Roll Number"
                disabled
              />
              <input
                className="border p-3 rounded"
                value={editForm.blood}
                onChange={(e) => updateField("blood", e.target.value)}
                placeholder="Blood Group"
              />
              <input
                className="border p-3 rounded"
                value={editForm.height}
                onChange={(e) => updateField("height", e.target.value)}
                placeholder="Height (cm)"
                type="number"
              />
              <input
                className="border p-3 rounded"
                value={editForm.weight}
                onChange={(e) => updateField("weight", e.target.value)}
                placeholder="Weight (kg)"
                type="number"
              />
              <input
                className="border p-3 rounded"
                value={editForm.allergies}
                onChange={(e) => updateField("allergies", e.target.value)}
                placeholder="Allergies"
              />
              <input
                className="border p-3 rounded"
                value={editForm.chronic}
                onChange={(e) => updateField("chronic", e.target.value)}
                placeholder="Chronic Issue"
              />
              <input
                className="border p-3 rounded"
                value={editForm.medication}
                onChange={(e) => updateField("medication", e.target.value)}
                placeholder="Medication"
              />
              <input
                className="border p-3 rounded"
                value={editForm.vaccination}
                onChange={(e) => updateField("vaccination", e.target.value)}
                placeholder="Vaccination"
              />
            </div>
            <textarea
              className="border p-3 rounded w-full"
              rows="3"
              value={editForm.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Medical Notes"
            ></textarea>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setOpenEdit(false);
                  setSelectedStudent(null);
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={saveChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Camp Modal */}
      {openCamp && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold">
              Doctor Health Camp Report — {selectedStudent?.name}
            </h3>
            <div className="grid grid-cols-2 gap-5">
              <input
                className="border p-3 rounded"
                placeholder="BP"
                value={campForm.bp}
                onChange={(e) => updateCampField("bp", e.target.value)}
              />
              <input
                className="border p-3 rounded"
                placeholder="HeartBeat"
                value={campForm.hb}
                onChange={(e) => updateCampField("hb", e.target.value)}
              />
              <input
                className="border p-3 rounded"
                placeholder="Eye Test"
                value={campForm.eye}
                onChange={(e) => updateCampField("eye", e.target.value)}
              />
              <input
                className="border p-3 rounded"
                placeholder="Dental"
                value={campForm.dental}
                onChange={(e) => updateCampField("dental", e.target.value)}
              />
            </div>
            <textarea
              className="border p-3 rounded w-full"
              rows="4"
              placeholder="Other Notes"
              value={campForm.notes}
              onChange={(e) => updateCampField("notes", e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setOpenCamp(false);
                  setSelectedStudent(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveCamp}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Save
              </button>
              <button
                onClick={exportCampPDF}
                className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-1 hover:bg-green-700"
              >
                <FiDownload /> Export PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

