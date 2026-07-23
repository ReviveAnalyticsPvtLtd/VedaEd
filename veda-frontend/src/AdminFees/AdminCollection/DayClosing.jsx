import React, { useMemo, useState } from "react";

export default function DayClosing() {

  const [expectedCash] = useState(25000);
  const [actualCash, setActualCash] = useState("");
  const [remarks, setRemarks] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
const [dayClosed, setDayClosed] = useState(false);

  const summary = {
    cash: 20000,
    upi: 12000,
    bankTransfer: 8000,
    cheque: 0,
    onlineGateway: 0,
    refunds: 0,
  };

  const netCollection =
    summary.cash +
    summary.upi +
    summary.bankTransfer +
    summary.cheque +
    summary.onlineGateway -
    summary.refunds;

  const difference = useMemo(() => {
    return Number(actualCash || 0) - expectedCash;
  }, [actualCash, expectedCash]);
const resetDay = () => {

setActualCash("");

setRemarks("");

setDayClosed(false);

alert("New Day Started");

};
  return (

<div className="grid lg:grid-cols-3 gap-4">

{/* LEFT */}

<div className="lg:col-span-2">

<div className="bg-white rounded-xl border">

<div className="flex justify-between items-center p-6">

<h2 className="text-xl font-bold">

Collection Summary

</h2>

<p className="text-gray-500">

15 Jul 2026

</p>

</div>

<div className="px-6 pb-6">

{[
["Cash",summary.cash],
["UPI",summary.upi],
["Bank Transfer",summary.bankTransfer],
["Cheque",summary.cheque],
["Online Gateway",summary.onlineGateway],
["Refunds",summary.refunds],
].map(([label,value])=>(

<div
key={label}
className="flex justify-between py-4 border-b"
>

<span className="text-lg">

{label}

</span>

<strong className="text-xl">

₹{Number(value).toLocaleString()}

</strong>

</div>

))}

<div className="flex justify-between pt-5">

<h2 className="text-xl font-bold">

Net Collection

</h2>

<h2 className="text-xl font-bold">

₹{netCollection.toLocaleString()}

</h2>

</div>

</div>

</div>

</div>

{/* RIGHT */}

<div>

<div className="bg-white rounded-2xl border">

<div className="flex justify-between gap-2 items-center p-6 mb-2">

<h2 className="text-xl font-bold">

Cash Reconciliation

</h2>

<p className="text-gray-500">

Required before closing

</p>

</div>

<div className="px-6 pb-6 space-y-5">

<div>

<label className="font-medium">

Expected Cash

</label>

<input

value={expectedCash}

readOnly

className="w-full border rounded-lg p-3 mt-2 bg-gray-50"

/>

</div>

<div>

<label className="font-medium">

Actual Cash Counted

</label>

<input

type="number"

value={actualCash}

onChange={(e)=>setActualCash(e.target.value)}

className="w-full border rounded-lg p-3 mt-2"

/>

</div>

<div className="flex justify-between text-xl border-t pt-4">

<span>

Difference

</span>

<strong

className={

difference===0

?

"text-green-600"

:

"text-red-600"

}

>

₹{difference.toLocaleString()}

</strong>

</div>

<div>

<label className="font-medium">

Closing Remarks

</label>

<textarea

rows="4"

value={remarks}

onChange={(e)=>setRemarks(e.target.value)}

placeholder="Required when there is a difference"

className="w-full border rounded-lg p-3 mt-2"

/>

</div>

<button

disabled={dayClosed}

onClick={() => {

if(difference!==0 && remarks.trim()===""){

alert("Please enter closing remarks.");

return;

}

setShowConfirm(true);

}}

className={`w-full py-4 rounded-xl font-semibold text-white

${dayClosed

?

"bg-gray-400 cursor-not-allowed"

:

"bg-blue-600 hover:bg-blue-700"

}

`}
>

Close Day

</button>

</div>
<div className="grid grid-cols-3 gap-3 mt-4 px-6 pb-6 ">

<button

onClick={()=>window.print()}

disabled={!dayClosed}

className={`py-3 rounded-xl

${dayClosed

?

"bg-gray-800 text-white"

:

"bg-gray-200 text-gray-400 cursor-not-allowed"

}

`}

>

Print Report

</button>

<button

onClick={()=>alert("Downloading Closing Report...")}

disabled={!dayClosed}

className={`py-3 rounded-xl

${dayClosed

?

"bg-green-600 text-white"

:

"bg-gray-200 text-gray-400 cursor-not-allowed"

}

`}

>

Download

</button>

<button

onClick={resetDay}

className="bg-orange-500 text-white py-3 rounded-xl"

>

Reset Day

</button>
</div>
</div>

<div className="border rounded-xl p-5 mt-5 bg-gray-50">

<h3 className="text-xl font-bold mb-4">

Closing Summary

</h3>

<div className="space-y-3">

<div className="flex justify-between">

<span>

Net Collection

</span>

<strong>

₹{netCollection.toLocaleString()}

</strong>

</div>

<div className="flex justify-between">

<span>

Expected Cash

</span>

<strong>

₹{expectedCash.toLocaleString()}

</strong>

</div>

<div className="flex justify-between">

<span>

Actual Cash

</span>

<strong>

₹{Number(actualCash||0).toLocaleString()}

</strong>

</div>

<div className="flex justify-between">

<span>

Difference

</span>

<strong
className={difference===0?"text-green-600":"text-red-600"}
>

₹{difference.toLocaleString()}

</strong>

</div>

<div className="flex justify-between">

<span>

Status

</span>

<strong
className={dayClosed?"text-green-600":"text-orange-600"}
>

{dayClosed

?

"Day Closed"

:

"Pending"}

</strong>
</div>
</div>

</div>

</div>





{/* Confirm Modal */}

{showConfirm && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white rounded-2xl w-[500px]">

<div className="border-b p-6">

<h2 className="text-2xl font-bold">

Confirm Day Closing

</h2>

</div>

<div className="p-6 space-y-4">

<div className="flex justify-between">

<span>

Expected Cash

</span>

<strong>

₹{expectedCash.toLocaleString()}

</strong>

</div>

<div className="flex justify-between">

<span>

Actual Cash

</span>

<strong>

₹{Number(actualCash||0).toLocaleString()}

</strong>

</div>

<div className="flex justify-between">

<span>

Difference

</span>

<strong
className={difference===0 ? "text-green-600":"text-red-600"}
>

₹{difference.toLocaleString()}

</strong>

</div>

<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">

Once the day is closed, no more cash transactions can be entered for today.

</div>

<div className="flex justify-end gap-3">

<button

onClick={()=>setShowConfirm(false)}

className="border px-5 py-3 rounded-xl"

>

Cancel

</button>

<button

onClick={()=>{

setShowConfirm(false);

setDayClosed(true);

alert("Day Closed Successfully");

}}

className="bg-blue-600 text-white px-6 py-3 rounded-xl"

>

Confirm Close

</button>

</div>

</div>

</div>

</div>

)}
{/* Success */}

{dayClosed && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white rounded-2xl w-[450px] text-center p-8">

<div className="text-6xl">

✅

</div>

<h2 className="text-3xl font-bold mt-4">

Day Closed Successfully

</h2>

<p className="text-gray-500 mt-3">

Cash counter has been closed.

Daily collection has been finalized.

</p>

<button

onClick={()=>setDayClosed(false)}

className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl"

>

Done

</button>

</div>

</div>

)}
</div>

  );

}