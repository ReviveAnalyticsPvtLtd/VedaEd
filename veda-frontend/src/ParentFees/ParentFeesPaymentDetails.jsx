import { useParams, useNavigate } from "react-router-dom";
import useParentFeeData from "./useParentFeeData";
import { useEffect, useState } from "react";
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

export default function ParentFeesPaymentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { child, timeline, loading: hookLoading } = useParentFeeData();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let active = true;
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${config.API_BASE_URL}/fees/collect/receipt/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (active) setReceipt(res.data);
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Could not load receipt details.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id]);

  const txn = timeline.find((t) => t.id === id) || receipt;

  if (loading || hookLoading) {
    return (
      <div className="p-0 min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-200 border-t-blue-500 rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-0 min-h-screen">
        <h2 className="text-2xl font-bold mb-2">Payment Details</h2>
        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">{error}</div>
      </div>
    );
  }

  if (!txn) {
    return (
      <div className="p-0 min-h-screen">
        <h2 className="text-2xl font-bold mb-2">Payment Details</h2>
        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
          Transaction not found.
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 min-h-screen">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Payment Details</h2>
      </div>

      <div className="flex gap-3 text-sm mb-3 text-gray-600 border-b">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">Overview</button>
      </div>

      <div className="bg-white rounded-xl shadow p-5 mb-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-semibold">{child?.name || "Student"}</h3>
            <p className="text-gray-500">
              {child?.grade || child?.class || ""}
              {child?.section ? ` (${child.section})` : ""}
            </p>
          </div>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Paid</span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between border-b py-2">
            <span className="text-gray-500">Transaction ID</span>
            <span className="font-medium">{txn.id || txn.receiptNo || id}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-gray-500">Description</span>
            <span>{txn.remark || "Fee Payment"}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-gray-500">Amount</span>
            <span className="font-semibold">{formatCurrency(txn.totalAmount || txn.amount || 0)}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-gray-500">Payment Mode</span>
            <span>{txn.paymentMethod || "—"}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-gray-500">Date</span>
            <span>{formatDate(txn.date)}</span>
          </div>
          {receipt?.receiptNo && (
            <div className="flex justify-between border-b py-2">
              <span className="text-gray-500">Receipt No</span>
              <span>{receipt.receiptNo}</span>
            </div>
          )}
        </div>

        <div className="mt-4 border-t pt-3 text-xs text-gray-500 space-y-1">
          <p>✔ Initiated</p>
          <p>✔ Processing</p>
          <p>✔ Completed</p>
        </div>
      </div>

      <button
        onClick={() => navigate("/parent/fees/history")}
        className="w-full border py-2 rounded hover:bg-gray-50"
      >
        Back to Payment History
      </button>
    </div>
  );
}
