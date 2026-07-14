import { useState } from "react";
import { FiSearch, FiEye, FiDownload } from "react-icons/fi";

export default function PaymentHistory() {
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const perPage = 5;

  // ✅ Dummy Data (Invoice Based)
 const data = [
  {
    invoice: "INV-1001",
    student: "Aarav Sharma",
    className: "Class 5-A",
    feeType: "Quarterly Fees",
    date: "10 Jan 2026",
    amount: "₹5,000",
    status: "Success",
  },
  {
    invoice: "INV-1002",
    student: "Ananya Sharma",
    className: "Class 2-B",
    feeType: "Monthly Fees",
    date: "18 Feb 2026",
    amount: "₹3,000",
    status: "Success",
  },
  {
    invoice: "INV-1003",
    student: "Vivaan Sharma",
    className: "Class 7-C",
    feeType: "Annual Fees",
    date: "15 Mar 2026",
    amount: "₹12,000",
    status: "Failed",
  },
];

  // FILTER
  const filtered = data.filter((d) => {
    return (
      (year === "all" || d.date.includes(year)) &&
      (status === "all" || d.status === status) &&
      d.invoice.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const current = filtered.slice((page - 1) * perPage, page * perPage);

  // PDF DOWNLOAD
  const downloadReceipt = (p) => {
    const content = `
Invoice Receipt
-----------------------
Invoice No: ${p.invoice}
Student: ${p.student}
Class: ${p.className}
Fee Type: ${p.feeType}
Amount: ${p.amount}
Date: ${p.date}
Status: ${p.status}
    `;
    const blob = new Blob([content], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.invoice}.pdf`;
    a.click();
  };

  return (
    <div className="p-0 min-h-screen">
{/* Breadcrumb */}
          <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
            <span>Parent Fees &gt;</span>
            <span>Payment History</span>
          </div>
    <div className="flex items-center justify-between mb-2">
           <h2 className="text-2xl font-bold">Payment History </h2>
         </div>
    
          {/* Tabs */}
          <div className="flex gap-3 text-sm mb-3 text-gray-600 border-b">
            <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
              Overview
            </button>
          </div>
      <div className="bg-white border rounded-lg">

       

        {/* FILTER BAR */}
        <div className="p-4 flex gap-3 items-center">

          {/* SEARCH */}
          <div className="flex items-center border px-3 py-2 rounded-md w-[320px]">
            <FiSearch className="text-gray-400 mr-2" />
            <input
              placeholder="Search invoice number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none w-full text-sm"
            />
          </div>

          {/* YEAR */}
          <select
            className="border px-3 py-2 rounded-md text-sm"
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="all">Year</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          {/* STATUS */}
          <select
            className="border px-3 py-2 rounded-md text-sm"
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Status</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        {/* TABLE */}
        <div className="px-4 pb-4">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">S. no.</th>
                <th className="p-2 border">Invoice No</th>
<th className="p-2 border">Student</th>
<th className="p-2 border">Class</th>
<th className="p-2 border">Fee Type</th>
<th className="p-2 border">Date</th>

                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>

            <tbody>
              {current.map((p, i) => (
                <tr key={i} className="text-center hover:bg-gray-50">
                  <td className="p-2 border">{(page - 1) * perPage + i + 1}</td>
                  <td className="p-2 border">{p.invoice}</td>
<td className="p-2 border">{p.student}</td>
<td className="p-2 border">{p.className}</td>
<td className="p-2 border">{p.feeType}</td>
<td className="p-2 border">{p.date}</td>
<td className="p-2 border">{p.amount}</td>

                  <td className="p-2 border">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        p.status === "Success"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>

                  <td className="p-2 border">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setSelected(p)}
                        className="text-blue-600"
                      >
                        <FiEye />
                      </button>

                      {p.status === "Success" && (
                        <button
                          onClick={() => downloadReceipt(p)}
                          className="text-green-600"
                        >
                          <FiDownload />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {current.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-gray-500 text-center">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div className="flex justify-between items-center mt-3 text-sm text-gray-500">
            <p>
              Page {page} of {totalPages || 1}
            </p>

            <div className="space-x-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>

              <button
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-5 rounded-md w-96">

            <h3 className="font-semibold mb-3">Invoice Details</h3>
<p><b>Invoice:</b> {selected.invoice}</p>
<p><b>Student:</b> {selected.student}</p>
<p><b>Class:</b> {selected.className}</p>
<p><b>Fee Type:</b> {selected.feeType}</p>
<p><b>Date:</b> {selected.date}</p>
<p><b>Amount:</b> {selected.amount}</p>
<p><b>Status:</b> {selected.status}</p>

            <div className="mt-4 border-t pt-2 text-xs text-gray-500">
              <p>✔ Initiated</p>
              <p>✔ Processing</p>
              <p>
                {selected.status === "Success"
                  ? "✔ Completed"
                  : "✖ Failed"}
              </p>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="mt-4 w-full border py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}