import { useState } from "react";
import { FiSearch, FiEye, FiDownload } from "react-icons/fi";
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

export default function PaymentHistory() {
  const { timeline, child, loading, error } = useParentFeeData();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const perPage = 5;

  const filtered = timeline.filter((t) => {
    const matchSearch =
      !search ||
      (t.remark || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.id || "").toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const current = filtered.slice((page - 1) * perPage, page * perPage);

  const downloadReceipt = async (txn) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${config.API_BASE_URL}/fees/collect/receipt/${txn.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${res.data.receiptNo || txn.id}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
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
        <h2 className="text-2xl font-bold mb-2">Payment History</h2>
        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-0 min-h-screen">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Payment History</h2>
      </div>

      <div className="flex gap-3 text-sm mb-3 text-gray-600 border-b">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">Overview</button>
      </div>

      <div className="bg-white border rounded-lg">
        <div className="p-4 flex gap-3 items-center">
          <div className="flex items-center border px-3 py-2 rounded-md w-[320px]">
            <FiSearch className="text-gray-400 mr-2" />
            <input
              placeholder="Search by remark or transaction ID"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="outline-none w-full text-sm"
            />
          </div>
        </div>

        <div className="px-4 pb-4">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">S. no.</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Description</th>
                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Mode</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {current.map((t, i) => (
                <tr key={t.id || i} className="text-center hover:bg-gray-50">
                  <td className="p-2 border">{(page - 1) * perPage + i + 1}</td>
                  <td className="p-2 border">{formatDate(t.date)}</td>
                  <td className="p-2 border">{t.remark || "Fee Payment"}</td>
                  <td className="p-2 border">{formatCurrency(t.totalAmount)}</td>
                  <td className="p-2 border">{t.paymentMethod || "—"}</td>
                  <td className="p-2 border">
                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">Paid</span>
                  </td>
                  <td className="p-2 border">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setSelected(t)} className="text-blue-600"><FiEye /></button>
                      <button onClick={() => downloadReceipt(t)} className="text-green-600"><FiDownload /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {current.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-gray-500 text-center">No payment records found.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-center mt-3 text-sm text-gray-500">
            <p>Page {page} of {totalPages || 1}</p>
            <div className="space-x-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-md w-96">
            <h3 className="font-semibold mb-3">Transaction Details</h3>
            <p><b>Date:</b> {formatDate(selected.date)}</p>
            <p><b>Description:</b> {selected.remark || "Fee Payment"}</p>
            <p><b>Amount:</b> {formatCurrency(selected.totalAmount)}</p>
            <p><b>Mode:</b> {selected.paymentMethod || "—"}</p>
            <p><b>Transaction ID:</b> {selected.id}</p>
            <p><b>Status:</b> Paid</p>

            <div className="mt-4 border-t pt-2 text-xs text-gray-500">
              <p>✔ Initiated</p>
              <p>✔ Processing</p>
              <p>✔ Completed</p>
            </div>

            <button onClick={() => setSelected(null)} className="mt-4 w-full border py-2 rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
