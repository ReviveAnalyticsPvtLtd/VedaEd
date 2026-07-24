import React, { useState, useEffect } from "react";
import { FiArrowLeft, FiMoreVertical } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../services/apiClient";
import config from "../../config";

export default function FeeAccount() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [student, setStudent] = useState(null);
  const [feesData, setFeesData] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.API_BASE_URL}/fees/collect/student/${id}`);
      setStudent(res.data.student);
      setFeesData(res.data.feesData || []);

      // Fetch payment transactions for this student
      const tRes = await axios.get(`${config.API_BASE_URL}/fees/collect/payments?search=${res.data.student.admission}`);
      setPayments(tRes.data || []);
    } catch (err) {
      console.error("Failed to load student fee profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <span className="text-gray-500">Loading student billing profile...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-600 font-semibold mb-5">
          <FiArrowLeft /> Back
        </button>
        <div className="bg-white rounded-xl shadow border p-12 text-center text-red-600 font-bold">
          Student profile not found.
        </div>
      </div>
    );
  }

  const totalFee = feesData.reduce((s, f) => s + f.amount, 0);
  const paid = feesData.reduce((s, f) => s + f.paid, 0);
  const pending = feesData.reduce((s, f) => s + f.balance, 0);
  const percentCollected = totalFee > 0 ? Math.round((paid / totalFee) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-blue-600 font-semibold mb-5 hover:underline"
      >
        <FiArrowLeft /> Back to Collection
      </button>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        {/* Header */}
        <div className="border-b p-5 bg-gray-50 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-800">Student Fee Account</h1>
            <p className="text-gray-500 mt-1 text-xs uppercase font-semibold tracking-wider">
              Session: 2025-26
            </p>
          </div>
        </div>

        {/* Student details header */}
        <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b">
          <div className="flex gap-4 items-center">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
              {student.name ? student.name[0].toUpperCase() : "S"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{student.name}</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                Class: {student.class} ({student.section || "N/A"}) • Admission No: {student.admission}
              </p>
            </div>
          </div>

          <div className="flex gap-6 w-full md:w-auto text-sm">
            <div className="border rounded-xl px-4 py-2.5 bg-gray-50">
              <p className="text-gray-500 text-xs">Total Fee</p>
              <h3 className="font-bold text-base mt-0.5">₹{totalFee.toLocaleString()}</h3>
            </div>
            <div className="border rounded-xl px-4 py-2.5 bg-green-50 text-green-800">
              <p className="text-green-600 text-xs">Total Paid</p>
              <h3 className="font-bold text-base mt-0.5">₹{paid.toLocaleString()}</h3>
            </div>
            <div className="border rounded-xl px-4 py-2.5 bg-red-50 text-red-800">
              <p className="text-red-600 text-xs">Balance Pending</p>
              <h3 className="font-bold text-base mt-0.5">₹{pending.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 px-6 border-b text-sm font-medium">
          {[
            ["overview", "Overview"],
            ["schedule", "Installment Schedule"],
            ["payments", "Payment Transactions"],
            ["activity", "Activity Log"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-3 pt-4 transition ${
                activeTab === key
                  ? "border-b-2 border-blue-600 text-blue-600 font-bold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fee Schedule overview list */}
              <div className="md:col-span-2 space-y-4">
                <h2 className="text-lg font-bold text-gray-800 mb-2">Schedule Overview</h2>
                {feesData.map((fee, idx) => (
                  <div key={idx} className="border rounded-xl p-4 flex justify-between items-center hover:bg-gray-50 transition">
                    <div>
                      <h3 className="font-semibold text-gray-800">{fee.category}</h3>
                      <p className="text-gray-500 text-xs mt-1">Due Date: 10th Monthly</p>
                    </div>
                    <div className="text-right">
                      <h3 className="font-bold text-gray-800">₹{fee.amount.toLocaleString()}</h3>
                      <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        fee.status === "Paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {fee.status === "Paid" ? "Paid" : `₹${fee.balance.toLocaleString()} Pending`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress and percentage card */}
              <div className="border rounded-xl p-6 h-fit bg-gray-50/50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-700">Tally Progress</h3>
                  <span className="font-bold text-blue-600 text-lg">{percentCollected}%</span>
                </div>
                <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${percentCollected}%` }}></div>
                </div>
                <div className="mt-6 space-y-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Expected Billing:</span>
                    <span className="font-bold text-gray-800">₹{totalFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600 font-medium">Collected:</span>
                    <span className="font-bold text-green-700">₹{paid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-500 font-medium">Pending:</span>
                    <span className="font-bold text-red-600">₹{pending.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Fee Installment Breakdown</h2>
              <table className="w-full text-sm border rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-left border-b font-semibold">
                    <th className="p-3">Fee Head</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Expected Amount</th>
                    <th className="p-3 text-right">Paid Amount</th>
                    <th className="p-3 text-right">Pending Balance</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {feesData.map((f, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50 transition">
                      <td className="p-3 font-semibold text-gray-800">{f.category}</td>
                      <td className="p-3 text-gray-500">10th Monthly</td>
                      <td className="p-3 text-right">₹{f.amount.toLocaleString()}</td>
                      <td className="p-3 text-right text-green-600 font-medium">₹{f.paid.toLocaleString()}</td>
                      <td className="p-3 text-right text-red-600 font-medium">₹{f.balance.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          f.status === "Paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Transaction History</h2>
              {payments.length === 0 ? (
                <p className="text-center text-gray-400 py-6">No payment transactions recorded for this student.</p>
              ) : (
                <table className="w-full text-sm border rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 text-left border-b font-semibold">
                      <th className="p-3">Receipt No</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Remark</th>
                      <th className="p-3 text-right">Amount Collected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((t) => (
                      <tr key={t._id} className="border-b hover:bg-gray-50 transition">
                        <td className="p-3 font-mono text-xs text-gray-600">
                          REC-{t._id.substring(t._id.length - 8).toUpperCase()}
                        </td>
                        <td className="p-3 text-gray-500">
                          {new Date(t.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="p-3">{t.paymentMethod}</td>
                        <td className="p-3 text-gray-400 max-w-[200px] truncate" title={t.remark}>{t.remark || "N/A"}</td>
                        <td className="p-3 text-right font-bold text-green-600">₹{t.totalAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Billing Log</h2>
              <div className="space-y-4">
                {payments.map((t, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 py-1">
                    <h3 className="font-semibold text-gray-800">
                      Payment of ₹{t.totalAmount.toLocaleString()} received via {t.paymentMethod}
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(t.date).toLocaleString()} • Logged by Admin
                    </p>
                    {t.remark && <p className="text-gray-400 text-xs mt-1">Remark: {t.remark}</p>}
                  </div>
                ))}
                <div className="border-l-4 border-green-500 pl-4 py-1">
                  <h3 className="font-semibold text-gray-800">Academic Year Billing Structure Created</h3>
                  <p className="text-gray-500 text-xs mt-1">01 Apr 2025 • Grade standard configuration</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}