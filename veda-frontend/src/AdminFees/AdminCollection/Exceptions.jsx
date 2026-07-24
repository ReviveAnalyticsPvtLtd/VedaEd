import React, { useState, useEffect } from "react";
import { FiAlertCircle } from "react-icons/fi";
import axios from "../../services/apiClient";
import config from "../../config";

export default function Exceptions() {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchExceptions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.API_BASE_URL}/fees/collect/payments`);
      
      // Filter payments that have carry forward or custom waivers
      const filtered = res.data.filter(t => 
        t.paymentMethod === "Carry-Forward" || 
        t.remark?.toLowerCase().includes("waiv") || 
        t.remark?.toLowerCase().includes("carry") ||
        t.fees?.some(f => f.category.toLowerCase().includes("carry"))
      );
      
      setExceptions(filtered);
    } catch (err) {
      console.error("Failed to load exception logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow border p-5">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-red-600">
          <FiAlertCircle /> Collection Exceptions Log
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Displays outstanding balance carry-forwards, late fee waivers, and customized adjustments.
        </p>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading exceptions log...</div>
        ) : exceptions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No exception transactions found in logs.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-semibold border-b text-left">
                <th className="p-3">Student Name</th>
                <th className="p-3">Class</th>
                <th className="p-3">Session</th>
                <th className="p-3">Adjustment Type</th>
                <th className="p-3">Remark Details</th>
                <th className="p-3 text-right">Adjustment Amount</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map((ex) => {
                const isCarryForward = ex.paymentMethod === "Carry-Forward" || ex.remark?.toLowerCase().includes("carry");
                return (
                  <tr key={ex._id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-3 font-semibold text-gray-800">
                      {ex.studentId?.personalInfo?.name || "Unknown"}
                    </td>
                    <td className="p-3 text-gray-600">
                      {ex.studentId?.personalInfo?.class?.name || "N/A"}
                    </td>
                    <td className="p-3 text-gray-600">{ex.year}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        isCarryForward ? "bg-purple-100 text-purple-800" : "bg-red-100 text-red-800"
                      }`}>
                        {isCarryForward ? "Carry-Forward Dues" : "Late Fee Waiver"}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 max-w-[250px] truncate" title={ex.remark}>
                      {ex.remark || "N/A"}
                    </td>
                    <td className="p-3 text-right font-bold text-red-600">
                      ₹{ex.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}