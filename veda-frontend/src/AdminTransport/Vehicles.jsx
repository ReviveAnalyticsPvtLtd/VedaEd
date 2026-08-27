import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import config from "../config";
import { FiEdit, FiTrash2 } from "react-icons/fi";
export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
const [errors, setErrors] = useState({});
  const emptyForm = {
    vehicleNumber: "",
    model: "",
    year: "",
    registration: "",
    chasis: "",
    capacity: "",
    driverName: "",
    licence: "",
    contact: "",
    note: "",
    photo: null,
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.API_BASE_URL}/transport/vehicles`);
      setVehicles(res.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) =>
      v.vehicleNumber?.toLowerCase().includes(search.toLowerCase())
    );
  }, [vehicles, search]);

  // Handle Change with Restrictions
 const handleChange = (e) => {
  const { name, value } = e.target;

  const letterOnly = ["driverName", "model"];
  const numberOnly = ["capacity", "year", "contact"];

  // LETTER ONLY
  if (letterOnly.includes(name)) {
    if (!/^[a-zA-Z\s]*$/.test(value)) {
      setErrors((p) => ({ ...p, [name]: "Only letters allowed" }));
      return; // ❌ type block
    }
  }

  // NUMBER ONLY
  if (numberOnly.includes(name)) {
    if (!/^\d*$/.test(value)) {
      setErrors((p) => ({ ...p, [name]: "Only numbers allowed" }));
      return; // ❌ type block
    }
  }

  // CLEAR ERROR ON CORRECT INPUT
  setErrors((p) => ({ ...p, [name]: "" }));

  setFormData({ ...formData, [name]: value });
};

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        photo: URL.createObjectURL(file), // This should ideally be uploaded to cloud/server
      });
    }
  };

  const handleSave = async () => {
    if (!formData.vehicleNumber || !formData.model) {
      alert("Vehicle Number and Model are required");
      return;
    }

    try {
      if (editId) {
        await axios.put(`${config.API_BASE_URL}/transport/vehicles/${editId}`, formData);
      } else {
        await axios.post(`${config.API_BASE_URL}/transport/vehicles`, formData);
      }
      fetchVehicles();
      setFormData(emptyForm);
      setShowModal(false);
      setEditId(null);
    } catch (error) {
      console.error("Error saving vehicle:", error);
      alert("Failed to save vehicle");
    }
  };

  const handleEdit = (vehicle) => {
    setFormData(vehicle);
    setEditId(vehicle._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this vehicle?")) {
      try {
        await axios.delete(`${config.API_BASE_URL}/transport/vehicles/${id}`);
        fetchVehicles();
      } catch (error) {
        console.error("Error deleting vehicle:", error);
        alert("Failed to delete vehicle");
      }
    }
  };

  return (
     <div className="p-0 m-0 min-h-screen">
    <div className="flex items-center justify-between mb-2">
           <h2 className="text-2xl font-bold">Vehicles List </h2>
         </div>
    
          {/* Tabs */}
          <div className="flex gap-3 text-sm mb-3 text-gray-600 border-b">
            <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
              Overview
            </button>
          </div>
    <div className="bg-white rounded-xl shadow p-4">
      {/* Header */}
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Vehicle List</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          + Add
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search"
        className="border px-3 py-2 rounded mb-4 w-64"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Vehicle No</th>
              <th className="p-2">Model</th>
              <th className="p-2">Year</th>
              <th className="p-2">Reg No</th>
              <th className="p-2">Chasis</th>
              <th className="p-2">Capacity</th>
              <th className="p-2">Driver</th>
              <th className="p-2">Licence</th>
              <th className="p-2">Contact</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map((v) => (
              <tr key={v._id} className="border-t">
                <td className="p-2">{v.vehicleNumber}</td>
                <td className="p-2">{v.model}</td>
                <td className="p-2">{v.year}</td>
                <td className="p-2">{v.registration}</td>
                <td className="p-2">{v.chasis}</td>
                <td className="p-2">{v.capacity}</td>
                <td className="p-2">{v.driverName}</td>
                <td className="p-2">{v.licence}</td>
                <td className="p-2">{v.contact}</td>
               <td className="p-2 text-center">
  <div className="flex justify-center gap-2">

    {/* Edit */}
    <button
      onClick={() => handleEdit(v)}
      title="Edit"
      className="p-1.5 rounded-full text-blue-600 hover:bg-blue-100"
    >
      <FiEdit size={14} />
    </button>

    {/* Delete */}
    <button
      onClick={() => handleDelete(v._id)}
      title="Delete"
      className="p-1.5 rounded-full text-red-600 hover:bg-red-100"
    >
      <FiTrash2 size={14} />
    </button>

  </div>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white w-4/5 max-w-5xl rounded-xl shadow-lg overflow-y-auto max-h-[90vh]">
            <div className="bg-blue-600 text-white p-4 flex justify-between">
              <h3 className="font-semibold">
                {editId ? "Edit Vehicle" : "Add Vehicle"}
              </h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
             {Object.keys(emptyForm).map((key) =>
  key !== "photo" && key !== "note" ? (
    <div key={key}>
      <input
        type="text"
        name={key}
        value={formData[key]}
        onChange={handleChange}
        placeholder={key}
        className={`border px-3 py-2 rounded w-full ${
          errors[key] ? "border-red-500" : ""
        }`}
      />

      {errors[key] && (
        <p className="text-xs text-red-500 mt-1">
          {errors[key]}
        </p>
      )}
    </div>
  ) : null
)}

              <div className="col-span-3">
                <label className="block mb-1">Vehicle Photo</label>
                <input type="file" onChange={handleFileChange} />
                {formData.photo && (
                  <img
                    src={formData.photo}
                    alt="preview"
                    className="mt-2 h-24"
                  />
                )}
              </div>

              <div className="col-span-3">
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="Note"
                  className="border px-3 py-2 rounded w-full"
                />
              </div>
            </div>

            <div className="p-4 text-right">
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
              >
                {editId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
     </div>
  );
}