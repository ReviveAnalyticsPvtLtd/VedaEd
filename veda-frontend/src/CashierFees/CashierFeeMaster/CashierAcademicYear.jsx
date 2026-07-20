
import { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import config from "../../config";

const API_BASE = `${config.API_BASE_URL}/academic-years`;

export default function CashierAcademicYear({ selectedYear, onYearChange }) {
  /* ================= DUMMY DATA ================= */
  const [years, setYears] = useState([
    {
      _id: "1",
      label: "2024-25",
      startDate: "2024-04-01",
      endDate: "2025-03-31",
      isActive: true,
      terms: [
        {
          name: "Term 1",
          startDate: "2024-04-01",
          endDate: "2024-09-30",
          dueDate: "2024-04-15",
        },
        {
          name: "Term 2",
          startDate: "2024-10-01",
          endDate: "2025-03-31",
          dueDate: "2024-10-15",
        },
      ],
    },
  ]);

  /* ================= STATE ================= */
  const emptyForm = {
    label: "",
    startDate: "",
    endDate: "",
    isActive: false,
    terms: [
      { name: "", startDate: "", endDate: "", dueDate: "" },
    ],
  };

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  /* ================= HANDLERS ================= */
  const openNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (y) => {
    setEditId(y._id);
    setForm(JSON.parse(JSON.stringify(y)));
    setShowModal(true);
  };

 const saveYear = () => {
  if (!form.label || !form.startDate || !form.endDate) {
    alert("All required fields are mandatory");
    return;
  }

  // ================= FRONTEND STATE (INSTANT UI) =================
  setYears((prev) => {
    let updated = prev.map((y) =>
      form.isActive ? { ...y, isActive: false } : y
    );

    if (editId) {
      updated = updated.map((y) =>
        y._id === editId ? { ...form, _id: editId } : y
      );
    } else {
      updated.push({ ...form, _id: Date.now().toString() });
    }
    return updated;
  });

  // ================= API CALL =================
  fetch(editId ? `${API_BASE}/${editId}` : API_BASE, {
    method: editId ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  }).catch(() => {
    console.log("Save API failed (dummy mode)");
  });

  setShowModal(false);
};

  const deleteYear = (id) => {
  if (!window.confirm("Delete this academic year?")) return;

  // UI remove
  setYears((p) => p.filter((y) => y._id !== id));

  // API
  fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  }).catch(() => {
    console.log("Delete API failed (dummy mode)");
  });
};

  const addTerm = () =>
    setForm({
      ...form,
      terms: [
        ...form.terms,
        { name: "", startDate: "", endDate: "", dueDate: "" },
      ],
    });

  const removeTerm = (i) =>
    setForm({
      ...form,
      terms: form.terms.filter((_, idx) => idx !== i),
    });
useEffect(() => {
  // GET ALL ACADEMIC YEARS
  fetch(API_BASE)
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) {
        setYears(data);
      }
    })
    .catch(() => {
      // backend na ho to fallback data rahe
      console.log("API not connected, showing local data");
    });
}, []);
  /* ================= UI ================= */
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Academic Configuration</h2>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <FiPlus /> New Academic Year
        </button>
      </div>

      {/* Cards */}
      {years.map((y) => (
        <div key={y._id} className="border rounded-lg p-4 bg-white">
          <div className="flex justify-between">
            <div>
              <h3 className="text-xl font-semibold">
                {y.label}
                {y.isActive && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Active
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500">
                {y.startDate} — {y.endDate}
              </p>
            </div>

            <div className="flex gap-2">
              {!y.isActive && (
               <button
  onClick={() => {
   
    setYears((prev) =>
      prev.map((yr) =>
        yr._id === y._id
          ? { ...yr, isActive: true }
          : { ...yr, isActive: false }
      )
    );

    
    fetch(`${config.API_BASE_URL}/academic-years/${y._id}/activate`, {
      method: "PATCH",
    })
    .then(() => onYearChange())
    .catch(() => {
      console.log("Activate API failed (dummy mode)");
    });
  }}
  className="border px-3 py-1 rounded text-sm"
>
  Set Active
</button>
              )}
              <button
                onClick={() => openEdit(y)}
                className="border px-3 py-1 rounded"
              >
                <FiEdit2 />
              </button>
              <button
                onClick={() => deleteYear(y._id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                <FiTrash2 />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            {y.terms.map((t, i) => (
              <div key={i} className="border rounded p-3">
                <h4 className="font-semibold">{t.name}</h4>
                <p className="text-sm">
                  Period: {t.startDate} — {t.endDate}
                </p>
                <p className="text-sm">
                  Due Date: {t.dueDate}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-gray-50 w-full max-w-3xl rounded-lg">

            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <div>
                <h2 className="text-xl font-semibold">
                  {editId ? "Edit Academic Year" : "New Academic Year"}
                </h2>
                <p className="text-sm text-gray-500">
                  Set the year period and define billing terms.
                </p>
              </div>
              <button onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>

           <div className="p-6 space-y-6">

  {/* YEAR LABEL */}
  <div>
    <label className="block text-xs font-semibold mb-1">
      YEAR LABEL *
    </label>
    <input
      className="w-full border rounded px-3 py-2"
      placeholder="e.g. 2025-26"
      value={form.label}
      onChange={(e) =>
        setForm({ ...form, label: e.target.value })
      }
    />
  </div>

  {/* ACADEMIC DATES */}
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-xs font-semibold mb-1">
        START DATE *
      </label>
      <input
        type="date"
        className="w-full border rounded px-3 py-2"
        value={form.startDate}
        onChange={(e) =>
          setForm({ ...form, startDate: e.target.value })
        }
      />
    </div>

    <div>
      <label className="block text-xs font-semibold mb-1">
        END DATE *
      </label>
      <input
        type="date"
        className="w-full border rounded px-3 py-2"
        value={form.endDate}
        onChange={(e) =>
          setForm({ ...form, endDate: e.target.value })
        }
      />
    </div>
  </div>

  {/* SET ACTIVE */}
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={form.isActive}
      onChange={(e) =>
        setForm({ ...form, isActive: e.target.checked })
      }
    />
    <label className="text-sm font-medium">
      Set this Academic Year as Active
    </label>
  </div>

  {/* TERMS HEADER */}
  <div className="flex justify-between items-center pt-2">
    <h4 className="text-sm font-semibold">
       BILLING PERIODS
    </h4>
    <button
      onClick={addTerm}
      className="text-blue-600 text-sm flex gap-1"
    >
      <FiPlus /> Add Term
    </button>
  </div>

  {/* TERMS ROWS */}
  {form.terms.map((t, i) => (
    <div
      key={i}
      className="grid grid-cols-5 gap-4 bg-white p-4 rounded border"
    >

      {/* TERM NAME */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          MONTH NAME
        </label>
        <input
          className="w-full border rounded px-2 py-1"
          placeholder="Month"
          value={t.name}
          onChange={(e) => {
            const terms = [...form.terms];
            terms[i].name = e.target.value;
            setForm({ ...form, terms });
          }}
        />
      </div>

      {/* TERM START */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          START DATE
        </label>
        <input
          type="date"
          className="w-full border rounded px-2 py-1"
          value={t.startDate}
          onChange={(e) => {
            const terms = [...form.terms];
            terms[i].startDate = e.target.value;
            setForm({ ...form, terms });
          }}
        />
      </div>

      {/* TERM END */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          END DATE
        </label>
        <input
          type="date"
          className="w-full border rounded px-2 py-1"
          value={t.endDate}
          onChange={(e) => {
            const terms = [...form.terms];
            terms[i].endDate = e.target.value;
            setForm({ ...form, terms });
          }}
        />
      </div>

      {/* DUE DATE */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          DUE DATE
        </label>
        <input
          type="date"
          className="w-full border rounded px-2 py-1"
          value={t.dueDate}
          onChange={(e) => {
            const terms = [...form.terms];
            terms[i].dueDate = e.target.value;
            setForm({ ...form, terms });
          }}
        />
      </div>

      {/* DELETE */}
      <div className="flex items-end justify-center">
        <button
          onClick={() => removeTerm(i)}
          className="text-red-500 hover:text-red-700"
        >
          <FiTrash2 />
        </button>
      </div>

    </div>
  ))}
</div>

            {/* Footer */}
            <div className="px-6 py-4 border-t space-y-2">
              <button
                onClick={saveYear}
                className="w-full bg-blue-600 text-white py-2 rounded"
              >
                {editId ? "Update" : "Create"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="w-full border py-2 rounded text-blue-600"
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