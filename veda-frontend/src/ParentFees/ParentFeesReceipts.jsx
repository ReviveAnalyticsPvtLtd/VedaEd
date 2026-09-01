import React from "react";

export default function ParentFeeReceipts() {
  const receipts = [
    {
      id: "RCP001",
      student: "Aarav Sharma",
      class: "Class 5-A",
      amount: 12000,
      paymentMode: "UPI",
      date: "10 Jul 2026",
      status: "Paid",
    },
    {
      id: "RCP002",
      student: "Ananya Sharma",
      class: "Class 2-B",
      amount: 8500,
      paymentMode: "Credit Card",
      date: "18 Aug 2026",
      status: "Paid",
    },
    {
      id: "RCP003",
      student: "Vivaan Sharma",
      class: "Class 7-C",
      amount: 15000,
      paymentMode: "UPI",
      date: "05 Sep 2026",
      status: "Paid",
    },
  ];

  const previewReceipt = (receipt) => {
    alert(`
Receipt No : ${receipt.id}

Student : ${receipt.student}
Class : ${receipt.class}

Amount : ₹${receipt.amount}

Payment Mode : ${receipt.paymentMode}

Date : ${receipt.date}

Status : ${receipt.status}
    `);
  };

  const downloadReceipt = (receipt) => {
    const text = `
PAYMENT RECEIPT

Receipt No : ${receipt.id}

Student : ${receipt.student}
Class : ${receipt.class}

Amount Paid : ₹${receipt.amount}

Payment Mode : ${receipt.paymentMode}

Date : ${receipt.date}

Status : ${receipt.status}
`;

    const blob = new Blob([text], {
      type: "text/plain",
    });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);

    link.download = `${receipt.id}.txt`;

    link.click();
  };

  return (
     <div className="p-0 min-h-screen">
          <div className="flex items-center justify-between mb-2">
           <h2 className="text-2xl font-bold">Payment Receipt </h2>
         </div>
 {/* Tabs */}
          <div className="flex gap-3 text-sm mb-3 text-gray-600 border-b">
            <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
              Overview
            </button>
          </div>
      <div className="bg-white border rounded-lg"></div>

      {receipts.map((receipt) => (
        <div
          key={receipt.id}
          className="bg-white rounded-xl shadow p-5 mb-5"
        >
          <div className="flex justify-between items-center">

            <div>

              <h3 className="text-lg font-semibold">
                {receipt.student}
              </h3>

              <p className="text-gray-500">
                {receipt.class}
              </p>

              <p className="text-sm mt-2">
                Receipt No : {receipt.id}
              </p>

              <p className="text-sm">
                Date : {receipt.date}
              </p>

              <p className="text-sm">
                Payment Mode : {receipt.paymentMode}
              </p>

            </div>

            <div className="text-right">

              <h3 className="text-xl font-bold text-green-600">
                ₹{receipt.amount}
              </h3>

              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                {receipt.status}
              </span>

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
      ))}
    </div>
  );
}