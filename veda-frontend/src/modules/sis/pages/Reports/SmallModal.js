import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";

export default function SmallModal({
  open,
  title,
  fields,
  editRow,
  onSave,
  onImport,
  onClose,
}) {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editRow) {
      setForm(editRow);
    } else {
      setForm({});
    }
    setErrors({});
  }, [editRow, open]);

  if (!open) return null;

  // 🔒 FIELD RULES (same pattern as Vehicles.jsx)
  const letterOnly = ["name", "subject", "section", "grade"];
  const numberOnly = ["marks", "prevMarks", "class"];

  const handleKeyDown = (e, field) => {
    const key = e.key;

    // allow control keys
    if (
      ["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete"].includes(key)
    ) {
      return;
    }

    // LETTER ONLY
    if (letterOnly.includes(field)) {
      if (!/^[a-zA-Z\s]$/.test(key)) {
        e.preventDefault();
        setErrors((p) => ({
          ...p,
          [field]: "Only letters allowed",
        }));
      }
    }

    // NUMBER ONLY
    if (numberOnly.includes(field)) {
      if (!/^[0-9]$/.test(key)) {
        e.preventDefault();
        setErrors((p) => ({
          ...p,
          [field]: "Only numbers allowed",
        }));
      }
    }
  };

  const handleChange = (e, field) => {
    setErrors((p) => ({ ...p, [field]: "" }));
    setForm({ ...form, [field]: e.target.value });
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      onImport(json);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 px-3">
     <div className="bg-white w-full max-w-md mx-auto rounded-xl shadow-xl p-5 relative">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {fields.map((f) => (
            <div key={f}>
              <label className="block text-sm font-medium mb-1 capitalize">
                {f}
              </label>

              <input
                type="text"
                value={form[f] || ""}
                onKeyDown={(e) => handleKeyDown(e, f)}
                onChange={(e) => handleChange(e, f)}
                onPaste={(e) => e.preventDefault()}
                className={`w-full border px-3 py-2 rounded-md ${
                  errors[f] ? "border-red-500" : ""
                }`}
              />

              {/* 🔴 EXACT Vehicles.jsx style error */}
              {errors[f] && (
                <p className="text-xs text-red-500 mt-1">{errors[f]}</p>
              )}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium mb-1">Import</label>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleImport}
              className="w-full border px-3 py-2 rounded-md file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={() => {
              onSave(form);
              setForm({});
              setErrors({});
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            Save
          </button>

          <button
            onClick={() => {
              setForm({});
              setErrors({});
              onClose();
            }}
            className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}