import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import config from "../../config";

const API = `${config.API_BASE_URL}/fines`;

const CashierFineManagement = ({ selectedYear }) => {
  const [fines, setFines] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editFine, setEditFine] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    amount: "",
    active: true,
  });

  // ------------------ Dummy Data ------------------
  const dummyData = [
    {
      id: 1,
      name: "Lost Library Book",
      description: "Penalty for each lost book",
      amount: 500,
      active: true,
    },
    {
      id: 2,
      name: "ID Card Replacement",
      description: "Replacement of lost school ID card",
      amount: 150,
      active: true,
    },
    {
      id: 3,
      name: "Uniform Violation",
      description: "Repeated uniform non-compliance fine",
      amount: 200,
      active: true,
    },
    {
      id: 4,
      name: "Bus Pass Duplicate",
      description: "Duplicate bus pass issuance",
      amount: 100,
      active: true,
    },
  ];

  // ------------------ Fetch ------------------
  const fetchFines = async () => {
    if (!selectedYear) return;
    try {
      const res = await axios.get(`${API}?year=${selectedYear}`);
      setFines(Array.isArray(res.data) ? res.data : dummyData);
    } catch {
      setFines(dummyData);
    }
  };

  useEffect(() => {
    fetchFines();
  }, [selectedYear]);

  // ------------------ Input Change ------------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // ------------------ Submit ------------------
  const handleSubmit = async () => {
    try {
      if (editFine) {
        await axios.put(`${API}/${editFine.id}`, { ...form, year: selectedYear });
        setFines((prev) =>
          prev.map((f) =>
            f.id === editFine.id ? { ...f, ...form, year: selectedYear } : f
          )
        );
      } else {
        const res = await axios.post(API, { ...form, year: selectedYear });
        setFines([...fines, res.data || { ...form, id: Date.now(), year: selectedYear }]);
      }
    } catch {
      if (editFine) {
        setFines((prev) =>
          prev.map((f) =>
            f.id === editFine.id ? { ...f, ...form } : f
          )
        );
      } else {
        setFines([...fines, { ...form, id: Date.now() }]);
      }
    }

    resetForm();
  };

  // ------------------ Edit ------------------
  const handleEdit = (fine) => {
    setEditFine(fine);
    setForm(fine);
    setShowModal(true);
  };

  // ------------------ Delete ------------------
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/${id}`);
    } catch {}
    setFines(fines.filter((f) => f.id !== id));
  };

  // ------------------ Toggle Status ------------------
  const toggleStatus = async (fine) => {
    try {
      await axios.patch(`${API}/${fine.id}/status`, {
        active: !fine.active,
      });
    } catch {}

    setFines((prev) =>
      prev.map((f) =>
        f.id === fine.id ? { ...f, active: !f.active } : f
      )
    );
  };

  // ------------------ Reset ------------------
  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      amount: "",
      active: true,
    });
    setEditFine(null);
    setShowModal(false);
  };

  return (
    <div className="p-0 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Fees Penalities</h2>
        
   <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
        >
          <FiPlus /> Add Fine
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="p-4">Fine Name</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {fines.map((fine) => (
              <tr key={fine.id} className="border-t">
                <td className="p-4 font-medium">{fine.name}</td>
                <td>{fine.description}</td>
                <td className="text-blue-600 font-semibold">
                  ₹{fine.amount}
                </td>

                {/* STATUS */}
                <td>
                  <button
                    onClick={() => toggleStatus(fine)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      fine.active
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {fine.active ? "Active" : "Inactive"}
                  </button>
                </td>

                {/* ACTIONS */}
                <td className="flex justify-center gap-2 py-2">
                  <button
                    onClick={() => handleEdit(fine)}
                    className="flex items-center gap-1 border px-3 py-1 rounded text-blue-600"
                  >
                    <FiEdit /> Edit
                  </button>

                  <button
                    onClick={() => handleDelete(fine.id)}
                    className="bg-red-500 text-white p-2 rounded"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center">
          <div className="bg-white w-[420px] rounded-xl p-6 shadow-lg relative">
            {/* Close */}
            <button
              onClick={resetForm}
              className="absolute top-4 right-4 text-gray-500"
            >
              <FiX />
            </button>

            <h2 className="text-xl font-semibold mb-2">
              {editFine ? "Edit Fine Rule" : "New Fine Rule"}
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              Define a miscellaneous penalty charged per incident.
            </p>

            {/* FORM */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Fine Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Lost Library Book"
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Short explanation shown on receipts"
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />
                <label>Active</label>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="mt-6 space-y-2">
              <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 text-white py-2 rounded-lg"
              >
                {editFine ? "Update Fine" : "Add Fine"}
              </button>

              <button
                onClick={resetForm}
                className="w-full border py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierFineManagement;