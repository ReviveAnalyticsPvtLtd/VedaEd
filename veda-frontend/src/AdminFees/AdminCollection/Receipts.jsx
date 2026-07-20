import React, { useMemo, useState } from "react";
import {
  FiSearch,
  FiEye,
  FiPrinter,
  FiSend,
} from "react-icons/fi";

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

className="border rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-blue-50"

>

<FiEye/>

View

</button>

<button
onClick={()=>window.print()}
className="border rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-50"
>

<FiPrinter/>

Print

</button>

<button

onClick={()=>setShowSendModal(true)}

className="border rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-50"

>

<FiSend/>

Send

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

className="border px-5 py-3 rounded-xl hover:bg-gray-100"

>

Print Receipt

</button>

<button

onClick={()=>alert("PDF Download Started")}

className="border px-5 py-3 rounded-xl hover:bg-gray-100"

>

Download PDF

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