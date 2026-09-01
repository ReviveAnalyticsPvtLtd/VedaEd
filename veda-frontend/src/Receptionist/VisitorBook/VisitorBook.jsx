import React, { useState, useEffect } from "react";
import { FiDownload, FiPlus, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import * as XLSX from "xlsx";
import axios from "axios";
import config from "../../config";
import { useLocation } from "react-router-dom";
import HelpInfo from "../../components/HelpInfo";

export default function VisitorList() {
  const [visitorData, setVisitorData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    purpose: "",
    otherPurpose: "",
    meetingWith: "",
    visitorName: "",
    phone: "",
    idCard: "",
    numberOfPerson: "",
    date: new Date().toISOString().split("T")[0],
    inTime: "",
    outTime: "",
    note: "",
  });
const [errors, setErrors] = useState({});
  const location = useLocation();
const [editMode, setEditMode] = useState(false);
const [editId, setEditId] = useState(null);
  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/visitor-book`);
      if (res.data.success) {
        setVisitorData(res.data.visitors);
      }
    } catch (err) {
      console.error("Error fetching visitors:", err);
    } finally {
      setLoading(false);
    }
  };

  // Prefill modal if navigated from student
  useEffect(() => {
    if (location.state?.meetingWith) {
      setShowModal(true);
      setFormData((prev) => ({
        ...prev,
        meetingWith: location.state.meetingWith,
      }));
    }
  }, [location.state]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(visitorData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Visitors");
    XLSX.writeFile(wb, "VisitorList.xlsx");
  };
const handleSaveVisitor = async () => {
  if (!formData.purpose || !formData.meetingWith || !formData.visitorName) {
    return alert("Please fill all required fields (*)");
  }


    const finalPurpose =
      formData.purpose === "Others" ? formData.otherPurpose : formData.purpose;

    const payload = {
      ...formData,
      purpose: finalPurpose,
      numberOfPerson: formData.numberOfPerson ? parseInt(formData.numberOfPerson, 10) : 1,
    };

    try {
      const res = await axios.post(`${config.API_BASE_URL}/visitor-book`, payload);
      if (res.data.success) {
        setVisitorData([res.data.visitor, ...visitorData]);
        setShowModal(false);
        setFormData({
          purpose: "",
          otherPurpose: "",
          meetingWith: "",
          visitorName: "",
          phone: "",
          idCard: "",
          numberOfPerson: "",
          date: new Date().toISOString().split("T")[0],
          inTime: "",
          outTime: "",
          note: "",
        });
      }
    } catch (err) {
      console.error("Error adding visitor:", err);
      // improved error logging
      const errorMsg = err.response?.data?.message || err.message || "Failed to add visitor";
      alert(errorMsg);
    }
  };


  const handleEdit = (visitor) => {
  setEditMode(true);
  setEditId(visitor._id);

  setFormData({
    purpose: visitor.purpose || "",
    otherPurpose: "",
    meetingWith: visitor.meetingWith || "",
    visitorName: visitor.visitorName || "",
    phone: visitor.phone || "",
    idCard: visitor.idCard || "",
    numberOfPerson: visitor.numberOfPerson || "",
    date: visitor.date || "",
    inTime: visitor.inTime || "",
    outTime: visitor.outTime || "",
    note: visitor.note || "",
  });

  setShowModal(true);
};
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      const res = await axios.delete(`${config.API_BASE_URL}/visitor-book/${id}`);
      if (res.data.success) {
        setVisitorData(visitorData.filter((v) => v._id !== id));
      }
    } catch (err) {
      console.error("Error deleting visitor:", err);
      alert("Failed to delete visitor");
    }
  };

  const filteredData = visitorData.filter((v) =>
    (v.visitorName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.meetingWith || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
const validateKey = (e, field) => {
  const letterOnly = ["visitorName", "meetingWith"];
  const numberOnly = ["phone", "numberOfPerson"];

  // LETTER ONLY
  if (
    letterOnly.includes(field) &&
    !/^[a-zA-Z\s]$/.test(e.key) &&
    !["Backspace", "Tab"].includes(e.key)
  ) {
    e.preventDefault();
    setErrors((p) => ({ ...p, [field]: "Only letters allowed" }));
  }

  // NUMBER ONLY
  if (
    numberOnly.includes(field) &&
    !/^\d$/.test(e.key) &&
    !["Backspace", "Tab"].includes(e.key)
  ) {
    e.preventDefault();
    setErrors((p) => ({ ...p, [field]: "Only numbers allowed" }));
  }
};
  return (
    <div className="p-0 m-0 min-h-screen">
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Visitor Book</h2>
        <HelpInfo
          title="Visitor Book Help"
          description={`Page Description: Record every visitor entering the campus, capture whom they are meeting, and keep a searchable visitor history.


15.1 Visitor Register

Review past visits, filter by visitor name, and export logs when needed.

Sections:
- Search Bar: Quickly locate visitors by name or meeting contact
- Action Buttons: Add new entry or export the visitor list to Excel
- Visitor Table: Columns for purpose, meeting with, visitor info, headcount, visit timings, and actions


15.2 Add Visitor Modal

Guided form for capturing new visitors.

Sections:
- Required Fields: Purpose, Meeting With, Visitor Name, Phone, Date, In/Out time
- Conditional Purpose: “Other Purpose” field appears when Purpose = Others
- ID & Notes: Collect ID card type/number, number of persons, and optional note
- Save Workflow: Adds the visitor to the log and resets the form


15.3 Row Actions & Integrations

Manage the log and link it with other receptionist workflows.

Sections:
- Edit Icon: Update visitor information mid-visit
- Delete Icon: Remove incorrect entries after confirmation
- Prefill Support: When launched from Student Details, “Meeting With” auto-populates for faster intake`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
          Overview
        </button>
      </div>

      <div className="bg-white p-3 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Search name..."
            className="border rounded-md px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex gap-3">
            <button
          onClick={() => {
  setEditMode(false);
  setEditId(null);
  setFormData({
    purpose: "",
    otherPurpose: "",
    meetingWith: "",
    visitorName: "",
    phone: "",
    idCard: "",
    numberOfPerson: "",
    date: new Date().toISOString().split("T")[0],
    inTime: "",
    outTime: "",
    note: "",
  });
  setShowModal(true);
}}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FiPlus /> Add
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              <FiDownload /> Excel
            </button>
          </div>
        </div>

        <table className="w-full  text-left border-collapse">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-2 border ">Purpose</th>
              <th className="p-2 border ">Meeting With</th>
              <th className="p-2 border">Visitor Name</th>
              <th className="p-2 border ">Phone</th>
              <th className="p-2 border ">ID Card</th>
              <th className="p-2 border ">No. of Person</th>
              <th className="p-2 border ">Date</th>
              <th className="p-2 border ">In Time</th>
              <th className="p-2 border ">Out Time</th>
              <th className="p-2 border font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((v) => (
              <tr key={v._id || v.id} className="border-b hover:bg-gray-50">
                <td className="p-2 border">{v.purpose}</td>
                <td className="p-2 border">{v.meetingWith}</td>
                <td className="p-2 border">{v.visitorName}</td>
                <td className="p-2 border">{v.phone}</td>
                <td className="p-2 border">{v.idCard}</td>
                <td className="p-2 border">{v.numberOfPerson}</td>
                <td className="p-2 border">{v.date}</td>
                <td className="p-2 border">{v.inTime}</td>
                <td className="p-2 border">{v.outTime}</td>
                <td className="p-2 border text-center">
  <div className="flex justify-center items-center gap-4">
    <FiEdit2
      className="cursor-pointer text-blue-600"
      onClick={() => handleEdit(v)}
    />

    <FiTrash2
      className="cursor-pointer text-red-600"
      onClick={() => handleDelete(v._id)}
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[800px] relative animate-fadeIn">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
            >
              <FiX size={20} />
            </button>

           <h3 className="text-lg font-bold mb-4 text-gray-800">
  {editMode ? "Edit Visitor" : "Add Visitor"}
</h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block mb-1 font-semibold ">
                  Purpose <span className="text-red-500">*</span>
                </label>
                <select
                  className="border rounded-md px-3 py-2 w-full"
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Student Meeting">Student Meeting</option>
                  <option value="Principal Meeting">Principal Meeting</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="col-span-1">
                <label className="block mb-1 font-semibold ">
                  Meeting With <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Staff / Student"
                  className="border rounded-md px-3 py-2 w-full"
                  value={formData.meetingWith}
                  onKeyDown={(e) => validateKey(e, "meetingWith")}
onChange={(e) => {
  setErrors((p) => ({ ...p, meetingWith: "" }));
  setFormData({ ...formData, meetingWith: e.target.value });
}}
                />
                {errors.meetingWith && (
  <p className="text-xs text-red-500 mt-1">
    {errors.meetingWith}
  </p>
)}
              </div>

              <div className="col-span-1">
                <label className="block mb-1 font-semibold ">
                  Visitor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="border rounded-md px-3 py-2 w-full"
                  value={formData.visitorName}
                 onKeyDown={(e) => validateKey(e, "visitorName")}
onChange={(e) => {
  setErrors((p) => ({ ...p, visitorName: "" }));
  setFormData({ ...formData, visitorName: e.target.value });
}}
                />
                {errors.visitorName && (
  <p className="text-xs text-red-500 mt-1">
    {errors.visitorName}
  </p>
)}
              </div>

              {formData.purpose === "Others" && (
                <div className="col-span-3">
                  <label className="block mb-1 font-semibold">
                    Specify Purpose
                  </label>
                  <input
                    type="text"
                    placeholder="Enter custom purpose"
                    className="border rounded-md px-3 py-2 w-full"
                    value={formData.otherPurpose}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        otherPurpose: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              <input
                placeholder="Phone"
                className="border rounded-md px-3 py-2"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
              <input
                placeholder="ID Card"
                className="border rounded-md px-3 py-2"
                value={formData.idCard}
               onKeyDown={(e) => validateKey(e, "phone")}
onChange={(e) => {
  setErrors((p) => ({ ...p, phone: "" }));
  setFormData({ ...formData, phone: e.target.value });
}}
              />
              {errors.phone && (
  <p className="text-xs text-red-500 mt-1">
    {errors.phone}
  </p>
)}
              <input
                placeholder="Number Of Person"
                className="border rounded-md px-3 py-2"
                value={formData.numberOfPerson}
               onKeyDown={(e) => validateKey(e, "numberOfPerson")}
onChange={(e) => {
  setErrors((p) => ({ ...p, numberOfPerson: "" }));
  setFormData({ ...formData, numberOfPerson: e.target.value });
}}
              />
              {errors.numberOfPerson && (
  <p className="text-xs text-red-500 mt-1">
    {errors.numberOfPerson}
  </p>
)}
              <input
                type="date"
                className="border rounded-md px-3 py-2"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
              <input
                type="time"
                className="border rounded-md px-3 py-2"
                value={formData.inTime}
                onChange={(e) =>
                  setFormData({ ...formData, inTime: e.target.value })
                }
              />
              <input
                type="time"
                className="border rounded-md px-3 py-2"
                value={formData.outTime}
                onChange={(e) =>
                  setFormData({ ...formData, outTime: e.target.value })
                }
              />
              <textarea
                placeholder="Note"
                rows="3"
                className="border rounded-md px-3 py-2 col-span-3"
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
              ></textarea>
            </div>

            <div className="flex justify-end mt-5">
              <button
              onClick={handleSaveVisitor}
                className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700"
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
