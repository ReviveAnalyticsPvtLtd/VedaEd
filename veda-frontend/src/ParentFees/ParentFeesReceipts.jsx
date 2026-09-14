import useParentFeeData from "./useParentFeeData";
import axios from "axios";
import config from "../config";

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

export default function ParentFeeReceipts() {
  const { timeline, child, loading, error } = useParentFeeData();

  const previewReceipt = (receipt) => {
    alert(
      `Receipt ID: ${receipt.id}\n\nStudent: ${child?.name || "—"}\nAmount: ${formatCurrency(receipt.totalAmount)}\nMode: ${receipt.paymentMethod || "—"}\nDate: ${formatDate(receipt.date)}\nStatus: Paid`
    );
  };

  const downloadReceipt = async (receipt) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${config.API_BASE_URL}/fees/collect/receipt/${receipt.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${res.data.receiptNo || receipt.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Could not download receipt.");
    }
  };

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
        <h2 className="text-2xl font-bold mb-2">Payment Receipts</h2>
        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-0 min-h-screen">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Payment Receipts</h2>
      </div>

      <div className="flex gap-3 text-sm mb-3 text-gray-600 border-b">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">Overview</button>
      </div>

      <div className="bg-white border rounded-lg" />

      {timeline.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          No receipts available yet.
        </div>
      ) : (
        timeline.map((receipt) => (
          <div key={receipt.id} className="bg-white rounded-xl shadow p-5 mb-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{child?.name || "Student"}</h3>
                <p className="text-gray-500">
                  {child?.grade || child?.class || ""}
                  {child?.section ? ` (${child.section})` : ""}
                </p>
                <p className="text-sm mt-2">Receipt ID: {receipt.id}</p>
                <p className="text-sm">Date: {formatDate(receipt.date)}</p>
                <p className="text-sm">Payment Mode: {receipt.paymentMethod || "—"}</p>
              </div>

              <div className="text-right">
                <h3 className="text-xl font-bold text-green-600">{formatCurrency(receipt.totalAmount)}</h3>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">Paid</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => previewReceipt(receipt)}
                className="border px-5 py-2 rounded hover:bg-gray-100"
              >
                Preview
              </button>
              <button
                onClick={() => downloadReceipt(receipt)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
              >
                Download
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
