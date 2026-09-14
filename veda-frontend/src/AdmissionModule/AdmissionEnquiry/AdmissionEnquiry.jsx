import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import * as XLSX from "xlsx";
import HelpInfo from "../../components/HelpInfo";
import { getEnquiries, createEnquiry, deleteEnquiry, updateEnquiry } from "../../services/admissionEnquiryAPI";
import classAPI from "../../services/classAPI";
import { useNavigate } from "react-router-dom";
import Pagination from "../../components/common/Pagination";
export default function AdmissionEnquiry() {
   const navigate = useNavigate(); 
  const [enquiries, setEnquiries] = useState([]);
  const [classes, setClasses] = useState([]);
  const totalEnquiries = Array.isArray(enquiries) ? enquiries.length : 0;
  const reviewedCount = Array.isArray(enquiries)
    ? enquiries.filter((e) => e?.status === "reviewed").length
    : 0;
  const pendingCount = Array.isArray(enquiries)
    ? enquiries.filter((e) => e?.status !== "reviewed").length
    : 0;
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEnquiryId, setEditingEnquiryId] = useState(null);
  const [formData, setFormData] = useState({
    studentName: "",
    guardianName: "",
    mobile: "",
    whatsapp: "",
    email: "",
    enquiryClass: "",
    date: "",
  });
  const [editFormData, setEditFormData] = useState({
    studentName: "",
    guardianName: "",
    mobile: "",
    whatsapp: "",
    email: "",
    enquiryClass: "",
    date: "",
    status: "pending",
  });

  useEffect(() => {
    fetchEnquiries();
    const loadClasses = async () => {
      try {
        const clsList = await classAPI.getAllClasses();
        const list = Array.isArray(clsList)
          ? clsList
          : Array.isArray(clsList?.data)
          ? clsList.data
          : [];
        setClasses(list);
      } catch (err) {
        console.error("Failed to load classes in enquiries:", err);
        setClasses([]);
      }
    };
    loadClasses();
  }, []);

  const fetchEnquiries = async () => {
    try {
      const data = await getEnquiries();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setEnquiries(
        list.map((e) => ({ ...e, status: e.status || "pending" }))
      );
    } catch (error) {
      console.warn("API failed, loading dummy data");

      setEnquiries([
        {
          _id: "1",
          studentName: "Aarav Sharma",
          guardianName: "Rohit Sharma",
          mobile: "9876543210",
          whatsapp: "9876543210",
          email: "aarav@gmail.com",
          enquiryClass: "Class 5",
          date: "2026-01-10",
          status: "pending",
        },
        {
          _id: "2",
          studentName: "Ananya Verma",
          guardianName: "Suresh Verma",
          mobile: "9123456789",
          whatsapp: "9123456789",
          email: "ananya@gmail.com",
          enquiryClass: "Class 8",
          date: "2026-01-11",
          status: "reviewed",
        },
      ]);
    }
  };

  const mergeUpdatedEnquiry = (updatedEnquiry) => {
    if (!updatedEnquiry?._id) return;
    setEnquiries((prev) =>
      Array.isArray(prev)
        ? prev.map((entry) =>
            entry._id === updatedEnquiry._id ? updatedEnquiry : entry
          )
        : []
    );
  };

  // Excel export
  const exportToExcel = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one enquiry to export");
      return;
    }

    const selectedData = enquiries.filter((e) =>
      selectedIds.includes(e._id)
    );

    const ws = XLSX.utils.json_to_sheet(selectedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Admission Enquiry");
    XLSX.writeFile(wb, "AdmissionEnquiry.xlsx");
  };

  const [selectedIds, setSelectedIds] = useState([]);

  const resetAddForm = () => {
    setFormData({
      studentName: "",
      guardianName: "",
      mobile: "",
      whatsapp: "",
      email: "",
      enquiryClass: "",
      date: "",
    });
    setErrors({});
  };

  const openEditModal = (enquiry) => {
    setEditingEnquiryId(enquiry._id);
    setEditFormData({
      studentName: enquiry.studentName || "",
      guardianName: enquiry.guardianName || "",
      mobile: enquiry.mobile || "",
      whatsapp: enquiry.whatsapp || "",
      email: enquiry.email || "",
      enquiryClass: enquiry.enquiryClass || "",
      date: enquiry.date || "",
      status: enquiry.status || "pending",
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingEnquiryId(null);
  };

    // Add Enquiry
  const handleAdd = async () => {
    if (
      !formData.studentName ||
      !formData.guardianName ||
      !formData.mobile ||
      !formData.enquiryClass
    ) {
      return alert("Please fill all required fields (*)");
    }

    try {
      await createEnquiry(formData);
      await fetchEnquiries();
      setShowModal(false);
      resetAddForm();
      alert("Enquiry added successfully!");
    } catch (error) {
      console.error("Error adding enquiry:", error);
      alert("Failed to add enquiry");
    }
  };

  const handleUpdateEnquiry = async () => {
    if (
      !editFormData.studentName ||
      !editFormData.guardianName ||
      !editFormData.mobile ||
      !editFormData.enquiryClass
    ) {
      alert("Please fill all required fields (*)");
      return;
    }

    try {
      const updatedEnquiry = await updateEnquiry(editingEnquiryId, editFormData);
      mergeUpdatedEnquiry(updatedEnquiry);
      await fetchEnquiries();
      closeEditModal();
      alert("Enquiry updated successfully!");
    } catch (error) {
      console.error("Error updating enquiry:", error);
      alert("Failed to update enquiry");
    }
  };

  const filteredData = Array.isArray(enquiries)
    ? enquiries.filter((e) =>
        (e?.studentName || "")
          .toLowerCase()
          .includes((searchQuery || "").toLowerCase())
      )
    : [];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);
const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

const indexOfLast = currentPage * itemsPerPage;
const indexOfFirst = indexOfLast - itemsPerPage;

const currentEnquiries = filteredData.slice(
  indexOfFirst,
  indexOfLast
);
  return (
    <div className="p-0 m-0 min-h-screen">
<div className="flex items-center justify-between gap-3 mb-4">
       <h2 className="text-2xl font-bold">Admission Enquiry</h2>
     
      <HelpInfo
  title="Admission Enquiry Help"
  description={`1.1 Overview

This page lists all admission enquiries received from prospective students. It helps the admissions team keep track of inquiries and follow up accordingly.

2. Table Columns Description

The table shows key information for each enquiry. 'Student Name' displays the name of the prospective student. 'Guardian Name' shows the parent or guardian's name, useful for contacting them. 'Mobile No.' and 'WhatsApp No.' provide phone numbers for direct and instant messaging communication respectively. 'Email' contains the guardian’s or student's email address for sending official correspondence. 'Class Enquired' indicates the grade level the student is interested in. 'Date' is the day the enquiry was submitted, helping prioritize follow-ups. The 'Action' column offers options to view, edit, or manage each enquiry.

3. Usage Tips

Regularly review this page to ensure timely responses to all enquiries. Use the contact details provided for smooth communication, and follow up with prospective students to increase admission chances.`}
  steps={[
    "Check the enquiry list daily for new entries.",
    "Use mobile or WhatsApp numbers for quick communication.",
    "Send relevant information via email to guardians.",
    "Follow up on enquiries promptly to maximize admissions."
  ]}
/>


     </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b overflow-x-auto">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
          Overview
        </button>
      </div>
      {/* SUMMARY BOXES */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3 mt-4">
  <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-gray-200" />
    <div>
      <p className="text-sm text-gray-500">Total Enquiries</p>
      <p className="text-xl font-bold">{totalEnquiries}</p>
    </div>
  </div>

  <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-gray-200" />
    <div>
      <p className="text-sm text-gray-500">Reviewed</p>
      <p className="text-xl font-bold">{reviewedCount}</p>
    </div>
  </div>

  <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-gray-200" />
    <div>
      <p className="text-sm text-gray-500">Pending Follow-up</p>
      <p className="text-xl font-bold">{pendingCount}</p>
    </div>
  </div>
</div>


      {/* Main content box */}
      <div className=" p-0 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm ">
           <h3 className="text-lg font-semibold mb-4">Admission Enquiry List</h3>
          {/* Top controls */}
         <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4">
  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
    <input
      type="text"
      placeholder="Search..."
      className="border rounded-md px-2 py-1.5 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-300"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />

    {/* BULK ACTION – YAHAN ADD */}
    <select
      className="border px-3 py-2 rounded-md bg-white text-gray-700"
      defaultValue=""
      onChange={async (e) => {
        const val = e.target.value;
        if (!val) return;
        if (val === "excel") {
          exportToExcel();
          e.target.value = "";
        }
        if (val === "reviewed") {
          if (selectedIds.length === 0) {
            alert("Please select at least one enquiry to mark as reviewed");
            e.target.value = "";
            return;
          }
          try {
             const updatedRows = await Promise.all(
               selectedIds.map((id) => updateEnquiry(id, { status: "reviewed" }))
             );
             updatedRows.forEach(mergeUpdatedEnquiry);
             await fetchEnquiries();
             setSelectedIds([]);
             alert("Selected enquiries marked as reviewed!");
          } catch (error) {
              console.error("Error bulk updating:", error);
              alert("Failed to update some enquiries.");
          }
          e.target.value = "";
        }
      }}
    >
      <option value="">Bulk Action</option>
      <option value="reviewed">Mark as Reviewed</option>
      <option value="excel">Export Excel</option>
    </select>
  </div>

  <div className="flex gap-3 justify-end">
    <button
      onClick={() => {
        resetAddForm();
        setShowModal(true);
      }}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm transition-colors"
    >
      <FiPlus /> Add
    </button>
  </div>
</div>


          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
           <table className="w-full text-sm min-w-[1000px]">
      <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border text-center">
  <input
    type="checkbox"
    onChange={(e) =>
      setSelectedIds(
        e.target.checked ? filteredData.map(x => x._id) : []
      )
    }
  />
</th>

<th className="p-2 border text-center">S.No</th>

<th className="p-2 border text-left">Student Name</th>
                <th className="p-2 border text-left">Guardian Name</th>
                <th className="p-2 border text-left">Mobile No.</th>
                <th className="p-2 border text-left">WhatsApp No.</th>
                <th className="p-2 border text-left">Email</th>
                <th className="p-2 border text-left">Class Enquired</th>
                <th className="p-2 border text-left">Date</th>
                <th className="p-2 border text-left">Status</th>

                <th className="p-2 border text-center">Action</th>
              </tr>
            </thead>
            <tbody>
            {currentEnquiries.map((e, index) => (
                <tr key={e._id} className="border-b hover:bg-gray-50">
                  
                  <td className="p-2 border text-center">
  <input
    type="checkbox"
    checked={selectedIds.includes(e._id)}
    onChange={() =>
      setSelectedIds(prev =>
        prev.includes(e._id)
          ? prev.filter(id => id !== e._id)
          : [...prev, e._id]
      )
    }
  />
</td>
<td className="p-2 border text-center font-medium">
  {indexOfFirst + index + 1}
</td>
                  <td className="p-2 border">{e.studentName}</td>
                  <td className="p-2 border">{e.guardianName}</td>
                  <td className="p-2 border">{e.mobile}</td>
                  <td className="p-2 border">{e.whatsapp}</td>
                  <td className="p-2 border">{e.email}</td>
                  <td className="p-2 border">{e.enquiryClass}</td>
                  <td className="p-2 border">{e.date}</td>
                  <td className="p-2 border text-center">
  <span
    className={`px-2 py-1 rounded-full text-xs ${
      e.status === "reviewed"
        ? "bg-green-100 text-green-700"
        : "bg-yellow-100 text-yellow-700"
    }`}
  >
    {e.status}
  </span>
</td>

                 <td className="p-2 border text-center">
  <div className="flex justify-center items-center gap-2">
  <button
    type="button"
    onClick={() => openEditModal(e)}
    className="p-1.5 rounded border border-blue-200 text-blue-600 hover:bg-blue-50"
    title="Edit enquiry"
  >
    <FiEdit2 />
  </button>

  {e.status !== "reviewed" && (
    <button
      onClick={async () => {
        try {
          const updatedEnquiry = await updateEnquiry(e._id, { status: "reviewed" });
          mergeUpdatedEnquiry(updatedEnquiry);
          await fetchEnquiries();
        } catch (error) {
          console.error("Error updating status:", error);
          alert("Failed to update status");
        }
      }}
      className="text-xs border px-2 py-1 rounded transition-colors bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
    >
      Mark Review
    </button>
  )}

  <FiTrash2
    className="cursor-pointer text-red-600"
    onClick={async () => {
      if (window.confirm("Are you sure you want to delete this enquiry?")) {
        try {
          await deleteEnquiry(e._id);
          setEnquiries(enquiries.filter((x) => x._id !== e._id));
        } catch (error) {
          console.error("Error deleting enquiry:", error);
          alert("Failed to delete enquiry");
        }
      }
    }}
  />
</div>
</td>

                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {/* PAGINATION */}
<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

          {filteredData.length === 0 && (
            <p className="text-center text-gray-500 py-4">No records found</p>
          )}
        </div>
       {/* BACK & NEXT BUTTONS – BOTTOM (NOT FIXED) */}
<div className="fixed bottom-4 left-4 right-4 md:left-[calc(16rem+1rem)] md:right-8 flex justify-between z-40">
  {/* BACK BUTTON */}
  <button
    onClick={() => navigate("/admission")}
    className="bg-gray-200 text-gray-700 px-4 md:px-6 py-2 rounded-md hover:bg-gray-300"
  >
    Back
  </button>

  {/* NEXT BUTTON */}
  <button
    onClick={() => navigate("/admission/vacancy-setup")}
    className="bg-green-600 text-white px-4 md:px-6 py-2 rounded-md hover:bg-green-700"
  >
    Next
  </button>
</div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-[700px] relative animate-fadeIn max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowModal(false);
                resetAddForm();
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 transition-colors"
            >
              <FiX size={20} />
            </button>

            <h3 className="text-lg font-bold mb-4 text-gray-800">
              Add Admission Enquiry
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter student name"
                  className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={formData.studentName}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^[a-zA-Z\s]*$/.test(val)) {
                      setFormData({ ...formData, studentName: val });
                      setErrors((prev) => ({ ...prev, studentName: "" }));
                    } else {
                      setErrors((prev) => ({
                        ...prev,
                        studentName: "Only letters and spaces allowed",
                      }));
                    }
                  }}
                />
                {errors.studentName && (
                  <p className="text-red-500 text-xs mt-1">{errors.studentName}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">
                  Guardian Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter guardian name"
                  className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={formData.guardianName}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^[a-zA-Z\s]*$/.test(val)) {
                      setFormData({ ...formData, guardianName: val });
                      setErrors((prev) => ({ ...prev, guardianName: "" }));
                    } else {
                      setErrors((prev) => ({
                        ...prev,
                        guardianName: "Only letters and spaces allowed",
                      }));
                    }
                  }}
                />
                {errors.guardianName && (
                  <p className="text-red-500 text-xs mt-1">{errors.guardianName}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">
                  Mobile No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                  className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={formData.mobile}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setFormData({ ...formData, mobile: val });
                    if (val.length === 10 || val.length === 0) {
                      setErrors((prev) => ({ ...prev, mobile: "" }));
                    }
                  }}
                />
                {errors.mobile && (
                  <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">
                  WhatsApp No.
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="10-digit WhatsApp number"
                  className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={formData.whatsapp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setFormData({ ...formData, whatsapp: val });
                    if (val.length === 10 || val.length === 0) {
                      setErrors((prev) => ({ ...prev, whatsapp: "" }));
                    }
                  }}
                />
                {errors.whatsapp && (
                  <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">
                  Enquiry For Class <span className="text-red-500">*</span>
                </label>
                <select
                  className="border rounded-md px-3 py-2 w-full text-gray-700 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={formData.enquiryClass}
                  onChange={(e) =>
                    setFormData({ ...formData, enquiryClass: e.target.value })
                  }
                  required
                >
                  <option value="">Select Class</option>
                  {Array.isArray(classes) &&
                    classes.map((cls) => {
                      const className = typeof cls === "string" ? cls : cls?.name;
                      const classKey = cls?._id || className;
                      if (!className) return null;
                      return (
                        <option key={classKey} value={className}>
                          {className}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">Date</label>
                <input
                  type="date"
                  className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetAddForm();
                }}
                className="bg-gray-100 text-gray-700 px-5 py-2 rounded-md hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-[700px] relative animate-fadeIn max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeEditModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 transition-colors"
            >
              <FiX size={20} />
            </button>

            <h3 className="text-lg font-bold mb-4 text-gray-800">
              Update Admission Enquiry
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={editFormData.studentName}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, studentName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">
                  Guardian Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={editFormData.guardianName}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, guardianName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">
                  Mobile No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={editFormData.mobile}
                  maxLength={10}
                  inputMode="numeric"
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">
                  WhatsApp No.
                </label>
                <input
                  type="tel"
                  className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={editFormData.whatsapp}
                  maxLength={10}
                  inputMode="numeric"
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, whatsapp: e.target.value.replace(/\D/g, "").slice(0, 10) })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">
                  Email
                </label>
                <input
                  type="email"
                  className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">
                  Enquiry For Class <span className="text-red-500">*</span>
                </label>
                <select
                  className="border rounded-md px-3 py-2 w-full text-gray-700 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={editFormData.enquiryClass}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, enquiryClass: e.target.value })
                  }
                  required
                >
                  <option value="">Select Class</option>
                  {Array.isArray(classes) &&
                    classes.map((cls) => {
                      const className = typeof cls === "string" ? cls : cls?.name;
                      const classKey = cls?._id || className;
                      if (!className) return null;
                      return (
                        <option key={classKey} value={className}>
                          {className}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">Date</label>
                <input
                  type="date"
                  className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={editFormData.date}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, date: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-700 text-sm">Status</label>
                <select
                  className="border rounded-md px-3 py-2 w-full text-gray-700 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, status: e.target.value })
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={closeEditModal}
                className="bg-gray-100 text-gray-700 px-5 py-2 rounded-md hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateEnquiry}
                className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
