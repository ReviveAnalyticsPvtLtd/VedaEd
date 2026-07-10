import React, { useState, useEffect } from "react";
import { FiSearch, FiDownload } from "react-icons/fi";
import axios from "axios";
import config from "../../config";

export default function SearchFeesPayment() {
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("All");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${config.API_BASE_URL}/fees/collect/payments?search=${search}&paymentMethod=${paymentMethod}`
      );
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to fetch payments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleSearch = () => {
    fetchPayments();
  };

  const handleExport = () => {
    const csv = [
      ["Student Name", "Class", "Date", "Payment Mode", "Amount", "Remark"],
      ...transactions.map((t) => [
        t.studentId?.personalInfo?.name || "Unknown",
        t.studentId?.personalInfo?.class?.name || "N/A",
        new Date(t.date).toLocaleDateString(),
        t.paymentMethod,
        t.totalAmount,
        t.remark || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fee-payments-report.csv";
    a.click();
  };

  return (
    <div className="p-0 min-h-screen">
      <div className="text-gray-500 text-sm mb-2 flex gap-1">
        <span>Admin Fees</span> &gt; <span>Search Payment</span>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Search Payment</h2>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Select Criteria</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search By Student Name, Admission Number..."
            className="border p-2 rounded w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border p-2 rounded w-full"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="All">All Payment Modes</option>
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
            <option value="Net Banking">Net Banking</option>
          </select>
        </div>

        <div className="mt-4">
          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FiSearch /> Search
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Payment Transactions List</h2>
          {transactions.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 text-sm bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200"
            >
              <FiDownload /> Export CSV
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-4">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No data available in table</p>
        ) : (
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Student Name</th>
                <th className="p-2">Class</th>
                <th className="p-2">Date</th>
                <th className="p-2">Payment Mode</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Remark</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t._id} className="border-t">
                  <td className="p-2 font-semibold text-blue-600">
                    {t.studentId?.personalInfo?.name || "Unknown"}
                  </td>
                  <td className="p-2">
                    {t.studentId?.personalInfo?.class?.name || "N/A"}{" "}
                    {t.studentId?.personalInfo?.section?.name ? `(${t.studentId.personalInfo.section.name})` : ""}
                  </td>
                  <td className="p-2">
                    {new Date(t.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-2">{t.paymentMethod}</td>
                  <td className="p-2 text-green-600 font-bold">₹{t.totalAmount}</td>
                  <td className="p-2 text-gray-500">{t.remark || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
