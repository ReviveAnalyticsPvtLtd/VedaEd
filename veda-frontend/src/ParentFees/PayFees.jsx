import { useState } from "react";

const feePlans = [
  {
    id: "monthly",
    label: "Monthly Fees",
    total: 1000,
    breakup: [
      { name: "Tuition Fees", amount: 800 },
      { name: "Exam Fees", amount: 100 },
      { name: "Transport Fees", amount: 100 },
    ],
  },
  {
    id: "quarterly",
    label: "Quarterly Fees",
    total: 3000,
    breakup: [
      { name: "Tuition Fees", amount: 2400 },
      { name: "Exam Fees", amount: 300 },
      { name: "Transport Fees", amount: 300 },
    ],
  },
  {
    id: "half",
    label: "Half-Yearly Fees",
    total: 6000,
    breakup: [
      { name: "Tuition Fees", amount: 4800 },
      { name: "Exam Fees", amount: 600 },
      { name: "Transport Fees", amount: 600 },
    ],
  },
  {
    id: "annual",
    label: "Annual Fees",
    total: 12000,
    breakup: [
      { name: "Tuition Fees", amount: 9600 },
      { name: "Exam Fees", amount: 1200 },
      { name: "Transport Fees", amount: 1200 },
    ],
  },
];

const students = [
  {
    id: 1,
    name: "Aarav Sharma",
    class: "Class 5 - A",
    parent: "Rajesh Sharma",
    phone: "9876543210",
  },
  {
    id: 2,
    name: "Ananya Sharma",
    class: "Class 2 - B",
    parent: "Rajesh Sharma",
    phone: "9876543210",
  },
  {
    id: 3,
    name: "Vivaan Verma",
    class: "Class 7 - C",
    parent: "Rohit Verma",
    phone: "9123456789",
  },
];
export default function PayFees() {
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [paymentMode, setPaymentMode] = useState("UPI");
const [paymentHistory, setPaymentHistory] = useState([]);
const [selectedStudent, setSelectedStudent] = useState(null);
  const student = {
    name: "Aarav Sharma",
    class: "Class 5 - A",
  };

  const downloadReceipt = () => {
    const text = `
PAYMENT RECEIPT

Student Name: ${student.name}
Class: ${student.class}
Fees Period: ${selectedPlan.label}
Amount Paid: ₹${selectedPlan.total}
Payment Mode: ${paymentMode}
Status: SUCCESS
Date: ${new Date().toLocaleString()}
`;
    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Fee_Receipt.txt";
    link.click();
  };
const handleDone = () => {
  const newPayment = {
    studentName: student.name,
    className: student.class,
    feesType: selectedPlan.label,
    amount: selectedPlan.total,
    paymentMode,
    date: new Date().toLocaleString(),
    status: "Success",
  };

  setPaymentHistory((prev) => [newPayment, ...prev]);

  // RESET FLOW
  setSelectedPlan(null);
  setExpanded(null);
  setPaymentMode("UPI");
  setStep(1);
};
  return (
    <div className="min-h-screen">

      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-2">
        Parent &gt; Fees &gt; Pay Fees
      </div>
{/* Title */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Pay Fees</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 text-sm mb-3 text-gray-600 border-b">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
          Overview
        </button>
      </div>
    

      {/* STEP INDICATOR */}
      <div className="flex gap-8 text-sm mb-4">
        {["Select Student", "Select Fees", "Payment", "Receipt"].map((label, i) => (
          <div
            key={label}
            className={`flex items-center gap-2 ${
              step === i + 1 ? "text-green-600 font-medium" : "text-gray-400"
            }`}
          >
            <span
              className={`h-3 w-3 rounded-full border ${
                step >= i + 1 ? "bg-green-500 border-green-500" : ""
              }`}
            />
            {label}
          </div>
        ))}
      </div>

{/* STEP 1 */}
{step === 1 && (
  <div className="bg-white rounded-lg shadow p-4">

    <h3 className="font-medium mb-5">
      Select Student
    </h3>

    <div className="grid md:grid-cols-2 gap-5">

      {students.map((student) => (

        <div
          key={student.id}
          className={`border rounded-xl p-5 cursor-pointer transition ${
            selectedStudent?.id === student.id
              ? "border-blue-600 bg-blue-50"
              : "hover:shadow-md"
          }`}
          onClick={() => setSelectedStudent(student)}
        >

          <div className="flex justify-between">

            <div>

              <h3 className="text-lg font-semibold">
                {student.name}
              </h3>

              <p className="text-gray-500">
                {student.class}
              </p>

              <p className="text-sm mt-2">
                Parent : {student.parent}
              </p>

              <p className="text-sm">
                Mobile : {student.phone}
              </p>

            </div>

            {selectedStudent?.id === student.id && (
              <div className="text-green-600 text-xl">
                ✓
              </div>
            )}

          </div>

        </div>

      ))}

    </div>

    <div className="flex justify-end mt-6">

      <button
        disabled={!selectedStudent}
        onClick={() => setStep(2)}
        className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
      >
        Continue
      </button>

    </div>

  </div>
)}
      {/* STEP 1 */}
      {step === 2 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-4">Select fees plan</h3>

          {feePlans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-lg mb-4 ${
                selectedPlan?.id === plan.id
                  ? "border-blue-500 bg-blue-50"
                  : ""
              }`}
            >
              <div
                className="flex justify-between items-center p-4 cursor-pointer"
                onClick={() => setSelectedPlan(plan)}
              >
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={selectedPlan?.id === plan.id}
                    readOnly
                  />
                  <span className="font-medium">{plan.label}</span>
                </label>

                <div className="text-right">
                  <div className="font-semibold">₹{plan.total}</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded(expanded === plan.id ? null : plan.id);
                    }}
                    className="text-xs text-blue-600 underline"
                  >
                    {expanded === plan.id ? "Hide details" : "View details"}
                  </button>
                </div>
              </div>

              {expanded === plan.id && (
                <div className="px-4 pb-4 text-sm bg-white">
                  {plan.breakup.map((b) => (
                    <div key={b.name} className="flex justify-between py-1">
                      <span className="text-gray-600">{b.name}</span>
                      <span>₹{b.amount}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 font-medium">
                    <span>Total</span>
                    <span>₹{plan.total}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end">
            <button
              disabled={!selectedPlan}
              onClick={() => setStep(2)}
              className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 3 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-4">Payment method</h3>

          <div className="grid grid-cols-3 gap-4 mb-4">
            {["UPI", "Credit Card", "Debit Card"].map((mode) => (
              <button
                key={mode}
                onClick={() => setPaymentMode(mode)}
                className={`border rounded p-3 text-sm ${
                  paymentMode === mode
                    ? "border-green-500 bg-green-50 font-medium"
                    : ""
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {paymentMode === "UPI" && (
            <input
              className="w-full border rounded px-3 py-2 mb-3"
              placeholder="UPI ID (example@bank)"
            />
          )}

          {(paymentMode === "Credit Card" ||
            paymentMode === "Debit Card") && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input className="border px-3 py-2 rounded col-span-2" placeholder="Card Number" />
              <input className="border px-3 py-2 rounded col-span-2" placeholder="Name on Card" />
              <input className="border px-3 py-2 rounded" placeholder="MM/YY" />
              <input className="border px-3 py-2 rounded" placeholder="CVV" />
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="border px-5 py-2 rounded">
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="bg-blue-600 text-white px-5 py-2 rounded"
            >
              Pay ₹{selectedPlan.total}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
  <div className="bg-white rounded-lg shadow p-6 max-w-md text-center">
    
    {/* DONE ICON */}
    <div className="flex justify-center mb-3">
      <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
        <span className="text-green-600 text-2xl">✓</span>
      </div>
    </div>

    <h3 className="text-lg font-semibold mb-1">Payment Successful</h3>
    <p className="text-sm text-gray-500 mb-4">
      Your payment has been completed successfully
    </p>

    <div className="text-sm text-left space-y-1 mb-4">
      <div><b>Student:</b> {student.name}</div>
      <div><b>Class:</b> {student.class}</div>
      <div><b>Fees Period:</b> {selectedPlan.label}</div>
      <div><b>Amount Paid:</b> ₹{selectedPlan.total}</div>
      <div><b>Payment Mode:</b> {paymentMode}</div>
    </div>

    <div className="flex gap-3 justify-center">
      <button
        onClick={() => window.print()}
        className="border px-4 py-2 rounded"
      >
        View Receipt
      </button>

      <button
        onClick={downloadReceipt}
        className="border px-4 py-2 rounded"
      >
        Download
      </button>
    </div>

    {/* DONE BUTTON */}
    <button
      onClick={handleDone}
      className="mt-4 w-full bg-blue-600 text-white py-2 rounded"
    >
      Done
    </button>
  </div>
)}
    </div>
  );
}