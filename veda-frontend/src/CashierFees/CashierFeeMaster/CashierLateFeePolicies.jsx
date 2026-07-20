import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiPlus, FiEdit, FiTrash2, FiX } from "react-icons/fi";

import config from "../../config";

const API = `${config.API_BASE_URL}/late-fee-policies`;

/* ================= DUMMY DATA ================= */
const dummyPolicies = [
  {
    _id: "1",
    category: "Tuition Fee",
    graceDays: 15,
    type: "% of Outstanding Due",
    amount: 2,
    maxCap: 1000,
    compound: false,
  },
  {
    _id: "2",
    category: "Transport Fee",
    graceDays: 5,
    type: "Flat Amount (₹)",
    amount: 100,
    maxCap: 0,
    compound: false,
  },
  {
    _id: "3",
    category: "Lab Fee",
    graceDays: 10,
    type: "Flat Amount (₹)",
    amount: 200,
    maxCap: 0,
    compound: false,
  },
  {
    _id: "4",
    category: "Exam Fee",
    graceDays: 7,
    type: "Per Day (₹/day)",
    amount: 50,
    maxCap: 500,
    compound: false,
  },
];

export default function CashierLateFeePolicies({ selectedYear }) {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    category: "Tuition Fee",
    graceDays: 7,
    type: "Flat Amount (₹)",
    amount: 0,
    maxCap: 0,
    compound: false,
  });

  /* ================= FETCH ================= */
  const fetchData = async () => {
    if (!selectedYear) return;
    try {
      const [polRes, catRes] = await Promise.all([
        axios.get(`${API}?year=${selectedYear}`),
        axios.get(`${config.API_BASE_URL}/fee-categories?year=${selectedYear}`)
      ]);
      setData(Array.isArray(polRes.data) ? polRes.data : dummyPolicies);
      if (Array.isArray(catRes.data)) setCategories(catRes.data);
      
      if (catRes.data.length > 0) {
         setForm(prev => ({ ...prev, category: catRes.data[0].name }));
      }
    } catch {
      setData(dummyPolicies);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  /* ================= MODAL ================= */
  const openModal = (item = null) => {
    if (item) {
      setEditItem(item);
      setForm(item);
    } else {
      setEditItem(null);
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      category: "Tuition Fee",
      graceDays: 7,
      type: "Flat Amount (₹)",
      amount: 0,
      maxCap: 0,
      compound: false,
    });
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (form.amount < 0 || form.graceDays < 0 || form.maxCap < 0) {
      alert("Negative values not allowed");
      return;
    }

    try {
      if (editItem) {
        await axios.put(`${API}/${editItem._id}`, { ...form, year: selectedYear });
      } else {
        await axios.post(API, { ...form, year: selectedYear });
      }
      fetchData();
    } catch {
      if (editItem) {
        setData((prev) =>
          prev.map((d) =>
            d._id === editItem._id ? { ...form, _id: d._id } : d
          )
        );
      } else {
        setData((prev) => [
          ...prev,
          { ...form, _id: Date.now().toString() },
        ]);
      }
    }

    setShowModal(false);
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete policy?")) return;

    try {
      await axios.delete(`${API}/${id}`);
      fetchData();
    } catch {
      setData((prev) => prev.filter((d) => d._id !== id));
    }
  };

  return (
    <div className="p-0 min-h-screen">

     

      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Late Fee Policies</h2>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FiPlus /> Add Policy
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left">Fee Category</th>
              <th>Grace Period</th>
              <th>Penalty Type</th>
              <th>Penalty Amount</th>
              <th>Max Cap</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d._id} className="border-t">
                <td className="p-3 font-medium">{d.category}</td>
                <td>{d.graceDays} days</td>
                <td>{d.type}</td>
                <td className="text-red-600 font-semibold">
                  {d.type.includes("%") ? `${d.amount}%` : `₹${d.amount}`}
                </td>
                <td>{d.maxCap ? `₹${d.maxCap}` : "No cap"}</td>
                <td className="flex gap-2 p-2">
                  <button
                    onClick={() => openModal(d)}
                    className="border px-2 py-1 rounded text-blue-600 flex items-center gap-1"
                  >
                    <FiEdit /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(d._id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-[500px] max-h-[90vh] rounded-xl flex flex-col">

            {/* HEADER */}
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editItem ? "Edit Late Fee Policy" : "New Late Fee Policy"}
              </h3>
              <FiX
                onClick={() => setShowModal(false)}
                className="cursor-pointer"
              />
            </div>

            {/* BODY */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">

              <div>
                <label className="text-sm text-gray-600">Fee Category *</label>
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
                  {categories.length === 0 && (
                    <>
                      <option>Tuition Fee</option>
                      <option>Transport Fee</option>
                      <option>Lab Fee</option>
                      <option>Exam Fee</option>
                      <option>Library Fee</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  Grace Period (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  className="border p-2 rounded w-full mt-1"
                  value={form.graceDays}
                  onKeyDown={(e) =>
                    (e.key === "-" || e.key === "e") && e.preventDefault()
                  }
                  onChange={(e) =>
                    setForm({ ...form, graceDays: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Penalty Type</label>
                <select
                  className="border p-2 rounded w-full mt-1"
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value })
                  }
                >
                  <option>% of Outstanding Due</option>
                  <option>Flat Amount (₹)</option>
                  <option>Per Day (₹/day)</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Amount</label>
                <input
                  type="number"
                  min="0"
                  className="border p-2 rounded w-full mt-1"
                  value={form.amount}
                  onKeyDown={(e) =>
                    (e.key === "-" || e.key === "e") && e.preventDefault()
                  }
                  onChange={(e) =>
                    setForm({ ...form, amount: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  Maximum Cap (₹) – 0 for no cap
                </label>
                <input
                  type="number"
                  min="0"
                  className="border p-2 rounded w-full mt-1"
                  value={form.maxCap}
                  onKeyDown={(e) =>
                    (e.key === "-" || e.key === "e") && e.preventDefault()
                  }
                  onChange={(e) =>
                    setForm({ ...form, maxCap: Number(e.target.value) })
                  }
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.compound}
                  onChange={(e) =>
                    setForm({ ...form, compound: e.target.checked })
                  }
                />
                Compound monthly (add to principal each month)
              </label>
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t flex gap-3">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white w-full py-2 rounded"
              >
                {editItem ? "Update Policy" : "Add Policy"}
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