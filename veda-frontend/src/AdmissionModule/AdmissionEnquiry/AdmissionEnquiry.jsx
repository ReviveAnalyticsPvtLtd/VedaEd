import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import * as XLSX from "xlsx";
import HelpInfo from "../../components/HelpInfo";
import { getEnquiries, createEnquiry, deleteEnquiry, updateEnquiry } from "../../services/admissionEnquiryAPI";
import classAPI from "../../services/classAPI";
import { useNavigate } from "react-router-dom";
export default function AdmissionEnquiry() {
   const navigate = useNavigate(); 
  const [enquiries, setEnquiries] = useState([]);
  const [classes, setClasses] = useState([]);
  const totalEnquiries = enquiries.length;
const reviewedCount = enquiries.filter(e => e.status === "reviewed").length;
const pendingCount = enquiries.filter(e => e.status !== "reviewed").length;
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
        setClasses(clsList || []);
      } catch (err) {
        console.error("Failed to load classes in enquiries:", err);
      }
    };
    loadClasses();
  }, []);

 const fetchEnquiries = async () => {
  try {
    const data = await getEnquiries();
    setEnquiries(
      data.map(e => ({ ...e, status: e.status || "pending" }))
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
    prev.map((entry) => (entry._id === updatedEnquiry._id ? updatedEnquiry : entry))
  );
};


  // Excel export
 const exportToExcel = () => {
  if (selectedIds.length === 0) {
    alert("Please select at least one enquiry to export");
    return;
  }

  const selectedData = enquiries.filter(e =>
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

  const filteredData = enquiries.filter((e) =>
    e.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );useEffect(() => {
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
      {/* Breadcrumb */}
      <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <span>Admission &gt;</span>
        <span>Admission Enquiry</span>
      </div>
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
      className="border px-3 py-2 rounded-md"
      onChange={async (e) => {
        if (e.target.value === "excel") exportToExcel();
        if (e.target.value === "reviewed") {
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
        }
      }}
    >
      <option>Bulk Action</option>
      
      <option value="reviewed">Mark as Reviewed</option>
      <option value="excel">Export Excel</option>
    </select>
  </div>

  <div className="flex gap-3 justify-end">
    <button
      onClick={exportToExcel}
      className="flex items-center gap-2 px-4 py-2 "
    >
     
    </button>

    <button
      onClick={() => setShowModal(true)}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
    >
      <FiPlus /> Add
    </button>
  </div>
</div>


          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
           <table className="w-full min-w-[1000px]">
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

                <th className="p-2 border text-left">Action</th>
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
{filteredData.length > 0 && (
  <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
    <span>
      Page {currentPage} of {totalPages}
    </span>

    <div className="flex gap-2">
      <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(p => p - 1)}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Previous
      </button>

      <button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(p => p + 1)}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
)}

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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[95%] max-w-[700px] relative animate-fadeIn max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
            >
              <FiX size={20} />
            </button>

            <h3 className="text-lg font-bold mb-4 text-gray-800">
              Add Admission Enquiry
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
  onKeyDown={(e) => {
    if (!/[a-zA-Z\s]/.test(e.key) && e.key !== "Backspace") {
      e.preventDefault(); 
      setErrors((prev) => ({
        ...prev,
        studentName: "Only letters allowed",
      }));
    } else {
      setErrors((prev) => ({ ...prev, studentName: "" }));
    }
  }}
  onChange={(e) =>
    setFormData({ ...formData, studentName: e.target.value })
  }
/>

{errors.studentName && (
  <p className="text-red-500 text-xs mt-1">{errors.studentName}</p>
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
  onKeyDown={(e) => {
    if (!/[a-zA-Z\s]/.test(e.key) && e.key !== "Backspace") {
      e.preventDefault();
      setErrors((prev) => ({
        ...prev,
        guardianName: "Only letters allowed",
      }));
    } else {
      setErrors((prev) => ({ ...prev, guardianName: "" }));
    }
  }}
  onChange={(e) =>
    setFormData({ ...formData, guardianName: e.target.value })
  }
/>

{errors.guardianName && (
  <p className="text-red-500 text-xs mt-1">{errors.guardianName}</p>
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
  maxLength={10}
  inputMode="numeric"
  onKeyDown={(e) => {
    if (!/[0-9]/.test(e.key) && e.key !== "Backspace") {
      e.preventDefault();
      setErrors((prev) => ({
        ...prev,
        mobile: "Only numbers allowed",
      }));
    } else {
      setErrors((prev) => ({ ...prev, mobile: "" }));
    }
  }}
  onChange={(e) =>
    setFormData({ ...formData, mobile: e.target.value })
  }
/>

{errors.mobile && (
  <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>
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
  maxLength={10}
  inputMode="numeric"
  onKeyDown={(e) => {
    if (!/[0-9]/.test(e.key) && e.key !== "Backspace") {
      e.preventDefault();
      setErrors((prev) => ({
        ...prev,
        whatsapp: "Only numbers allowed",
      }));
    } else {
      setErrors((prev) => ({ ...prev, whatsapp: "" }));
    }
  }}
  onChange={(e) =>
    setFormData({ ...formData, whatsapp: e.target.value })
  }
/>

{errors.whatsapp && (
  <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>
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
                <label className="block mb-1 font-semibold">
                  Enquiry For Class <span className="text-red-500">*</span>
                </label>
                <select
                  className="border rounded-md px-3 py-2 w-full text-gray-700 bg-white"
                  value={formData.enquiryClass}
                  onChange={(e) =>
                    setFormData({ ...formData, enquiryClass: e.target.value })
                  }
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls._id || cls.name} value={cls.name}>
                      {cls.name}
                    </option>
                  ))}
                </select>
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
                onClick={handleAdd}
                className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[95%] max-w-[700px] relative animate-fadeIn max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeEditModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
            >
              <FiX size={20} />
            </button>

            <h3 className="text-lg font-bold mb-4 text-gray-800">
              Update Admission Enquiry
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold ">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="border rounded-md px-3 py-2 w-full"
                  value={editFormData.studentName}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, studentName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold ">
                  Guardian Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="border rounded-md px-3 py-2 w-full"
                  value={editFormData.guardianName}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, guardianName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold ">
                  Mobile No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="border rounded-md px-3 py-2 w-full"
                  value={editFormData.mobile}
                  maxLength={10}
                  inputMode="numeric"
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, mobile: e.target.value.replace(/\D/g, "") })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold ">
                  WhatsApp No.
                </label>
                <input
                  type="text"
                  className="border rounded-md px-3 py-2 w-full"
                  value={editFormData.whatsapp}
                  maxLength={10}
                  inputMode="numeric"
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, whatsapp: e.target.value.replace(/\D/g, "") })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold ">
                  Email
                </label>
                <input
                  type="email"
                  className="border rounded-md px-3 py-2 w-full"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">
                  Enquiry For Class <span className="text-red-500">*</span>
                </label>
                <select
                  className="border rounded-md px-3 py-2 w-full text-gray-700 bg-white"
                  value={editFormData.enquiryClass}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, enquiryClass: e.target.value })
                  }
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls._id || cls.name} value={cls.name}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold ">Date</label>
                <input
                  type="date"
                  className="border rounded-md px-3 py-2 w-full"
                  value={editFormData.date}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, date: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold ">Status</label>
                <select
                  className="border rounded-md px-3 py-2 w-full"
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
                onClick={closeEditModal}
                className="bg-gray-100 text-gray-700 px-5 py-2 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEnquiry}
                className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700"
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
