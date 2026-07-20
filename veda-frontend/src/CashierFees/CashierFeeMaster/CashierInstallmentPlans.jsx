import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiPlus, FiEdit, FiTrash2, FiX } from "react-icons/fi";

import config from "../../config";

const API = `${config.API_BASE_URL}/installments`;



export default function CashierInstallmentPlans({ selectedYear }) {
  const [data, setData] = useState([]);
  const [useDummy, setUseDummy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [years, setYears] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: "",
    category: "Tuition Fee",
    year: "2024-25",
    slices: [
      { label: "1st Installment", days: 15, percent: 50 },
      { label: "2nd Installment", days: 200, percent: 50 },
    ],
  });

  // ================= FETCH =================
  const fetchData = async () => {
    if (!selectedYear) return;
    try {
      const res = await axios.get(`${API}?year=${selectedYear}`);
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Failed to fetch installment plans", err);
      setData([]); // fallback
    }
  };

  useEffect(() => {
    fetchData();
    fetchSupportData();
  }, [selectedYear]);

  const fetchSupportData = async () => {
    try {
      const [yrRes, catRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/academic-years`),
        axios.get(`${config.API_BASE_URL}/fee-categories`)
      ]);
      if (Array.isArray(yrRes.data)) setYears(yrRes.data);
      if (Array.isArray(catRes.data)) setCategories(catRes.data);
      
      // Update form defaults if data exists
      if (yrRes.data.length > 0 || catRes.data.length > 0) {
        setForm(prev => ({
          ...prev,
          year: yrRes.data.find(y => y.isActive)?.label || yrRes.data[0]?.label || prev.year,
          category: catRes.data[0]?.name || prev.category
        }));
      }
    } catch (error) {
      console.log("Error fetching support data", error);
    }
  };

  // ================= MODAL =================
  const openModal = (item = null) => {
    setEditItem(item);
    if (item) setForm(item);
    else resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: "Tuition Fee",
      year: "2024-25",
      slices: [
        { label: "1st Installment", days: 15, percent: 50 },
        { label: "2nd Installment", days: 200, percent: 50 },
      ],
    });
  };

  // ================= SLICE =================
  const addSlice = () => {
    setForm({
      ...form,
      slices: [
        ...form.slices,
        { label: "", days: 0, percent: 0 },
      ],
    });
  };

  const removeSlice = (i) => {
    setForm({
      ...form,
      slices: form.slices.filter((_, idx) => idx !== i),
    });
  };

  const updateSlice = (i, key, value) => {
    const updated = [...form.slices];

    // 🔒 Prevent negative
    if (key !== "label") {
      if (value < 0) value = 0;
    }

    updated[i][key] = value;
    setForm({ ...form, slices: updated });
  };

  const totalPercent = form.slices.reduce(
    (sum, s) => sum + Number(s.percent || 0),
    0
  );

  // ================= SAVE =================
  const handleSave = async () => {
    if (totalPercent !== 100) {
      alert("Total % must be 100");
      return;
    }

    try {
      if (editItem) {
        await axios.put(`${API}/${editItem._id}`, { ...form, year: selectedYear });
      } else {
        await axios.post(API, { ...form, year: selectedYear });
      }
      fetchData();
    } catch (err) {
      console.log("API failed to save plan");
    }

    setShowModal(false);
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete plan?")) return;

    try {
      await axios.delete(`${API}/${id}`);
      fetchData();
    } catch (err) {
      console.log("Failed to delete plan");
    }
  };

  return (
    <div className="p-0 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between mb-3">
        <h2 className="text-xl font-semibold">Installment Plans</h2>

        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <FiPlus /> New Plan
        </button>
      </div>

      {/* CARDS */}
      <div className="space-y-3">
        {data.map((item) => (
          <div
            key={item._id}
            className="bg-white p-5 rounded-xl shadow border flex justify-between items-center"
          >
            <div>
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-sm text-gray-500">
                {item.category} • {item.year} • {item.slices.length} slices
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openModal(item)}
                className="px-3 py-1 border rounded flex items-center gap-1"
              >
                <FiEdit /> Edit
              </button>

              <button
                onClick={() => handleDelete(item._id)}
                className="px-3 py-1 bg-red-500 text-white rounded flex items-center gap-1"
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center backdrop-blur-sm z-50">
    <div className="bg-white w-[700px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col">

      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold">
          {editItem ? "Edit Plan" : "New Installment Plan"}
        </h2>
        <FiX
          onClick={() => setShowModal(false)}
          className="cursor-pointer"
        />
      </div>

      {/* ================= SCROLLABLE CONTENT ================= */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4">

        {/* PLAN NAME */}
        <div>
          <label className="text-sm font-medium text-gray-600">
            Plan Name *
          </label>
          <input
            placeholder="e.g. Tuition - 2 Term Plan"
            className="border p-2 w-full rounded mt-1 focus:ring-2 focus:ring-blue-500"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />
        </div>

        {/* CATEGORY + YEAR */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-600">
              Fee Category *
            </label>
            <select
              className="border p-2 rounded w-full mt-1"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            >
              {categories.map(c => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
              {categories.length === 0 && <option>Tuition Fee</option>}
            </select>
          </div>

          <div>
             <label className="text-sm font-medium text-gray-600 uppercase tracking-wider block">Academic Session</label>
             <div className="border p-2 rounded-lg bg-gray-50 text-gray-700 mt-1 font-bold">
               {selectedYear}
             </div>
          </div>
        </div>

        {/* INSTALLMENT SLICES */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-600">
              Installment Slices
            </label>
            <button
              onClick={addSlice}
              className="text-blue-600 text-sm"
            >
              + Add Slice
            </button>
          </div>

          {/* TABLE HEADER */}
          <div className="grid grid-cols-4 text-xs text-gray-500 mb-1 px-1">
            <span>Label</span>
            <span>Due (Days)</span>
            <span>% of Total</span>
            <span></span>
          </div>

          {form.slices.map((s, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 mb-2">
              <input
                placeholder="Q1 / Term 1"
                className="border p-2 rounded"
                value={s.label}
                onChange={(e) =>
                  updateSlice(i, "label", e.target.value)
                }
              />


              <input
                type="number"
                min="0"
                value={s.days}
                onKeyDown={(e) =>
                  (e.key === "-" || e.key === "e") &&
                  e.preventDefault()
                }
                onChange={(e) =>
                  updateSlice(i, "days", e.target.value)
                }
                className="border p-2 rounded"
              />

              <input
                type="number"
                min="0"
                value={s.percent}
                onKeyDown={(e) =>
                  (e.key === "-" || e.key === "e") &&
                  e.preventDefault()
                }
                onChange={(e) =>
                  updateSlice(i, "percent", e.target.value)
                }
                className="border p-2 rounded"
              />

              <button
                onClick={() => removeSlice(i)}
                className="text-red-500"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>

        {/* TOTAL */}
        <div
          className={`p-2 rounded text-sm ${
            totalPercent === 100
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          Total: {totalPercent}% {totalPercent === 100 && "✔"}
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="p-4 border-t flex gap-3">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white w-full py-2 rounded"
        >
          Save Plan
        </button>
        <button
          onClick={() => setShowModal(false)}
          className="border w-full py-2 rounded"
        >
          Cancel
        </button>
      </div>

    </div>
  </div>
)}
    </div>
  );
}