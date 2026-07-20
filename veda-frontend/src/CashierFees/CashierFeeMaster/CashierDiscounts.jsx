import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiPlus, FiEdit, FiTrash2, FiX } from "react-icons/fi";

/* ================= API ================= */
import config from "../../config";

const API = `${config.API_BASE_URL}/discount-rules`;

/* ================= DUMMY DATA ================= */
const dummyDiscounts = [
  {
    _id: "1",
    name: "Sibling Concession",
    description: "10% off tuition for second child onward",
    basis: "Custom",
    type: "Percentage (%)",
    value: 10,
    maxCap: 2500,
    categories: ["Tuition Fee"],
    grades: [],
    stackable: true,
    active: true,
  },
  {
    _id: "2",
    name: "Merit Scholarship",
    description: "15% off tuition for top performers (≥95%)",
    basis: "Merit",
    type: "Percentage (%)",
    value: 15,
    maxCap: 4000,
    categories: ["Tuition Fee"],
    grades: [],
    stackable: false,
    active: true,
  },
  {
    _id: "3",
    name: "Staff Ward Discount",
    description: "50% off all fees for staff children",
    basis: "Staff",
    type: "Percentage (%)",
    value: 50,
    maxCap: 15000,
    categories: [],
    grades: [],
    stackable: false,
    active: true,
  },
];

/* ================= OPTIONS ================= */
const feeCategories = [
  "Tuition Fee",
  "Transport Fee",
  "Lab Fee",
  "Library Fee",
  "Sports Fee",
  "Exam Fee",
  "Development Fund",
];

const gradesList = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
];

export default function CashierDiscountRules({ selectedYear }) {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [gradesList, setGradesList] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    basis: "Custom",
    type: "Percentage (%)",
    value: 0,
    maxCap: 0,
    categories: [],
    grades: [],
    stackable: false,
    active: true,
  });

  const fetchData = async () => {
    if (!selectedYear) return;
    try {
      const [rulesRes, catRes, classRes] = await Promise.all([
        axios.get(`${API}?year=${selectedYear}`),
        axios.get(`${config.API_BASE_URL}/fee-categories?year=${selectedYear}`),
        axios.get(`${config.API_BASE_URL}/classes`)
      ]);
      setData(Array.isArray(rulesRes.data) ? rulesRes.data : dummyDiscounts);
      if (Array.isArray(catRes.data)) setCategories(catRes.data.map(c => c.name));
      if (classRes.data && Array.isArray(classRes.data.data)) {
        setGradesList(classRes.data.data.map(c => c.name));
      }
    } catch {
      setData(dummyDiscounts);
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
      name: "",
      description: "",
      basis: "Custom",
      type: "Percentage (%)",
      value: 0,
      maxCap: 0,
      categories: [],
      grades: [],
      stackable: false,
      active: true,
    });
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (
      form.value < 0 ||
      form.maxCap < 0
    ) {
      alert("Negative values are not allowed");
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
    if (!window.confirm("Delete discount rule?")) return;

    try {
      await axios.delete(`${API}/${id}`);
      fetchData();
    } catch {
      setData((prev) => prev.filter((d) => d._id !== id));
    }
  };

  /* ================= TOGGLES ================= */
  const toggleArray = (arr, value) =>
    arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];

  return (
    <div className="p-0 min-h-screen">

      

      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Discount Rules</h2>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FiPlus /> Add Discount
        </button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.map((d) => (
          <div
            key={d._id}
            className="bg-white rounded-xl border p-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start">
                <span className="text-xs px-2 py-1 rounded bg-gray-100">
                  {d.basis}
                </span>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
  <span className={d.active ? "text-green-600" : "text-gray-400"}>
    {d.active ? "Active" : "Inactive"}
  </span>

  <input
    type="checkbox"
    checked={d.active}
    onChange={() => {
      setData((prev) =>
        prev.map((item) =>
          item._id === d._id
            ? { ...item, active: !item.active }
            : item
        )
      );
    }}
    className="sr-only"
  />

  <div
    className={`w-9 h-5 rounded-full transition relative ${
      d.active ? "bg-green-500" : "bg-gray-300"
    }`}
  >
    <div
      className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition ${
        d.active ? "right-0.5" : "left-0.5"
      }`}
    />
  </div>
</label>
              </div>

              <h3 className="text-lg font-semibold mt-2">{d.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {d.description}
              </p>

              <div className="mt-3 text-sm">
                <div className="font-semibold text-green-700">
                  {d.type.includes("%")
                    ? `${d.value}% off`
                    : `₹${d.value} off`}
                  {d.maxCap > 0 && ` (max ₹${d.maxCap})`}
                </div>

                <div className="mt-2 text-gray-600">
                  Applies to:{" "}
                  <b>
                    {d.categories.length
                      ? d.categories.join(", ")
                      : "All categories"}
                  </b>
                </div>

                <div className="text-gray-600">
                  Grades:{" "}
                  <b>
                    {d.grades.length
                      ? d.grades.join(", ")
                      : "All"}
                  </b>
                </div>

                <div className="text-gray-600">
                  Stackable: <b>{d.stackable ? "Yes" : "No"}</b>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => openModal(d)}
                className="border px-3 py-1 rounded text-blue-600 flex items-center gap-1"
              >
                <FiEdit /> Edit
              </button>
              <button
                onClick={() => handleDelete(d._id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-[600px] max-h-[90vh] rounded-xl flex flex-col">

            {/* HEADER */}
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editItem ? "Edit Discount Rule" : "New Discount Rule"}
              </h3>
              <FiX
                onClick={() => setShowModal(false)}
                className="cursor-pointer"
              />
            </div>

            {/* BODY */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">

             <div>
  <label className="text-sm font-medium mb-1 block">
    Rule Name *
  </label>
  <input
    className="border p-2 rounded w-full"
    value={form.name}
    onChange={(e) =>
      setForm({ ...form, name: e.target.value })
    }
  />
</div>
<div>
  <label className="text-sm font-medium mb-1 block">
    Short Description *
  </label>
              <input
                placeholder="Short description"
                className="border p-2 rounded w-full"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
</div>
             <div className="grid grid-cols-2 gap-3">
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium">Discount Basis</label>
    <select
      className="border p-2 rounded"
      value={form.basis}
      onChange={(e) =>
        setForm({ ...form, basis: e.target.value })
      }
    >
      <option>Custom</option>
      <option>Merit</option>
      <option>Staff</option>
      <option>EWS / RTE</option>
    </select>
  </div>

  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium">Discount Type</label>
    <select
      className="border p-2 rounded"
      value={form.type}
      onChange={(e) =>
        setForm({ ...form, type: e.target.value })
      }
    >
      <option>Percentage (%)</option>
      <option>Flat Amount (₹)</option>
    </select>
  </div>
</div>

<div className="grid grid-cols-2 gap-3">
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium">Discount Value</label>
    <input
      type="number"
      min="0"
      className="border p-2 rounded"
      value={form.value}
      onKeyDown={(e) =>
        (e.key === "-" || e.key === "e") &&
        e.preventDefault()
      }
      onChange={(e) =>
        setForm({
          ...form,
          value: Number(e.target.value),
        })
      }
    />
  </div>

  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium">Maximum Cap (₹)</label>
    <input
      type="number"
      min="0"
      className="border p-2 rounded"
      value={form.maxCap}
      onKeyDown={(e) =>
        (e.key === "-" || e.key === "e") &&
        e.preventDefault()
      }
      onChange={(e) =>
        setForm({
          ...form,
          maxCap: Number(e.target.value),
        })
      }
    />
  </div>
</div>

              {/* CATEGORIES */}
              <div>
                <div className="text-sm font-medium mb-1">
                  Applicable Fee Categories (blank = all)
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          categories: toggleArray(
                            form.categories,
                            c
                          ),
                        })
                      }
                      className={`px-3 py-1 rounded-full border text-sm ${
                        form.categories.includes(c)
                          ? "bg-blue-600 text-white"
                          : ""
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                  {categories.length === 0 && <span className="text-gray-400 text-xs italic">Define Fee Categories first</span>}
                </div>
              </div>

              {/* GRADES */}
              <div>
                <div className="text-sm font-medium mb-1">
                  Applicable Grades (blank = all)
                </div>
                <div className="flex flex-wrap gap-2">
                  {gradesList.map((g) => (
                    <button
                      key={g}
                      onClick={() =>
                        setForm({
                          ...form,
                          grades: toggleArray(form.grades, g),
                        })
                      }
                      className={`px-3 py-1 rounded-full border text-sm ${
                        form.grades.includes(g)
                          ? "bg-blue-600 text-white"
                          : ""
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.stackable}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stackable: e.target.checked,
                    })
                  }
                />
                Stackable (can combine with other discounts)
              </label>
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t flex gap-3">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white w-full py-2 rounded"
              >
                {editItem ? "Update Discount" : "Add Discount"}
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