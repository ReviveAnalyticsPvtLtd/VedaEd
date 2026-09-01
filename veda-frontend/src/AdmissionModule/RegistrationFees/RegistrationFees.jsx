import React, { useEffect, useState } from "react";
import { FiEdit2, FiPlus, FiDownload } from "react-icons/fi";
import HelpInfo from "../../components/HelpInfo";
import axios from "axios";
import config from "../../config";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
export default function RegistrationFees() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [search, setSearch] = useState("");
const [selectedIds, setSelectedIds] = useState([]);
  useEffect(() => {
    fetchSelectedStudents();
  }, []);
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;
  const fetchSelectedStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${config.API_BASE_URL}/admission/application/selected`
      );

      if (res.data?.success) {
        const mappedStudents = res.data.data.map((app) => ({
          id: app._id || Date.now() + Math.random(),
          applicationId: app.applicationId || "-",
          name: app.personalInfo?.name || "-",
          class:
            app.appliedClass ||
            app.personalInfo?.classApplied ||
            app.personalInfo?.class ||
            app.earlierAcademic?.lastClass ||
            "-",
          admissionFee:
            app.admissionFee?.amount !== undefined && app.admissionFee?.amount !== null
              ? app.admissionFee.amount
              : "",
          tuitionFee: "",
          transportFee: "",
          term: "",
          status:
            (app.admissionFee?.status || app.personalInfo?.fees || "").toLowerCase() ===
            "paid"
              ? "Paid"
              : "Pending",
          paymentMode: app.admissionFee?.paymentMode || "",
          receiptNo: app.admissionFee?.receiptNumber || "-",
        }));

        setStudents(mappedStudents);
      }
    } catch (error) {
      console.error("Error fetching selected students for fees:", error);
    } finally {
      setLoading(false);
    }
  };
const toggleOne = (id) => {
  setSelectedIds((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );
};

const toggleAll = (e) => {
  setSelectedIds(
    e.target.checked ? filtered.map((s) => s.id) : []
  );
};
  const handleOpenModal = (student = null) => {
    setEditMode(!!student);
    setSelectedStudent(
      student || {
        id: Date.now(),
        applicationId: "",
        name: "",
        class: "",
        admissionFee: "",
        tuitionFee: "",
        transportFee: "",
        term: "",
        paymentMode: "",
        receiptNo: "",
        status: "Pending",
      }
    );
    setShowModal(true);
  };

  const handleChange = (e) => {
  const { name, value } = e.target;

  // fee fields ke liye negative block
  if (["admissionFee", "tuitionFee", "transportFee"].includes(name)) {
    if (value < 0) return; // ignore negative
  }

  setSelectedStudent({ ...selectedStudent, [name]: value });
};

 const handleSave = async () => {
  if (
    selectedStudent.admissionFee < 0 ||
    selectedStudent.tuitionFee < 0 ||
    selectedStudent.transportFee < 0
  ) {
    alert("Amount cannot be negative");
    return;
  }

  try {
    if (editMode) {
      // Persist fee status to backend without replacing the full personalInfo object.
      const backendFeeStatus = selectedStudent.status === "Paid" ? "Paid" : "Due";
      const normalizedAmount =
        selectedStudent.admissionFee === "" || selectedStudent.admissionFee === null
          ? 0
          : Number(selectedStudent.admissionFee);
      await axios.put(
        `${config.API_BASE_URL}/admission/application/${selectedStudent.id}`,
        {
          "personalInfo.fees": backendFeeStatus,
          admissionFee: {
            status: backendFeeStatus,
            amount: Number.isNaN(normalizedAmount) ? 0 : normalizedAmount,
            paymentMode: selectedStudent.paymentMode || "",
            receiptNumber:
              selectedStudent.receiptNo && selectedStudent.receiptNo !== "-"
                ? selectedStudent.receiptNo
                : "",
          },
        }
      );

      setStudents((prev) =>
        prev.map((s) => (s.id === selectedStudent.id ? selectedStudent : s))
      );
    } else {
      setStudents((prev) => [...prev, selectedStudent]);
    }

    setShowModal(false);
  } catch (error) {
    console.error("Error saving fee status:", error);
    alert("Failed to save fee status. Please try again.");
  }
};

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

const paginatedData = filtered.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);
const exportSelectedExcel = () => {
  if (selectedIds.length === 0) {
    alert("Please select at least one student");
    return;
  }

  const selectedStudents = students.filter((s) =>
    selectedIds.includes(s.id)
  );

  const excelData = selectedStudents.map((s, index) => ({
    "S.No": index + 1,
    "Application ID": s.applicationId,
    "Student Name": s.name,
    Class: s.class,
    "Admission Fee": s.admissionFee,
    "Tuition Fee": s.tuitionFee,
    "Transport Fee": s.transportFee,
    Term: s.term,
    "Payment Mode": s.paymentMode,
    "Receipt No": s.receiptNo,
    Status: s.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Fees");
  XLSX.writeFile(workbook, "Registration_Fees.xlsx");
};
  return (
    <div className="p-0 m-0 min-h-screen mb-14">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold">Admission Fees</h2>
        <HelpInfo
          title="Fees Confirmation Help"
          description={`1.1 Overview

This page allows you to manage and confirm student fee payments, including various fee types and payment statuses.

2.1 Table Columns Description

- Student Name: Name of the student who has made or is due for payment.
- Class: The class or grade of the student.
- Admission Fee: One-time fee paid during admission.
- Tuition Fee: Regular fee for academic tuition.
- Transport Fee: Charges for transportation services if opted.
- Term: The academic term or quarter the fees apply to (e.g., First Quarter).
- Payment Mode: Mode of payment used by the student (e.g., Online, Manual).
- Receipt No.: Receipt number generated for the payment; may be blank if pending.
- Status: Payment status indicating if the fee is 'Paid' or 'Pending'.
- Actions: Options to add new payments, edit or confirm existing payments.

3.1 Usage Tips

Use the search feature to quickly find student fee records. Add new payments as necessary and export payment data in CSV format for reporting or record keeping.`}
        />
      </div>
{/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
          Overview
        </button>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-8">
        {/* Search + actions row */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
          {/* Left: Search box */}
          <input
            type="text"
            placeholder="Search student..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring focus:ring-blue-300 w-full md:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Right: Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-blue-700 w-full sm:w-auto"
            >
              <FiPlus className="mr-2" /> Add New Payment
            </button>
           <button
  onClick={exportSelectedExcel}
  disabled={selectedIds.length === 0}
  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-green-700 disabled:opacity-50 w-full sm:w-auto"
>
  <FiDownload className="mr-2" /> Export Excel
</button>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white shadow border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>  <th className="p-2 border text-center">
    <input
      type="checkbox"
      onChange={toggleAll}
      checked={
        filtered.length > 0 &&
        selectedIds.length === filtered.length
      }
    />
  </th>

  <th className="p-2 border text-center">S.No</th>
                <th className="p-2 border text-left">Application ID</th>
                <th className="p-2 border text-left">Student Name</th>
                <th className="p-2 border text-left">Class</th>
                <th className="p-2 border text-left">Admission Fee</th>
                <th className="p-2 border text-left">Tuition Fee</th>
                <th className="p-2 border text-left">Transport Fee</th>
                <th className="p-2 border text-left">Term</th>
                <th className="p-2 border text-left">Payment Mode</th>
                <th className="p-2 border text-left">Receipt No.</th>
                <th className="p-2 border text-left">Status</th>
                <th className="p-2 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
               paginatedData.map((stu, index) => (
                  <tr key={stu.id} className="hover:bg-gray-50">
                     <td className="p-2 border text-center">
    <input
      type="checkbox"
      checked={selectedIds.includes(stu.id)}
      onChange={() => toggleOne(stu.id)}
    />
  </td>

  <td className="p-2 border text-center">
   {(currentPage - 1) * itemsPerPage + index + 1}
  </td>
                    <td className="p-2 border">{stu.applicationId || "-"}</td>
                    <td className="p-2 border">{stu.name}</td>
                    <td className="p-2 border">{stu.class}</td>
                    <td className="p-2 border">
                      {stu.admissionFee === "" ? "-" : `₹${stu.admissionFee}`}
                    </td>
                    <td className="p-2 border">
                      {stu.tuitionFee === "" ? "-" : `₹${stu.tuitionFee}`}
                    </td>
                    <td className="p-2 border">
                      {stu.transportFee === "" ? "-" : `₹${stu.transportFee}`}
                    </td>
                    <td className="p-2 border">{stu.term}</td>
                    <td className="p-2 border">{stu.paymentMode}</td>
                    <td className="p-2 border">{stu.receiptNo}</td>
                    <td
                      className={`p-2 border font-semibold ${
                        stu.status === "Paid"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {stu.status}
                    </td>
                    <td className="p-2 border text-center">
                      <button
                        onClick={() => handleOpenModal(stu)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FiEdit2 />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={11}
                    className="text-center p-4 text-gray-500 border"
                  >
                    {loading ? "Loading selected students..." : "No students found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        
        </div>
          {/* FIXED BOTTOM NAVIGATION */}
<div className="fixed bottom-4 left-4 right-4 md:left-[calc(16rem+1rem)] md:right-8 flex justify-between z-40 gap-3">
  <button
    onClick={() => navigate("/admission/application-offer")}
    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 w-full sm:w-auto"
  >
    Back
  </button>

  <button
    onClick={() => navigate("/admission/status-tracking")}
    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 w-full sm:w-auto"
  >
    Next →
  </button>
</div>
        

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">
                {editMode ? "Edit Payment Details" : "Add New Payment"}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium">Application ID</label>
                  <input
                    type="text"
                    name="applicationId"
                    value={selectedStudent.applicationId}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="block font-medium">
                    Student Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={selectedStudent.name}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="block  font-medium">Class</label>
                  <input
                    type="text"
                    name="class"
                    value={selectedStudent.class}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="block  font-medium">
                    Admission Fee
                  </label>
                <input
  type="number"
  name="admissionFee"
  min="0"
  value={selectedStudent.admissionFee}
  onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="block  font-medium">
                    Tuition Fee
                  </label>
                  <input
                    type="number"
                    name="tuitionFee"
                    value={selectedStudent.tuitionFee}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="block  font-medium">
                    Transport Fee
                  </label>
                  <input
                    type="number"
                    name="transportFee"
                    value={selectedStudent.transportFee}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="block  font-medium">Term</label>
                  <select
                    name="term"
                    value={selectedStudent.term}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                  >
                    <option value="">Select Term</option>
                    <option>First Quarter</option>
                    <option>Second Quarter</option>
                    <option>Third Quarter</option>
                    <option>Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium">
                    Payment Mode
                  </label>
                  <select
                    name="paymentMode"
                    value={selectedStudent.paymentMode}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                  >
                    <option value="">Select Mode</option>
                    <option>Online</option>
                    <option>Cash</option>
                    <option>Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block  font-medium">
                    Receipt No.
                  </label>
                  <input
                    type="text"
                    name="receiptNo"
                    value={selectedStudent.receiptNo}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block  font-medium">Status</label>
                  <select
                    name="status"
                    value={selectedStudent.status}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                  >
                    <option>Paid</option>
                    <option>Pending</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
          <div className="flex justify-between items-center mt-4">
  <span className="text-sm text-gray-600">
    Page {currentPage} of {totalPages}
  </span>

  <div className="flex gap-2">
    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((p) => p - 1)}
      className="px-4 py-1 border rounded disabled:opacity-50"
    >
      Previous
    </button>

    <button
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage((p) => p + 1)}
      className="px-4 py-1 border rounded disabled:opacity-50"
    >
      Next
    </button>
  </div>
</div>
      </div>
    </div>
  );
}
