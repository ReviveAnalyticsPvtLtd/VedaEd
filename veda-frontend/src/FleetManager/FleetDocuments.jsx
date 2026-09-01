import { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import {
  FiUpload,
  FiTrash2,
  FiEye,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";

/* ================= DOCUMENT TYPES ================= */
const DOC_TYPES = [
  { key: "rc", label: "RC Book" },
  { key: "insurance", label: "Insurance" },
  { key: "fitness", label: "Fitness Certificate" },
  { key: "permit", label: "Permit" },
  { key: "pollution", label: "PUC" },
];

/* ================= HELPERS ================= */
const daysBetween = (date) => {
  const today = new Date();
  const d = new Date(date);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
};

/* ================= MAIN ================= */
export default function FleetDocuments() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vRes, dRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/transport/vehicles`),
        axios.get(`${config.API_BASE_URL}/transport/documents`)
      ]);

      const mappedVehicles = vRes.data.map(v => {
        const vDocs = dRes.data.filter(d => d.vehicleId?._id === v._id);
        const documents = {};
        DOC_TYPES.forEach(type => {
          const doc = vDocs.find(d => d.type === type.key);
          documents[type.key] = doc ? {
            id: doc._id,
            name: doc.fileName,
            expiry: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : "",
            url: doc.fileUrl
          } : null;
        });
        return {
          id: v._id,
          vehicleNo: v.vehicleNumber,
          model: v.model,
          documents
        };
      });
      setVehicles(mappedVehicles);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= HANDLERS ================= */
  const uploadDoc = async (vid, key, file, expiry) => {
    if (!file || !expiry) return;

    try {
      const payload = {
        vehicleId: vid,
        type: key,
        fileName: file.name,
        expiryDate: expiry,
        fileUrl: URL.createObjectURL(file) // Mock URL as per implementation
      };

      await axios.post(`${config.API_BASE_URL}/transport/documents`, payload);
      fetchData();
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document");
    }
  };

  const deleteDoc = async (vid, key) => {
    const vehicle = vehicles.find(v => v.id === vid);
    const doc = vehicle?.documents[key];
    if (!doc?.id) return;

    if (window.confirm("Delete this document?")) {
      try {
        await axios.delete(`${config.API_BASE_URL}/transport/documents/${doc.id}`);
        fetchData();
      } catch (error) {
        console.error("Error deleting document:", error);
        alert("Failed to delete document");
      }
    }
  };

  /* ================= UI ================= */
  return (<div className="p-0 m-0 min-h-screen">
    <div className="flex items-center justify-between mb-2">
           <h2 className="text-2xl font-bold">Document List </h2>
         </div>
    
          {/* Tabs */}
          <div className="flex gap-3 text-sm mb-3 text-gray-600 border-b">
            <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
              Overview
            </button>
          </div>
    <div className="space-y-6">
      

      {vehicles.map((v) => {
        const alerts = [];

        Object.values(v.documents).forEach((d) => {
          if (d?.expiry) {
            const days = daysBetween(d.expiry);
            if (days <= 0) alerts.push("expired");
            else if (days <= 15) alerts.push("soon");
          }
        });

        return (
          <div
            key={v.id}
            className="bg-white rounded-xl shadow p-6 space-y-4"
          >
            {/* VEHICLE HEADER */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{v.vehicleNo}</h3>
                <p className="text-sm text-gray-500">{v.model}</p>
              </div>

              {alerts.includes("expired") ? (
                <span className="flex items-center gap-2 text-red-600 text-sm">
                  <FiAlertTriangle /> Documents Expired
                </span>
              ) : alerts.includes("soon") ? (
                <span className="flex items-center gap-2 text-orange-600 text-sm">
                  <FiAlertTriangle /> Expiring Soon
                </span>
              ) : (
                <span className="flex items-center gap-2 text-green-600 text-sm">
                  <FiCheckCircle /> All Good
                </span>
              )}
            </div>

            {/* DOCUMENT CARDS */}
            <div className="grid md:grid-cols-3 gap-4">
              {DOC_TYPES.map((d) => {
                const doc = v.documents[d.key];
                const daysLeft = doc?.expiry
                  ? daysBetween(doc.expiry)
                  : null;

                return (
                  <div
                    key={d.key}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="font-semibold">{d.label}</div>

                    {doc ? (
                      <>
                        <div className="text-sm">{doc.name}</div>
                        <div
                          className={`text-xs ${
                            daysLeft <= 0
                              ? "text-red-600"
                              : daysLeft <= 15
                              ? "text-orange-600"
                              : "text-green-600"
                          }`}
                        >
                          Expiry: {doc.expiry} (
                          {daysLeft <= 0
                            ? "Expired"
                            : `${daysLeft} days left`}
                          )
                        </div>

                        <div className="flex gap-3 text-sm">
                          <button
                            onClick={() => window.open(doc.url, "_blank")}
                            className="text-blue-600 flex items-center gap-1"
                          >
                            <FiEye /> Preview
                          </button>
                          <button
                            onClick={() => deleteDoc(v.id, d.key)}
                            className="text-red-600 flex items-center gap-1"
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </div>
                      </>
                    ) : (
                      <UploadBox
                        onUpload={(file, expiry) =>
                          uploadDoc(v.id, d.key, file, expiry)
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
     </div>
  );
}

/* ================= UPLOAD COMPONENT ================= */
function UploadBox({ onUpload }) {
  const [file, setFile] = useState(null);
  const [expiry, setExpiry] = useState("");

  return (
    <div className="border-2 border-dashed rounded p-3 text-center space-y-2">
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <input
        type="date"
        className="border px-2 py-1 rounded w-full text-sm"
        value={expiry}
        onChange={(e) => setExpiry(e.target.value)}
      />
      <button
        onClick={() => onUpload(file, expiry)}
        className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
      >
        <FiUpload className="inline mr-1" /> Upload
      </button>
    </div>
  );
}