<<<<<<< HEAD
import React, { useMemo, useState } from "react";
import {
  FiSearch,
  FiEye,
  FiPrinter,
  FiSend,
} from "react-icons/fi";
import jsPDF from "jspdf";
export default function Receipts() {

  const [search, setSearch] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);
const [showSendModal, setShowSendModal] = useState(false);
  const receipts = [
    {
      receiptNo: "VS-REC-1084",
      student: "Aarav Sharma",
      admission: "VS-1024",
      class: "8-A",
      date: "15 Jul 2026",
      amount: 12000,
      method: "UPI",
      status: "Successful",
    },
    {
      receiptNo: "VS-REC-1083",
      student: "Ananya Patel",
      admission: "VS-0987",
      class: "7-B",
      date: "15 Jul 2026",
      amount: 20000,
      method: "Cash",
      status: "Successful",
    },
    {
      receiptNo: "VS-REC-1081",
      student: "Meera Singh",
      admission: "VS-1102",
      class: "10-B",
      date: "15 Jul 2026",
      amount: 10000,
      method: "Cheque",
      status: "Cancelled",
    },
    {
      receiptNo: "VS-REC-1080",
      student: "Kabir Shah",
      admission: "VS-0872",
      class: "6-A",
      date: "14 Jul 2026",
      amount: 8000,
      method: "Bank Transfer",
      status: "Successful",
    },
  ];

  const filteredReceipts = useMemo(() => {

    return receipts.filter((item) =>

      item.receiptNo.toLowerCase().includes(search.toLowerCase()) ||

      item.student.toLowerCase().includes(search.toLowerCase()) ||

      item.admission.toLowerCase().includes(search.toLowerCase())

    );

  }, [search]);

  const badgeColor = (status) => {

    switch (status) {

      case "Successful":

        return "bg-green-100 text-green-700";

      case "Cancelled":

        return "bg-red-100 text-red-700";

      default:

        return "bg-gray-100 text-gray-700";

    }

  };

  const printReceipt = () => {

  if (!selectedReceipt) return;

  window.print();

};

const downloadReceipt = () => {

  if (!selectedReceipt) return;

  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text("VEDA SCHOOL", 20, 20);

  doc.setFontSize(11);
  doc.text("Fee Receipt", 20, 30);

  doc.line(20, 35, 190, 35);

  doc.text(`Receipt No : ${selectedReceipt.receiptNo}`, 20, 50);
  doc.text(`Student : ${selectedReceipt.student}`, 20, 60);
  doc.text(`Admission : ${selectedReceipt.admission}`, 20, 70);
  doc.text(`Class : ${selectedReceipt.class}`, 20, 80);
  doc.text(`Payment Date : ${selectedReceipt.date}`, 20, 90);
  doc.text(`Payment Method : ${selectedReceipt.method}`, 20, 100);
  doc.text(`Status : ${selectedReceipt.status}`, 20, 110);

  doc.line(20, 118, 190, 118);

  doc.setFontSize(13);
  doc.text("Fee Details", 20, 130);

  doc.setFontSize(11);

  doc.text("Tuition Fee", 20, 145);
  doc.text("₹8,000", 170, 145);

  doc.text("Transport Fee", 20, 155);
  doc.text("₹2,000", 170, 155);

  doc.text("Exam Fee", 20, 165);
  doc.text("₹2,000", 170, 165);

  doc.line(20, 173, 190, 173);

  doc.setFontSize(14);

  doc.text(
    `Total Paid : ₹${selectedReceipt.amount.toLocaleString()}`,
    20,
    185
  );

  doc.save(`${selectedReceipt.receiptNo}.pdf`);

};

  return (

<div>

{/* Search */}

<div className="flex justify-between items-center mb-6">

<div className="relative">

<FiSearch className="absolute left-3 top-3 text-gray-400"/>

<input

type="text"

placeholder="Search receipt, student, or admission..."

value={search}

onChange={(e)=>setSearch(e.target.value)}

className="border rounded-lg pl-10 pr-4 py-3 w-96"

/>

</div>

</div>

{/* Table */}

<div className="border rounded-xl overflow-hidden bg-white">

<table className="w-full">

<thead className="bg-gray-50">

<tr>

<th className="text-left p-4">

Receipt No.

</th>

<th className="text-left">

Student

</th>

<th className="text-left">

Class

</th>

<th className="text-left">

Date

</th>

<th className="text-right">

Amount

</th>

<th className="text-left">

Method

</th>

<th className="text-center">

Status

</th>

<th className="text-center">

Actions

</th>

</tr>

</thead>

<tbody>

{filteredReceipts.map((receipt)=>(

<tr
key={receipt.receiptNo}
className="border-t hover:bg-gray-50"
>

<td className="p-4 font-medium">

{receipt.receiptNo}

</td>

<td>

<div className="font-medium">

{receipt.student}

</div>

<div className="text-sm text-gray-500">

{receipt.admission}

</div>

</td>

<td>

{receipt.class}

</td>

<td>

{receipt.date}

</td>

<td className="text-right font-semibold">

₹{receipt.amount.toLocaleString()}

</td>

<td>

{receipt.method}

</td>

<td className="text-center">

<span
className={`px-3 py-1 rounded-full text-sm ${badgeColor(receipt.status)}`}
>

{receipt.status}

</span>

</td>

<td>

<div className="flex justify-center gap-2">

<button

onClick={()=>setSelectedReceipt(receipt)}

className="border border-blue-600 text-blue-600 rounded-lg px-4 py-2 flex items-center gap-2 transition-all duration-200 hover:bg-blue-600 hover:text-white"

>

<FiEye/>

View

</button>

<button
onClick={()=>{
  setSelectedReceipt(receipt);
  setTimeout(() => window.print(), 300);
}}
className="border border-green-600 text-green-600 px-5 py-3 rounded-lg flex items-center gap-2 transition-all hover:bg-green-600 hover:text-white"
>

<FiPrinter />

Print

</button>



</div>

</td>

</tr>

))}

</tbody>

</table>

</div>
{/* ===================== VIEW RECEIPT MODAL ===================== */}

{selectedReceipt && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white rounded-2xl shadow-xl w-[850px] max-h-[90vh] overflow-y-auto">

{/* Header */}

<div className="flex justify-between items-center border-b px-6 py-5">

<div>

<h2 className="text-2xl font-bold">

Fee Receipt

</h2>

<p className="text-gray-500">

Receipt No. {selectedReceipt.receiptNo}

</p>

</div>

<button

onClick={()=>setSelectedReceipt(null)}

className="text-3xl text-gray-500 hover:text-black"

>

×

</button>

</div>

{/* Body */}

<div className="p-6 space-y-6">

{/* School */}

<div className="text-center border-b pb-5">

<h2 className="text-3xl font-bold">

Veda School

</h2>

<p className="text-gray-500">

Green Valley School Campus

</p>

<p className="text-gray-500">

Phone : +91 9876543210

</p>

</div>

{/* Student Details */}

<div className="grid grid-cols-2 gap-8">

<div>

<p className="text-gray-500">

Student Name

</p>

<h3 className="font-bold text-xl mt-1">

{selectedReceipt.student}

</h3>

</div>

<div>

<p className="text-gray-500">

Admission No.

</p>

<h3 className="font-bold text-xl mt-1">

{selectedReceipt.admission}

</h3>

</div>

<div>

<p className="text-gray-500">

Class

</p>

<h3 className="font-bold mt-1">

{selectedReceipt.class}

</h3>

</div>

<div>

<p className="text-gray-500">

Payment Date

</p>

<h3 className="font-bold mt-1">

{selectedReceipt.date}

</h3>

</div>

</div>

{/* Fee Details */}

<div className="border rounded-xl overflow-hidden">

<div className="bg-gray-50 px-5 py-4 font-bold">

Fee Details

</div>

<table className="w-full">

<thead>

<tr className="border-b">

<th className="text-left p-4">

Fee Head

</th>

<th className="text-right p-4">

Amount

</th>

</tr>

</thead>

<tbody>

<tr className="border-b">

<td className="p-4">

Tuition Fee

</td>

<td className="text-right p-4">

₹8,000

</td>

</tr>

<tr className="border-b">

<td className="p-4">

Transport Fee

</td>

<td className="text-right p-4">

₹2,000

</td>

</tr>

<tr>

<td className="p-4">

Exam Fee

</td>

<td className="text-right p-4">

₹2,000

</td>

</tr>

</tbody>

<tfoot>

<tr className="border-t bg-gray-50">

<td className="p-4 font-bold">

Total Paid

</td>

<td className="text-right p-4 font-bold">

₹{selectedReceipt.amount.toLocaleString()}

</td>

</tr>

</tfoot>

</table>

</div>

{/* Payment Summary */}

<div className="border rounded-xl p-5">

<h3 className="font-bold text-lg mb-4">

Payment Summary

</h3>

<div className="space-y-3">

<div className="flex justify-between">

<span>

Receipt No.

</span>

<strong>

{selectedReceipt.receiptNo}

</strong>

</div>

<div className="flex justify-between">

<span>

Payment Method

</span>

<strong>

{selectedReceipt.method}

</strong>

</div>

<div className="flex justify-between">

<span>

Status

</span>

<span
className={`px-3 py-1 rounded-full text-sm ${badgeColor(selectedReceipt.status)}`}
>

{selectedReceipt.status}

</span>

</div>

<div className="flex justify-between">

<span>

Collected By

</span>

<strong>

School Admin

</strong>

</div>

</div>

</div>

{/* Footer */}

<div className="flex justify-end gap-3">

<button
onClick={printReceipt}
className="border border-green-600 text-green-600 px-5 py-3 rounded-xl flex items-center gap-2 transition-all hover:bg-green-600 hover:text-white"
>

<FiPrinter />

Print Receipt

</button>

<button
onClick={downloadReceipt}
className="border border-red-600 text-red-600 px-5 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 hover:bg-red-600 hover:text-white"
>

📄 Download PDF

</button>

<button

onClick={()=>{

setShowSendModal(true);

}}

className="border px-5 py-3 rounded-xl hover:bg-gray-100"

>

Send Receipt

</button>

<button

onClick={()=>setSelectedReceipt(null)}

className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"

>

Close

</button>

</div>

</div>

</div>

</div>

)}
{showSendModal && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white rounded-2xl w-[550px]">

<div className="border-b px-6 py-5 flex justify-between items-center">

<h2 className="text-2xl font-bold">

Send Receipt

</h2>

<button

onClick={()=>setShowSendModal(false)}

className="text-3xl text-gray-400"

>

×

</button>

</div>

<div className="p-6 space-y-5">

<div>

<label className="font-medium">

Parent Email

</label>

<input

defaultValue="parent@gmail.com"

className="w-full border rounded-lg p-3 mt-2"

/>

</div>

<div>

<label className="font-medium">

Mobile Number

</label>

<input

defaultValue="+91 9876543210"

className="w-full border rounded-lg p-3 mt-2"

/>

</div>

<div>

<label className="font-medium">

Share Via

</label>

<div className="grid grid-cols-3 gap-3 mt-3">

<button

className="border rounded-xl py-3 hover:bg-gray-100"

>

📧 Email

</button>

<button

className="border rounded-xl py-3 hover:bg-gray-100"

>

💬 WhatsApp

</button>

<button

className="border rounded-xl py-3 hover:bg-gray-100"

>

📱 SMS

</button>

</div>

</div>

<div>

<label className="font-medium">

Message

</label>

<textarea

rows="4"

className="w-full border rounded-lg p-3 mt-2"

defaultValue="Dear Parent, your fee payment has been received successfully. Please find the receipt attached."

>

</textarea>

</div>

<div className="flex justify-end gap-3">

<button

onClick={()=>setShowSendModal(false)}

className="border px-5 py-3 rounded-xl"

>

Cancel

</button>

<button

onClick={()=>{

alert("Receipt Sent Successfully");

setShowSendModal(false);

}}

className="bg-blue-600 text-white px-6 py-3 rounded-xl"

>

Send Receipt

</button>

</div>

</div>

</div>

</div>

)}
</div>

  );

}
=======
import React, { useState, useEffect } from "react";
import { FiPrinter, FiSearch, FiCheck } from "react-icons/fi";
import axios from "../../services/apiClient";
import config from "../../config";

export default function Receipts() {
  const [transactions, setTransactions] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTxs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.API_BASE_URL}/fees/collect/payments?search=${search}`);
      setTransactions(res.data);
      if (res.data.length > 0 && !selectedTx) {
        setSelectedTx(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTxs();
  }, [search]);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Search & Selector List */}
      <div className="bg-white rounded-xl shadow border p-5 space-y-4">
        <div>
          <h3 className="font-bold text-lg text-gray-800">Select Transaction</h3>
          <p className="text-gray-500 text-xs mt-1">Search student or receipt number to review voucher.</p>
        </div>
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {loading ? (
            <p className="text-center text-gray-400 text-xs py-6">Loading list...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-400 text-xs py-6">No matches found.</p>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx._id}
                onClick={() => setSelectedTx(tx)}
                className={`p-3 border rounded-lg cursor-pointer transition flex justify-between items-center ${
                  selectedTx?._id === tx._id ? "border-blue-500 bg-blue-50/40" : "hover:bg-gray-50"
                }`}
              >
                <div>
                  <h4 className="font-semibold text-sm text-gray-800">
                    {tx.studentId?.personalInfo?.name || "Unknown"}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    REC-{tx._id.substring(tx._id.length - 8).toUpperCase()} • {tx.paymentMethod}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-green-600">₹{tx.totalAmount}</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(tx.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Receipt Preview Canvas */}
      <div className="md:col-span-2 bg-white rounded-xl shadow border p-6 flex flex-col justify-between">
        {selectedTx ? (
          <div>
            <div className="flex justify-between items-start border-b pb-5">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-blue-700">VEDA ACADEMY</h2>
                <p className="text-gray-500 text-xs mt-1">12, Sector 4, Dwarka, New Delhi - 110075</p>
                <p className="text-gray-500 text-xs">Email: billing@vedaedu.com | Tel: 011-4567890</p>
              </div>
              <div className="text-right">
                <span className="bg-green-100 text-green-800 font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full">
                  Fee Receipt
                </span>
                <p className="text-xs text-gray-500 mt-3">
                  Receipt No: <strong className="font-mono text-gray-800">REC-{selectedTx._id.substring(selectedTx._id.length - 8).toUpperCase()}</strong>
                </p>
                <p className="text-xs text-gray-500">
                  Date: <span className="text-gray-800">{new Date(selectedTx.date).toLocaleString()}</span>
                </p>
              </div>
            </div>

            {/* Student & Class Details grid */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 my-5 text-sm">
              <div>
                <p className="text-gray-400 text-xs uppercase font-semibold">Student Details</p>
                <h4 className="font-bold text-gray-800 mt-1">{selectedTx.studentId?.personalInfo?.name || "Unknown"}</h4>
                <p className="text-gray-600 text-xs mt-0.5">
                  Admission No: {selectedTx.studentId?.personalInfo?.stdId || "N/A"}
                </p>
                <p className="text-gray-600 text-xs">
                  Father's Name: {selectedTx.studentId?.parent?.fatherName || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase font-semibold">Academic Details</p>
                <h4 className="font-bold text-gray-800 mt-1">Class: {selectedTx.studentId?.personalInfo?.class?.name || "N/A"}</h4>
                <p className="text-gray-600 text-xs mt-0.5">Section: {selectedTx.studentId?.personalInfo?.section?.name || "N/A"}</p>
                <p className="text-gray-600 text-xs">Session: {selectedTx.year}</p>
              </div>
            </div>

            {/* Table breakdown */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-gray-700">Payment Breakdown</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-left border-b font-semibold">
                    <th className="p-2.5">S.No</th>
                    <th className="p-2.5">Fee Category Head</th>
                    <th className="p-2.5 text-right">Amount Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTx.fees?.map((feeItem, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2.5 text-gray-500">{index + 1}</td>
                      <td className="p-2.5 font-semibold text-gray-800">{feeItem.category}</td>
                      <td className="p-2.5 text-right text-gray-800">₹{feeItem.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="font-bold text-base border-t-2">
                    <td></td>
                    <td className="p-2.5 text-gray-800">Total Collected</td>
                    <td className="p-2.5 text-right text-green-700">₹{selectedTx.totalAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mode & Collector Footer info */}
            <div className="mt-8 pt-4 border-t flex justify-between items-center text-xs text-gray-500">
              <div>
                <p>Payment Mode: <strong className="text-gray-700">{selectedTx.paymentMethod}</strong></p>
                {selectedTx.remark && <p className="mt-1">Remarks: <span className="text-gray-600 italic">{selectedTx.remark}</span></p>}
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-700">Accounts Officer</p>
                <p className="text-[10px] text-gray-400 mt-1">Computer Generated Receipt</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-24 text-gray-400">No transaction selected.</div>
        )}

        {selectedTx && (
          <div className="flex justify-end gap-3 mt-6 border-t pt-4">
            <button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg text-sm flex items-center gap-2 transition"
            >
              <FiPrinter /> Print Receipt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
>>>>>>> f1bfd88 (done)
