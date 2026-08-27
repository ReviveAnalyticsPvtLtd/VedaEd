import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import config from "../config";
import { FiEdit, FiTrash2 } from "react-icons/fi";
export default function AssignVehicle() {
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [routesRes, vehiclesRes, assignmentsRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/transport/routes`),
        axios.get(`${config.API_BASE_URL}/transport/vehicles`),
        axios.get(`${config.API_BASE_URL}/transport/assignments`)
      ]);
      setRoutes(routesRes.data);
      setVehicles(vehiclesRes.data);
      setAssignments(assignmentsRes.data);
    } catch (error) {
      console.error("Error fetching assignment data:", error);
    } finally {
      setLoading(false);
    }
  };

  // checkbox handler
  const toggleVehicle = (v) => {
    setSelectedVehicles((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };

  // save / update
  const handleSave = async () => {
    if (!selectedRoute || selectedVehicles.length === 0) {
      alert("Route and Vehicle required");
      return;
    }

    try {
      const payload = {
        route: selectedRoute,
        vehicles: selectedVehicles,
      };

      if (editId) {
        await axios.put(`${config.API_BASE_URL}/transport/assignments/${editId}`, payload);
      } else {
        await axios.post(`${config.API_BASE_URL}/transport/assignments`, payload);
      }
      fetchData();
      setSelectedRoute("");
      setSelectedVehicles([]);
      setEditId(null);
    } catch (error) {
      console.error("Error saving assignment:", error);
      alert("Failed to save assignment");
    }
  };

  const handleEdit = (row) => {
    setSelectedRoute(row.route);
    setSelectedVehicles(row.vehicles);
    setEditId(row._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        await axios.delete(`${config.API_BASE_URL}/transport/assignments/${id}`);
        fetchData();
      } catch (error) {
        console.error("Error deleting assignment:", error);
        alert("Failed to delete assignment");
      }
    }
  };

  // search filter
  const filteredData = useMemo(() => {
    return assignments.filter((a) =>
      a.route?.toLowerCase().includes(search.toLowerCase())
    );
  }, [assignments, search]);

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Assign Vehicle</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 text-sm mb-3 text-gray-600 border-b">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
          Overview
        </button>
      </div>

     <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        {/* LEFT FORM */}
        <div className="bg-white rounded-xl shadow p-5 h-fit sticky top-4">
          <h2 className="text-lg font-semibold mb-4">
            Assign Vehicle On Route
          </h2>

          {/* Route */}
          <div className="mb-4">
            <label className="block font-medium mb-1">
              Route <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select</option>
              {routes.map((r) => (
                <option key={r.id} value={r.title}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicles */}
          <div>
            <label className="block font-medium mb-1">
              Vehicle <span className="text-red-500">*</span>
            </label>

            {vehicles.map((v) => (
              <div key={v._id} className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={selectedVehicles.includes(v.vehicleNumber)}
                  onChange={() => toggleVehicle(v.vehicleNumber)}
                />
                <span>{v.vehicleNumber}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 text-right">
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
            >
              {editId ? "Update" : "Save"}
            </button>
          </div>
        </div>

        {/* RIGHT TABLE */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold mb-4">
            Vehicle Route List
          </h2>

          <div className="flex justify-between mb-4">
            <input
              type="text"
              placeholder="Search"
              className="border px-3 py-2 rounded w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Route</th>
                  <th className="p-3 text-left">Vehicle</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row) => (
                  <tr key={row._id} className="border-t">
                    <td className="p-3">{row.route}</td>
                    <td className="p-3">
                      {row.vehicles.map((v) => (
                        <div key={v}>{v}</div>
                      ))}
                    </td>
                    <td className="p-3 text-center">
  <div className="flex justify-center gap-3">

    {/* Edit */}
    <button
      onClick={() => handleEdit(row)}
      title="Edit"
      className="p-2 rounded-full text-blue-600 hover:bg-blue-100"
    >
      <FiEdit size={18} />
    </button>

    {/* Delete */}
    <button
      onClick={() => handleDelete(row._id)}
      title="Delete"
      className="p-2 rounded-full text-red-600 hover:bg-red-100"
    >
      <FiTrash2 size={18} />
    </button>

  </div>
</td>
                  </tr>
                ))}

                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center p-4">
                      No Data Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}