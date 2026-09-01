import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import config from "../config";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { FiEdit, FiTrash2 } from "react-icons/fi";

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapViewHandler({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

function MapPicker({ onLocationSelect, markerPosition }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });

  return markerPosition ? <Marker position={markerPosition} /> : null;
}

export default function PickupPoint() {
  const [pickupPoints, setPickupPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    time: "",
    type: "Morning",
    latitude: 28.6139,
    longitude: 77.209,
  });

  const [mapCenter, setMapCenter] = useState([28.6139, 77.209]);

  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  useEffect(() => {
    fetchPickupPoints();
  }, []);

  const fetchPickupPoints = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.API_BASE_URL}/transport/pickup-points`);
      setPickupPoints(res.data);
    } catch (error) {
      console.error("Error fetching pickup points:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sorting Logic
  const sortedData = useMemo(() => {
    let sortable = [...pickupPoints];
    sortable.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key])
        return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
        return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sortable;
  }, [pickupPoints, sortConfig]);

  // Filter
  const filteredData = sortedData.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const query = showModal ? formData.name : search;
    const timer = setTimeout(() => {
      if (query.trim().length > 2 && showSuggestions) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.name, search, showSuggestions, showModal]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&addressdetails=1&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      setShowSuggestions(true);
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSelectSuggestion = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    setFormData({ 
      ...formData, 
      name: suggestion.display_name,
      latitude: lat,
      longitude: lon
    });
    setMapCenter([lat, lon]);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleMapClick = (latlng) => {
    setFormData({
      ...formData,
      latitude: latlng.lat,
      longitude: latlng.lng,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.time) {
      alert("All fields are required");
      return;
    }

    try {
      if (editData) {
        await axios.put(`${config.API_BASE_URL}/transport/pickup-points/${editData._id}`, formData);
      } else {
        await axios.post(`${config.API_BASE_URL}/transport/pickup-points`, formData);
      }
      fetchPickupPoints();
      resetForm();
    } catch (error) {
      console.error("Error saving pickup point:", error);
      alert("Failed to save pickup point");
    }
  };

  const handleEdit = (item) => {
    setEditData(item);
    setFormData(item);
    setMapCenter([item.latitude || 28.6139, item.longitude || 77.209]);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete?")) {
      try {
        await axios.delete(`${config.API_BASE_URL}/transport/pickup-points/${id}`);
        fetchPickupPoints();
      } catch (error) {
        console.error("Error deleting pickup point:", error);
        alert("Failed to delete pickup point");
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: "", time: "", type: "Morning", latitude: 28.6139, longitude: 77.209 });
    setEditData(null);
    setShowModal(false);
  };

  return (
     <div className="p-0 m-0 min-h-screen">
    <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Pickup Point List</h2>
         </div>
    
          {/* Tabs */}
          <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
            <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
              Overview
            </button>
          </div>
    <div className="bg-white rounded-xl shadow p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Pickup Point List</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          + Add
        </button>
      </div>

      {/* Search with Global Autocomplete */}
      <div className="relative mb-4 w-full md:w-96">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search local or find new area..."
              className="w-full border px-3 py-2 rounded"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            {suggestions.length > 0 && showSuggestions && (
              <ul className="absolute z-50 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto mt-1">
                <li className="px-3 py-1 bg-gray-50 text-xs font-semibold text-gray-500">Global Locations</li>
                {suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    onClick={() => {
                      const lat = parseFloat(s.lat);
                      const lon = parseFloat(s.lon);
                      setFormData({ 
                        ...formData, 
                        name: s.display_name,
                        latitude: lat,
                        longitude: lon
                      });
                      setMapCenter([lat, lon]);
                      setSuggestions([]);
                      setShowSuggestions(false);
                      setShowModal(true);
                    }}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0"
                  >
                    <span className="text-blue-600 font-medium">+ Add:</span> {s.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th
                className="p-3 text-left cursor-pointer"
                onClick={() => requestSort("name")}
              >
                Name
              </th>
              <th
                className="p-3 text-left cursor-pointer"
                onClick={() => requestSort("time")}
              >
                Time
              </th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item._id} className="border-t">
                <td className="p-3">
                  <div className="font-medium text-gray-800">{item.name}</div>
                  <div className="text-xs text-gray-400">
                    Lat: {item.latitude?.toFixed(4)}, Lon: {item.longitude?.toFixed(4)}
                  </div>
                </td>
                <td className="p-3">{item.time}</td>
                <td className="p-3">{item.type}</td>
              <td className="p-3">
  <div className="flex justify-center gap-3">

    {/* Edit */}
    <button
      onClick={() => handleEdit(item)}
      title="Edit"
      className="p-2 rounded-full text-blue-600 hover:bg-blue-100"
    >
      <FiEdit size={18} />
    </button>

    {/* Delete */}
    <button
      onClick={() => handleDelete(item._id)}
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
                <td colSpan="4" className="text-center p-4">
                  No Data Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white w-[90%] max-w-4xl rounded-xl shadow-lg overflow-hidden">
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editData ? "Edit Pickup Point" : "Add Pickup Point"}</h3>
              <button onClick={resetForm} className="text-white hover:text-gray-200">✕</button>
            </div>

            <div className="flex flex-col md:flex-row h-[70vh]">
              {/* Form Section */}
              <div className="p-6 space-y-4 md:w-2/5 overflow-y-auto">
                <div className="relative">
                  <label className="block mb-1 text-sm font-semibold text-gray-700">
                    Pickup Point Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="off"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="Enter area or pickup point"
                  />
                  {suggestions.length > 0 && showSuggestions && (
                    <ul className="absolute z-[1001] w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto mt-1 border-t-0 rounded-t-none">
                      {suggestions.map((s, idx) => (
                        <li
                          key={idx}
                          onClick={() => handleSelectSuggestion(s)}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                        >
                          {s.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Time *</label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Time Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                    >
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Coordinates</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Latitude:</span>
                    <span className="font-mono">{formData.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Longitude:</span>
                    <span className="font-mono">{formData.longitude.toFixed(6)}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 italic">
                  💡 You can also click or drag on the map to manually pick a location.
                </p>

                <div className="pt-4">
                  <button
                    onClick={handleSubmit}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95"
                  >
                    {editData ? "Update Location" : "Save Pickup Point"}
                  </button>
                </div>
              </div>

              {/* Map Section */}
              <div className="flex-1 relative border-l border-gray-200 bg-gray-100">
                <MapContainer
                  center={mapCenter}
                  zoom={15}
                  style={{ height: "100%", width: "100%" }}
                  className="z-10"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapViewHandler center={mapCenter} />
                  <MapPicker
                    onLocationSelect={handleMapClick}
                    markerPosition={[formData.latitude, formData.longitude]}
                  />
                </MapContainer>
                <div className="absolute top-4 left-4 z-[1000] bg-white px-3 py-1 rounded shadow-md text-xs font-bold text-gray-600 border border-gray-200 pointer-events-none">
                  MAP VIEW
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
