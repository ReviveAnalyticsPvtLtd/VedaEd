import React, { useState, useEffect } from "react";
import { FiDownload, FiPlus, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import * as XLSX from "xlsx";
import axios from "axios";
import config from "../../config";
import HelpInfo from "../../components/HelpInfo";

export default function AdmissionEnquiry() {
  const [enquiries, setEnquiries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
const [editMode, setEditMode] = useState(false);
const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    studentName: "",
    guardianName: "",
    mobile: "",
    whatsapp: "",
    email: "",
    enquiryClass: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchEnquiries();
  }, []);
const [errors, setErrors] = useState({});
  const fetchEnquiries = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/admission-enquiry`);
      setEnquiries(res.data);
    } catch (err) {
      console.error("Error fetching enquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  // Excel export
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(enquiries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Admission Enquiry");
    XLSX.writeFile(wb, "AdmissionEnquiry.xlsx");
  };

  // Add Enquiry
const handleSave = async () => {
  if (
    !formData.studentName ||
    !formData.guardianName ||
    !formData.mobile ||
    !formData.enquiryClass
  ) {
    return alert("Please fill all required fields (*)");
  }

  try {
    let res;

    if (editMode) {
      // UPDATE
      res = await axios.put(
        `${config.API_BASE_URL}/admission-enquiry/${editId}`,
        formData
      );

      setEnquiries((prev) =>
        prev.map((e) => (e._id === editId ? res.data : e))
      );
    } else {
      // ADD
      res = await axios.post(
        `${config.API_BASE_URL}/admission-enquiry`,
        formData
      );

      setEnquiries((prev) => [res.data, ...prev]);
    }

    // reset
    setShowModal(false);
    setEditMode(false);
    setEditId(null);

    setFormData({
      studentName: "",
      guardianName: "",
      mobile: "",
      whatsapp: "",
      email: "",
      enquiryClass: "",
      date: new Date().toISOString().split("T")[0],
    });

  } catch (err) {
    console.error(err);
    alert("Failed to save enquiry");
  }
};

  const handleEdit = (data) => {
  setEditMode(true);
  setEditId(data._id);

  setFormData({
    studentName: data.studentName || "",
    guardianName: data.guardianName || "",
    mobile: data.mobile || "",
    whatsapp: data.whatsapp || "",
    email: data.email || "",
    enquiryClass: data.enquiryClass || "",
    date: data.date || new Date().toISOString().split("T")[0],
  });

  setShowModal(true);
};
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this enquiry?")) return;
    try {
      await axios.delete(`${config.API_BASE_URL}/admission-enquiry/${id}`);
      setEnquiries(enquiries.filter((e) => e._id !== id));
    } catch (err) {
      console.error("Error deleting enquiry:", err);
      alert("Failed to delete enquiry");
    }
  };

  const filteredData = enquiries.filter((e) =>
    (e.studentName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.guardianName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
const validateKey = (e, field) => {
  const letterOnly = ["studentName", "guardianName"];
  const numberOnly = ["mobile", "whatsapp"];

  // LETTER ONLY
  if (
    letterOnly.includes(field) &&
    !/^[a-zA-Z\s]$/.test(e.key) &&
    !["Backspace", "Tab"].includes(e.key)
  ) {
    e.preventDefault(); // ❌ type hi nahi hoga
    setErrors((p) => ({ ...p, [field]: "Only letters allowed" }));
  }

  // NUMBER ONLY
  if (
    numberOnly.includes(field) &&
    !/^\d$/.test(e.key) &&
    !["Backspace", "Tab"].includes(e.key)
  ) {
    e.preventDefault(); // ❌ type hi nahi hoga
    setErrors((p) => ({ ...p, [field]: "Only numbers allowed" }));
  }
};
  return (
    <div className="p-0 m-0 min-h-screen">
      {/* Breadcrumb */}
      <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <span>Receptionist</span>
        <span>&gt;</span>
        <span>Admission Enquiry</span>
      </div>

      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-bold">Admission Enquiry</h2>
        <HelpInfo
          title="Admission Enquiry Help"
          description={`Page Description: Manage every admission enquiry collected at the reception desk. Capture guardian information, follow-up details, and export the register for reporting.


11.1 Enquiry Register

Monitor all enquiries, search by student name, and review key contact details.

Sections:
- Search Bar: Quickly filter enquiries by student or guardian name
- Action Buttons: Add new enquiry or export the entire register to Excel
- Enquiry Table: Columns for student info, guardian contact, class of interest, date, and row-level actions


11.2 Add Enquiry Modal

Use the modal to log a new enquiry in detail.

Sections:
- Required Fields: Student Name, Guardian Name, Contact numbers, Class, Date
- Additional Fields: Email, WhatsApp number for follow-ups
- Save Button: Validates inputs and inserts the new enquiry into the register
- Reset Logic: Modal clears after saving so the next walk-in can be recorded immediately


11.3 Row Actions & Export

Manage the register without leaving the page.

Sections:
- Edit/Delete Icons: Update or remove an enquiry entry directly from the table
- Excel Export: Generates a spreadsheet snapshot of current enquiries for counselors`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-3 text-sm mb-3 text-gray-600 border-b">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
          Overview
        </button>
      </div>

      <div className="bg-white p-3 rounded-lg shadow-sm border">
        {/* Top controls */}
        <div className="flex justify-between items-center mb-3">
          <input
            type="text"
            placeholder="Search name..."
            className="border rounded-md px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="flex gap-3">
            <button
             onClick={() => {
  setEditMode(false);
  setEditId(null);
  setFormData({
    studentName: "",
    guardianName: "",
    mobile: "",
    whatsapp: "",
    email: "",
    enquiryClass: "",
    date: new Date().toISOString().split("T")[0],
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

        {/* Table */}
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3 font-semibold">Student Name</th>
              <th className="p-3 font-semibold">Guardian Name</th>
              <th className="p-3 font-semibold">Mobile No.</th>
              <th className="p-3 font-semibold">WhatsApp No.</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Class Enquired</th>
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((e) => (
              <tr key={e._id || e.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{e.studentName}</td>
                <td className="p-3">{e.guardianName}</td>
                <td className="p-3">{e.mobile}</td>
                <td className="p-3">{e.whatsapp}</td>
                <td className="p-3">{e.email}</td>
                <td className="p-3">{e.enquiryClass}</td>
                <td className="p-3">{e.date}</td>
                <td className="p-3 text-center flex justify-center gap-2">
                  <FiEdit2
  className="cursor-pointer text-blue-600"
  onClick={() => handleEdit(e)}
/>
                  <FiTrash2
                    className="cursor-pointer text-red-600"
                    onClick={() => handleDelete(e._id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <p className="text-center text-gray-500 py-4">No records found</p>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[700px] relative animate-fadeIn">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
            >
              <FiX size={20} />
            </button>

           <h3 className="text-lg font-bold mb-4 text-gray-800">
  {editMode ? "Edit Admission Enquiry" : "Add Admission Enquiry"}
</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold ">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="border rounded-md px-3 py-2 w-full"
                  value={formData.studentName}
                  onKeyDown={(e) => validateKey(e, "studentName")}
onChange={(e) => {
  setErrors((p) => ({ ...p, studentName: "" }));
  setFormData({ ...formData, studentName: e.target.value });
}}
                />
                {errors.studentName && (
  <p className="text-xs text-red-500 mt-1">
    {errors.studentName}
  </p>
)}
              </div>

              <div>
                <label className="block mb-1 font-semibold ">
                  Guardian Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="border rounded-md px-3 py-2 w-full"
                  value={formData.guardianName}
                 onKeyDown={(e) => validateKey(e, "guardianName")}
onChange={(e) => {
  setErrors((p) => ({ ...p, guardianName: "" }));
  setFormData({ ...formData, guardianName: e.target.value });
}}
                />
                {errors.guardianName && (
  <p className="text-xs text-red-500 mt-1">
    {errors.guardianName}
  </p>
)}
              </div>

              <div>
                <label className="block mb-1 font-semibold ">
                  Mobile No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="border rounded-md px-3 py-2 w-full"
                  value={formData.mobile}
                 onKeyDown={(e) => validateKey(e, "mobile")}
onChange={(e) => {
  setErrors((p) => ({ ...p, mobile: "" }));
  setFormData({ ...formData, mobile: e.target.value });
}}
                />
                {errors.mobile && (
  <p className="text-xs text-red-500 mt-1">
    {errors.mobile}
  </p>
)}
              </div>

              <div>
                <label className="block mb-1 font-semibold ">
                  WhatsApp No.
                </label>
                <input
                  type="text"
                  className="border rounded-md px-3 py-2 w-full"
                  value={formData.whatsapp}
                 onKeyDown={(e) => validateKey(e, "whatsapp")}
onChange={(e) => {
  setErrors((p) => ({ ...p, whatsapp: "" }));
  setFormData({ ...formData, whatsapp: e.target.value });
}}
                />
                {errors.whatsapp && (
  <p className="text-xs text-red-500 mt-1">
    {errors.whatsapp}
  </p>
)}
              </div>

              <div>
                <label className="block mb-1 font-semibold ">
                  Email
                </label>
                <input
                  type="email"
                  className="border rounded-md px-3 py-2 w-full"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold ">
                  Enquiry For Class <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Class 5"
                  className="border rounded-md px-3 py-2 w-full"
                  value={formData.enquiryClass}
                  onChange={(e) =>
                    setFormData({ ...formData, enquiryClass: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold ">Date</label>
                <input
                  type="date"
                  className="border rounded-md px-3 py-2 w-full"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <button
                onClick={handleSave}
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
