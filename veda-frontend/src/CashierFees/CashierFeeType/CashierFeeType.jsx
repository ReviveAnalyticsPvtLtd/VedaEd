import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiDownload } from "react-icons/fi";
import axios from "axios";
import config from "../../config";

export default function CashierFeeType() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [feeTypes, setFeeTypes] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = async (year) => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/fee-categories?year=${year}`);
      if (Array.isArray(res.data)) {
        setFeeTypes(res.data);
      }
    } catch (err) {
      console.error("Error fetching fee types:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get(`${config.API_BASE_URL}/academic-years`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          const active = res.data.find(y => y.isActive) || res.data[0];
          setSelectedYear(active.label);
          fetchData(active.label);
        } else {
          setSelectedYear("2025-26");
          fetchData("2025-26");
        }
      } catch (err) {
        setSelectedYear("2025-26");
        fetchData("2025-26");
      }
    };
    init();
  }, []);

  /* ===== SAVE / UPDATE ===== */
  const handleSave = async () => {
    if (!name.trim() || !code.trim()) {
      return alert("Name & Fees Code are required");
    }

    try {
      if (editIndex !== null) {
        const item = feeTypes[editIndex];
        await axios.put(`${config.API_BASE_URL}/fee-categories/${item._id}`, {
          name,
          code,
          desc: description,
          year: selectedYear,
          frequency: item.frequency || "Annual",
          applicability: item.applicability || "All Grades"
        });
        setEditIndex(null);
      } else {
        await axios.post(`${config.API_BASE_URL}/fee-categories`, {
          name,
          code,
          desc: description,
          year: selectedYear,
          frequency: "Annual",
          applicability: "All Grades"
        });
      }
      setName("");
      setCode("");
      setDescription("");
      fetchData(selectedYear);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save fee type");
    }
  };

  /* ===== EDIT ===== */
  const handleEdit = (index) => {
    const item = feeTypes[index];
    setName(item.name);
    setCode(item.code);
    setDescription(item.desc || "");
    setEditIndex(index);
  };

  /* ===== DELETE ===== */
  const handleDelete = async (index) => {
    if (!window.confirm("Delete this fee type?")) return;
    try {
      const item = feeTypes[index];
      await axios.delete(`${config.API_BASE_URL}/fee-categories/${item._id}`);
      fetchData(selectedYear);
      if (editIndex === index) {
        setName("");
        setCode("");
        setDescription("");
        setEditIndex(null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete fee type");
    }
  };

  /* ===== SEARCH ===== */
  const filteredData = feeTypes.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase())
  );

  /* ===== EXPORT CSV ===== */
  const handleExport = () => {
    const csv = [
      ["Name", "Fees Code", "Description"],
      ...feeTypes.map((f) => [f.name, f.code, f.desc || ""]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "fee-types.csv";
    a.click();
  };


  return (
    <div className="p-0 min-h-screen">
        <div className="text-gray-500 text-sm mb-2">
Fees &gt; Fees Type 
</div>

<div className="flex justify-between items-center mb-4">
<h2 className="text-2xl font-bold">Fees Type</h2>
</div>
{/* Tabs */}
          <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
            <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
              Overview
            </button>
          </div>
      <div className="grid grid-cols-12 gap-3">

        {/* ===== LEFT FORM ===== */}
        <div className="col-span-4">
          <div className="bg-white border rounded-lg shadow-sm">

            <div className="p-4 border-b font-medium">
              {editIndex !== null ? "Edit Fees Type" : "Add Fees Type"}
            </div>

            <div className="p-4 space-y-4">

              <div>
                <label className="text-sm">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm">
                  Fees Code <span className="text-red-500">*</span>
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full mt-1 border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm">Description</label>
                <textarea
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>

            <div className="p-4 flex justify-end">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
              >
                {editIndex !== null ? "Update" : "Save"}
              </button>
            </div>

          </div>
        </div>

        {/* ===== RIGHT TABLE ===== */}
        <div className="col-span-8">
          <div className="bg-white border rounded-lg shadow-sm">

            {/* HEADER */}
            <div className="p-4 border-b font-medium flex justify-between items-center">
              <span>Fees Type List</span>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 text-sm bg-blue-200 px-3 py-2 rounded-md hover:bg-gray-200"
              >
                <FiDownload /> Export
              </button>
            </div>

            {/* SEARCH */}
            <div className="p-4">
              <input
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm w-64"
              />
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-b text-gray-600">
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Fees Code</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredData.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3">{item.name}</td>
                      <td className="p-3">{item.code}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(index)}
                            className="bg-purple-500 text-white p-2 rounded-md"
                          >
                            <FiEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(index)}
                            className="bg-red-500 text-white p-2 rounded-md"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center p-4 text-gray-400">
                        No data found
                      </td>
                    </tr>
                  )}
                </tbody>

              </table>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}