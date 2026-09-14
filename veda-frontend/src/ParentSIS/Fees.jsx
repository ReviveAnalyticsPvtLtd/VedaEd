import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import config from "../config";
import HelpInfo from "../components/HelpInfo";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiCalendar,
  FiDownload,
  FiCreditCard,
} from "react-icons/fi";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const statusStyles = {
  Paid: {
    label: "Paid",
    className: "text-green-600 bg-green-100",
    icon: <FiCheckCircle className="w-4 h-4" />,
  },
  Pending: {
    label: "Pending",
    className: "text-yellow-600 bg-yellow-100",
    icon: <FiAlertTriangle className="w-4 h-4" />,
  },
  Upcoming: {
    label: "Upcoming",
    className: "text-blue-600 bg-blue-100",
    icon: <FiCalendar className="w-4 h-4" />,
  },
};

export default function ParentFees() {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [feeProfile, setFeeProfile] = useState(null);
  const [academicYear, setAcademicYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");
    if (!user || !user.refId || !token) {
      setError("You need to be logged in to view fees.");
      setLoading(false);
      return;
    }
    const authHeaders = { Authorization: `Bearer ${token}` };

    const loadParent = async () => {
      try {
        const res = await axios.get(`${config.API_BASE_URL}/parents/${user.refId}`, {
          headers: authHeaders,
        });
        const kids = res.data && res.data.parent ? res.data.parent.children : [];
        if (!active) return;
        setChildren(kids);
        if (kids.length > 0) {
          setSelectedChildId(kids[0]._id);
        }
      } catch (err) {
        console.error("Error fetching parent info:", err);
      }
    };

    const loadAcademicYear = async () => {
      try {
        const res = await axios.get(`${config.API_BASE_URL}/academic-years/`, {
          headers: authHeaders,
        });
        const years = Array.isArray(res.data) ? res.data : [];
        const current = years.find((y) => y.isActive) || years[0];
        if (active && current && current.label) {
          setAcademicYear(current.label);
        }
      } catch (err) {
        console.error("Error fetching academic year:", err);
      }
    };

    loadParent();
    loadAcademicYear();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedChildId) return;
    let active = true;

    const loadFeeProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        const authHeaders = { Authorization: `Bearer ${token}` };
        const params = {};
        if (academicYear) params.year = academicYear;

        const res = await axios.get(
          `${config.API_BASE_URL}/fees/collect/student/${selectedChildId}`,
          { headers: authHeaders, params }
        );
        if (active) setFeeProfile(res.data);
      } catch (err) {
        console.error("Error loading fee profile:", err);
        if (active) {
          const msg = err.response && err.response.data && err.response.data.message;
          if (msg === "No active academic year found") {
            setError("Fee records for the current academic year are not set up yet.");
          } else {
            setError(msg || "Could not load fee data. Please try again.");
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadFeeProfile();
    return () => {
      active = false;
    };
  }, [selectedChildId, academicYear]);

  const data = useMemo(() => {
    if (!feeProfile) return null;
    const fees = feeProfile.feesData || [];
    const installments = feeProfile.installments || [];
    const timeline = feeProfile.timeline || [];

    return {
      student: feeProfile.student,
      totalPayable: fees.reduce((sum, f) => sum + Number(f.amount || 0), 0),
      totalPaid: fees.reduce((sum, f) => sum + Number(f.paid || 0), 0),
      totalPending: fees.reduce((sum, f) => sum + Number(f.balance || 0), 0),
      lastPaymentDate: timeline.length
        ? timeline.map((t) => t.date).sort().pop()
        : null,
      fees,
      installments,
      timeline,
    };
  }, [feeProfile]);

  const dues = useMemo(() => {
    if (!data) return [];

    const unpaidInstallments = data.installments.filter(
      (i) => Number(i.balance || 0) > 0
    );

    if (unpaidInstallments.length > 0) {
      const today = new Date();
      return unpaidInstallments.map((i) => ({
        id: `${i.category}-${i.installmentName}`,
        title:
          i.installmentName && i.installmentName !== "Full Payment"
            ? `${i.category} (${i.installmentName})`
            : i.category,
        dueDate: i.dueDate,
        amount: Number(i.payable !== undefined ? i.payable : i.amount) || 0,
        status: new Date(i.dueDate) < today ? "Pending" : "Upcoming",
      }));
    }

    return data.fees
      .filter((f) => Number(f.balance || 0) > 0)
      .map((f) => ({
        id: f.category,
        title: f.category,
        dueDate: "—",
        amount: Number(f.amount || 0),
        status: "Pending",
      }));
  }, [data]);

  const handleDownload = async (txnId) => {
    if (!txnId) {
      alert("No receipt available yet.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const authHeaders = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${config.API_BASE_URL}/fees/collect/receipt/${txnId}`, {
        headers: authHeaders,
      });
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${res.data.receiptNo || txnId}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading receipt:", err);
      alert("Could not download receipt. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="p-0 m-0 min-h-screen">
        <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
          <span>Fees</span>
          <span>&gt;</span>
        </div>
        <div className="bg-white p-10 rounded-lg shadow-sm border flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-200 border-t-blue-500 rounded-full mx-auto mb-4" />
            <p className="text-gray-600 text-sm">
              Loading child's fee summary...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-0 m-0 min-h-screen">
        <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
          <span>Fees</span>
          <span>&gt;</span>
        </div>
        <div className="bg-white p-10 rounded-lg shadow-sm border text-center text-gray-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <span>Fees</span>
        <span>&gt;</span>
      </div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          Child Fees View
          {data && data.student && data.student.name
            ? ` - ${data.student.name}`
            : ""}
        </h2>
        <div className="flex gap-2 items-center">
          {children.length > 1 && (
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="border px-3 py-1 rounded bg-blue-50 text-blue-700 font-medium"
            >
              {children.map((child) => (
                <option key={child._id} value={child._id}>
                  {child.name}
                </option>
              ))}
            </select>
          )}
          <HelpInfo
            title="Child Fees View Help"
            description={`4.1 Fees Overview

This top section shows the complete summary of the child's fee status for the academic year.

Includes:
• Academic Year – Displays the current academic session  
• Last Payment Date – Shows the most recent payment  
• Total Payable – Total assigned fee for the year  
• Total Paid – Amount paid till date  
• Pending Amount – Remaining balance

4.2 Pending & Upcoming Fees

This section lists all pending and upcoming fee items with due dates and current status.

Includes:
• Fee Item – Name of the fee (e.g., Tuition Fee, Laboratory Fee)  
• Due Date – Deadline for payment  
• Amount – Fee amount  
• Status Tags – Pending or Upcoming indicator

4.3 Payment History

This section displays the complete history of all paid fees.

Includes:
• Fee Item – The specific payment category  
• Amount – Paid amount  
• Due Date – Original due date for the fee  
• Status – Paid or Pending  
• Paid On – Actual payment date  
• Mode – Payment method (e.g., Cash, UPI)  
• Receipt – Downloadable payment receipt
`}
            steps={[
              "Review fee summary to understand total, paid, and pending amounts.",
              "Check upcoming and pending fees to avoid late payments.",
              "View complete payment history for tracking past payments.",
              "Download receipts whenever required.",
            ]}
          />
        </div>
      </div>

      <div className="bg-white p-3 mb-3 rounded-lg shadow-sm border">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <p className="font-medium text-gray-500 mb-1">Academic Year</p>
            <p className="font-semibold text-gray-800">{academicYear || "—"}</p>
            <p className="text-gray-400 mt-2">
              Last payment on{" "}
              {data ? formatDate(data.lastPaymentDate) : "—"}
            </p>
          </div>
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
            <p className="text-blue-700 font-medium mb-1">Total Payable</p>
            <p className="font-bold text-blue-900">
              {formatCurrency(data ? data.totalPayable : 0)}
            </p>
          </div>
          <div className="bg-green-50 p-5 rounded-xl border border-green-100">
            <p className="text-green-700 font-medium mb-1">Total Paid</p>
            <p className="font-bold text-green-900">
              {formatCurrency(data ? data.totalPaid : 0)}
            </p>
          </div>
          <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100">
            <p className="text-yellow-700 font-medium mb-1">Pending Amount</p>
            <p className="font-bold text-yellow-900">
              {formatCurrency(data ? data.totalPending : 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Section */}
      <div className="bg-white p-3 mb-3 rounded-lg shadow-sm border">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FiAlertTriangle /> Pending & Upcoming Fees
          </h3>
          {dues.length === 0 ? (
            <div className="border border-dashed border-green-200 rounded-lg p-6 text-center text-green-700">
              All fees are settled. 🎉
            </div>
          ) : (
            <div className="space-y-3">
              {dues.map((txn) => {
                const style = statusStyles[txn.status];
                return (
                  <div
                    key={txn.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div>
                      <p className="text-base font-medium text-gray-800">
                        {txn.title}
                      </p>
                      <p className="text-gray-500 flex items-center gap-2">
                        <FiCalendar /> Due {formatDate(txn.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-800">
                        {formatCurrency(txn.amount)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${style.className}`}
                      >
                        {style.icon}
                        {style.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white p-3 gap-3 rounded-lg shadow-sm border">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FiCreditCard /> Payment History
          </h3>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-3 font-medium">Fee Item</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Paid On</th>
                  <th className="px-4 py-3 font-medium">Mode</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data && data.timeline.length > 0 ? (
                  data.timeline.map((txn) => {
                    const style = statusStyles.Paid;
                    return (
                      <tr key={txn.id} className="text-gray-700">
                        <td className="px-4 py-3">{txn.remark || "Fee Payment"}</td>
                        <td className="px-4 py-3 font-medium">
                          {formatCurrency(txn.totalAmount)}
                        </td>
                        <td className="px-4 py-3">{formatDate(txn.date)}</td>
                        <td className="px-4 py-3">{txn.paymentMethod || "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium mr-3 ${style.className}`}
                          >
                            {style.icon}
                            {style.label}
                          </span>
                          <button
                            onClick={() => handleDownload(txn.id)}
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <FiDownload />
                            Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      No payments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}