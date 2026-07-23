import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
export default function Exceptions() {


  const exceptions = [
    {
      id: 1,
      type: "Pending Gateway",
      student: "Rohan Verma",
      reference: "PAY-90318",
      amount: 12000,
      created: "15 Jul 2026 09:31",
      status: "Pending",
    },
    {
      id: 2,
      type: "Bounced Cheque",
      student: "Meera Singh",
      reference: "CHQ-1184",
      amount: 10000,
      created: "14 Jul 2026 16:10",
      status: "Needs Action",
    },
    {
      id: 3,
      type: "Refund Pending",
      student: "Ananya Patel",
      reference: "REF-0092",
      amount: 5000,
      created: "14 Jul 2026 14:20",
      status: "Approved",
    },
    {
      id: 4,
      type: "Duplicate Warning",
      student: "Aarav Sharma",
      reference: "DUP-022",
      amount: 12000,
      created: "14 Jul 2026 11:02",
      status: "Review",
    },
    {
      id: 5,
      type: "Pending Gateway",
      student: "Neha Jain",
      reference: "PAY-90314",
      amount: 6000,
      created: "14 Jul 2026 10:12",
      status: "Pending",
    },
  ];
const [rows, setRows] = useState(exceptions);
  const [selectedException, setSelectedException] = useState(null);
  const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const [dateFilter, setDateFilter] = useState("");
 const filtered = useMemo(() => {

  return rows.filter((item) => {

    const matchSearch =

      item.student.toLowerCase().includes(search.toLowerCase()) ||

      item.reference.toLowerCase().includes(search.toLowerCase()) ||

      item.type.toLowerCase().includes(search.toLowerCase());

    const matchStatus =

      statusFilter === "All" ||

      item.status === statusFilter;

    const matchDate =

      !dateFilter ||

      item.created.includes(dateFilter);

    return matchSearch && matchStatus && matchDate;

  });

}, [rows, search, statusFilter, dateFilter]);

  const badgeColor = (status) => {

    switch (status) {

      case "Pending":
        return "bg-orange-100 text-orange-700";

      case "Needs Action":
        return "bg-red-100 text-red-700";

      case "Approved":
        return "bg-green-100 text-green-700";

      case "Review":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";

    }

  };

  const exportExcel = () => {

  const data = filtered.map((item) => ({
    Type: item.type,
    Student: item.student,
    Reference: item.reference,
    Amount: item.amount,
    Created: item.created,
    Status: item.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Exceptions");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  saveAs(
    new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "Exceptions.xlsx"
  );

};
const downloadException = () => {

  if (!selectedException) return;

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Exception Report",20,20);

  doc.setFontSize(12);

  doc.text(`Student : ${selectedException.student}`,20,40);
  doc.text(`Type : ${selectedException.type}`,20,50);
  doc.text(`Reference : ${selectedException.reference}`,20,60);
  doc.text(`Amount : ₹${selectedException.amount}`,20,70);
  doc.text(`Created : ${selectedException.created}`,20,80);
  doc.text(`Status : ${selectedException.status}`,20,90);

  doc.save(`${selectedException.reference}.pdf`);

};

  return (

 <div className="p-0 m-0 min-h-screen">

{/* Search */}

<div className="flex justify-between items-center mb-6 flex-wrap gap-4">

<input

type="text"

placeholder="Search student, reference or type..."

value={search}

onChange={(e)=>setSearch(e.target.value)}

className="border rounded-lg px-4 py-3 w-96"

/>

</div>
<div className="flex gap-3 mb-3">

<select

value={statusFilter}

onChange={(e)=>setStatusFilter(e.target.value)}

className="border rounded-lg px-4 py-3"

>

<option>All</option>

<option>Pending</option>

<option>Needs Action</option>

<option>Approved</option>

<option>Review</option>

</select>

<input

type="date"

value={dateFilter}

onChange={(e)=>setDateFilter(e.target.value)}

className="border rounded-lg px-4 py-3"

/>

<button
onClick={exportExcel}
className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-5 py-3 transition-all"
>

Export Excel

</button>

</div>

{/* Summary */}

<div className="grid grid-cols-5 gap-5 mb-6">

<div className="border rounded-xl p-4 bg-white border-blue-500">

<p className="text-gray-600">

All Exceptions

</p>

<h2 className="text-4xl font-bold mt-2">

12

</h2>

</div>

<div className="border rounded-xl p-4 bg-white">

<p className="text-gray-600">

Pending Gateway

</p>

<h2 className="text-4xl font-bold mt-2">

5

</h2>

</div>

<div className="border rounded-xl p-4 bg-white">

<p className="text-gray-600">

Bounced Cheque

</p>

<h2 className="text-4xl font-bold mt-2">

3

</h2>

</div>

<div className="border rounded-xl p-4 bg-white">

<p className="text-gray-600">

Refund Pending

</p>

<h2 className="text-4xl font-bold mt-2">

2

</h2>

</div>

<div className="border rounded-xl p-4 bg-white">

<p className="text-gray-600">

Duplicate Warning

</p>

<h2 className="text-4xl font-bold mt-2">

2

</h2>

</div>

</div>

{/* Table */}

<div className="border  bg-white rounded-xl overflow-hidden">

<table className="w-full">

<thead className="bg-gray-50">

<tr>

<th className="text-left p-4">Type</th>

<th className="text-left">Student</th>

<th className="text-left">Reference</th>

<th className="text-right">Amount</th>

<th className="text-left">Created</th>

<th className="text-center">Status</th>

<th className="text-center">Action</th>

</tr>

</thead>

<tbody>

{filtered.map((item)=>(

<tr
key={item.id}
className="border-t hover:bg-gray-50"
>

<td className="p-4 font-medium">

{item.type}

</td>

<td>

{item.student}

</td>

<td>

{item.reference}

</td>

<td className="text-right font-semibold">

₹{item.amount.toLocaleString()}

</td>

<td>

{item.created}

</td>

<td className="text-center">

<span
className={`px-3 py-1 rounded-full text-sm ${badgeColor(item.status)}`}
>

{item.status}

</span>

</td>

<td>

<div className="flex justify-center">

<button

onClick={()=>setSelectedException(item)}

className="border border-blue-600 text-blue-600 px-5 py-2 rounded-lg transition-all hover:bg-blue-600 hover:text-white"

>

Resolve

</button>

</div>

</td>

</tr>

))}

</tbody>

</table>

</div>
{/* ================= Resolve Exception Modal ================= */}

{selectedException && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white rounded-2xl shadow-xl w-[700px] max-h-[90vh] overflow-y-auto">

{/* Header */}

<div className="flex justify-between items-center border-b px-6 py-5">

<div>

<h2 className="text-2xl font-bold">

Resolve Exception

</h2>

<p className="text-gray-500 mt-1">

Reference : {selectedException.reference}

</p>

</div>

<button

onClick={()=>setSelectedException(null)}

className="text-3xl text-gray-400 hover:text-black"

>

×

</button>

</div>

{/* Body */}

<div className="p-6 space-y-6">

{/* Student Details */}

<div className="grid grid-cols-2 gap-6">

<div>

<label className="block text-gray-500 mb-1">

Student

</label>

<div className="font-semibold text-lg">

{selectedException.student}

</div>

</div>

<div>

<label className="block text-gray-500 mb-1">

Exception Type

</label>

<div className="font-semibold text-lg">

{selectedException.type}

</div>

</div>

<div>

<label className="block text-gray-500 mb-1">

Reference

</label>

<div className="font-semibold">

{selectedException.reference}

</div>

</div>

<div>

<label className="block text-gray-500 mb-1">

Amount

</label>

<div className="font-semibold text-red-600">

₹{selectedException.amount.toLocaleString()}

</div>

</div>

<div>

<label className="block text-gray-500 mb-1">

Created

</label>

<div>

{selectedException.created}

</div>

</div>

<div>

<label className="block text-gray-500 mb-1">

Current Status

</label>

<span
className={`px-3 py-1 rounded-full text-sm ${badgeColor(selectedException.status)}`}
>

{selectedException.status}

</span>

</div>

</div>

{/* Resolution */}

<div>

<label className="block font-medium mb-2">

Resolution

</label>

<select
className="w-full border rounded-lg p-3"
>

<option>Approve</option>

<option>Reject</option>

<option>Mark as Reviewed</option>

<option>Need More Information</option>

</select>

</div>

{/* Remarks */}

<div>

<label className="block font-medium mb-2">

Remarks

</label>

<textarea

rows="4"

placeholder="Write resolution remarks..."

className="w-full border rounded-lg p-3"

/>

</div>

{/* Attach Proof */}

<div>

<label className="block font-medium mb-2">

Attach Supporting Document

</label>

<input

type="file"

className="w-full border rounded-lg p-3"

/>

</div>

{/* Footer */}

<div className="flex justify-end gap-3 pt-2">

<button

onClick={()=>setSelectedException(null)}

className="border px-6 py-3 rounded-xl"

>

Cancel

</button>
<button
onClick={downloadException}
className="border border-red-600 text-red-600 px-6 py-3 rounded-xl transition-all hover:bg-red-600 hover:text-white"
>

Download PDF

</button>
<button

onClick={() => {

setRows(

rows.map((item)=>

item.id===selectedException.id

?

{

...item,

status:"Approved"

}

:

item

)

);

alert("Exception Resolved Successfully");

setSelectedException(null);

}}

className="bg-blue-600 hover:bg-blue-700 transition-all text-white px-6 py-3 rounded-xl"

>

Resolve Exception

</button>

</div>

</div>

</div>

</div>

)}

</div>

  );

}