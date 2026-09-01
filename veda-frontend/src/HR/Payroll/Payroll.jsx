import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiSave,
  FiMoreHorizontal,
  FiX,
  FiDownload,
  FiFileText,
} from "react-icons/fi";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import HelpInfo from "../../components/HelpInfo";   
import api from "../../services/apiClient";

export default function ManageSalary() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  });
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [noteInput, setNoteInput] = useState("");

  const roles = [
    "Teacher",
    "Admin",
    "Accountant",
    "Librarian",
    "Receptionist",
    "Principal",
  ];

  useEffect(() => {
    fetchPayroll();
  }, [selectedMonth]);

  const getMonthYearParams = () => {
    const [year, month] = selectedMonth.split("-");
    return {
      month: Number(month),
      year: Number(year),
    };
  };

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const { month, year } = getMonthYearParams();
      const res = await api.get("/staff/payroll/list", {
        params: { month, year }
      });
      if (res.data.success) {
        setStaffList(res.data.payrolls);
      }
    } catch (err) {
      console.error("Error fetching payroll:", err);
      alert(err?.response?.data?.message || "Failed to fetch payroll");
    } finally {
      setLoading(false);
    }
  };

  // Filtered list based on search and role
  const filteredStaff = staffList.filter((s) => {
    const nameMatch = (s.staff?.personalInfo?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const roleMatch = selectedRole ? s.staff?.personalInfo?.role === selectedRole : true;
    return nameMatch && roleMatch;
  });

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      staffList.map((s) => ({
      "Staff ID": s.staff?.personalInfo?.staffId,
      Name: s.staff?.personalInfo?.name,
      Role: s.staff?.personalInfo?.role,
      "Basic Salary": s.basic,
      Allowances: s.allowances,
      Deductions: s.deductions,
      "Gross Salary": s.basic + s.allowances - s.deductions,
      "Net Salary": s.basic + s.allowances - s.deductions,
      "Pay Status": s.payStatus,
      Note: s.note || "-",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");
    XLSX.writeFile(workbook, "Payroll.xlsx");
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Staff Payroll - ${selectedMonth}`, 14, 15);
    doc.autoTable({
      startY: 25,
      head: [
        [
          "ID",
          "Name",
          "Role",
          "Basic",
          "Allowances",
          "Deductions",
          "Net",
          "Pay Status",
          "Note",
        ],
      ],
      body: staffList.map((s) => [
        s.staff?.personalInfo?.staffId,
        s.staff?.personalInfo?.name,
        s.staff?.personalInfo?.role,
        s.basic,
        s.allowances,
        s.deductions,
        s.basic + s.allowances - s.deductions,
        s.payStatus,
        s.note || "-",
      ]),
    });
    doc.save(`Payroll_${selectedMonth}.pdf`);
  };

  const updatePayStatus = async (status) => {
    try {
      const res = await api.put(`/staff/payroll/${selectedStaff._id}`, {
        payStatus: status,
        note: noteInput
      });
      if (res.data.success) {
        setStaffList((prev) =>
          prev.map((s) =>
            s._id === selectedStaff._id
              ? { ...s, payStatus: status, note: noteInput }
              : s
          )
        );
        setSelectedStaff(null);
        setNoteInput("");
      }
    } catch (err) {
      console.error("Error updating pay status:", err);
      alert(err?.response?.data?.message || "Failed to update pay status");
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex justify-between items-center mb-4">
           <h2 className="text-2xl font-bold">Staff Payroll</h2>
          <HelpInfo
  title="Payroll Page Help"
  description={`1.1 Payroll Table Overview:

- Staff ID: Unique identifier assigned to each staff member.
- Name: Full name of the staff member.
- Role: Job designation (e.g., Teacher, Accountant).
- Basic Salary: Fixed monthly salary before any additions or deductions.
- Allowances: Additional financial benefits given on top of the basic salary.
- Deductions: Amounts subtracted for taxes, leaves, or other reasons.
- Gross: Total salary before deductions (Basic Salary + Allowances).
- Net: Final payable salary after deductions.
- Pay Status: Current payment state, e.g., 'Pending' or 'Paid'.
- Note: Additional remarks regarding the payroll entry.
- Action: Options to edit or manage the payroll record.`}
/>
         </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        {["overview"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize pb-2 ${
              activeTab === tab
                ? "text-blue-600 font-semibold border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
          >
            {tab === "overview" ? "Overview" : tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="bg-white p-3 rounded-lg shadow-sm border">
          {/* Top Controls */}
          <div className="flex flex-wrap justify-between gap-3 mb-4">
            <div className="flex gap-2">
              <select
                className="border p-2 rounded focus:ring-2 focus:ring-blue-300"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="">All Roles</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <input
                type="month"
                className="border p-2 rounded focus:ring-2 focus:ring-blue-300"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search name..."
                className="border rounded-md px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                <FiDownload /> Excel
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                <FiFileText /> PDF
              </button>
            </div>
          </div>

          {/* Staff Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full  text-left border-collapse">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-3 font-semibold">#</th>
                  <th className="p-3 font-semibold">Staff ID</th>
                  <th className="p-3 font-semibold">Name</th>
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 font-semibold">Basic Salary</th>
                  <th className="p-3 font-semibold">Allowances</th>
                  <th className="p-3 font-semibold">Deductions</th>
                  <th className="p-3 font-semibold">Gross</th>
                  <th className="p-3 font-semibold">Net</th>
                  <th className="p-3 font-semibold">Pay Status</th>
                  <th className="p-3 font-semibold">Note</th>
                  <th className="p-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((s, idx) => (
                  <tr
                    key={s._id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="p-2 border">{idx + 1}</td>
                    <td className="p-2 border">{s.staff?.personalInfo?.staffId}</td>
                    <td className="p-2 border font-medium text-gray-800">
                      {s.staff?.personalInfo?.name}
                    </td>
                    <td className="p-2 border text-gray-600">{s.staff?.personalInfo?.role}</td>
                    <td className="p-2 border">{s.basic}</td>
                    <td className="p-2 border">{s.allowances}</td>
                    <td className="p-2 border">{s.deductions}</td>
                    <td className="p-2 border">
                      {s.basic + s.allowances - s.deductions}
                    </td>
                    <td className="p-2 border">
                      {s.basic + s.allowances - s.deductions}
                    </td>
                    <td className="p-2 border">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        s.payStatus === "Paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {s.payStatus}
                      </span>
                    </td>
                    <td className="p-2 border text-gray-600 italic">
                      {s.note || "—"}
                    </td>
                    <td className="p-2 border text-center">
                      <button
                        onClick={() => {
                          setSelectedStaff(s);
                          setNoteInput(s.note || "");
                        }}
                        className="text-gray-600 hover:text-blue-600"
                      >
                        <FiMoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStaff.length === 0 && (
              <p className="text-center text-gray-500 py-4">No records found</p>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96 relative animate-fadeIn">
            <button
              onClick={() => setSelectedStaff(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
            >
              <FiX size={20} />
            </button>

            <h3 className="text-lg font-bold mb-4 text-gray-800">
              Update Pay Status
            </h3>
            <p className="text-gray-700 mb-2">
              <strong>Staff:</strong> {selectedStaff.staff?.personalInfo?.name}
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Role:</strong> {selectedStaff.staff?.personalInfo?.role}
            </p>

            <textarea
              placeholder="Add a note..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none mb-4"
              rows="3"
            ></textarea>

            <div className="flex justify-between gap-3">
              <button
                onClick={() => updatePayStatus("Paid")}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex-1"
              >
                Paid
              </button>
              <button
                onClick={() => updatePayStatus("Pending")}
                className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 flex-1"
              >
                Pending
              </button>
            </div>

            <button
              onClick={() => updatePayStatus(selectedStaff.payStatus)}
              className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
