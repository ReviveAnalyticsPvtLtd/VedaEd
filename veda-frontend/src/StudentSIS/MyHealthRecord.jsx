import React, { useState, useEffect } from "react";
import {
  FiHeart,
  FiEdit,
  FiAlertCircle,
  FiActivity,
  FiShield,
  FiDownload,
} from "react-icons/fi";
import jsPDF from "jspdf";
import api from "../services/apiClient";
import { studentAPI } from "../services/studentAPI";

/* ---------------- HELPERS ---------------- */

const calcBMI = (h, w) => {
  if (!h || !w) return "-";
  const m = h / 100;
  return (w / (m * m)).toFixed(1);
};

const mapStudentToState = (s) => {
  const p = s.personalInfo || {};
  const h = s.health || {};
  const className =
    typeof p.class === "string"
      ? p.class
      : p.class?.name || s.grade || "";
  const sectionName =
    typeof p.section === "string"
      ? p.section
      : p.section?.name || s.section || "";

  return {
    _id: s._id,
    name: p.name || s.name || "",
    class: className,
    section: sectionName,
    roll: p.rollNo || s.rollNo || "",
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

/* ---------------- COMPONENT ---------------- */

export default function MyHealthRecord() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);
  const [openCamp, setOpenCamp] = useState(false);

  const [editForm, setEditForm] = useState({
    blood: "",
    height: 0,
    weight: 0,
    notes: "",
  });
  
  const [campForm, setCampForm] = useState({
    bp: "",
    hb: "",
    eye: "",
    dental: "",
    notes: "",
  });

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const studentId = user?.refId || user?.stdId || user?.username || user?._id;

      if (!studentId) {
        setStudent(null);
        return;
      }

      const res = await studentAPI.getStudent(studentId);
      if (res?.success && res?.student) {
        const s = mapStudentToState(res.student);
        setStudent(s);
        setEditForm({
          blood: s.blood,
          height: s.height,
          weight: s.weight,
          notes: s.notes,
        });
        setCampForm({ ...s.campReport });
      } else {
        setStudent(null);
      }
    } catch (err) {
      console.error("Error fetching health record:", err);
      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
  }, []);

  const updateField = (k, v) => setEditForm({ ...editForm, [k]: v });
  const updateCampField = (k, v) => setCampForm({ ...campForm, [k]: v });

  const saveHealth = async () => {
    if (!student) return;
    try {
      const payload = {
        health: {
          ...student, // Keep existing fields
          height: Number(editForm.height),
          weight: Number(editForm.weight),
          bloodGroup: editForm.blood,
          notes: editForm.notes,
        }
      };
      const res = await api.put(`/students/${student._id}/health`, payload);
      if (res.data?.success) {
        await fetchRecord();
        setOpenEdit(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update record");
    }
  };

  const saveCamp = async () => {
    if (!student) return;
    try {
      const payload = {
        health: {
          height: student.height,
          weight: student.weight,
          bloodGroup: student.blood,
          allergies: student.allergies,
          chronic: student.chronic,
          medication: student.medication,
          vaccination: student.vaccination,
          notes: student.notes,
          history: student.history,
          campReport: campForm
        }
      };
      const res = await api.put(`/students/${student._id}/health`, payload);
      if (res.data?.success) {
        await fetchRecord();
        setOpenCamp(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save camp report");
    }
  };

  const exportCampPDF = () => {
    if (!student) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Health Camp Report`, 14, 20);
    doc.text(`Name: ${student.name}`, 14, 30);
    doc.text(`Class: ${student.class}-${student.section}`, 14, 40);
    doc.text(`BP: ${campForm.bp}`, 14, 50);
    doc.text(`HB: ${campForm.hb}`, 14, 60);
    doc.text(`Eye: ${campForm.eye}`, 14, 70);
    doc.text(`Dental: ${campForm.dental}`, 14, 80);
    doc.text(`Notes: ${campForm.notes}`, 14, 90);
    doc.save(`${student.name}_Health_Camp_Report.pdf`);
  };

  if (loading) return <div className="p-10 text-center">Loading My Health Record...</div>;
  if (!student) return <div className="p-10 text-center">Student record not found.</div>;

  const summaryCards = [
    {
      label: "Blood Group",
      value: student.blood,
      icon: <FiHeart className="text-red-600" />,
    },
    {
      label: "BMI",
      value: calcBMI(student.height, student.weight),
      icon: <FiActivity className="text-blue-600" />,
    },
    {
      label: "Allergies",
      value: student.allergies,
      icon: <FiAlertCircle className="text-orange-600" />,
    },
    {
      label: "Vaccination",
      value: student.vaccination,
      icon: <FiShield className="text-green-600" />,
    },
  ];

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-bold">My Health Record</h2>
        <button
          onClick={() => setOpenEdit(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
        >
          <FiEdit /> Update Details
        </button>
      </div>

      {/* Summary Cards */}
      <div className="bg-white p-3 rounded-lg border mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {summaryCards.map((c, i) => (
            <div key={i} className="p-4 border rounded-lg shadow-sm">
              <div className="flex gap-3 items-center">
                <div className="text-xl">{c.icon}</div>
                <div>
                  <p className="text-gray-500 text-xs uppercase font-bold">{c.label}</p>
                  <p className="font-semibold">{c.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
        <div className="bg-white p-4 rounded-lg border space-y-3">
          <h3 className="font-semibold text-gray-700 border-b pb-2">Medical Profile</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
             <p className="text-gray-500">Full Name</p> <p className="font-medium">{student.name}</p>
             <p className="text-gray-500">Class-Section</p> <p className="font-medium">{student.class}-{student.section}</p>
             <p className="text-gray-500">Roll Number</p> <p className="font-medium">{student.roll}</p>
             <p className="text-gray-500">Height</p> <p className="font-medium">{student.height} cm</p>
             <p className="text-gray-500">Weight</p> <p className="font-medium">{student.weight} kg</p>
             <p className="text-gray-500">Chronic Issues</p> <p className="font-medium text-orange-600">{student.chronic}</p>
             <p className="text-gray-500">Current Medication</p> <p className="font-medium text-blue-600">{student.medication}</p>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded text-sm italic text-gray-600">
            <strong>Medical Notes:</strong> {student.notes || "No additional notes provided."}
          </div>
        </div>

        {/* Camp */}
        <div className="bg-white p-4 rounded-lg border flex flex-col">
          <div className="flex justify-between items-center border-b pb-2 mb-3">
            <h3 className="font-semibold text-gray-700">Latest Camp Report</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setOpenCamp(true)}
                className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
              >
                Edit Report
              </button>
              <button
                onClick={exportCampPDF}
                className="px-3 py-1 bg-green-600 text-white rounded text-xs flex items-center gap-1 hover:bg-green-700"
              >
                <FiDownload /> PDF
              </button>
            </div>
          </div>
          <div className="space-y-3 text-sm flex-1">
             <div className="flex justify-between"><span>Blood Pressure (BP)</span> <span className="font-mono">{student.campReport.bp || "-"}</span></div>
             <div className="flex justify-between"><span>Heartbeat (HB)</span> <span className="font-mono">{student.campReport.hb || "-"}</span></div>
             <div className="flex justify-between"><span>Eye Alignment</span> <span className="font-mono">{student.campReport.eye || "-"}</span></div>
             <div className="flex justify-between"><span>Dental Health</span> <span className="font-mono">{student.campReport.dental || "-"}</span></div>
             <div className="mt-4 text-xs bg-purple-50 p-2 rounded border border-purple-100 italic">
                <strong>Doctor's Remarks:</strong> {student.campReport.notes || "N/A"}
             </div>
          </div>
        </div>
      </div>

      {/* Health History */}
      <div className="bg-white p-4 rounded-lg border mb-3">
         <h3 className="font-semibold text-lg mb-3 border-b pb-2">Medical History</h3>
         {student.history.length === 0 ? (
           <p className="text-gray-400 text-sm italic">No medical history records found.</p>
         ) : (
           <ul className="space-y-2">
             {student.history.map((h, i) => (
               <li key={i} className="flex gap-4 items-start p-2 border-l-4 border-blue-400 bg-blue-50 text-sm">
                  <span className="font-bold text-blue-800 min-w-20">{h.date}</span>
                  <div>
                    <p className="font-semibold">{h.issue}</p>
                    <p className="text-gray-600 font-medium">Action: {h.action}</p>
                  </div>
               </li>
             ))}
           </ul>
         )}
      </div>

      {/* EDIT MODAL */}
      {openEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4 shadow-2xl">
            <h3 className="font-bold text-xl text-blue-800">Update Health Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">BLOOD GROUP</label>
                <input className="border p-3 w-full rounded focus:ring-2 ring-blue-200" value={editForm.blood} onChange={(e)=>updateField("blood",e.target.value)} placeholder="e.g. O+"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">HEIGHT (CM)</label>
                <input type="number" className="border p-3 w-full rounded focus:ring-2 ring-blue-200" value={editForm.height} onChange={(e)=>updateField("height",e.target.value)} placeholder="cm"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">WEIGHT (KG)</label>
                <input type="number" className="border p-3 w-full rounded focus:ring-2 ring-blue-200" value={editForm.weight} onChange={(e)=>updateField("weight",e.target.value)} placeholder="kg"/>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">PERSONAL MEDICAL NOTES</label>
              <textarea className="border p-3 w-full rounded focus:ring-2 ring-blue-200" rows="3" value={editForm.notes} onChange={(e)=>updateField("notes",e.target.value)} placeholder="Add any medical observations..." />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={()=>setOpenEdit(false)} className="px-6 py-2 bg-gray-400 text-white rounded font-semibold hover:bg-gray-500 cursor-pointer">Cancel</button>
              <button onClick={saveHealth} className="px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 cursor-pointer">Update Record</button>
            </div>
          </div>
        </div>
      )}

      {/* CAMP MODAL */}
      {openCamp && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4 shadow-2xl">
            <h3 className="font-bold text-xl text-purple-800">Camp Report Update</h3>
            <div className="grid grid-cols-2 gap-4">
              <input className="border p-3 w-full rounded" value={campForm.bp} onChange={(e)=>updateCampField("bp",e.target.value)} placeholder="Blood Pressure"/>
              <input className="border p-3 w-full rounded" value={campForm.hb} onChange={(e)=>updateCampField("hb",e.target.value)} placeholder="Heartbeat (HB)"/>
              <input className="border p-3 w-full rounded" value={campForm.eye} onChange={(e)=>updateCampField("eye",e.target.value)} placeholder="Eye Vision Test"/>
              <input className="border p-3 w-full rounded" value={campForm.dental} onChange={(e)=>updateCampField("dental",e.target.value)} placeholder="Dental Checkup"/>
            </div>
            <textarea className="border p-3 w-full rounded" rows="3" value={campForm.notes} onChange={(e)=>updateCampField("notes",e.target.value)} placeholder="General health camp notes..." />
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={()=>setOpenCamp(false)} className="px-6 py-2 bg-gray-400 text-white rounded font-semibold hover:bg-gray-500">Cancel</button>
              <button onClick={saveCamp} className="px-6 py-2 bg-purple-600 text-white rounded font-semibold hover:bg-purple-700">Save Camp Data</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
