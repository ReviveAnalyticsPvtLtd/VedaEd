import React, { useState } from "react";
import { FiArrowLeft, FiMoreVertical } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function FeeAccount() {

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");

  // Dummy Student
  const student = {
    name: "Aarav Sharma",
    admission: "VS-1024",
    class: "8-A",
    section: "A",
    totalFee: 50000,
    paid: 30000,
    pending: 20000,
    academicYear: "2026-27",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">

      {/* Back */}

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-blue-600 font-semibold mb-5"
      >
        <FiArrowLeft />
        Back to Collection
      </button>

      {/* Main Card */}

      <div className="bg-white rounded-2xl shadow border overflow-hidden">

        {/* Header */}

        <div className="border-b p-4">

          <h1 className="text-2xl font-bold">
            Student Fee Account
          </h1>

          <p className="text-gray-500 mt-1">
            Academic Year {student.academicYear}
          </p>

        </div>

        {/* Student */}

        <div className="p-4 flex justify-between items-start">

          <div className="flex gap-5">

            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700">

              {student.name[0]}

            </div>

            <div>

              <h2 className="text-xl font-bold">

                {student.name}

              </h2>

              <p className="text-gray-500 mt-1">

                Grade {student.class} • {student.admission}

              </p>

            </div>

          </div>

        </div>

        {/* Cards */}

        <div className="grid md:grid-cols-3 gap-5 px-6">

          <div className="border rounded-xl p-5">

            <p className="text-gray-500">

              Total Fee

            </p>

            <h2 className="text-xl font-bold mt-2">

              ₹{student.totalFee.toLocaleString()}

            </h2>

          </div>

          <div className="border rounded-xl p-5">

            <p className="text-gray-500">

              Paid

            </p>

            <h2 className="text-xl font-bold text-green-600 mt-2">

              ₹{student.paid.toLocaleString()}

            </h2>

          </div>

          <div className="border rounded-xl p-5">

            <p className="text-gray-500">

              Pending

            </p>

            <h2 className="text-xl font-bold text-red-600 mt-2">

              ₹{student.pending.toLocaleString()}

            </h2>

          </div>

        </div>

        {/* Buttons */}

        <div className="flex gap-4 px-6 mt-6">

          <button
            onClick={() => navigate("/admin-fees/collection")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Collect Payment
          </button>

          <button className="border rounded-xl px-6 py-3 flex items-center gap-2">

            <FiMoreVertical />

            Actions

          </button>

        </div>

        {/* Tabs */}

        <div className="flex gap-10 px-6 mt-8 border-b">

          {[
            "overview",
            "schedule",
            "payments",
            "activity",
          ].map((tab) => (

            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 capitalize ${
                activeTab === tab
                  ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                  : "text-gray-500"
              }`}
            >
              {tab}
            </button>

          ))}

        </div>

        {/* Content */}

        <div className="p-4">

          {activeTab === "overview" && (

<div className="space-y-6">

    {/* Fee Schedule */}

    <div className="border rounded-2xl p-4">

        <h2 className="text-xl font-bold mb-6">

            Fee Schedule

        </h2>

        <div className="space-y-5">

            <div className="border rounded-xl p-5 flex justify-between items-center hover:bg-gray-50">

                <div>

                    <h3 className="text-xl font-bold">

                        Term 1

                    </h3>

                    <p className="text-gray-500 mt-1">

                        10 Apr 2026

                    </p>

                </div>

                <div className="text-right">

                    <h3 className="text-xl font-bold">

                        ₹20,000

                    </h3>

                    <span className="inline-block mt-2 px-4 py-1 rounded-full bg-green-100 text-green-700 font-semibold">

                        Paid

                    </span>

                </div>

            </div>

            <div className="border rounded-xl p-5 flex justify-between items-center hover:bg-gray-50">

                <div>

                    <h3 className="text-xl font-bold">

                        Term 2

                    </h3>

                    <p className="text-gray-500 mt-1">

                        10 Aug 2026

                    </p>

                </div>

                <div className="text-right">

                    <h3 className="text-xl font-bold">

                        ₹20,000

                    </h3>

                    <span className="inline-block mt-2 px-4 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold">

                        ₹10,000 Pending

                    </span>

                </div>

            </div>

            <div className="border rounded-xl p-5 flex justify-between items-center hover:bg-gray-50">

                <div>

                    <h3 className="text-xl font-bold">

                        Term 3

                    </h3>

                    <p className="text-gray-500 mt-1">

                        10 Dec 2026

                    </p>

                </div>

                <div className="text-right">

                    <h3 className="text-xl font-bold">

                        ₹10,000

                    </h3>

                    <span className="inline-block mt-2 px-4 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold">

                        Upcoming

                    </span>

                </div>

            </div>

        </div>

    </div>

    {/* Activity */}

    <div>

        <h2 className="text-xl font-bold mb-5">

            Activity History

        </h2>

        <div className="space-y-5">

            <div className="border-l-4 border-blue-500 pl-5">

                <h3 className="font-bold text-lg">

                    ₹10,000 payment collected

                </h3>

                <p className="text-gray-500 mt-1">

                    14 Jul 2026 • UPI • School Admin

                </p>

            </div>

            <div className="border-l-4 border-orange-500 pl-5">

                <h3 className="font-bold text-lg">

                    Late Fee Waived : ₹500

                </h3>

                <p className="text-gray-500 mt-1">

                    12 Jul 2026

                </p>

                <p className="text-gray-500">

                    Reason : Medical Emergency

                </p>

            </div>

            <div className="border-l-4 border-green-500 pl-5">

                <h3 className="font-bold text-lg">

                    Fee Structure Assigned

                </h3>

                <p className="text-gray-500 mt-1">

                    02 Apr 2026

                </p>

                <p className="text-gray-500">

                    Grade 8 Standard

                </p>

            </div>

        </div>

    </div>

</div>

)}

         {activeTab === "schedule" && (

<div className="space-y-6">

    {/* Header */}

    <div className="flex justify-between items-center">

        <div>

            <h2 className="text-xl font-bold">

                Fee Installment Schedule

            </h2>

            <p className="text-gray-500 mt-1">

                Academic Year 2026-27

            </p>

        </div>

        <button className="bg-blue-600 text-white px-5 py-3 rounded-xl">

            Print Schedule

        </button>

    </div>

    {/* Table */}

    <div className="border rounded-2xl overflow-hidden">

        <table className="w-full">

            <thead className="bg-gray-100">

                <tr>

                    <th className="text-left p-4">

                        Installment

                    </th>

                    <th className="text-left p-4">

                        Due Date

                    </th>

                    <th className="text-right p-4">

                        Total

                    </th>

                    <th className="text-right p-4">

                        Paid

                    </th>

                    <th className="text-right p-4">

                        Pending

                    </th>

                    <th className="text-center p-4">

                        Status

                    </th>

                </tr>

            </thead>

            <tbody>

                <tr className="border-t">

                    <td className="p-4 font-semibold">

                        Term 1

                    </td>

                    <td>

                        10 Apr 2026

                    </td>

                    <td className="text-right">

                        ₹20,000

                    </td>

                    <td className="text-right text-green-600 font-semibold">

                        ₹20,000

                    </td>

                    <td className="text-right">

                        ₹0

                    </td>

                    <td className="text-center">

                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">

                            Paid

                        </span>

                    </td>

                </tr>

                <tr className="border-t">

                    <td className="p-4 font-semibold">

                        Term 2

                    </td>

                    <td>

                        10 Aug 2026

                    </td>

                    <td className="text-right">

                        ₹20,000

                    </td>

                    <td className="text-right text-blue-600 font-semibold">

                        ₹10,000

                    </td>

                    <td className="text-right text-red-600 font-semibold">

                        ₹10,000

                    </td>

                    <td className="text-center">

                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">

                            Partial

                        </span>

                    </td>

                </tr>

                <tr className="border-t">

                    <td className="p-4 font-semibold">

                        Term 3

                    </td>

                    <td>

                        10 Dec 2026

                    </td>

                    <td className="text-right">

                        ₹10,000

                    </td>

                    <td className="text-right">

                        ₹0

                    </td>

                    <td className="text-right text-red-600 font-semibold">

                        ₹10,000

                    </td>

                    <td className="text-center">

                        <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full">

                            Upcoming

                        </span>

                    </td>

                </tr>

            </tbody>

        </table>

    </div>

    {/* Progress */}

    <div className="border rounded-2xl p-6">

        <div className="flex justify-between">

            <h2 className="text-xl font-bold">

                Collection Progress

            </h2>

            <strong>

                60%

            </strong>

        </div>

        <div className="w-full bg-gray-200 h-4 rounded-full mt-5">

            <div className="bg-blue-600 h-4 rounded-full w-3/5">

            </div>

        </div>

        <div className="grid grid-cols-3 gap-5 mt-6">

            <div>

                <p className="text-gray-500">

                    Total Fee

                </p>

                <h2 className="font-bold text-2xl">

                    ₹50,000

                </h2>

            </div>

            <div>

                <p className="text-gray-500">

                    Collected

                </p>

                <h2 className="font-bold text-2xl text-green-600">

                    ₹30,000

                </h2>

            </div>

            <div>

                <p className="text-gray-500">

                    Pending

                </p>

                <h2 className="font-bold text-2xl text-red-600">

                    ₹20,000

                </h2>

            </div>

        </div>

    </div>

</div>

)}

          {activeTab === "payments" && (

            <div className="text-gray-500">

              Payments Content

            </div>

          )}

          {activeTab === "activity" && (

            <div className="text-gray-500">

              Activity Content

            </div>

          )}

        </div>

      </div>

    </div>
  );
}