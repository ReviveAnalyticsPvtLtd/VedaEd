import { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";

export default function FleetExpense() {

  const [vehicles, setVehicles] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openBus, setOpenBus] = useState(null);

  const [form, setForm] = useState({
    type: "Fuel",
    amount: "",
    date: "",
    note: ""
  });

  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vehRes, expRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/transport/vehicles`),
        axios.get(`${config.API_BASE_URL}/transport/expenses`),
      ]);
      setVehicles(vehRes.data);
      setExpenses(expRes.data);
    } catch (error) {
      console.error("Error fetching expense data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addExpense = async (busId) => {
    if (!form.amount || !form.date) return;

    try {
      if (editId) {
        await axios.put(`${config.API_BASE_URL}/transport/expenses/${editId}`, { ...form, vehicleId: busId });
      } else {
        await axios.post(`${config.API_BASE_URL}/transport/expenses`, { ...form, vehicleId: busId });
      }
      fetchData();
      setForm({ type: "Fuel", amount: "", date: "", note: "" });
      setEditId(null);
    } catch (error) {
      console.error("Error saving expense:", error);
    }
  };

  const deleteExpense = async (expId) => {
    if(!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${config.API_BASE_URL}/transport/expenses/${expId}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const editExpense = (expense) => {
    setForm({
      type: expense.type,
      amount: expense.amount,
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : "",
      note: expense.note || ""
    });
    setEditId(expense._id);
  };

  const getTotal = (logs) => {
    return logs.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  };

  const getMonthly = (logs) => {
    const month = new Date().getMonth();
    return logs
      .filter(e => new Date(e.date).getMonth() === month)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  };

  const getQuarter = (logs) => {
    const month = new Date().getMonth();
    return logs
      .filter(e => {
        const m = new Date(e.date).getMonth();
        return Math.abs(m - month) <= 2;
      })
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* Title */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Bus Expenses</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 text-sm mb-3 text-gray-600 border-b">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
          Overview
        </button>
      </div>

      <div className="space-y-3">

        {loading && vehicles.length === 0 ? (
            <div className="p-10 text-center">Loading...</div>
        ) : (
          vehicles.map(bus => {
            const busLogs = expenses.filter(e => e.vehicleId?._id === bus._id || e.vehicleId === bus._id);
            const total = getTotal(busLogs);
            const monthly = getMonthly(busLogs);
            const quarter = getQuarter(busLogs);

            return (
              <div key={bus._id} className="bg-white shadow rounded-lg p-4 space-y-4">

                {/* BUS HEADER */}
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {bus.vehicleNumber}
                    </h2>
                  </div>

                  <button
                    onClick={() => {
                        setOpenBus(openBus === bus._id ? null : bus._id);
                        setEditId(null);
                        setForm({ type: "Fuel", amount: "", date: "", note: "" });
                    }}
                    className="text-blue-600 text-sm"
                  >
                    {openBus === bus._id ? "Hide" : "Manage Expense"}
                  </button>
                </div>

                {/* SUMMARY */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-gray-100 p-3 rounded">
                    <p>Total Expense</p>
                    <p className="font-bold">₹{total.toLocaleString()}</p>
                  </div>

                  <div className="bg-blue-50 p-3 rounded">
                    <p>This Month</p>
                    <p className="font-bold text-blue-600">₹{monthly.toLocaleString()}</p>
                  </div>

                  <div className="bg-purple-50 p-3 rounded">
                    <p>Quarter</p>
                    <p className="font-bold text-purple-600">₹{quarter.toLocaleString()}</p>
                  </div>
                </div>

                {/* MANAGE SECTION */}
                {openBus === bus._id && (
                  <div className="space-y-4">

                    {/* ADD FORM */}
                    <div className="grid grid-cols-4 gap-2">
                      <select
                        name="type"
                        value={form.type}
                        onChange={handleChange}
                        className="border p-2 rounded"
                      >
                        <option>Fuel</option>
                        <option>Maintenance</option>
                        <option>Document</option>
                        <option>Other</option>
                      </select>

                      <input
                        type="number"
                        name="amount"
                        placeholder="Amount"
                        value={form.amount}
                        onChange={handleChange}
                        className="border p-2 rounded"
                      />

                      <input
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleChange}
                        className="border p-2 rounded"
                      />

                      <input
                        type="text"
                        name="note"
                        placeholder="Note"
                        value={form.note}
                        onChange={handleChange}
                        className="border p-2 rounded"
                      />
                    </div>

                    <button
                      onClick={() => addExpense(bus._id)}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm"
                    >
                      {editId ? "Update Expense" : "Add Expense"}
                    </button>

                    {/* EXPENSE TABLE */}
                    <table className="w-full text-sm border">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border p-2">Type</th>
                          <th className="border p-2">Amount</th>
                          <th className="border p-2">Date</th>
                          <th className="border p-2">Note</th>
                          <th className="border p-2">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {busLogs.length === 0 ? (
                            <tr><td colSpan="5" className="p-4 text-center text-gray-400 italic">No expenses found</td></tr>
                        ) : (
                          busLogs.map(exp => (
                            <tr key={exp._id} className="text-center">
                              <td className="border p-2">{exp.type}</td>
                              <td className="border p-2">₹{exp.amount?.toLocaleString()}</td>
                              <td className="border p-2">{new Date(exp.date).toLocaleDateString()}</td>
                              <td className="border p-2">{exp.note}</td>

                              <td className="border p-2 space-x-2">
                                <button
                                  onClick={() => editExpense(exp)}
                                  className="text-blue-600"
                                >
                                  Edit
                                </button>

                                <button
                                  onClick={() => deleteExpense(exp._id)}
                                  className="text-red-600"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}