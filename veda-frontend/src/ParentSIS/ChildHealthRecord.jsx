import React, { useState } from "react";
import {
  FiHeart,
  FiEdit,
  FiAlertCircle,
  FiActivity,
  FiShield,
  FiDownload,
} from "react-icons/fi";
import jsPDF from "jspdf";

/* ---------------- DUMMY CHILD DATA ---------------- */

const DUMMY_CHILD = {
  id: "STU123",
  name: "Aarav Sharma",
  class: "8",
  section: "A",
  roll: 12,
  blood: "O+",
  height: 145,
  weight: 42,
  allergies: "Dust",
  chronic: "None",
  medication: "None",
  vaccination: "Up to Date",
  notes: "Needs regular eye checkup",
  campReport: {
    bp: "110/70",
    hb: "Normal",
    eye: "Weak eyesight",
    dental: "Good",
    notes: "Use spectacles",
  },
};

/* ---------------- HELPERS ---------------- */

const calcBMI = (h, w) => {
  if (!h || !w) return "-";
  const m = h / 100;
  return (w / (m * m)).toFixed(1);
};

/* ---------------- COMPONENT ---------------- */

export default function ChildHealthRecord() {
  const [child, setChild] = useState(DUMMY_CHILD);
  const [openEdit, setOpenEdit] = useState(false);
  const [openCamp, setOpenCamp] = useState(false);

  const [editForm, setEditForm] = useState({ ...child });
  const [campForm, setCampForm] = useState({ ...child.campReport });
const [editErrors, setEditErrors] = useState({});
const [campErrors, setCampErrors] = useState({});
  const updateField = (k, v) => setEditForm({ ...editForm, [k]: v });
  const updateCampField = (k, v) =>
    setCampForm({ ...campForm, [k]: v });

  const saveHealth = () => {
    setChild({
      ...child,
      ...editForm,
    });
    setOpenEdit(false);
  };

  const saveCamp = () => {
    setChild({
      ...child,
      campReport: campForm,
    });
    setOpenCamp(false);
  };

  const exportCampPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Child Health Camp Report`, 14, 20);
    doc.text(`Name: ${child.name}`, 14, 30);
    doc.text(`Class: ${child.class}-${child.section}`, 14, 40);
    doc.text(`BP: ${campForm.bp}`, 14, 50);
    doc.text(`HB: ${campForm.hb}`, 14, 60);
    doc.text(`Eye: ${campForm.eye}`, 14, 70);
    doc.text(`Dental: ${campForm.dental}`, 14, 80);
    doc.text(`Notes: ${campForm.notes}`, 14, 90);
    doc.save("Child_Health_Camp_Report.pdf");
  };

  const summaryCards = [
    {
      label: "Blood Group",
      value: child.blood,
      icon: <FiHeart className="text-red-600" />,
    },
    {
      label: "BMI",
      value: calcBMI(child.height, child.weight),
      icon: <FiActivity className="text-blue-600" />,
    },
    {
      label: "Allergies",
      value: child.allergies,
      icon: <FiAlertCircle className="text-orange-600" />,
    },
    {
      label: "Vaccination",
      value: child.vaccination,
      icon: <FiShield className="text-green-600" />,
    },
  ];

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-bold">Child Health Record</h2>
        <button
          onClick={() => setOpenEdit(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
        >
          <FiEdit /> Edit
        </button>
      </div>

      {/* Summary Cards */}
      <div className="bg-white p-3 rounded-lg border mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {summaryCards.map((c, i) => (
            <div key={i} className="p-4 border rounded-lg shadow-sm">
              <div className="flex gap-3 items-center">
                {c.icon}
                <div>
                  <p className="text-gray-500 text-sm">{c.label}</p>
                  <p className="font-semibold">{c.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="bg-white p-4 rounded-lg border mb-3 space-y-2">
        <p><strong>Name:</strong> {child.name}</p>
        <p><strong>Class:</strong> {child.class}-{child.section}</p>
        <p><strong>Roll:</strong> {child.roll}</p>
        <p><strong>Height:</strong> {child.height} cm</p>
        <p><strong>Weight:</strong> {child.weight} kg</p>
        <p><strong>Medication:</strong> {child.medication}</p>
        <p><strong>Notes:</strong> {child.notes}</p>
      </div>

      {/* Camp */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Doctor Health Camp</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setOpenCamp(true)}
              className="px-3 py-1 bg-purple-600 text-white rounded text-sm"
            >
              Edit
            </button>
            <button
              onClick={exportCampPDF}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm flex items-center gap-1"
            >
              <FiDownload /> PDF
            </button>
          </div>
        </div>

        <div className="mt-3 text-sm">
          <p>BP: {child.campReport.bp}</p>
          <p>HB: {child.campReport.hb}</p>
          <p>Eye: {child.campReport.eye}</p>
          <p>Dental: {child.campReport.dental}</p>
          <p>Notes: {child.campReport.notes}</p>
        </div>
      </div>

      {/* EDIT MODAL */}
      {openEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-xl space-y-3">
            <h3 className="font-semibold text-lg">Edit Child Health</h3>
<input
  type="text"
  className="border p-2 w-full rounded"
  value={editForm.blood}
  onChange={(e) =>
    updateField(
      "blood",
      e.target.value.toUpperCase().replace(/[^ABO+-]/g, "")
    )
  }
  placeholder="Blood Group (A+, O-)"
/>

<input
  type="number"
  className="border p-2 w-full rounded"
  value={editForm.height}
  onChange={(e) => {
    const val = e.target.value;
    updateField("height", val);

    setEditErrors((prev) => ({
      ...prev,
      height: val < 0 ? "Height should be above 0" : "",
    }));
  }}
  placeholder="Height (cm)"
/>

{editErrors.height && (
  <p className="text-red-600 text-sm">{editErrors.height}</p>
)}

<input
  type="number"
  className="border p-2 w-full rounded"
  value={editForm.weight}
  onChange={(e) => {
    const val = e.target.value;
    updateField("weight", val);

    setEditErrors((prev) => ({
      ...prev,
      weight: val < 0 ? "Weight should be not less than 0 " : "",
    }));
  }}
  placeholder="Weight (kg)"
/>

{editErrors.weight && (
  <p className="text-red-600 text-sm">{editErrors.weight}</p>
)}
<textarea
  maxLength={200}
  className="border p-2 w-full rounded"
  value={editForm.notes}
  onChange={(e) => updateField("notes", e.target.value)}
  placeholder="Notes (max 200 chars)"
/>
            <div className="flex justify-end gap-2">
              <button onClick={()=>setOpenEdit(false)} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
              <button onClick={saveHealth} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* CAMP MODAL */}
      {openCamp && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-xl space-y-3">
            <h3 className="font-semibold text-lg">Health Camp</h3>

         <input
  type="text"
  className="border p-2 w-full rounded"
  value={campForm.bp}
  onChange={(e) => {
    const val = e.target.value;
    updateCampField("bp", val);

    setCampErrors((prev) => ({
      ...prev,
      bp:
        val && !val.includes("/")
          ? "BP kformat is 120/80 "
          : "",
    }));
  }}
  placeholder="BP (120/80)"
/>

{campErrors.bp && (
  <p className="text-red-600 text-sm">{campErrors.bp}</p>
)}

<input
  type="number"
  className="border p-2 w-full rounded"
  value={campForm.hb}
  onChange={(e) => {
    const val = e.target.value;
    updateCampField("hb", val);

    setCampErrors((prev) => ({
      ...prev,
      hb: val < 0 ? "HB cannot be less than 0" : "",
    }));
  }}
  placeholder="HB"
 />

{campErrors.hb && (
  <p className="text-red-600 text-sm">{campErrors.hb}</p>
)}
<input
  type="text"
  className="border p-2 w-full rounded"
  value={campForm.eye}
  onChange={(e) =>
    updateCampField(
      "eye",
      e.target.value.replace(/[^a-zA-Z ]/g, "")
    )
  }
  placeholder="Eye"
 />

<textarea
  maxLength={200}
  className="border p-2 w-full rounded"
  value={campForm.notes}
  onChange={(e) => updateCampField("notes", e.target.value)}
  placeholder="Notes (max 200 chars)"
/>

            <div className="flex justify-end gap-2">
              <button onClick={()=>setOpenCamp(false)} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
             <button
  disabled={Object.values(editErrors).some(Boolean)}
  onClick={saveHealth}
  className={`px-4 py-2 rounded text-white ${
    Object.values(editErrors).some(Boolean)
      ? "bg-blue-300 cursor-not-allowed"
      : "bg-blue-600"
  }`}
>
  Save
</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
