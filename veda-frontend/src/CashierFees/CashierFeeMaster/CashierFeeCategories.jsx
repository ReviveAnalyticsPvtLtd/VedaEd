import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import config from "../../config";

const API = `${config.API_BASE_URL}/fee-categories`;

// ✅ Dummy fallback data
const dummyData = [
  {
    _id: "1",
    name: "Tuition Fee",
    code: "4000",
    desc: "Core academic instruction charges",
    frequency: "Annual",
    applicability: "All Grades",
    optional: false,
    partial: true,
    taxable: false,
    taxPercent: 0,
    active: true,
  },
  {
    _id: "2",
    name: "Transport Fee",
    code: "4100",
    desc: "Monthly school bus transportation",
    frequency: "Monthly",
    applicability: "All Grades",
    optional: true,
    partial: false,
    taxable: false,
    taxPercent: 0,
    active: true,
  },
];

export default function CashierFeeCategories({ selectedYear }) {
  const [data, setData] = useState([]);
  const [useDummy, setUseDummy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    desc: "",
    frequency: "Annual",
    applicability: "All Grades",
    optional: false,
    partial: false,
    taxable: false,
    taxPercent: 0,
  });

  const fetchData = async () => {
    if (!selectedYear) return;
    try {
      const res = await axios.get(`${API}?year=${selectedYear}`);
      if (Array.isArray(res.data)) {
        setData(res.data);
      } else {
        throw new Error("Invalid format");
      }
      setUseDummy(false);
    } catch (err) {
      console.warn("API failed → using dummy data");
      setData(dummyData);
      setUseDummy(true);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

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
      code: "",
      desc: "",
      frequency: "Annual",
      applicability: "All Grades",
      optional: false,
      partial: false,
      taxable: false,
      taxPercent: 0,
    });
  };

  // ================= SAVE =================
  const handleSave = async () => {
    try {
      if (editItem) {
        await axios.put(`${API}/${editItem._id}`, { ...form, year: selectedYear });
      } else {
        await axios.post(API, { ...form, year: selectedYear });
      }
      fetchData();
    } catch (err) {
      console.warn("API failed → updating locally");

      if (editItem) {
        setData((prev) =>
          prev.map((d) =>
            d._id === editItem._id ? { ...form, _id: d._id } : d
          )
        );
      } else {
        setData((prev) => [
          ...prev,
          { ...form, _id: Date.now().toString(), active: true },
        ]);
      }
    }

    setShowModal(false);
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;

    try {
      await axios.delete(`${API}/${id}`);
      fetchData();
    } catch {
      setData((prev) => prev.filter((d) => d._id !== id));
    }
  };

  // ================= TOGGLE =================
  const toggleActive = async (id) => {
    try {
      await axios.patch(`${API}/${id}/toggle`);
      fetchData();
    } catch {
      setData((prev) =>
        prev.map((d) =>
          d._id === id ? { ...d, active: !d.active } : d
        )
      );
    }
  };

  return (
    <div className="p-0 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between mb-3">
        <h2 className="text-xl font-semibold">Fee Configuration</h2>

        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <FiPlus /> Add Category
        </button>
      </div>

      

      {/* CARDS */}
      <div className="grid md:grid-cols-3 gap-3">
        {data.map((item) => (
          <div
            key={item._id}
            className="bg-white p-5 rounded-xl shadow border relative"
          >
            <span className="text-xs bg-yellow-100 px-2 py-1 rounded-full">
              {item.frequency}
            </span>

            {/* Toggle */}
            <div className="absolute right-4 top-4 flex items-center gap-2">
              <span
                className={`text-xs ${
                  item.active ? "text-green-600" : "text-red-500"
                }`}
              >
                {item.active ? "Active" : "Inactive"}
              </span>

              <button
                onClick={() => toggleActive(item._id)}
                className={`w-10 h-5 flex items-center rounded-full p-1 ${
                  item.active ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full ${
                    item.active ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            <h3 className="text-lg font-semibold mt-3">{item.name}</h3>
            <p className="text-sm text-gray-500">{item.desc}</p>

            <div className="mt-4 text-sm space-y-1">
              <p><b>GL CODE:</b> {item.code}</p>
              <p><b>Applies To:</b> {item.applicability}</p>
              <p>
                <b>Partial Pay:</b>{" "}
                {item.partial ? "Allowed" : "Not Allowed"}
              </p>
            </div>

            <div className="flex gap-2 mt-4">
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
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center backdrop-blur-sm">
          <div className="bg-white w-[650px] rounded-2xl p-6 shadow-2xl animate-fadeIn">
            
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editItem ? "Edit Fee Category" : "New Fee Category"}
              </h2>
              <FiX
                className="cursor-pointer"
                onClick={() => setShowModal(false)}
              />
            </div>

            {/* FORM */}
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Category Name *"
                className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />

              <input
                placeholder="GL Code *"
                className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value })
                }
              />

              <input
                placeholder="Description"
                className="border p-2 rounded-lg col-span-2"
                value={form.desc}
                onChange={(e) =>
                  setForm({ ...form, desc: e.target.value })
                }
              />

              <select
                className="border p-2 rounded-lg"
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: e.target.value })
                }
              >
                <option>Annual</option>
                <option>Monthly</option>
                <option>One-Time</option>
              </select>

              <select
                className="border p-2 rounded-lg"
                value={form.applicability}
                onChange={(e) =>
                  setForm({ ...form, applicability: e.target.value })
                }
              >
                <option>All Grades</option>
                <option>Grade 1-5</option>
                <option>Grade 6-10</option>
              </select>
            </div>

            {/* CHECKBOXES */}
            <div className="mt-4 space-y-2 text-sm">
              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={form.optional}
                  onChange={(e) =>
                    setForm({ ...form, optional: e.target.checked })
                  }
                />
                Optional (student can opt-out)
              </label>

              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={form.partial}
                  onChange={(e) =>
                    setForm({ ...form, partial: e.target.checked })
                  }
                />
                Allow Partial Payment
              </label>

              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={form.taxable}
                  onChange={(e) =>
                    setForm({ ...form, taxable: e.target.checked })
                  }
                />
                Taxable
              </label>
            </div>

            {/* TAX */}
            {form.taxable && (
              <input
                type="number"
                placeholder="Tax %"
                className="border p-2 rounded-lg mt-3 w-full"
                value={form.taxPercent}
                onChange={(e) =>
                  setForm({
                    ...form,
                    taxPercent: e.target.value,
                  })
                }
              />
            )}

            {/* BUTTONS */}
            <div className="flex gap-3 mt-6">
               <button
              onClick={handleSave}
              className="bg-blue-600 text-white w-full py-2 rounded"
            >
              Save
            </button>
              <button
                onClick={() => setShowModal(false)}
                className="border w-full py-2 rounded-lg"
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