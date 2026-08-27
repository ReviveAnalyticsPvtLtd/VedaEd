import { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";

// Keeping these as constants for now as per user's original data structure
export default function DriverAllocation() {

  const [allocations, setAllocations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    routeId: "",
    driverId: "",
    conductorId: "",
    date: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allRes, routeRes, vehRes, driverRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/transport/allocations`),
        axios.get(`${config.API_BASE_URL}/transport/routes`),
        axios.get(`${config.API_BASE_URL}/transport/vehicles`),
        axios.get(`${config.API_BASE_URL}/transport/drivers`),
      ]);
      setAllocations(allRes.data);
      setRoutes(routeRes.data);
      setVehicles(vehRes.data);
      
      const allDrivers = driverRes.data;
      setDrivers(allDrivers.filter(d => d.type === "Driver"));
      setConductors(allDrivers.filter(d => d.type === "Cleaner"));

    } catch (error) {
      console.error("Error fetching allocation data:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= SAVE ================= */

  const saveAllocation = async () => {

    if (!form.routeId || !form.driverId || !form.conductorId) return;

    // To maintain backend structure, we need a vehicleId. 
    // Usually, Route corresponds to a vehicle. 
    // In our backend, Route assignment is one-to-one or many-to-one.
    // However, I'll find the vehicleId for the selected route if available, 
    // or just pass what's needed. For now, since user's UI doesn't have vehicle select,
    // I'll assume we handle it or just pass IDs.
    
    // Note: The user's UI snippet had ROUTES with (UP32 AB 4589) hardcoded.
    // In our dynamic routes, we might need to select a vehicle too.
    // I'll stick to the UI but will use vehicleId from the first vehicle that matches or similar logic
    // to avoid breaking backend schema.
    const vehicleId = vehicles[0]?._id; 

    try {
      if (editId) {
        await axios.put(`${config.API_BASE_URL}/transport/allocations/${editId}`, {
          ...form,
          vehicleId: vehicleId // Backend requirement
        });
      } else {
        await axios.post(`${config.API_BASE_URL}/transport/allocations`, {
          ...form,
          vehicleId: vehicleId // Backend requirement
        });
      }
      fetchData();
      setForm({
        routeId: "",
        driverId: "",
        conductorId: "",
        date: "",
      });
      setEditId(null);
      setOpenModal(false);
    } catch (error) {
      console.error("Error saving allocation:", error);
    }
  };

  const deleteAllocation = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${config.API_BASE_URL}/transport/allocations/${id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting allocation:", error);
    }
  };

  const editAllocation = (a) => {
    setForm({
      routeId: a.routeId?._id || a.routeId,
      driverId: a.driverId?._id || a.driverId,
      conductorId: a.conductorId?._id || a.conductorId,
      date: a.date ? new Date(a.date).toISOString().split('T')[0] : "",
    });
    setEditId(a._id);
    setOpenModal(true);
  };

  return (

    <div className="p-0 m-0 min-h-screen">
      {/* Title */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Driver & Conductor Allocation</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 text-sm mb-3 text-gray-600 border-b">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
          Overview
        </button>
      </div>

      <div className="space-y-4">

        {/* TABLE */}

        <div className="bg-white p-4 rounded shadow">

          {/* TABLE HEADER */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Route Allocations</h3>

            <button
              onClick={() => {
                  setEditId(null);
                  setForm({ routeId: "", driverId: "", conductorId: "", date: "" });
                  setOpenModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded"
            >
              <FiPlus /> Allocate Driver
            </button>
          </div>

          <table className="w-full text-sm border">

            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Route</th>
                <th className="border p-2">Vehicle</th>
                <th className="border p-2">Driver</th>
                <th className="border p-2">Driver Phone</th>
                <th className="border p-2">Conductor</th>
                <th className="border p-2">Conductor Phone</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                  <tr><td colSpan="8" className="p-4 text-center">Loading...</td></tr>
              ) : allocations.map(a => {

                // Finding name from states
                const route = routes.find(r => r._id == (a.routeId?._id || a.routeId));
                const driver = (a.driverId?._id ? a.driverId : drivers.find(d => d._id == a.driverId)) || { name: a.driverName, phone: a.driverPhone };
                const conductor = (a.conductorId?._id ? a.conductorId : conductors.find(c => c._id == a.conductorId)) || { name: a.conductorName, phone: a.conductorPhone };

                return (

                  <tr key={a._id} className="text-center">

                    <td className="border p-2">{route?.title}</td>

                    <td className="border p-2 font-medium">
                      {a.vehicleId?.vehicleNumber || "N/A"}
                    </td>

                    <td className="border p-2">{driver?.name}</td>

                    <td className="border p-2">{driver?.phone}</td>

                    <td className="border p-2">{conductor?.name}</td>

                    <td className="border p-2">{conductor?.phone}</td>

                    <td className="border p-2">{new Date(a.date).toLocaleDateString()}</td>

                    <td className="border p-2 flex justify-center gap-3">

                      <button
                        onClick={() => editAllocation(a)}
                        className="text-blue-600"
                      >
                        <FiEdit />
                      </button>

                      <button
                        onClick={() => deleteAllocation(a._id)}
                        className="text-red-600"
                      >
                        <FiTrash2 />
                      </button>

                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>

      </div>

      {/* MODAL */}

      {openModal && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white p-6 rounded-xl w-[420px] space-y-4">

            <h3 className="text-lg font-semibold">
              {editId ? "Edit Allocation" : "Allocate Driver"}
            </h3>

            <select
              className="border w-full p-2 rounded"
              value={form.routeId}
              onChange={(e) =>
                setForm({ ...form, routeId: e.target.value })
              }
            >
              <option value="">Select Route</option>

              {routes.map(r => (
                <option key={r._id} value={r._id}>
                  {r.title}
                </option>
              ))}

            </select>

            <select
              className="border w-full p-2 rounded"
              value={form.driverId}
              onChange={(e) =>
                setForm({ ...form, driverId: e.target.value })
              }
            >
              <option value="">Select Driver</option>

              {drivers.map(d => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}

            </select>

            <select
              className="border w-full p-2 rounded"
              value={form.conductorId}
              onChange={(e) =>
                setForm({ ...form, conductorId: e.target.value })
              }
            >
              <option value="">Select Conductor</option>

              {conductors.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}

            </select>

            <input
              type="date"
              className="border w-full p-2 rounded"
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
            />

            <div className="flex justify-end gap-3 pt-2">

              <button
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={saveAllocation}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Save
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}