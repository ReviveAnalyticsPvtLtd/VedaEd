import React,{useState,useEffect} from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiUser,
  FiDollarSign,
  FiCheckCircle,
} from "react-icons/fi";

export default function CollectFee() {

  const students = [
    {
      id: 1,
      name: "Aarav Sharma",
      class: "8-A",
      admission: "VS-1024",
      pending: 22000,
      annual: 62000,
      paid: 40000,
      current: 20000,
      previous: 2000,
      advance: 0,
      feeHeads: [
  {
    id: 1,
    head: "Tuition Fee",
    dueDate: "10 Jul 2026",
    amount: 12000,
    lateFee: 500,
  },
  {
    id: 2,
    head: "Transport Fee",
    dueDate: "10 Jul 2026",
    amount: 5000,
    lateFee: 0,
  },
  {
    id: 3,
    head: "Exam Fee",
    dueDate: "10 Jul 2026",
    amount: 3000,
    lateFee: 0,
  },
],
    }
    ,
    {
      id: 2,
      name: "Ananya Patel",
      class: "7-B",
      admission: "VS-0987",
      pending: 0,
      annual: 55000,
      paid: 55000,
      current: 0,
      previous: 0,
      advance: 0,
      feeHeads: [
  {
    id: 1,
    head: "Tuition Fee",
    dueDate: "10 Jul 2026",
    amount: 12000,
    lateFee: 500,
  },
  {
    id: 2,
    head: "Transport Fee",
    dueDate: "10 Jul 2026",
    amount: 5000,
    lateFee: 0,
  },
  {
    id: 3,
    head: "Exam Fee",
    dueDate: "10 Jul 2026",
    amount: 3000,
    lateFee: 0,
  },
],
    },
    {
      id: 3,
      name: "Meera Singh",
      class: "10-B",
      admission: "VS-1102",
      pending: 12500,
      annual: 70000,
      paid: 57500,
      current: 12500,
      previous: 0,
      advance: 0,
      feeHeads: [
  {
    id: 1,
    head: "Tuition Fee",
    dueDate: "10 Jul 2026",
    amount: 12000,
    lateFee: 500,
  },
  {
    id: 2,
    head: "Transport Fee",
    dueDate: "10 Jul 2026",
    amount: 5000,
    lateFee: 0,
  },
  {
    id: 3,
    head: "Exam Fee",
    dueDate: "10 Jul 2026",
    amount: 3000,
    lateFee: 0,
  },
],
    },
  ];

  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
const [selectedFees, setSelectedFees] = useState([]);
const [discount, setDiscount] = useState(0);
const [lateFee, setLateFee] = useState(0);
const [extraCharge, setExtraCharge] = useState(0);
const [amountReceived, setAmountReceived] = useState(0);
const [showWaiverModal, setShowWaiverModal] = useState(false);
const [showChargeModal, setShowChargeModal] = useState(false);

const [waiverAmount, setWaiverAmount] = useState(0);
const [waiverReason, setWaiverReason] = useState("");

const [chargeAmount, setChargeAmount] = useState(0);
const [chargeName, setChargeName] = useState("");
const [chargeReason, setChargeReason] = useState("");
const [paymentMode, setPaymentMode] = useState("single");
const navigate = useNavigate();
const [paymentRows, setPaymentRows] = useState([
  {
    id: 1,
    method: "Cash",
    amount: 0,
  },
]);
  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );


  const toggleFee = (fee) => {

    const exists = selectedFees.find(
        item => item.id === fee.id
    );

    if (exists) {

        setSelectedFees(
            selectedFees.filter(
                item => item.id !== fee.id
            )
        );

    } else {

        setSelectedFees([
            ...selectedFees,
            fee,
        ]);

    }

}
const selectedAmount =
selectedFees.reduce(

(sum,item)=>

sum+item.amount,

0

);
const totalLateFee =
selectedFees.reduce(

(sum,item)=>

sum+item.lateFee,

0

);
const effectiveLateFee =
Math.max(0,totalLateFee-waiverAmount);
const payable =
selectedAmount +
effectiveLateFee +
extraCharge -
discount;

const addPaymentRow=()=>{

setPaymentRows([

...paymentRows,

{

id:Date.now(),

method:"Cash",

amount:0,

}

]);

}
const removePayment=(id)=>{

if(paymentRows.length===1)return;

setPaymentRows(

paymentRows.filter(

row=>row.id!==id

)

);

}

const totalReceived =
paymentMode === "single"

? amountReceived

: paymentRows.reduce(

(sum,row)=>

sum + Number(row.amount),

0

);
const remaining =
totalReceived >= payable

?

0

:

payable-totalReceived;

const advance =
totalReceived > payable

?

totalReceived-payable

:

0;

  return (
    <div className="grid lg:grid-cols-3 gap-6">

      {/* LEFT */}

      <div className="lg:col-span-2 space-y-6">

        {/* Search */}

        <div className="bg-white rounded-xl shadow border">

          <div className="p-5 border-b">
            <h2 className="text-xl font-bold">
              Find Student
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Search by student name, admission number,
              class or parent mobile.
            </p>
          </div>

          <div className="p-5">

            <div className="relative">

              <FiSearch className="absolute left-3 top-3 text-gray-400"/>

              <input
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
                placeholder="Search Student..."
                className="w-full border rounded-lg pl-10 py-3"
              />

            </div>

            <div className="mt-5 space-y-3">

              {filteredStudents.map((student)=>(
                <div
                  key={student.id}
                  className="flex justify-between items-center border rounded-lg p-4 hover:bg-gray-50"
                >

                  <div>

                    <h3 className="font-semibold">
                      {student.name}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {student.class} • {student.admission}
                    </p>

                    <span className="text-red-600 text-sm">
                      Pending ₹{student.pending}
                    </span>

                  </div>

                  <button
             onClick={() => {

    setSelectedStudent(student);

    setSelectedFees([]);

    setDiscount(0);

    setLateFee(0);

    setExtraCharge(0);

}}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg"
                  >
                    Select
                  </button>

                </div>
              ))}

            </div>

          </div>

        </div>

        {/* Student */}

        {!selectedStudent ? (

          <div className="bg-white rounded-xl shadow border p-16 text-center">

            <FiUser
              className="mx-auto text-5xl text-gray-400"
            />

            <h2 className="text-xl font-semibold mt-5">
              Select a Student
            </h2>

            <p className="text-gray-500 mt-2">
              Student fee details will appear here.
            </p>

          </div>

        ) : (

          <>

            {/* Header */}

            <div className="bg-white rounded-xl shadow border p-5">

              <div className="flex justify-between items-center">

                <div className="flex gap-4">

                  <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">

                    {selectedStudent.name[0]}

                  </div>

                  <div>

                    <h2 className="text-xl font-bold">

                      {selectedStudent.name}

                    </h2>

                    <p className="text-gray-500">

                      {selectedStudent.class}

                    </p>

                    <p className="text-gray-500">

                      {selectedStudent.admission}

                    </p>

                  </div>

                </div>

               <button
onClick={() =>
navigate(`/admin/fees/fee-account/${selectedStudent.id}`)
}
className="border px-4 py-2 rounded-lg hover:bg-blue-50"
>

View Fee Account

</button>

              </div>

            </div>

            {/* Cards */}

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

              <div className="bg-white border rounded-xl p-4">
                <p className="text-gray-500 text-sm">
                  Annual Fee
                </p>
                <h2 className="font-bold text-xl">
                  ₹{selectedStudent.annual}
                </h2>
              </div>

              <div className="bg-white border rounded-xl p-4">
                <p className="text-gray-500 text-sm">
                  Paid
                </p>
                <h2 className="font-bold text-xl text-green-600">
                  ₹{selectedStudent.paid}
                </h2>
              </div>

              <div className="bg-white border rounded-xl p-4">
                <p className="text-gray-500 text-sm">
                  Current Due
                </p>
                <h2 className="font-bold text-xl text-red-600">
                  ₹{selectedStudent.current}
                </h2>
              </div>

              <div className="bg-white border rounded-xl p-4">
                <p className="text-gray-500 text-sm">
                  Previous Due
                </p>
                <h2 className="font-bold text-xl">
                  ₹{selectedStudent.previous}
                </h2>
              </div>

              <div className="bg-white border rounded-xl p-4">
                <p className="text-gray-500 text-sm">
                  Advance
                </p>
                <h2 className="font-bold text-xl">
                  ₹{selectedStudent.advance}
                </h2>
              </div>

            </div>

            {/* Outstanding */}

            <div className="bg-white rounded-xl shadow border">

             <div className="flex justify-between items-center p-5 border-b">

  <div>
    <h2 className="font-bold text-lg">
      Outstanding Fees
    </h2>

    <p className="text-sm text-gray-500">
      Select dues to collect.
    </p>
  </div>

  <div className="flex items-center gap-3">

    {/* Academic Year */}

    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">

      <span className="text-xs font-semibold text-blue-700 uppercase">
        Session
      </span>

      <select
        className="bg-transparent outline-none font-semibold text-blue-700"
      >
        <option>2026-27</option>
        <option>2025-26</option>
        <option>2024-25</option>
      </select>

    </div>

    {/* Sort */}

    <select className="border rounded-lg px-3 py-2">
      <option>Manual Selection</option>
      <option>Oldest First</option>
      <option>Current First</option>
    </select>

  </div>

</div>

              <table className="w-full">

               <thead className="bg-gray-100">

<tr>

<th className="p-3 text-left w-12"></th>

<th className="p-3 text-left">
Due Type
</th>



<th className="p-3 text-left">
Due Date
</th>

<th className="p-3 text-left">
Due Amount
</th>

</tr>

</thead>
<tbody>

{selectedStudent?.feeHeads.map((fee) => (

<tr
key={fee.id}
className="border-t hover:bg-gray-50"
>

<td className="p-4">

<input

type="checkbox"

checked={
selectedFees.some(
(item)=>item.id===fee.id
)
}

onChange={()=>toggleFee(fee)}

/>

</td>

<td>

{fee.head}

</td>

<td>

{fee.dueDate}

</td>

<td>

₹{fee.amount.toLocaleString()}

</td>

</tr>

))}

</tbody>
              

              </table>

              <div className="flex gap-3 p-5 border-t">

               
<button
onClick={()=>setShowWaiverModal(true)}
className="border rounded-lg px-4 py-2"
>

Waive Late Fee

</button>

             <button
onClick={()=>setShowChargeModal(true)}
className="border rounded-lg px-4 py-2"
>

Add Charge

</button>

               <button
onClick={()=>{
if(selectedStudent){
setSelectedFees(selectedStudent.feeHeads);
}
}}
className="border rounded-lg px-4 py-2"
>

Select All

</button>
<button

onClick={()=>{

setSelectedFees([]);

setWaiverAmount(0);

setExtraCharge(0);

setAmountReceived(0);

}}

className="border rounded-lg px-4 py-2"

>

Clear

</button>

              </div>

            </div>

          </>

        )}

      </div>

      {/* Right Side */}

      {/* RIGHT PAYMENT PANEL */}

<div className="bg-white rounded-xl shadow border sticky top-5 h-fit">

    <div className="p-5 border-b">

        <h2 className="text-xl font-bold">
            Payment Summary
        </h2>

        <p className="text-sm text-gray-500 mt-1">
            Review selected dues and collect payment.
        </p>

    </div>

    <div className="p-5 space-y-5">

        {/* Summary */}

        <div className="space-y-3">

            <div className="flex justify-between">

                <span>Selected Dues</span>

               <strong>

₹{selectedAmount}

</strong>

            </div>

            <div className="flex justify-between">

                <span>Late Fee</span>

               <strong>

₹{effectiveLateFee}

</strong>

            </div>

            <div className="flex justify-between">

                <span>Discount</span>

               <strong>

-₹{discount}

</strong>

            </div>

<div className="flex justify-between">

<span>

Additional Charge

</span>

<strong>

₹{extraCharge}

</strong>

</div>
            <hr />

            <div className="flex justify-between text-lg">

                <span className="font-bold">
                    Amount Payable
                </span>

               <strong>

₹{payable}

</strong>

            </div>

        </div>

        {/* Payment Mode */}

        <div>

            <label className="font-medium block mb-2">

                Payment Mode

            </label>

            <div className="grid grid-cols-2 gap-3">

                <button
onClick={() => setPaymentMode("single")}
className={`rounded-lg py-2 ${
paymentMode==="single"
?"bg-blue-600 text-white"
:"border"
}`}
>

Single Payment

</button>

<button
onClick={() => setPaymentMode("split")}
className={`rounded-lg py-2 ${
paymentMode==="split"
?"bg-blue-600 text-white"
:"border"
}`}
>

Split Payment

</button>

            </div>

        </div>

        {/* Payment Method */}
       {
paymentMode==="single"

?

(
<>

        <div>
            

            <label className="block mb-2 font-medium">

                Payment Method

            </label>

            <select className="w-full border rounded-lg p-3">

                <option>Cash</option>

                <option>UPI</option>

                <option>Cheque</option>

                <option>Bank Transfer</option>

                <option>Online Gateway</option>

            </select>

        </div>

        {/* Reference */}

        <div>

            <label className="block mb-2 font-medium">

                Transaction Reference

            </label>

            <input

                type="text"

                placeholder="Enter UPI / Cheque / Txn ID"

                className="w-full border rounded-lg p-3"

            />

        </div>

        {/* Amount */}

        <div>

            <label className="block mb-2 font-medium">

                Amount Received

            </label>

           <input
type="number"
value={amountReceived}
onChange={(e)=>setAmountReceived(Number(e.target.value))}
className="w-full border rounded-lg p-3"
/>

        </div>
        </>
)

:

(
<>


{
paymentRows.map((row)=>(

<div
key={row.id}
className="flex gap-3 mb-3"
>

<select

value={row.method}

onChange={(e)=>{

setPaymentRows(

paymentRows.map((item)=>

item.id===row.id

?

{...item,method:e.target.value}

:

item

)

)

}}

className="w-40 border rounded-lg p-3"
>

<option>Cash</option>
<option>UPI</option>
<option>Cheque</option>
<option>Card</option>

</select>

<input

type="number"

value={row.amount}

onChange={(e)=>{

setPaymentRows(

paymentRows.map((item)=>

item.id===row.id

?

{...item,amount:Number(e.target.value)}

:

item

)

)

}}

className="flex-1 border rounded-lg p-3"

/>

<button

onClick={()=>removePayment(row.id)}

className="border px-3 rounded-lg"

>

×

</button>

</div>

))
}

<button

onClick={addPaymentRow}

className="w-full border rounded-lg py-3"

>

Add Payment Method

</button>

</>
)
}

        {/* Remaining */}

        <div className="bg-gray-50 rounded-xl p-4 space-y-3">

            <div className="flex justify-between">

                <span>Total Received</span>

               <strong>

₹{totalReceived}

</strong>

            </div>

            <div className="flex justify-between">

                <span>Remaining</span>

                <strong
className={
remaining>0
?
"text-red-600"
:
"text-green-600"
}
>

₹{remaining}

</strong>

            </div>

            <div className="flex justify-between">

                <span>Advance</span>

                <strong className="text-green-600">

₹{Math.max(0,totalReceived-payable)}

</strong>

            </div>

        </div>

        {/* Remarks */}

        <div>

            <label className="block mb-2 font-medium">

                Remarks

            </label>

            <textarea

                rows="4"

                placeholder="Optional remarks..."

                className="w-full border rounded-lg p-3"

            />

        </div>

        {/* Buttons */}

        <div className="space-y-3">

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">

                Review Payment

            </button>

            <button className="w-full border py-3 rounded-lg">

                Save as Draft

            </button>

        </div>

    </div>

</div>

    
{
showWaiverModal && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center">

<div className="bg-white rounded-xl w-[600px] p-6">

<h2 className="text-2xl font-bold mb-5">

Waive Late Fee

</h2>

<label>

Waiver Amount

</label>

<input

type="number"

value={waiverAmount}

onChange={(e)=>setWaiverAmount(Number(e.target.value))}

className="w-full border rounded-lg p-3 mt-2"

/>

<label className="block mt-5">

Reason

</label>

<textarea

value={waiverReason}

onChange={(e)=>setWaiverReason(e.target.value)}

className="w-full border rounded-lg p-3 mt-2"

/>

<div className="flex justify-end gap-3 mt-6">

<button

onClick={()=>setShowWaiverModal(false)}

>

Cancel

</button>

<button

onClick={() => {

    if (waiverAmount > totalLateFee) {

        alert("Waiver cannot be greater than Late Fee");

        return;
    }

    setShowWaiverModal(false);

}}
className="bg-blue-600 text-white px-5 py-2 rounded-lg"

>

Apply

</button>

</div>

</div>

</div>

)
}

{
showChargeModal && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center">

<div className="bg-white rounded-xl w-[650px] p-6">

<h2 className="text-2xl font-bold">

Add Charge

</h2>

<div className="grid grid-cols-2 gap-5 mt-5">

<div>

<label>

Charge Name

</label>

<input

value={chargeName}

onChange={(e)=>setChargeName(e.target.value)}

className="w-full border rounded-lg p-3"

/>

</div>

<div>

<label>

Amount

</label>

<input

type="number"

value={chargeAmount}

onChange={(e)=>setChargeAmount(Number(e.target.value))}

className="w-full border rounded-lg p-3"

/>

</div>

</div>

<label className="block mt-5">

Reason

</label>

<textarea

value={chargeReason}

onChange={(e)=>setChargeReason(e.target.value)}

className="w-full border rounded-lg p-3 mt-2"

/>

<div className="flex justify-end gap-3 mt-6">

<button

onClick={()=>setShowChargeModal(false)}

>

Cancel

</button>

<button

onClick={()=>{

setExtraCharge(chargeAmount);

setShowChargeModal(false);

}}

className="bg-blue-600 text-white px-5 py-2 rounded-lg"

>

Apply

</button>

</div>

</div>

</div>

)
}
    </div>
  );
}