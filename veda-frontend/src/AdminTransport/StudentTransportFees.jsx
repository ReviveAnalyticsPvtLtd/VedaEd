import { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import {
  FiSearch,
  FiEdit,
  FiX,
  FiFileText,
  FiPrinter,
} from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";
import Pagination from "../components/common/Pagination";

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

  /* ---------------- DATA ---------------- */
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  /* ---------------- FETCH CLASSES ---------------- */
  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/classes`);
      if (res.data.success) {
        setClasses(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch classes", err);
    }
  };

  useEffect(() => {
    if (!selectedClass) {
      setSections([]);
      setSelectedSection("");
      return;
    }
    const selected = classes.find((c) => c.name === selectedClass);
    setSections(selected?.sections || []);
    setSelectedSection("");
  }, [selectedClass, classes]);

  /* ---------------- FETCH STUDENTS ---------------- */
  const fetchStudentTransports = async () => {
    try {
      setLoading(true);
      setDataError("");
      const params = new URLSearchParams();
      if (selectedClass) params.set("class", selectedClass);
      if (selectedSection) params.set("section", selectedSection);
      const res = await axios.get(
        `${config.API_BASE_URL}/transport/student-transports?${params.toString()}`
      );
      setStudents(res.data);
      setPage(1);
    } catch (err) {
      console.error("Failed to fetch student transports", err);
      setDataError("Failed to load student transport fees.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- SEARCH ---------------- */
  const handleSearch = () => {
    if (!selectedClass) {
      setError("The Class field is required.");
      setShowTable(false);
      return;
    }
    setError("");
    setShowTable(true);
    fetchStudentTransports();
  };

  /* ---------------- PAGINATION LOGIC ---------------- */
  const filtered = students;
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

  const assignFee = async () => {
    if (!selectedMonth || !amount) return;

    try {
      await axios.post(`${config.API_BASE_URL}/transport/student-transports/pay`, {
        studentId: activeStudent.studentId,
        month: selectedMonth,
        amount: Number(amount),
      });
      fetchStudentTransports();
      setShowModal(false);
    } catch (err) {
      console.error("Failed to assign transport fee", err);
      alert("Failed to assign transport fee");
    }
  };

  /* ---------------- EXPORT ---------------- */
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
              {classes.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
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
              {sections.map((s) => (
                <option key={s._id} value={s.name}>
                  {s.name}
                </option>
              ))}
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    Loading student transport fees...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-400">
                    {dataError || "No transport students found"}
                  </td>
                </tr>
              ) : (
                paginatedData.map((s) => (
                <tr key={s.studentId || s._id} className="border-t">
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
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
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
                {(activeStudent.fees || []).map((f, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{f.month}</td>
                      <td>{f.amount}</td>
                      <td className={
                        f.status === "Paid"
                          ? "text-green-600"
                          : "text-red-600"
                      }>
                        {f.status}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}