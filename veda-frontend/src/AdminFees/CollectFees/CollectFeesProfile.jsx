import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import config from "../../config";

const CollectFeesProfile = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [student, setStudent] = useState(state || null);
  const [feesData, setFeesData] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.API_BASE_URL}/fees/collect/student/${id}`);
      setFeesData(res.data.feesData);
      setStudent(res.data.student);
    } catch(e) {
      console.log("Profile fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Back Fix
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/admin/collect-fees");
    }
  };

  // Select All
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(feesData.map((f) => f.category));
    } else {
      setSelected([]);
    }
  };

  // Single Select
  const handleSelect = (cat) => {
    setSelected((prev) =>
      prev.includes(cat)
        ? prev.filter((i) => i !== cat)
        : [...prev, cat]
    );
  };

  const handleCollect = async () => {
     if (selected.length === 0) return alert("Select fees first");
     
     const feesToPay = feesData.filter(f => selected.includes(f.category));
     const total = feesToPay.reduce((s, f) => s + f.balance, 0);

     if (total <= 0) return alert("Selected fees are already paid");

     if (!window.confirm(`Collect ₹${total} for selected fees?`)) return;

     try {
        await axios.post(`${config.API_BASE_URL}/fees/collect/payment`, {
           studentId: id,
           year: "2025-26", // Should ideally be dynamic
           fees: feesToPay.map(f => ({ category: f.category, amount: f.balance })),
           totalAmount: total,
           paymentMethod: "Cash"
        });
        alert("Payment Recorded!");
        fetchData();
        setSelected([]);
     } catch(e) {
        alert("Payment failed");
     }
  };

  return (
    <div className="p-4 min-h-screen bg-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Student Fees</h2>

        <button
          onClick={handleBack}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          ← Back
        </button>
      </div>

      {/* Student Info */}
      <div className="bg-white p-4 rounded shadow mb-6 flex gap-6">
        <div className="w-24 h-24 bg-blue-100 flex items-center justify-center rounded text-blue-600 font-bold">
           {student?.name?.charAt(0) || "S"}
        </div>

        <div className="grid grid-cols-2 gap-4 w-full text-sm">
          <p><b>Name:</b> {student?.name}</p>
          <p><b>Class:</b> {student?.class} ({student?.section})</p>
          <p><b>Father:</b> {student?.father}</p>
          <p><b>Admission No:</b> {student?.admission}</p>
          <p><b>Mobile:</b> {student?.mobile}</p>
          <p><b>Roll:</b> {student?.roll}</p>
          <p><b>Category:</b> {student?.category || "General"}</p>
          <p><b>RTE:</b> <span className="text-red-500">No</span></p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mb-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => alert(`Print: ${selected.length} selected`)}
        >
          Print Selected
        </button>

        <button
          className="bg-yellow-500 text-white px-4 py-2 rounded"
          onClick={handleCollect}
        >
          Collect Selected
        </button>
      </div>

      <p className="text-center font-semibold mb-4">
        Session : 2025-26
      </p>

      {/* Fees Table */}
      <div className="bg-white p-4 rounded shadow">
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={feesData.length > 0 && selected.length === feesData.length}
                />
              </th>
              <th className="p-2">Fees</th>
              <th className="p-2">Due Date</th>
              <th className="p-2">Status</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Balance</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {feesData.map((f) => (
              <tr key={f.category} className="border-t">
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={selected.includes(f.category)}
                    onChange={() => handleSelect(f.category)}
                  />
                </td>

                <td className="p-2">{f.category}</td>
                <td className="p-2">10th Monthly</td>

                <td className="p-2">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      f.status === "Paid"
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {f.status}
                  </span>
                </td>

                <td className="p-2">₹{f.amount}</td>
                <td className="p-2">₹{f.balance}</td>

                <td className="p-2 text-center">
                  {f.status === "Unpaid" && (
                    <button 
                       onClick={() => { setSelected([f.category]); handleCollect(); }}
                       className="bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      +
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CollectFeesProfile;