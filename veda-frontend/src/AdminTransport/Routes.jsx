import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import config from "../config";
import { FiEdit, FiTrash2 } from "react-icons/fi";

export default function Routes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [routeTitle, setRouteTitle] = useState("");
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);

  const [sortConfig, setSortConfig] = useState({
    key: "title",
    direction: "asc",
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.API_BASE_URL}/transport/routes`);
      setRoutes(res.data);
    } catch (error) {
      console.error("Error fetching routes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sorting
  const sortedRoutes = useMemo(() => {
    let sortable = [...routes];
    sortable.sort((a, b) => {
      if (a.title < b.title)
        return sortConfig.direction === "asc" ? -1 : 1;
      if (a.title > b.title)
        return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sortable;
  }, [routes, sortConfig]);

  // Filter
  const filteredRoutes = sortedRoutes.filter((route) =>
    route.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleSort = () => {
    setSortConfig((prev) => ({
      key: "title",
      direction: prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Save / Update
  const handleSave = async () => {
    if (!routeTitle.trim()) {
      alert("Route Title is required");
      return;
    }

    // Restriction: Only letters + space
    if (!/^[a-zA-Z\s]+$/.test(routeTitle)) {
      alert("Only letters allowed");
      return;
    }

    try {
      if (editId) {
        await axios.put(`${config.API_BASE_URL}/transport/routes/${editId}`, { title: routeTitle });
      } else {
        await axios.post(`${config.API_BASE_URL}/transport/routes`, { title: routeTitle });
      }
      fetchRoutes();
      setRouteTitle("");
      setEditId(null);
    } catch (error) {
      console.error("Error saving route:", error);
      alert("Failed to save route");
    }
  };

  const handleEdit = (route) => {
    setRouteTitle(route.title);
    setEditId(route._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete?")) {
      try {
        await axios.delete(`${config.API_BASE_URL}/transport/routes/${id}`);
        fetchRoutes();
      } catch (error) {
        console.error("Error deleting route:", error);
        alert("Failed to delete route");
      }
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen">
    <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Routes</h2>
         </div>
    
          {/* Tabs */}
          <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
            <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
              Overview
            </button>
          </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
      
    
      {/* LEFT FORM */}
<div className="bg-white rounded-xl shadow p-4 h-fit sticky top-4">
        <h2 className="text-lg font-semibold mb-3">Create Route</h2>

        <div>
          <label className="block font-medium mb-1">
            Route Title <span className="text-red-500">*</span>
          </label>

          <input
            type="text"
            maxLength={30}
            value={routeTitle}
            onChange={(e) => setRouteTitle(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter route title"
          />
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
<div className="lg:col-span-2 bg-white rounded-xl shadow p-4 max-h-[75vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Route List</h2>

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
                <th
                  className="p-3 text-left cursor-pointer"
                  onClick={handleSort}
                >
                  Route Title
                </th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredRoutes.map((route) => (
                <tr key={route._id} className="border-t">
                  <td className="p-3">{route.title}</td>
                  <td className="p-3 text-center">
  <div className="flex justify-center gap-3">

    {/* Edit */}
    <button
      onClick={() => handleEdit(route)}
      title="Edit"
      className="p-2 rounded-full text-blue-600 hover:bg-blue-100"
    >
      <FiEdit size={18} />
    </button>

    {/* Delete */}
    <button
      onClick={() => handleDelete(route._id)}
      title="Delete"
      className="p-2 rounded-full text-red-600 hover:bg-red-100"
    >
      <FiTrash2 size={18} />
    </button>

  </div>
</td>
                </tr>
              ))}

              {filteredRoutes.length === 0 && (
                <tr>
                  <td colSpan="2" className="text-center p-4">
                    No Routes Found
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