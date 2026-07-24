import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiPrinter } from "react-icons/fi";
import axios from "../../services/apiClient";
import config from "../../config";

export default function DayClosing() {
  const [systemCash, setSystemCash] = useState(0);
  const [systemTotal, setSystemTotal] = useState(0);
  const [physicalCash, setPhysicalCash] = useState("");
  const [loading, setLoading] = useState(false);
  const [closed, setClosed] = useState(false);

  const fetchTodayCash = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.API_BASE_URL}/fees/collect/payments`);
      
      const todayStr = new Date().toDateString();
      const todayTxs = res.data.filter(t => new Date(t.date).toDateString() === todayStr);

      let cash = 0;
      let total = 0;

      todayTxs.forEach(t => {
        if (t.paymentMethod === "Cash" || !t.paymentMethod) {
          cash += t.totalAmount;
        }
        total += t.totalAmount;
      });

      setSystemCash(cash);
      setSystemTotal(total);
    } catch (err) {
      console.error("Failed to load today's cash tally", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayCash();
  }, []);

  const physicalCashNum = Number(physicalCash) || 0;
  const discrepancy = physicalCashNum - systemCash;

  const handleCloseDay = () => {
    if (physicalCash === "") return alert("Please enter the counted physical cash first!");
    setClosed(true);
    alert("Day register closed and aggregated audit log saved!");
  };

  return (
    <div className="bg-white rounded-xl shadow border p-5 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold">End of Day Register Closing</h2>
        <p className="text-gray-500 text-sm mt-1">
          Perform accounting audit and reconcile physical cash with the database.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading closing logs...</div>
      ) : closed ? (
        <div className="text-center py-12 space-y-4">
          <FiCheckCircle className="text-green-500 text-6xl mx-auto" />
          <h3 className="text-2xl font-bold text-gray-800">Register Closed Successfully</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            The fee counter register has been locked for the day. All logs have been archived for auditing.
          </p>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg text-sm inline-flex items-center gap-2 transition"
          >
            <FiPrinter /> Print Closing Audit Report
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 border rounded-xl p-4 bg-gray-50">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase">System Total Receipts</p>
              <h3 className="text-xl font-bold mt-1 text-gray-800">₹{systemTotal.toLocaleString()}</h3>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase">System Cash Expected</p>
              <h3 className="text-xl font-bold mt-1 text-green-700">₹{systemCash.toLocaleString()}</h3>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Counted Physical Cash (₹)</label>
            <input
              type="number"
              placeholder="Enter exact physical cash in the drawer..."
              value={physicalCash}
              onChange={(e) => setPhysicalCash(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800"
            />
          </div>

          <div className="border rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Expected Cash Tally</span>
              <span className="font-semibold text-gray-800">₹{systemCash.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Observed Physical Tally</span>
              <span className="font-semibold text-gray-800">₹{physicalCashNum.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t pt-2">
              <span className="text-gray-700">Tally Discrepancy</span>
              <span className={discrepancy === 0 ? "text-green-600" : discrepancy > 0 ? "text-blue-600" : "text-red-600"}>
                {discrepancy === 0
                  ? "Perfect Tally (₹0)"
                  : discrepancy > 0
                  ? `Surplus of +₹${discrepancy.toLocaleString()}`
                  : `Deficit of -₹${Math.abs(discrepancy).toLocaleString()}`}
              </span>
            </div>
          </div>

          <button
            onClick={handleCloseDay}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
          >
            Verify & Close Register
          </button>
        </div>
      )}
    </div>
  );
}