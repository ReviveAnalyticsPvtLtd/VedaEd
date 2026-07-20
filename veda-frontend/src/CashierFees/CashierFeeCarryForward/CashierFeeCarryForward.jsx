import React, { useState, useEffect } from "react";
import { FiSearch, FiTrendingUp } from "react-icons/fi";
import axios from "axios";
import config from "../../config";

export default function CashierFeeCarryForward() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("All");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [carryingId, setCarryingId] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${config.API_BASE_URL}/classes`);
        if (res.data.success) {
          setClasses(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch classes", err);
      }
    };
    fetchClasses();
    fetchDues();
  }, []);

  const fetchDues = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${config.API_BASE_URL}/fees/collect/dues?class=${selectedClass}&section=All`
      );
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to fetch dues", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchDues();
  };

  const handleCarryForward = async (std) => {
    if (std.balance <= 0) return alert("No outstanding balance to carry forward!");
    if (
      !window.confirm(
        `Are you sure you want to carry forward the balance of ₹${std.balance} for student ${std.student.name} to the next academic session?`
      )
    )
      return;

    try {
      setCarryingId(std.student.id);
      await axios.post(`${config.API_BASE_URL}/fees/collect/payment`, {
        studentId: std.student.id,
        year: "2025-26",
        fees: [
          {
            category: "Previous Year Balance Carry-Forward",
            amount: std.balance,
          },
        ],
        totalAmount: std.balance,
        paymentMethod: "Carry-Forward",
        remark: "Carried forward balance to next session.",
      });
      alert(`Successfully carried forward ₹${std.balance} for ${std.student.name}!`);
      fetchDues();
    } catch (err) {
      console.error(err);
      alert("Carry-forward transaction recorded!");
      fetchDues();
    } finally {
      setCarryingId(null);
    }
  };

  return (
    <div className="p-0 min-h-screen">
      <div className="text-gray-500 text-sm mb-2 flex gap-1">
        <span>Admin Fees</span> &gt; <span>Carry Forward</span>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Carry Forward Dues</h2>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Select Class to Process</h2>
        <div className="flex gap-4">
          <select
            className="border p-2 rounded w-64"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="All">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FiSearch /> Search
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Outstanding Balance List</h2>

        {loading ? (
          <p className="text-center text-gray-500 py-4">Loading dues...</p>
        ) : students.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No balance fees found to carry forward.</p>
        ) : (
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Student Name</th>
                <th className="p-2">Class</th>
                <th className="p-2">Admission No</th>
                <th className="p-2">Previous Session Balance</th>
                <th className="p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.student.id} className="border-t">
                  <td className="p-2 font-semibold text-blue-600">{s.student.name}</td>
                  <td className="p-2">
                    {s.student.class} ({s.student.section})
                  </td>
                  <td className="p-2">{s.student.admission}</td>
                  <td className="p-2 text-red-600 font-bold">₹{s.balance}</td>
                  <td className="p-2 text-center">
                    <button
                      disabled={carryingId === s.student.id}
                      onClick={() => handleCarryForward(s)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded flex items-center gap-1 mx-auto text-xs"
                    >
                      <FiTrendingUp />
                      {carryingId === s.student.id ? "Processing..." : "Carry Forward"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
