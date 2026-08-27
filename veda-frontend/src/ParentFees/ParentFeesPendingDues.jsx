import React from "react";
import { useNavigate } from "react-router-dom";
export default function ParentPendingDues() {
  const students = [
    {
      id: 1,
      name: "Aarav Sharma",
      class: "Class 5-A",
      dues: [
        { title: "Tuition Fee", amount: 5000 },
        { title: "Transport Fee", amount: 1000 },
      ],
    },
    {
      id: 2,
      name: "Ananya Sharma",
      class: "Class 2-B",
      dues: [
        { title: "Tuition Fee", amount: 4000 },
        { title: "Exam Fee", amount: 800 },
      ],
    },
    {
      id: 3,
      name: "Vivaan Sharma",
      class: "Class 7-C",
      dues: [
        { title: "Tuition Fee", amount: 6000 },
        { title: "Transport Fee", amount: 1200 },
      ],
    },
  ];

  const grandTotal = students.reduce(
    (total, student) =>
      total +
      student.dues.reduce((sum, due) => sum + due.amount, 0),
    0
  );
const navigate = useNavigate();
  return (
   <div className="p-0 min-h-screen">
    <div className="flex items-center justify-between mb-2">
           <h2 className="text-2xl font-bold">Pending Dues </h2>
         </div>
 {/* Tabs */}
          <div className="flex gap-3 text-sm mb-3 text-gray-600 border-b">
            <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
              Overview
            </button>
          </div>
      <div className="bg-white border rounded-lg"></div>
      {students.map((student) => {
        const total = student.dues.reduce(
          (sum, due) => sum + due.amount,
          0
        );
        
        

        return (
            
          <div
            key={student.id}
            className="bg-white rounded-xl shadow p-5 mb-5"
          >
            <div className="flex justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {student.name}
                </h3>

                <p className="text-gray-500">
                  {student.class}
                </p>
              </div>

              <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full font-semibold">
                Pending ₹{total}
              </span>
            </div>

            {student.dues.map((due) => (
              <div
                key={due.title}
                className="flex justify-between border-b py-2"
              >
                <span>{due.title}</span>
                <span>₹{due.amount}</span>
              </div>
            ))}

            <div className="flex justify-between mt-3 font-bold text-lg">
              <span>Total Pending</span>
              <span className="text-red-600">₹{total}</span>
            </div>
          </div>
        );
      })}

      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex justify-between text-2xl font-bold">
          <span>Grand Pending</span>
          <span className="text-red-600">
            ₹{grandTotal}
          </span>
        </div>

       <button
  onClick={() => navigate("/parent/fees/pay")}
  className="w-full mt-5 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg"
>
  Pay Now
</button>
      </div>

    </div>
  );
}