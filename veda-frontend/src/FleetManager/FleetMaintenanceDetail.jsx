import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import api from "../services/apiClient";
import config from "../config";
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiAlertCircle,
  FiCheckCircle,
  FiLock,
  FiUnlock,
} from "react-icons/fi";

export default function FleetMaintenanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState(null);

  /* ================= FETCH ================= */
  useEffect(() => {
    fetchMaintenance();
  }, [id]);

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${config.API_BASE_URL}/transport/maintenance/${id}`);
      setMaintenance(res.data);
    } catch (error) {
      console.error("Error fetching maintenance detail:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= ADD WORK ================= */
  const [newWork, setNewWork] = useState({
    part: "",
    action: "",
    mechanic: "",
    cost: "",
  });

  const addWork = async () => {
    if (!newWork.part || !newWork.action) return;

    try {
        const updatedWorks = [...(maintenance.works || []), { ...newWork, cost: Number(newWork.cost || 0), date: new Date() }];
        await api.put(`${config.API_BASE_URL}/transport/maintenance/${id}`, { works: updatedWorks });
        fetchMaintenance();
        setNewWork({ part: "", action: "", mechanic: "", cost: "" });
    } catch (error) {
        console.error("Error adding work log:", error);
    }
  };

  const deleteWork = async (workId) => {
    try {
        const updatedWorks = maintenance.works.filter(w => w._id !== workId);
        await api.put(`${config.API_BASE_URL}/transport/maintenance/${id}`, { works: updatedWorks });
        fetchMaintenance();
    } catch (error) {
        console.error("Error deleting work log:", error);
    }
  };

  /* ================= BILLS ================= */
  // Backend Bills connectivity: User hasn't requested specific bill storage yet,
  // so keeping it local or connecting to document model would be next step. 
  // For now, following the original UI for bills.

  /* ================= COMPLETE ================= */
  const completeMaintenance = async () => {
    try {
        await api.put(`${config.API_BASE_URL}/transport/maintenance/${id}`, { 
            status: "Completed",
            lastServiceDate: new Date()
        });
        if(maintenance.vehicleId?._id) {
            await api.put(`${config.API_BASE_URL}/transport/vehicles/${maintenance.vehicleId._id}`, { status: "Active" });
        }
        fetchMaintenance();
    } catch (error) {
        console.error("Error completing maintenance:", error);
    }
  };

  /* ================= CALCULATIONS ================= */
  const totalCost = useMemo(
    () => (maintenance?.works || []).reduce((s, w) => s + (w.cost || 0), 0),
    [maintenance]
  );

  const kmRemaining = (maintenance?.nextServiceDueKm || 0) - (maintenance?.currentKm || 0);

  const vendorExpenses = useMemo(() => {
    const map = {};
    (maintenance?.works || []).forEach((w) => {
      if(w.mechanic) {
          map[w.mechanic] = (map[w.mechanic] || 0) + (w.cost || 0);
      }
    });
    return map;
  }, [maintenance]);

  const monthlyCosts = [
    { month: "Jan", cost: 12000 },
    { month: "Feb", cost: 8000 },
    { month: "Mar", cost: totalCost },
  ];

  if (loading && !maintenance) return <div className="p-10 text-center">Loading...</div>;
  if (!maintenance) return <div className="p-10 text-center text-red-500">Record not found</div>;

  const vehicle = maintenance.vehicleId;

  return (
    <div className="space-y-6">

      {/* BACK */}
      <button
        onClick={() => navigate("/fleet/maintenance")}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
      >
        <FiArrowLeft /> Back to Maintenance List
      </button>

      {/* SUMMARY CARD */}
      <div className="bg-white rounded-xl shadow p-6 grid md:grid-cols-6 gap-4">
        <div>
          <div className="text-sm text-gray-500">Vehicle No</div>
          <div className="text-xl font-bold">{vehicle?.vehicleNumber}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Model</div>
          <div>{vehicle?.model}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Current KM</div>
          <div>{maintenance.currentKm}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Next Due</div>
          <div className="font-semibold">{maintenance.nextServiceDueKm} km</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Status</div>
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              maintenance.status === "Under Maintenance" || maintenance.status === "In Progress"
                ? "bg-orange-100 text-orange-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {maintenance.status}
          </span>
        </div>
        <div>
          <div className="text-sm text-gray-500">Vehicle Lock</div>
          <div className="flex items-center gap-2 font-semibold">
            {vehicle?.status === "Under Maintenance" ? <FiLock /> : <FiUnlock />}
            {vehicle?.status === "Under Maintenance" ? "Locked" : "Active"}
          </div>
        </div>
      </div>

      {/* ALERT */}
      {kmRemaining <= 500 && kmRemaining > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-4 flex gap-3">
          <FiAlertCircle className="text-red-600 mt-1" />
          <div>
            <div className="font-semibold text-red-700">
              Service Due Alert
            </div>
            <div className="text-sm text-red-600">
              Only {kmRemaining} km remaining for next service
            </div>
          </div>
        </div>
      )}

      {/* WORK TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Part</th>
              <th className="p-3 text-left">Action</th>
              <th className="p-3 text-left">Vendor</th>
              <th className="p-3 text-right">Cost</th>
              <th className="p-3 text-center">Delete</th>
            </tr>
          </thead>
          <tbody>
            {(maintenance.works || []).map((w) => (
              <tr key={w._id} className="border-t">
                <td className="p-3">{w.part}</td>
                <td className="p-3">{w.action}</td>
                <td className="p-3">{w.mechanic}</td>
                <td className="p-3 text-right">₹ {w.cost?.toLocaleString()}</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => deleteWork(w._id)}
                    className="text-red-600"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD WORK */}
      {maintenance.status !== "Completed" && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <FiPlus /> Add Maintenance Work
          </h3>

          <div className="grid md:grid-cols-4 gap-4">
            <input placeholder="PART" className="border px-3 py-2 rounded" value={newWork.part} onChange={(e) => setNewWork({...newWork, part: e.target.value})} />
            <input placeholder="ACTION" className="border px-3 py-2 rounded" value={newWork.action} onChange={(e) => setNewWork({...newWork, action: e.target.value})} />
            <input placeholder="MECHANIC" className="border px-3 py-2 rounded" value={newWork.mechanic} onChange={(e) => setNewWork({...newWork, mechanic: e.target.value})} />
            <input placeholder="COST" type="number" className="border px-3 py-2 rounded" value={newWork.cost} onChange={(e) => setNewWork({...newWork, cost: e.target.value})} />
          </div>

          <button
            onClick={addWork}
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            Add Work
          </button>
        </div>
      )}

      {/* BILLS SECTION (Original UI preserved) */}
      <div className="bg-white rounded-xl shadow p-6 space-y-3">
        <h3 className="font-semibold">Bills & Invoices</h3>
        <input type="file" />
        <p className="text-xs text-gray-400 italic">Bill uploads will appear here</p>
      </div>

      {/* MONTHLY COST */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold mb-4">Monthly Maintenance Cost</h3>
        {monthlyCosts.map((m) => (
          <div key={m.month} className="mb-3">
            <div className="flex justify-between text-sm">
              <span>{m.month}</span>
              <span>₹ {m.cost?.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded">
              <div
                className="h-2 bg-blue-600 rounded"
                style={{ width: `${Math.min(100, (m.cost / 20000) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* VENDOR REPORT */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold mb-3">Vendor Wise Expense</h3>
        {Object.entries(vendorExpenses).map(([v, c]) => (
          <div key={v} className="flex justify-between border-t py-2 text-sm">
            <span>{v}</span>
            <span className="font-medium">₹ {c.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* COMPLETE */}
      {maintenance.status !== "Completed" && (
        <button
          onClick={completeMaintenance}
          className="bg-green-600 text-white px-6 py-3 rounded flex items-center gap-2"
        >
          <FiCheckCircle /> Mark Maintenance Complete & Unlock Vehicle
        </button>
      )}
    </div>
  );
}