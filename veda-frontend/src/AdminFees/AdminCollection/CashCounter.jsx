import React, { useState, useEffect } from "react";
import { FiDollarSign, FiSmartphone, FiInbox } from "react-icons/fi";
import axios from "../../services/apiClient";
import config from "../../config";

export default function CashCounter() {
  const [stats, setStats] = useState({
    Cash: 0,
    UPI: 0,
    Cheque: 0,
    "Bank Transfer": 0,
    "Online Gateway": 0,
    Total: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchTodayStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.API_BASE_URL}/fees/collect/payments`);
      
      const todayStr = new Date().toDateString();
      const todayTxs = res.data.filter(t => new Date(t.date).toDateString() === todayStr);

      const totals = {
        Cash: 0,
        UPI: 0,
        Cheque: 0,
        "Bank Transfer": 0,
        "Online Gateway": 0,
        Total: 0
      };

      todayTxs.forEach(t => {
        const method = t.paymentMethod || "Cash";
        if (totals[method] !== undefined) {
          totals[method] += t.totalAmount;
        } else {
          totals["Cash"] += t.totalAmount;
        }
        totals.Total += t.totalAmount;
      });

      setStats(totals);
    } catch (err) {
      console.error("Failed to load today's collections", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStats();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow border p-5">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Today's Cash Counter</h2>
          <p className="text-gray-500 text-sm mt-1">
            Summary of fees received today, categorized by payment mode.
          </p>
        </div>
        <div className="text-sm font-semibold bg-green-50 text-green-700 px-3 py-1 rounded-lg">
          Date: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading counter summaries...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-green-200 rounded-xl p-5 bg-green-50/30 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Cash Drawer</p>
              <h2 className="text-3xl font-black mt-2 text-green-700">₹{stats.Cash.toLocaleString()}</h2>
            </div>
            <div className="p-3 bg-green-100 text-green-700 rounded-lg">
              <FiDollarSign size={24} />
            </div>
          </div>

          <div className="border border-blue-200 rounded-xl p-5 bg-blue-50/30 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">UPI & QR Pay</p>
              <h2 className="text-3xl font-black mt-2 text-blue-700">₹{stats.UPI.toLocaleString()}</h2>
            </div>
            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
              <FiSmartphone size={24} />
            </div>
          </div>

          <div className="border border-yellow-200 rounded-xl p-5 bg-yellow-50/30 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Cheques Drawer</p>
              <h2 className="text-3xl font-black mt-2 text-yellow-700">₹{stats.Cheque.toLocaleString()}</h2>
            </div>
            <div className="p-3 bg-yellow-100 text-yellow-700 rounded-lg">
              <FiInbox size={24} />
            </div>
          </div>

          <div className="md:col-span-3 border rounded-xl overflow-hidden mt-4">
            <div className="p-4 bg-gray-50 font-bold text-gray-700 border-b">Detailed Breakdown</div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-sm py-1 border-b">
                <span className="text-gray-600">Cash Collections</span>
                <span className="font-semibold">₹{stats.Cash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b">
                <span className="text-gray-600">UPI Payments</span>
                <span className="font-semibold">₹{stats.UPI.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b">
                <span className="text-gray-600">Cheques Collected</span>
                <span className="font-semibold">₹{stats.Cheque.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b">
                <span className="text-gray-600">Bank Transfers (NEFT/IMPS)</span>
                <span className="font-semibold">₹{stats["Bank Transfer"].toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b">
                <span className="text-gray-600">Online Gateways</span>
                <span className="font-semibold">₹{stats["Online Gateway"].toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base py-2 font-black text-gray-900 border-t">
                <span>Total Collected Today</span>
                <span className="text-green-700">₹{stats.Total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}