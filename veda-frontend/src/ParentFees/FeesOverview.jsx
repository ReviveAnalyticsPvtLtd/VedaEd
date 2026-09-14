import { useNavigate } from "react-router-dom";
import {
  FiCreditCard,
  FiFileText,
  FiDownload,
  FiAlertCircle,
  FiBell,
} from "react-icons/fi";
import useParentFeeData from "./useParentFeeData";

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
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function FeesOverview() {
  const navigate = useNavigate();
  const { academicYear, summary, dues, fees, timeline, loading, error, child } =
    useParentFeeData();

  if (loading) {
    return (
      <div className="p-0 min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-200 border-t-blue-500 rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-0 min-h-screen">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Fees Dashboard</h1>
        <div className="bg-white border rounded-xl p-8 text-center text-gray-500">{error}</div>
      </div>
    );
  }

  const outstandingFees = dues.map((d) => ({
    title: d.title,
    desc: d.dueDate ? `Due on ${formatDate(d.dueDate)}` : "Due date not set",
    amount: formatCurrency(d.balance),
  }));

  return (
    <div className="p-0 min-h-screen">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Fees Dashboard</h1>
        <p className="text-sm text-gray-500 mb-3">
          {child ? `${child.name} — ` : ""}Overview of fees, payments & dues
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {[
          { label: "Academic Year", value: academicYear || "—", color: "bg-blue-100 text-blue-700" },
          { label: "Total Payable", value: formatCurrency(summary.totalPayable), color: "bg-blue-100 text-blue-700" },
          { label: "Total Paid", value: formatCurrency(summary.totalPaid), color: "bg-green-100 text-green-700" },
          { label: "Outstanding", value: formatCurrency(summary.totalPending), color: "bg-red-100 text-red-700" },
        ].map((item, i) => (
          <div key={i} className="bg-white border rounded-xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${item.color}`}>₹</div>
            <div>
              <div className="text-lg font-semibold text-gray-800">{item.value}</div>
              <div className="text-sm text-gray-500">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <div className="lg:col-span-2 bg-white border rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Outstanding Fees</h2>
          {outstandingFees.length === 0 ? (
            <p className="text-green-600 text-sm py-4 text-center">All fees are settled.</p>
          ) : (
            <div className="space-y-3">
              {outstandingFees.map((fee, i) => (
                <div key={i} className="flex justify-between items-center border rounded-lg p-3">
                  <div>
                    <div className="text-sm font-medium">{fee.title}</div>
                    <div className="text-xs text-gray-500">{fee.desc}</div>
                  </div>
                  <div className="text-sm font-semibold text-red-600">{fee.amount}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/parent/fees/pay")}
              className="w-full flex items-center justify-center gap-2 border rounded-md px-3 py-2 text-sm hover:bg-gray-50"
            >
              <FiCreditCard /> Pay Fees
            </button>
            <button
              onClick={() => navigate("/parent/fees/history")}
              className="w-full flex items-center justify-center gap-2 border rounded-md px-3 py-2 text-sm hover:bg-gray-50"
            >
              <FiFileText /> Fee Statement
            </button>
            <button
              onClick={() => navigate("/parent/fees/receipts")}
              className="w-full flex items-center justify-center gap-2 border rounded-md px-3 py-2 text-sm hover:bg-gray-50"
            >
              <FiDownload /> Download Receipt
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Alerts</h2>
          {summary.totalPending > 0 ? (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50">
              <FiAlertCircle className="text-red-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-red-700">Payment Pending</div>
                <div className="text-xs text-red-600">
                  You have {formatCurrency(summary.totalPending)} outstanding fees
                </div>
              </div>
            </div>
          ) : (
            <p className="text-green-600 text-sm py-2">No pending payments.</p>
          )}
        </div>

        <div className="bg-white border rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Recent Payments</h2>
          {timeline.length === 0 ? (
            <p className="text-gray-500 text-sm py-2">No payments recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {timeline.slice(0, 3).map((t) => (
                <div key={t.id} className="border rounded-lg p-3 text-sm">
                  <div className="font-medium text-gray-700">{t.remark || "Fee Payment"}</div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(t.totalAmount)} — {formatDate(t.date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
