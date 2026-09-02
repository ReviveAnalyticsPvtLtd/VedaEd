import React, { useState, useEffect } from "react";
import {
  FiEdit2,
  FiTrash2,
  FiSave,
} from "react-icons/fi";
import HelpInfo from "../../components/HelpInfo";
import * as setupAPI from "../../services/frontOfficeSetupAPI";

export default function SetupFrontOffice() {
  const tabs = ["Purpose", "Complaint Type", "Source", "Reference"];
  const [activeTab, setActiveTab] = useState("Purpose");

  const [formData, setFormData] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    Purpose: [],
    "Complaint Type": [],
    Source: [],
    Reference: [],
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await setupAPI.getSetups(activeTab);
      if (res.success) {
        setData((prev) => ({ ...prev, [activeTab]: res.data }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // SAVE / UPDATE
  const handleSave = async () => {
    if (!formData.name.trim()) return alert("Name Required");

    try {
      if (editingId) {
        const res = await setupAPI.updateSetup(editingId, formData);
        if (res.success) {
          setEditingId(null);
          setFormData({ name: "", description: "" });
          fetchData();
        }
      } else {
        const res = await setupAPI.createSetup({ ...formData, type: activeTab });
        if (res.success) {
          setFormData({ name: "", description: "" });
          fetchData();
        }
      }
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error saving record");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({ name: item.name, description: item.description });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this record?")) {
      try {
        const res = await setupAPI.deleteSetup(id);
        if (res.success) {
          fetchData();
        }
      } catch (error) {
        console.error("Error deleting data:", error);
        alert("Error deleting record");
      }
    }
  };

  const filteredData = (data[activeTab] || []).filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Front Office Setup</h2>
        <HelpInfo
          title="Front Office Setup Help"
          description={`Page Description: Configure all master data that powers the front office flows—purposes, complaint types, sources, and references.


12.1 Page Overview

Use the tab bar to switch between the master lists.

Sections:
- Tabs: Purpose, Complaint Type, Source, Reference
- Search Bar: Filters records within the active tab
- Form Section: Fields for name/description with Save/Update button
- Table/List: Displays existing records with edit/delete controls


12.2 Purpose Tab

Maintain visit purposes used across the front office.

Sections:
- Purpose Name Input: Required label for the visit purpose
- Description Field: Optional explanation for staff
- Save/Update Buttons: Creates or updates entries
- Table Actions: Edit (prefills form) or delete (confirmation prompt)


12.3 Complaint Type Tab

Define categories used when logging complaints.

Sections:
- Complaint Type Name: Required field
- Description: Optional details to guide receptionists
- Record Table: Lists all complaint types with edit/delete icons


12.4 Source Tab

Create source labels (Walk-in, Phone, Email, etc.) for enquiries.

Sections:
- Source Name Input: Required text field
- Description Input: Optional for internal notes
- Table: Shows existing sources with management actions


12.5 Reference Tab

Capture reference names (e.g., Alumni, Agent) tied to enquiries.

Sections:
- Reference Name: Required field shown to reception staff
- Description: Optional supporting information
- Data Table: Manage entries with edit/delete just like other tabs`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-3 text-sm text-gray-600 border-b">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => {
              setActiveTab(t);
              setEditingId(null);
              setFormData({ name: "", description: "" });
            }}
            className={`capitalize pb-2 ${
              activeTab === t
                ? "text-blue-600 font-semibold border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white p-3 rounded-lg shadow-sm border">
        {/* Toolbar */}
        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Search name..."
            className="border rounded-md px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* FORM */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-semibold ">
              {activeTab} Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="border rounded-md px-3 py-2 w-full"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">
              Description
            </label>
            <input
              type="text"
              className="border rounded-md px-3 py-2 w-full"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <button
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-fit"
          >
            <FiSave className="inline mr-2" />
            {editingId ? "Update" : "Save"}
          </button>
        </div>

        {/* TABLE */}
       <table className="w-full text-left border-collapse">
  <thead className="bg-gray-100 border-b">
    <tr>
      <th className="p-2 border text-center">S.No.</th>
      <th className="p-2 border">{activeTab}</th>
      <th className="p-2 border">Description</th>
      <th className="p-2 border text-center">Action</th>
    </tr>
  </thead>

  <tbody>
    {filteredData.map((item, index) => (
      <tr key={item._id} className="border-b hover:bg-gray-50">

        {/* S.No. */}
        <td className="p-2 border text-center">
          {index + 1}
        </td>

        <td className="p-2 border">
          {item.name}
        </td>

        <td className="p-2 border">
          {item.description || "—"}
        </td>
                <td className="p-2 border text-center">
  <div className="flex items-center justify-center gap-2">
    <FiEdit2
      className="cursor-pointer text-blue-600"
      onClick={() => handleEdit(item)}
    />
    <FiTrash2
      className="cursor-pointer text-red-600"
      onClick={() => handleDelete(item._id)}
    />
  </div>
</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <p className="text-center text-gray-500 py-4">No records found</p>
        )}
      </div>
    </div>
  );
}
