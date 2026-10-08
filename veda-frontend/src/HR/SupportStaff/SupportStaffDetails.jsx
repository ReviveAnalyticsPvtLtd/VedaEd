import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import apiClient from "../../services/apiClient";

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 10);
};

// Maps the API Staff document onto the flat shape this page renders.
const mapStaff = (doc) => {
  const p = doc.personalInfo || {};
  const findDoc = (name) => (doc.documents || []).find((d) => d.name === name)?.path;
  return {
    fullName: p.name,
    designation: p.designation,
    staffId: p.staffId,
    gender: p.gender,
    dob: p.dob,
    bloodGroup: p.bloodGroup,
    phone: p.mobileNumber,
    emergencyContact: p.emergencyContact,
    aadhaar: p.aadhaar,
    department: p.department,
    profession: p.profession,
    salary: doc.salaryDetails?.salary,
    joiningDate: formatDate(doc.joiningDate),
    status: doc.status,
    permanentAddress: p.permanentAddress,
    currentAddress: p.currentAddress,
    photo: p.image || null,
    aadhaarDoc: findDoc("Aadhaar Document") || null,
    otherDocs: findDoc("Other Document") || null,
  };
};

const SupportStaffDetails = () => {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(state || null);
  const [error, setError] = useState(!state && !id ? "No Staff Data Found" : "");
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiClient.get(`/support-staff/${id}`);
        if (!cancelled) setData(mapStaff(res.data.data));
      } catch (err) {
        console.error("Error fetching support staff:", err);
        if (!cancelled) {
          setError(err?.response?.data?.message || "Failed to load staff details");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const previewFile = (file) => {
    if (!file) return null;
    if (typeof file === "string") return file;
    return URL.createObjectURL(file);
  };

  if (loading) {
    return (
      <div className="p-6 text-gray-500">
        Loading...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-red-500 font-semibold">
        {error || "No Staff Data Found"}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Support Staff Details</h1>

        <button
          onClick={() => navigate(-1)}
          className="bg-gray-600 hover:bg-white text-white px-4 py-2 rounded"
        >
          ← Back
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white shadow-lg rounded-xl p-6">

        {/* Photo Section */}
        <div className="flex flex-col items-center mb-6">
          {data.photo ? (
            <img
              src={previewFile(data.photo)}
              alt="Staff"
              className="w-32 h-32 rounded-full object-cover border-4 border-green-500 shadow"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
              No Photo
            </div>
          )}
          <h2 className="mt-4 text-xl font-semibold">
            {data.fullName}
          </h2>
          <p className="text-gray-500">{data.designation}</p>
          <span className="mt-2 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
            {data.status || "Active"}
          </span>
        </div>

        {/* Personal Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
          <div>
            <p><strong>Staff ID:</strong> {data.staffId}</p>
            <p><strong>Gender:</strong> {data.gender}</p>
            <p><strong>Date of Birth:</strong> {data.dob}</p>
            <p><strong>Blood Group:</strong> {data.bloodGroup}</p>
          </div>

          <div>
            <p><strong>Phone:</strong> {data.phone}</p>
            <p><strong>Emergency Contact:</strong> {data.emergencyContact}</p>
            <p><strong>Aadhaar:</strong> {data.aadhaar}</p>
          </div>
        </div>

        {/* Employment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t mt-6">
          <div>
            <p><strong>Department:</strong> {data.department}</p>
            <p><strong>Designation:</strong> {data.designation}</p>
            <p><strong>Profession:</strong> {data.profession}</p>
          </div>

          <div>
            <p><strong>Salary:</strong> ₹ {data.salary}</p>
            <p><strong>Joining Date:</strong> {data.joiningDate}</p>
            <p><strong>Status:</strong> {data.status}</p>
          </div>
        </div>

        {/* Address */}
        <div className="border-t mt-6 pt-6">
          <p><strong>Permanent Address:</strong></p>
          <p className="text-gray-600 mb-4">{data.permanentAddress}</p>

          <p><strong>Current Address:</strong></p>
          <p className="text-gray-600">{data.currentAddress}</p>
        </div>

        {/* Documents Section */}
        <div className="border-t mt-6 pt-6">
          <h3 className="text-lg font-semibold mb-4">Documents</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Aadhaar Preview */}
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="font-medium mb-2">Aadhaar Copy</p>
              {data.aadhaarDoc ? (
                <>
                  <a
                    href={previewFile(data.aadhaarDoc)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline block mb-2"
                  >
                    Preview
                  </a>
                  <a
                    href={previewFile(data.aadhaarDoc)}
                    download
                    className="text-green-600 underline"
                  >
                    Download
                  </a>
                </>
              ) : (
                <p className="text-gray-500">Not Uploaded</p>
              )}
            </div>

            {/* Other Docs */}
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="font-medium mb-2">Other Documents</p>
              {data.otherDocs ? (
                <>
                  <a
                    href={previewFile(data.otherDocs)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline block mb-2"
                  >
                    Preview
                  </a>
                  <a
                    href={previewFile(data.otherDocs)}
                    download
                    className="text-green-600 underline"
                  >
                    Download
                  </a>
                </>
              ) : (
                <p className="text-gray-500">Not Uploaded</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportStaffDetails;
