import { useState } from "react";
import {
  FiSearch,
  FiEdit,
  FiX,
  FiFileText,
  FiPrinter,
} from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function StudentTransportFees() {
  /* ---------------- FILTER STATES ---------------- */
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [error, setError] = useState("");
  const [showTable, setShowTable] = useState(false);

  /* ---------------- PAGINATION ---------------- */
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  /* ---------------- MODAL ---------------- */
  const [showModal, setShowModal] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [amount, setAmount] = useState("");

  /* ---------------- DUMMY DATA ---------------- */
  const [students, setStudents] = useState([
    {
      admissionNo: "10024",
      name: "Steven Taylor",
      class: "Class 1",
      section: "A",
      father: "Jason Taylor",
      route: "Brooklyn South",
      vehicle: "VH5645",
      pickup: "Brooklyn North",
      fees: {
        Jan: { amount: 800, status: "Paid" },
        Feb: { amount: 800, status: "Paid" },
        Mar: { amount: 800, status: "Unpaid" },
      },
    },
    {
      admissionNo: "120020",
      name: "Ashwani Kumar",
      class: "Class 1",
      section: "A",
      father: "Arjun Kumar",
      route: "Brooklyn Central",
      vehicle: "VH1001",
      pickup: "Brooklyn North",
      fees: {
        Jan: { amount: 900, status: "Paid" },
      },
    },
  ]);

  /* ---------------- SEARCH ---------------- */
  const handleSearch = () => {
    if (!selectedClass) {
      setError("The Class field is required.");
      setShowTable(false);
      return;
    }
    setError("");
    setShowTable(true);
    setPage(1);
  };

  const filtered = students.filter(
    (s) =>
      s.class === selectedClass &&
      (!selectedSection || s.section === selectedSection)
  );

  /* ---------------- PAGINATION LOGIC ---------------- */
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  /* ---------------- ASSIGN FEES ---------------- */
  const openAssignModal = (student) => {
    setActiveStudent(student);
    setSelectedMonth("");
    setAmount("");
    setShowModal(true);
  };

  const assignFee = () => {
    if (!selectedMonth || !amount) return;

    setStudents((prev) =>
      prev.map((s) =>
        s.admissionNo === activeStudent.admissionNo
          ? {
              ...s,
              fees: {
                ...s.fees,
                [selectedMonth]: {
                  amount,
                  status: "Paid",
                },
              },
            }
          : s
      )
    );
    setShowModal(false);
  };

  /* ---------------- EXPORT DUMMY ---------------- */
  const exportExcel = () => alert("Excel export");
  const exportPDF = () => alert("PDF export");
  const printTable = () => window.print();

  return (
    <div className="p-0 min-h-screen">
    <div className="flex items-center justify-between mb-4">
           <h2 className="text-2xl font-bold">Student Transport Fees</h2>
         </div>
    
          {/* Tabs */}
          <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
            <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
              Overview
            </button>
          </div>



      {/* ---------------- SELECT CRITERIA ---------------- */}
      <div className="bg-white p-6 rounded-xl shadow mb-3">
        <h3 className="font-semibold mb-4">Select Criteria</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">
              Class <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Select</option>
              <option>Class 1</option>
              <option>Class 2</option>
            </select>
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Section</label>
            <select
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="">Select</option>
              <option>A</option>
              <option>B</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg flex items-center gap-2"
          >
            <FiSearch /> Search
          </button>
        </div>
      </div>

      {/* ---------------- TABLE ---------------- */}
      {showTable && (
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex justify-between mb-4">
            
<div className="flex gap-2">
  <button
    onClick={exportExcel}
    className="border px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50"
  >
    <FaFileExcel className="text-green-600" />
    Excel
  </button>

  <button
    onClick={exportPDF}
    className="border px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50"
  >
    <FiFileText className="text-red-600" />
    PDF
  </button>

  
</div>
          </div>

          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Admission No</th>
                <th>Name</th>
                <th>Father</th>
                <th>Route</th>
                <th>Vehicle</th>
                <th>Pickup</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((s) => (
                <tr key={s.admissionNo} className="border-t">
                  <td className="p-2">{s.admissionNo}</td>
                  <td className="text-indigo-600">{s.name}</td>
                  <td>{s.father}</td>
                  <td>{s.route}</td>
                  <td>{s.vehicle}</td>
                  <td>{s.pickup}</td>
                  <td className="text-center">
                    <button
                      className="bg-blue-600 text-white p-2 rounded"
                      onClick={() => openAssignModal(s)}
                    >
                      <FiEdit />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
         <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
  <p>
    Page {page} of {totalPages}
  </p>

  <div className="space-x-2">
    <button
      disabled={page === 1}
      onClick={() => setPage(page - 1)}
      className="px-3 py-1 border rounded text-sm
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Previous
    </button>

    <button
      disabled={page === totalPages}
      onClick={() => setPage(page + 1)}
      className="px-3 py-1 border rounded text-sm
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Next
    </button>
  </div>
</div>
        </div>
      )}

      {/* ---------------- ASSIGN MODAL ---------------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-lg p-6 rounded-xl relative">
            <button
              className="absolute right-3 top-3"
              onClick={() => setShowModal(false)}
            >
              <FiX />
            </button>

            <h3 className="font-semibold text-lg mb-4">
              Assign Transport Fees – {activeStudent.name}
            </h3>

            {/* Month Assign */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <select
                className="border rounded px-3 py-2"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">Select ensure Month</option>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Amount"
                className="border rounded px-3 py-2"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <button
              onClick={assignFee}
              className="bg-indigo-600 text-white px-4 py-2 rounded mb-4"
            >
              Assign Fees
            </button>

            {/* Fee History */}
            <h4 className="font-semibold mb-2">Fee History</h4>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">Month</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(activeStudent.fees).map(
                  ([month, f]) => (
                    <tr key={month} className="border-t">
                      <td className="p-2">{month}</td>
                      <td>{f.amount}</td>
                      <td className={
                        f.status === "Paid"
                          ? "text-green-600"
                          : "text-red-600"
                      }>
                        {f.status}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}