import { useState } from "react";
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

export default function PayFees() {
  const {
    child,
    fees,
    installments,
    academicYear,
    summary,
    loading,
    error,
  } = useParentFeeData();

  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const pendingDues = installments.filter((i) => Number(i.balance || 0) > 0);

  const toggleItem = (item) => {
    setSelectedItems((prev) => {
      const exists = prev.find((p) => p.category === item.category && p.installmentName === item.installmentName);
      if (exists) return prev.filter((p) => !(p.category === item.category && p.installmentName === item.installmentName));
      return [...prev, { category: item.category, installmentName: item.installmentName, amount: item.balance }];
    });
  };

  const selectAll = () => {
    if (selectedItems.length === pendingDues.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(pendingDues.map((d) => ({ category: d.category, installmentName: d.installmentName, amount: d.balance })));
    }
  };

  const totalSelected = selectedItems.reduce((s, i) => s + i.amount, 0);

  const handlePay = async () => {
    if (!child || !academicYear || totalSelected <= 0) return;
    setPaying(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${config.API_BASE_URL}/fees/collect/payment`,
        {
          studentId: child._id || child.id,
          year: academicYear,
          fees: selectedItems.map((i) => ({ category: i.category, amount: i.amount })),
          totalAmount: totalSelected,
          paymentMethod: paymentMode,
          remark: "Parent fee payment",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReceipt(res.data);
      setStep(4);
    } catch (err) {
      alert(err.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-200 border-t-blue-500 rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <h2 className="text-2xl font-bold mb-2">Pay Fees</h2>
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Pay Fees</h2>
      </div>

      <div className="flex gap-3 text-sm mb-3 text-gray-600 border-b">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">Overview</button>
      </div>

      {/* STEP INDICATOR */}
      <div className="flex gap-8 text-sm mb-4">
        {["Select Dues", "Payment", "Receipt"].map((label, i) => (
          <div
            key={label}
            className={`flex items-center gap-2 ${step === i + 1 ? "text-green-600 font-medium" : "text-gray-400"}`}
          >
            <span className={`h-3 w-3 rounded-full border ${step >= i + 1 ? "bg-green-500 border-green-500" : ""}`} />
            {label}
          </div>
        ))}
      </div>

      {/* STEP 1: Select Dues */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Select Dues to Pay</h3>
            {pendingDues.length > 0 && (
              <button onClick={selectAll} className="text-sm text-blue-600 underline">
                {selectedItems.length === pendingDues.length ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>

          {child && (
            <p className="text-sm text-gray-500 mb-4">
              {child.name} — {child.grade || child.class || ""} {child.section ? `(${child.section})` : ""}
            </p>
          )}

          {pendingDues.length === 0 ? (
            <div className="text-center py-8 text-green-600 font-medium">All fees are settled.</div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {pendingDues.map((item) => {
                  const selected = selectedItems.some(
                    (p) => p.category === item.category && p.installmentName === item.installmentName
                  );
                  return (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-4 cursor-pointer transition ${selected ? "border-blue-500 bg-blue-50" : "hover:shadow-md"}`}
                      onClick={() => toggleItem(item)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-gray-500">
                            {item.dueDate ? `Due: ${formatDate(item.dueDate)}` : "No due date set"}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{formatCurrency(item.balance)}</span>
                          {selected && <span className="text-green-600 text-xl">✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center border-t pt-3 font-bold text-lg">
                <span>Total Selected</span>
                <span>{formatCurrency(totalSelected)}</span>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  disabled={selectedItems.length === 0}
                  onClick={() => setStep(2)}
                  className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 2: Payment Method */}
      {step === 2 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-4">Payment Method</h3>

          <div className="grid grid-cols-3 gap-4 mb-4">
            {["UPI", "Credit Card", "Debit Card"].map((mode) => (
              <button
                key={mode}
                onClick={() => setPaymentMode(mode)}
                className={`border rounded p-3 text-sm ${paymentMode === mode ? "border-green-500 bg-green-50 font-medium" : ""}`}
              >
                {mode}
              </button>
            ))}
          </div>

          {paymentMode === "UPI" && (
            <input
              className="w-full border rounded px-3 py-2 mb-3"
              placeholder="UPI ID (example@bank)"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />
          )}

          {(paymentMode === "Credit Card" || paymentMode === "Debit Card") && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input className="border px-3 py-2 rounded col-span-2" placeholder="Card Number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
              <input className="border px-3 py-2 rounded col-span-2" placeholder="Name on Card" value={cardName} onChange={(e) => setCardName(e.target.value)} />
              <input className="border px-3 py-2 rounded" placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} />
              <input className="border px-3 py-2 rounded" placeholder="CVV" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} />
            </div>
          )}

          <div className="border-t mt-4 pt-3 mb-4">
            <div className="flex justify-between text-sm">
              <span>Amount to Pay</span>
              <span className="font-semibold">{formatCurrency(totalSelected)}</span>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="border px-5 py-2 rounded">Back</button>
            <button
              disabled={paying}
              onClick={handlePay}
              className="bg-blue-600 text-white px-5 py-2 rounded disabled:opacity-50"
            >
              {paying ? "Processing..." : `Pay ${formatCurrency(totalSelected)}`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Receipt */}
      {step === 4 && receipt && (
        <div className="bg-white rounded-lg shadow p-6 max-w-md text-center">
          <div className="flex justify-center mb-3">
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-1">Payment Successful</h3>
          <p className="text-sm text-gray-500 mb-4">Your payment has been recorded successfully.</p>

          <div className="text-sm text-left space-y-1 mb-4">
            <div><b>Student:</b> {child?.name || "—"}</div>
            <div><b>Amount Paid:</b> {formatCurrency(totalSelected)}</div>
            <div><b>Payment Mode:</b> {paymentMode}</div>
            <div><b>Date:</b> {formatDate(new Date().toISOString())}</div>
            {receipt?.transactionId && <div><b>Transaction ID:</b> {receipt.transactionId}</div>}
          </div>

          <button
            onClick={() => { setStep(1); setSelectedItems([]); setReceipt(null); }}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
