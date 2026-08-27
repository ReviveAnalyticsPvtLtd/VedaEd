import { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";

export default function FleetFueling() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openBus, setOpenBus] = useState(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    litres: "",
    rate: "",
    invoiceFile: null,
  });

  const [previewInvoice, setPreviewInvoice] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vehRes, fuelRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/transport/vehicles`),
        axios.get(`${config.API_BASE_URL}/transport/fueling`),
      ]);

      const fuelLogs = fuelRes.data;
      const vehiclesWithLogs = vehRes.data.map((v) => ({
        ...v,
        fuelLogs: fuelLogs.filter((f) => f.vehicleId?._id === v._id || f.vehicleId === v._id),
      }));

      setVehicles(vehiclesWithLogs);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addFuelEntry = async (vehicleId) => {
    if (!form.date || !form.litres || !form.rate) {
        alert("Field required");
        return;
    }

    // Mocking file upload URLs as placeholders for UI consistency
    let invoiceUrl = "https://via.placeholder.com/600x800?text=Invoice";
    let invoiceType = "image/png";

    const amount = Number(form.litres) * Number(form.rate);

    try {
      await axios.post(`${config.API_BASE_URL}/transport/fueling`, {
        vehicleId,
        date: form.date,
        litres: Number(form.litres),
        rate: Number(form.rate),
        amount,
        invoiceUrl,
        invoiceType,
      });

      fetchData();
      setForm({ date: new Date().toISOString().split("T")[0], litres: "", rate: "", invoiceFile: null });
    } catch (error) {
      console.error("Error adding fuel entry:", error);
    }
  };

  const deleteFuelEntry = async (fuelId) => {
    if (!window.confirm("Delete record?")) return;
    try {
      await axios.delete(`${config.API_BASE_URL}/transport/fueling/${fuelId}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting fuel entry:", error);
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* Title */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Fueling Records</h2>
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
          vehicles.map((v) => {
            const totalLitres = (v.fuelLogs || []).reduce((s, f) => s + (f.litres || 0), 0);
            const totalAmount = (v.fuelLogs || []).reduce((s, f) => s + (f.amount || 0), 0);

            return (
              <div key={v._id} className="bg-white shadow rounded-lg p-4 space-y-4">
                {/* BUS HEADER */}
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold">{v.vehicleNumber}</h2>
                  </div>
                  <button
                    onClick={() => {
                        setOpenBus(openBus === v._id ? null : v._id);
                    }}
                    className="text-blue-600 text-sm"
                  >
                    {openBus === v._id ? "Hide" : "Manage Fuel"}
                  </button>
                </div>

                {/* SUMMARY */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-100 p-3 rounded">
                    <p>Total Litres</p>
                    <p className="font-bold">{totalLitres.toFixed(1)} L</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <p>Total Cost</p>
                    <p className="font-bold text-blue-600">₹ {totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                {/* MANAGE SECTION */}
                {openBus === v._id && (
                  <div className="space-y-4">
                    {/* ADD FORM */}
                    <div className="grid grid-cols-4 gap-2">
                        <input
                        type="date"
                        value={form.date}
                        className="border p-2 rounded"
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        />
                        <input
                        type="number"
                        placeholder="Litres"
                        value={form.litres}
                        className="border p-2 rounded"
                        onChange={(e) => setForm({ ...form, litres: e.target.value })}
                        />
                        <input
                        type="number"
                        placeholder="Rate ₹"
                        value={form.rate}
                        className="border p-2 rounded"
                        onChange={(e) => setForm({ ...form, rate: e.target.value })}
                        />
                        <button
                        onClick={() => addFuelEntry(v._id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
                        >
                        + Add Record
                        </button>
                    </div>

                    {/* FUEL TABLE */}
                    <table className="w-full text-sm border">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border p-2">Date</th>
                          <th className="border p-2">Litres</th>
                          <th className="border p-2">Rate</th>
                          <th className="border p-2">Amount</th>
                          <th className="border p-2">Invoice</th>
                          <th className="border p-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(v.fuelLogs || []).length === 0 ? (
                          <tr><td colSpan="6" className="p-4 text-center text-gray-400 italic">No records</td></tr>
                        ) : (
                          v.fuelLogs.map((f) => (
                            <tr key={f._id} className="text-center">
                              <td className="border p-2">{new Date(f.date).toLocaleDateString()}</td>
                              <td className="border p-2">{f.litres} L</td>
                              <td className="border p-2">₹ {f.rate}</td>
                              <td className="border p-2 font-bold text-blue-600">₹ {f.amount?.toLocaleString()}</td>
                              <td className="border p-2">
                                {f.invoiceUrl ? (
                                    <button
                                        onClick={() => setPreviewInvoice(f)}
                                        className="text-blue-500 underline"
                                    >
                                        View
                                    </button>
                                ) : "-"}
                              </td>
                              <td className="border p-2">
                                <button
                                  onClick={() => deleteFuelEntry(f._id)}
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

      {previewInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between">
                <h3 className="font-bold">Invoice Preview</h3>
                <button onClick={() => setPreviewInvoice(null)} className="text-xl">✕</button>
            </div>
            <div className="p-4 text-center">
                <img src={previewInvoice.invoiceUrl} className="max-w-full mx-auto" alt="invoice"/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}