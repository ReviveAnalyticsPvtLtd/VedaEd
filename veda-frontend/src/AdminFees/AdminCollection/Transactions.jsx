import React, { useState, useEffect } from "react";
import { FiSearch, FiCalendar, FiPrinter } from "react-icons/fi";
import axios from "../../services/apiClient";
import config from "../../config";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("All");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${config.API_BASE_URL}/fees/collect/payments?search=${search}&paymentMethod=${filterMethod}`
      );
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search, filterMethod]);

  return (
    <div className="bg-white rounded-xl shadow border p-5">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold">Transaction History</h2>
          <p className="text-gray-500 text-sm mt-1">
            Real-time audit log of all fees collections received.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search student or receipt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
          />
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="All">All Modes</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Cheque">Cheque</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Online Gateway">Online Gateway</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading collection log...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No transactions matching criteria.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-semibold border-b text-left">
                <th className="p-3">Receipt No</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Class</th>
                <th className="p-3">Payment Mode</th>
                <th className="p-3">Remarks</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3 font-mono text-xs text-blue-600 font-bold">
                    REC-{tx._id.substring(tx._id.length - 8).toUpperCase()}
                  </td>
                  <td className="p-3 font-semibold text-gray-800">
                    {tx.studentId?.personalInfo?.name || "Unknown"}
                  </td>
                  <td className="p-3 text-gray-600">
                    {tx.studentId?.personalInfo?.class?.name || "N/A"}
                  </td>
                  <td className="p-3">
                    <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full">
                      {tx.paymentMethod}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500 max-w-[200px] truncate" title={tx.remark}>
                    {tx.remark || "N/A"}
                  </td>
                  <td className="p-3 text-gray-500">
                    {new Date(tx.date).toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-bold text-green-600">
                    ₹{tx.totalAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}