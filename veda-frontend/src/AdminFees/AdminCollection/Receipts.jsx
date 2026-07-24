import React, { useState, useEffect } from "react";
import { FiPrinter, FiSearch, FiCheck } from "react-icons/fi";
import axios from "../../services/apiClient";
import config from "../../config";

export default function Receipts() {
  const [transactions, setTransactions] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTxs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.API_BASE_URL}/fees/collect/payments?search=${search}`);
      setTransactions(res.data);
      if (res.data.length > 0 && !selectedTx) {
        setSelectedTx(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTxs();
  }, [search]);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Search & Selector List */}
      <div className="bg-white rounded-xl shadow border p-5 space-y-4">
        <div>
          <h3 className="font-bold text-lg text-gray-800">Select Transaction</h3>
          <p className="text-gray-500 text-xs mt-1">Search student or receipt number to review voucher.</p>
        </div>
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {loading ? (
            <p className="text-center text-gray-400 text-xs py-6">Loading list...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-400 text-xs py-6">No matches found.</p>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx._id}
                onClick={() => setSelectedTx(tx)}
                className={`p-3 border rounded-lg cursor-pointer transition flex justify-between items-center ${
                  selectedTx?._id === tx._id ? "border-blue-500 bg-blue-50/40" : "hover:bg-gray-50"
                }`}
              >
                <div>
                  <h4 className="font-semibold text-sm text-gray-800">
                    {tx.studentId?.personalInfo?.name || "Unknown"}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    REC-{tx._id.substring(tx._id.length - 8).toUpperCase()} • {tx.paymentMethod}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-green-600">₹{tx.totalAmount}</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(tx.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Receipt Preview Canvas */}
      <div className="md:col-span-2 bg-white rounded-xl shadow border p-6 flex flex-col justify-between">
        {selectedTx ? (
          <div>
            <div className="flex justify-between items-start border-b pb-5">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-blue-700">VEDA ACADEMY</h2>
                <p className="text-gray-500 text-xs mt-1">12, Sector 4, Dwarka, New Delhi - 110075</p>
                <p className="text-gray-500 text-xs">Email: billing@vedaedu.com | Tel: 011-4567890</p>
              </div>
              <div className="text-right">
                <span className="bg-green-100 text-green-800 font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full">
                  Fee Receipt
                </span>
                <p className="text-xs text-gray-500 mt-3">
                  Receipt No: <strong className="font-mono text-gray-800">REC-{selectedTx._id.substring(selectedTx._id.length - 8).toUpperCase()}</strong>
                </p>
                <p className="text-xs text-gray-500">
                  Date: <span className="text-gray-800">{new Date(selectedTx.date).toLocaleString()}</span>
                </p>
              </div>
            </div>

            {/* Student & Class Details grid */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 my-5 text-sm">
              <div>
                <p className="text-gray-400 text-xs uppercase font-semibold">Student Details</p>
                <h4 className="font-bold text-gray-800 mt-1">{selectedTx.studentId?.personalInfo?.name || "Unknown"}</h4>
                <p className="text-gray-600 text-xs mt-0.5">
                  Admission No: {selectedTx.studentId?.personalInfo?.stdId || "N/A"}
                </p>
                <p className="text-gray-600 text-xs">
                  Father's Name: {selectedTx.studentId?.parent?.fatherName || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase font-semibold">Academic Details</p>
                <h4 className="font-bold text-gray-800 mt-1">Class: {selectedTx.studentId?.personalInfo?.class?.name || "N/A"}</h4>
                <p className="text-gray-600 text-xs mt-0.5">Section: {selectedTx.studentId?.personalInfo?.section?.name || "N/A"}</p>
                <p className="text-gray-600 text-xs">Session: {selectedTx.year}</p>
              </div>
            </div>

            {/* Table breakdown */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-gray-700">Payment Breakdown</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-left border-b font-semibold">
                    <th className="p-2.5">S.No</th>
                    <th className="p-2.5">Fee Category Head</th>
                    <th className="p-2.5 text-right">Amount Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTx.fees?.map((feeItem, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2.5 text-gray-500">{index + 1}</td>
                      <td className="p-2.5 font-semibold text-gray-800">{feeItem.category}</td>
                      <td className="p-2.5 text-right text-gray-800">₹{feeItem.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="font-bold text-base border-t-2">
                    <td></td>
                    <td className="p-2.5 text-gray-800">Total Collected</td>
                    <td className="p-2.5 text-right text-green-700">₹{selectedTx.totalAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mode & Collector Footer info */}
            <div className="mt-8 pt-4 border-t flex justify-between items-center text-xs text-gray-500">
              <div>
                <p>Payment Mode: <strong className="text-gray-700">{selectedTx.paymentMethod}</strong></p>
                {selectedTx.remark && <p className="mt-1">Remarks: <span className="text-gray-600 italic">{selectedTx.remark}</span></p>}
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-700">Accounts Officer</p>
                <p className="text-[10px] text-gray-400 mt-1">Computer Generated Receipt</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-24 text-gray-400">No transaction selected.</div>
        )}

        {selectedTx && (
          <div className="flex justify-end gap-3 mt-6 border-t pt-4">
            <button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg text-sm flex items-center gap-2 transition"
            >
              <FiPrinter /> Print Receipt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}