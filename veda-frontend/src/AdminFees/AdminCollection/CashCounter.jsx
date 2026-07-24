<<<<<<< HEAD
import React, { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";

export default function CashCounter() {

const [search,setSearch]=useState("");
const [counterOpen,setCounterOpen]=useState(false);

const [showCounterModal,setShowCounterModal]=useState(false);
const [notes500,setNotes500]=useState(0);
const [notes200,setNotes200]=useState(0);
const [notes100,setNotes100]=useState(0);
const [notes50,setNotes50]=useState(0);
const [notes20,setNotes20]=useState(0);
const [notes10,setNotes10]=useState(0);
const [coins,setCoins]=useState(0);
const transactions=[

{
id:1,
time:"09:42",
receipt:"VS-REC-1083",
student:"Ananya Patel",
amount:20000,
type:"Collection",
status:"Successful"
},

{
id:2,
time:"10:15",
receipt:"VS-REC-1084",
student:"Aarav Sharma",
amount:12000,
type:"Collection",
status:"Successful"
},

{
id:3,
time:"11:30",
receipt:"VS-REF-001",
student:"Rohan Verma",
amount:3000,
type:"Refund",
status:"Refunded"
},

{
id:4,
time:"12:40",
receipt:"VS-REC-1085",
student:"Neha Jain",
amount:6000,
type:"Collection",
status:"Successful"
}

];

const filtered=useMemo(()=>{

return transactions.filter(item=>

item.student.toLowerCase().includes(search.toLowerCase())||

item.receipt.toLowerCase().includes(search.toLowerCase())

);

},[search]);

const badge=(status)=>{

switch(status){

case "Successful":

return "bg-green-100 text-green-700";

case "Refunded":

return "bg-red-100 text-red-700";

default:

return "bg-gray-100";

}

};

return(

<div>

{/* Search */}

<div className="flex justify-between items-center mb-6">

<div className="relative">

<FiSearch className="absolute left-3 top-3 text-gray-400"/>

<input

value={search}

onChange={(e)=>setSearch(e.target.value)}

placeholder="Search receipt or student..."

className="border rounded-lg pl-10 pr-4 py-3 w-96"

/>

</div>

<button

onClick={()=>setShowCounterModal(true)}

className={`px-5 py-3 rounded-xl text-white

${counterOpen

?

"bg-red-600"

:

"bg-blue-600"

}

`}

>

{counterOpen

?

"Close Counter"

:

"Open Counter"

}

</button>

</div>

{/* Cards */}

<div className="grid grid-cols-4 gap-5 mb-6 ">

<div className="border rounded-xl p-5 bg-white">

<p className="text-gray-500">

Opening Cash

</p>

<h2 className="text-3xl font-bold mt-2">

₹5,000

</h2>

</div>

<div className="border rounded-xl p-5 bg-white">

<p className="text-gray-500">

Cash Collected

</p>

<h2 className="text-3xl font-bold mt-2 text-green-600">

₹20,000

</h2>

</div>

<div className="border rounded-xl p-5 bg-white">

<p className="text-gray-500">

Cash Refunds

</p>

<h2 className="text-3xl font-bold mt-2 text-red-600">

₹3,000

</h2>

</div>

<div className="border rounded-xl p-5 bg-white">

<p className="text-gray-500">

Expected Cash

</p>

<h2 className="text-3xl font-bold mt-2">

₹22,000

</h2>

</div>

</div>

{/* Transactions */}

<div className="border  overflow-hidden bg-white rounded-xl ">

<div className="flex justify-between p-5 border-b">

<h2 className="text-2xl font-bold">

Counter Transactions

</h2>

<span className="text-gray-500">

Current Session

</span>

</div>

<table className="w-full">

<thead className="bg-gray-50">

<tr>

<th className="text-left p-4">

Time

</th>

<th>

Receipt

</th>

<th>

Student

</th>

<th className="text-right">

Amount

</th>

<th>

Type

</th>

<th>

Status

</th>

</tr>

</thead>

<tbody>

{filtered.map(item=>(

<tr
key={item.id}
className="border-t hover:bg-gray-50"
>

<td className="p-4">

{item.time}

</td>

<td>

{item.receipt}

</td>

<td>

{item.student}

</td>

<td className="text-right font-semibold">

₹{item.amount.toLocaleString()}

</td>

<td>

{item.type}

</td>

<td>

<span
className={`px-3 py-1 rounded-full ${badge(item.status)}`}
>

{item.status}

</span>

</td>

</tr>

))}

</tbody>

</table>

</div>
{/* Cash Counting */}

<div className="border rounded-xl mt-6 bg-white rounded-xl border">

<div className="border-b p-5 ">

<h2 className="text-2xl font-bold">

Cash Counting

</h2>

</div>

<div className="grid grid-cols-2 gap-4 p-6">

{/* Left */}

<div className="space-y-4 ">

{[
["₹500",500,notes500,setNotes500],
["₹200",200,notes200,setNotes200],
["₹100",100,notes100,setNotes100],
["₹50",50,notes50,setNotes50],
["₹20",20,notes20,setNotes20],
["₹10",10,notes10,setNotes10],

].map(([label,value,state,setter])=>(

<div
key={label}
className="flex justify-between items-center"
>

<span className="font-medium">

{label}

</span>

<input

type="number"

value={state}

onChange={(e)=>setter(Number(e.target.value))}

className="border rounded-lg w-28 p-2"

/>

<span className="font-semibold w-28 text-right">

₹{(state*value).toLocaleString()}

</span>

</div>

))}

<div className="flex justify-between items-center">

<span>

Coins

</span>

<input

type="number"

value={coins}

onChange={(e)=>setCoins(Number(e.target.value))}

className="border rounded-lg w-28 p-2"

/>

</div>

</div>

{/* Right */}

<div className="border rounded-xl p-5 bg-gray-50">

{(()=>{

const counted=

notes500*500+

notes200*200+

notes100*100+

notes50*50+

notes20*20+

notes10*10+

coins;

const expected=22000;

const diff=counted-expected;

return(

<>

<div className="flex justify-between mb-4">

<span>

Expected Cash

</span>

<strong>

₹{expected.toLocaleString()}

</strong>

</div>

<div className="flex justify-between mb-4">

<span>

Counted Cash

</span>

<strong>

₹{counted.toLocaleString()}

</strong>

</div>

<div className="flex justify-between mb-6">

<span>

Difference

</span>

<strong

className={

diff===0

?

"text-green-600"

:

"text-red-600"

}

>

₹{diff.toLocaleString()}

</strong>

</div>

<button

onClick={()=>window.print()}

className="w-full bg-blue-600 text-white py-3 rounded-xl"

>

Print Counter Report

</button>

</>

)

})()}

</div>

</div>

</div>
{showCounterModal && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white rounded-2xl w-[600px]">

<div className="border-b px-6 py-5 flex justify-between items-center">

<h2 className="text-2xl font-bold">

{counterOpen

?

"Close Cash Counter"

:

"Open Cash Counter"

}

</h2>

<button

onClick={()=>setShowCounterModal(false)}

className="text-3xl"

>

×

</button>

</div>

<div className="p-6 space-y-5">

<div>

<label className="font-medium">

Cashier Name

</label>

<input

defaultValue="School Admin"

className="w-full border rounded-lg p-3 mt-2"

/>

</div>

<div>

<label className="font-medium">

Counter Number

</label>

<input

defaultValue="COUNTER-01"

className="w-full border rounded-lg p-3 mt-2"

/>

</div>

<div>

<label className="font-medium">

Opening Cash

</label>

<input

defaultValue="5000"

className="w-full border rounded-lg p-3 mt-2"

/>

</div>

<div>

<label className="font-medium">

Notes

</label>

<textarea

rows="3"

className="w-full border rounded-lg p-3 mt-2"

placeholder="Opening remarks..."

>

</textarea>

</div>

<div className="flex justify-end gap-3">

<button

onClick={()=>setShowCounterModal(false)}

className="border px-5 py-3 rounded-xl"

>

Cancel

</button>

<button

onClick={()=>{

setCounterOpen(!counterOpen);

setShowCounterModal(false);

alert(

counterOpen

?

"Cash Counter Closed"

:

"Cash Counter Opened"

);

}}

className={`px-6 py-3 rounded-xl text-white

${counterOpen

?

"bg-red-600"

:

"bg-blue-600"

}

`}

>

{counterOpen

?

"Close Counter"

:

"Open Counter"

}

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
import { FiDollarSign, FiSmartphone, FiInbox } from "react-icons/fi";
import axios from "../../services/apiClient";
import config from "../../config";

export default function CashCounter() {
  const [stats, setStats] = useState({
    Cash: 0,
    UPI: 0,
    Cheque: 0,
    "Bank Transfer": 0,
    "Online Gateway": 0,
    Total: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchTodayStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.API_BASE_URL}/fees/collect/payments`);
      
      const todayStr = new Date().toDateString();
      const todayTxs = res.data.filter(t => new Date(t.date).toDateString() === todayStr);

      const totals = {
        Cash: 0,
        UPI: 0,
        Cheque: 0,
        "Bank Transfer": 0,
        "Online Gateway": 0,
        Total: 0
      };

      todayTxs.forEach(t => {
        const method = t.paymentMethod || "Cash";
        if (totals[method] !== undefined) {
          totals[method] += t.totalAmount;
        } else {
          totals["Cash"] += t.totalAmount;
        }
        totals.Total += t.totalAmount;
      });

      setStats(totals);
    } catch (err) {
      console.error("Failed to load today's collections", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStats();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow border p-5">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Today's Cash Counter</h2>
          <p className="text-gray-500 text-sm mt-1">
            Summary of fees received today, categorized by payment mode.
          </p>
        </div>
        <div className="text-sm font-semibold bg-green-50 text-green-700 px-3 py-1 rounded-lg">
          Date: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading counter summaries...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-green-200 rounded-xl p-5 bg-green-50/30 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Cash Drawer</p>
              <h2 className="text-3xl font-black mt-2 text-green-700">₹{stats.Cash.toLocaleString()}</h2>
            </div>
            <div className="p-3 bg-green-100 text-green-700 rounded-lg">
              <FiDollarSign size={24} />
            </div>
          </div>

          <div className="border border-blue-200 rounded-xl p-5 bg-blue-50/30 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">UPI & QR Pay</p>
              <h2 className="text-3xl font-black mt-2 text-blue-700">₹{stats.UPI.toLocaleString()}</h2>
            </div>
            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
              <FiSmartphone size={24} />
            </div>
          </div>

          <div className="border border-yellow-200 rounded-xl p-5 bg-yellow-50/30 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Cheques Drawer</p>
              <h2 className="text-3xl font-black mt-2 text-yellow-700">₹{stats.Cheque.toLocaleString()}</h2>
            </div>
            <div className="p-3 bg-yellow-100 text-yellow-700 rounded-lg">
              <FiInbox size={24} />
            </div>
          </div>

          <div className="md:col-span-3 border rounded-xl overflow-hidden mt-4">
            <div className="p-4 bg-gray-50 font-bold text-gray-700 border-b">Detailed Breakdown</div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-sm py-1 border-b">
                <span className="text-gray-600">Cash Collections</span>
                <span className="font-semibold">₹{stats.Cash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b">
                <span className="text-gray-600">UPI Payments</span>
                <span className="font-semibold">₹{stats.UPI.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b">
                <span className="text-gray-600">Cheques Collected</span>
                <span className="font-semibold">₹{stats.Cheque.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b">
                <span className="text-gray-600">Bank Transfers (NEFT/IMPS)</span>
                <span className="font-semibold">₹{stats["Bank Transfer"].toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b">
                <span className="text-gray-600">Online Gateways</span>
                <span className="font-semibold">₹{stats["Online Gateway"].toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base py-2 font-black text-gray-900 border-t">
                <span>Total Collected Today</span>
                <span className="text-green-700">₹{stats.Total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
>>>>>>> f1bfd88 (done)
