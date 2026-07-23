import React, { useMemo, useState } from "react";
import {
  FiSearch,
  FiEye,
  FiDownload,
} from "react-icons/fi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import jsPDF from "jspdf";
export default function Transactions() {

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const transactions = [
    {
      id: "TXN-50184",
      receipt: "VS-REC-1084",
      student: "Aarav Sharma",
      class: "8-A",
      date: "15 Jul 2026",
      time: "10:05",
      amount: 12000,
      method: "UPI",
      cashier: "Anjali Mehta",
      status: "Successful",
    },
    {
      id: "TXN-50183",
      receipt: "VS-REC-1083",
      student: "Ananya Patel",
      class: "7-B",
      date: "15 Jul 2026",
      time: "09:42",
      amount: 20000,
      method: "Cash",
      cashier: "Anjali Mehta",
      status: "Successful",
    },
    {
      id: "TXN-50182",
      receipt: "--",
      student: "Rohan Verma",
      class: "9-A",
      date: "15 Jul 2026",
      time: "09:31",
      amount: 12000,
      method: "Online Gateway",
      cashier: "System",
      status: "Pending",
    },
    {
      id: "TXN-50181",
      receipt: "VS-REC-1081",
      student: "Meera Singh",
      class: "10-B",
      date: "15 Jul 2026",
      time: "09:05",
      amount: 10000,
      method: "Cheque",
      cashier: "Anjali Mehta",
      status: "Cancelled",
    },
    {
      id: "TXN-50180",
      receipt: "VS-REC-1080",
      student: "Kabir Shah",
      class: "6-A",
      date: "14 Jul 2026",
      time: "15:50",
      amount: 8000,
      method: "Bank Transfer",
      cashier: "Anjali Mehta",
      status: "Successful",
    },
  ];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {

      const matchesSearch =
        txn.id.toLowerCase().includes(search.toLowerCase()) ||
        txn.receipt.toLowerCase().includes(search.toLowerCase()) ||
        txn.student.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        txn.status === statusFilter;

      const matchesMethod =
        methodFilter === "All" ||
        txn.method === methodFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMethod
      );

    });
  }, [search, statusFilter, methodFilter]);

  const badgeColor = (status) => {
    switch (status) {
      case "Successful":
        return "bg-green-100 text-green-700";
      case "Pending":
        return "bg-orange-100 text-orange-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100";
    }
  };

  const exportExcel = () => {

  const data = filteredTransactions.map((txn) => ({
    TransactionID: txn.id,
    Receipt: txn.receipt,
    Student: txn.student,
    Class: txn.class,
    Date: txn.date,
    Time: txn.time,
    Amount: txn.amount,
    Method: txn.method,
    Cashier: txn.cashier,
    Status: txn.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const file = new Blob([excelBuffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(file, "Transactions.xlsx");
};


const downloadReceipt = () => {

  if (!selectedTransaction) return;

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Transaction Receipt", 20, 20);

  doc.setFontSize(12);

  doc.text(`Transaction : ${selectedTransaction.id}`,20,40);
  doc.text(`Receipt : ${selectedTransaction.receipt}`,20,50);
  doc.text(`Student : ${selectedTransaction.student}`,20,60);
  doc.text(`Class : ${selectedTransaction.class}`,20,70);
  doc.text(`Amount : ₹${selectedTransaction.amount}`,20,80);
  doc.text(`Method : ${selectedTransaction.method}`,20,90);
  doc.text(`Cashier : ${selectedTransaction.cashier}`,20,100);
  doc.text(`Status : ${selectedTransaction.status}`,20,110);

  doc.save(`${selectedTransaction.receipt}.pdf`);

};
  return (

<div>

{/* Top */}

<div className="flex justify-between items-center mb-6 flex-wrap gap-4">

<div className="relative">

<FiSearch className="absolute left-3 top-3 text-gray-400"/>

<input
type="text"
placeholder="Search transaction, receipt or student..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="border rounded-lg pl-10 pr-4 py-3 w-96"
/>

</div>

<div className="flex gap-3">

<select
value={statusFilter}
onChange={(e)=>setStatusFilter(e.target.value)}
className="border rounded-lg px-4 py-3"
>

<option>All</option>
<option>Successful</option>
<option>Pending</option>
<option>Cancelled</option>

</select>

<select
value={methodFilter}
onChange={(e)=>setMethodFilter(e.target.value)}
className="border rounded-lg px-4 py-3"
>

<option>All</option>
<option>Cash</option>
<option>UPI</option>
<option>Cheque</option>
<option>Bank Transfer</option>
<option>Online Gateway</option>

</select>

<button
onClick={exportExcel}
className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-5 py-3 flex items-center gap-2 transition-all"
>

<FiDownload/>

Export Excel

</button>

</div>

</div>

{/* Table */}

<div className="border  bg-white rounded-xl overflow-hidden">

<table className="w-full">

<thead className="bg-white">

<tr>

<th className="text-left p-4">Transaction</th>
<th className="text-left">Receipt</th>
<th className="text-left">Student</th>
<th className="text-left">Date & Time</th>
<th className="text-right">Amount</th>
<th className="text-left">Method</th>
<th className="text-left">Cashier</th>
<th className="text-center">Status</th>
<th className="text-center">Actions</th>

</tr>

</thead>

<tbody>

{filteredTransactions.map((txn)=>(

<tr
key={txn.id}
className="border-t hover:bg-gray-50"
>

<td className="p-4 font-medium">

{txn.id}

</td>

<td>

{txn.receipt}

</td>

<td>

<div className="font-medium">

{txn.student}

</div>

<div className="text-sm text-gray-500">

{txn.class}

</div>

</td>

<td>

<div>

{txn.date}

</div>

<div className="text-sm text-gray-500">

{txn.time}

</div>

</td>

<td className="text-right font-semibold">

₹{txn.amount.toLocaleString()}

</td>

<td>

{txn.method}

</td>

<td>

{txn.cashier}

</td>

<td className="text-center">

<span
className={`px-3 py-1 rounded-full text-sm font-medium ${badgeColor(txn.status)}`}
>

{txn.status}

</span>

</td>

<td>

<div className="flex justify-center">

<button
onClick={()=>setSelectedTransaction(txn)}
className="border border-blue-600 text-blue-600 rounded-lg px-4 py-2 flex items-center gap-2 transition-all duration-200 hover:bg-blue-600 hover:text-white"
>

<FiEye/>

View

</button>

</div>

</td>

</tr>

))}

</tbody>

</table>

</div>
{/* ================= View Transaction Modal ================= */}

{selectedTransaction && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white rounded-2xl shadow-xl w-[750px] max-h-[90vh] overflow-y-auto">

{/* Header */}

<div className="flex justify-between items-center border-b px-6 py-4">

<div>

<h2 className="text-2xl font-bold">

Transaction Details

</h2>

<p className="text-gray-500">

{selectedTransaction.id}

</p>

</div>

<button

onClick={()=>setSelectedTransaction(null)}

className="text-3xl text-gray-400 hover:text-black"

>

×

</button>

</div>

{/* Body */}

<div className="p-4 space-y-6">

{/* Student */}

<div className="grid grid-cols-2 gap-6">

<div>

<h3 className="font-semibold text-gray-500">

Student

</h3>

<p className="text-xl font-bold mt-2">

{selectedTransaction.student}

</p>

<p className="text-gray-500">

Class {selectedTransaction.class}

</p>

</div>

<div>

<h3 className="font-semibold text-gray-500">

Receipt No.

</h3>

<p className="text-xl font-bold mt-2">

{selectedTransaction.receipt}

</p>

</div>

</div>

{/* Payment Summary */}

<div className="border rounded-xl p-5">

<h3 className="text-xl font-bold mb-4">

Payment Summary

</h3>

<div className="space-y-3">

<div className="flex justify-between">

<span>

Transaction ID

</span>

<strong>

{selectedTransaction.id}

</strong>

</div>

<div className="flex justify-between">

<span>

Date

</span>

<strong>

{selectedTransaction.date}

</strong>

</div>

<div className="flex justify-between">

<span>

Time

</span>

<strong>

{selectedTransaction.time}

</strong>

</div>

<div className="flex justify-between">

<span>

Payment Method

</span>

<strong>

{selectedTransaction.method}

</strong>

</div>

<div className="flex justify-between">

<span>

Cashier

</span>

<strong>

{selectedTransaction.cashier}

</strong>

</div>

<div className="flex justify-between">

<span>

Status

</span>

<span
className={`px-3 py-1 rounded-full text-sm ${badgeColor(selectedTransaction.status)}`}
>

{selectedTransaction.status}

</span>

</div>

<hr/>

<div className="flex justify-between text-xl font-bold">

<span>

Amount Paid

</span>

<span>

₹{selectedTransaction.amount.toLocaleString()}

</span>

</div>

</div>

</div>

{/* Dummy Fee Heads */}

<div className="border rounded-xl">

<div className="p-4 border-b font-bold">

Fee Heads

</div>

<table className="w-full">

<thead className="bg-gray-50">

<tr>

<th className="text-left p-3">

Fee Head

</th>

<th className="text-right">

Amount

</th>

</tr>

</thead>

<tbody>

<tr className="border-t">

<td className="p-3">

Tuition Fee

</td>

<td className="text-right">

₹8,000

</td>

</tr>

<tr className="border-t">

<td className="p-3">

Transport Fee

</td>

<td className="text-right">

₹2,000

</td>

</tr>

<tr className="border-t">

<td className="p-3">

Exam Fee

</td>

<td className="text-right">

₹2,000

</td>

</tr>

</tbody>

</table>

</div>

{/* Footer */}

<div className="flex justify-end gap-3">

<button

className="border px-5 py-3 rounded-xl"

>

Print Receipt

</button>

<button
onClick={downloadReceipt}
className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 transition-all"
>

<FiDownload/>

Download PDF

</button>

<button

onClick={()=>setSelectedTransaction(null)}

className="bg-blue-600 text-white px-5 py-3 rounded-xl"

>

Close

</button>

</div>

</div>

</div>

</div>

)}
</div>

  );

}