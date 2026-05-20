import React, { useState, useEffect, useMemo } from "react";
import config from "../config";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { authFetch } from "../services/apiClient";
import ProfileAvatar, { resolveProfileImage } from "../components/ProfileAvatar";
import { getLatestPassportPhotoUrlFromDocs } from "../utils/studentProfileMedia";
import {
  FiArrowLeft,
  FiInfo,
  FiBarChart,
  FiFileText,
  FiCalendar,
  FiEdit2,
  FiCheck,
  FiX,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const mockDocuments = [
  { name: "Employment Contract.pdf", date: "2020-07-01", size: "2.3 MB" },
  {
    name: "Annual Performance Review 2023.docx",
    date: "2023-12-15",
    size: "450 KB",
  },
  { name: "Updated CV.pdf", date: "2022-05-20", size: "1.1 MB" },
];

const mockLeaveHistory = [
  {
    type: "Annual Leave",
    from: "2023-08-10",
    to: "2023-08-15",
    days: 5,
    status: "Approved",
  },
  {
    type: "Sick Leave",
    from: "2023-10-02",
    to: "2023-10-02",
    days: 1,
    status: "Approved",
  },
  {
    type: "Unpaid Leave",
    from: "2024-01-20",
    to: "2024-01-22",
    days: 2,
    status: "Pending",
  },
];

const ProfileCard = ({ label, children, icon, action }) => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden">
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="text-indigo-500 mr-3">{icon}</div>
          <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
        </div>
        {action}
      </div>
      <div className="space-y-3 text-sm text-gray-600">{children}</div>
    </div>
  </div>
);

const InfoDetail = ({ label, value }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2 border-b border-gray-100 last:border-b-0">
    <p className="font-medium text-gray-500">{label}</p>
    <p className="col-span-2">{value || "N/A"}</p>
  </div>
);

const EditableField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  options = [],
  placeholder,
  maxLength,
  inputMode,
  pattern,
  min,
  step,
  error,
  readOnly = false,
}) => (
  <div className="py-2 border-b border-gray-100 last:border-b-0">
    <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
    {type === "select" ? (
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        className={`w-full border rounded-lg p-2 ${error ? "border-red-500" : ""}`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        pattern={pattern}
        min={min}
        step={step}
        readOnly={readOnly}
        className={`w-full border rounded-lg p-2 ${error ? "border-red-500" : ""}`}
      />
    )}
    {error ? <p className="text-xs text-red-500 mt-1">{error}</p> : null}
  </div>
);

const TabButton = ({ label, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive
      ? "bg-indigo-600 text-white shadow"
      : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
      }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const StaffProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const staffData = location.state || null;
  const resolvedStaffId = id || staffData?._id || staffData?.id;
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [staff, setStaff] = useState(staffData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const documentAccept = ".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx";
  const toInputDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
  };
  const mapStaffFromApi = (staffRecord) => ({
    id: staffRecord._id,
    staffId: staffRecord.personalInfo?.staffId,
    name: staffRecord.personalInfo?.name,
    gender: staffRecord.personalInfo?.gender,
    role: staffRecord.personalInfo?.role,
    department: staffRecord.personalInfo?.department,
    status: staffRecord.status,
    address: staffRecord.personalInfo?.address,
    phone: staffRecord.personalInfo?.mobileNumber,
    contact: staffRecord.personalInfo?.email,
    emergencyContact: staffRecord.personalInfo?.emergencyContact,
    joiningDate: toInputDate(staffRecord.joiningDate),
    assignedClasses: staffRecord.classesAssigned?.join(", "),
    experience: staffRecord.experience,
    qualification: staffRecord.qualification,
    salary: staffRecord.salaryDetails?.salary,
    lastPayment: staffRecord.salaryDetails?.lastPayment,
    paymentStatus: staffRecord.salaryDetails?.paymentStatus || staffRecord.payStatus,
    username: staffRecord.personalInfo?.username,
    password: staffRecord.personalInfo?.password,
    photo:
      resolveProfileImage(
        staffRecord.personalInfo || {},
        staffRecord.personalInfo?.image || staffRecord.photo
      ) || "",
    performance: staffRecord.performance || [],
    documents: staffRecord.documents || [],
  });

  // Fetch staff data from backend if ID is provided
  useEffect(() => {
    const fetchStaff = async () => {
      if (!resolvedStaffId) {
        console.log("No ID provided in URL params");
        return;
      }

      console.log("Fetching staff with ID:", resolvedStaffId);
      setLoading(true);
      setError(null);

      try {
        const response = await authFetch(`/staff/${resolvedStaffId}`);
        if (!response.ok) {
          throw new Error('Staff not found');
        }

        const data = await response.json();
        if (data.success && data.staff) {
          // Map backend data to frontend structure
          const mappedStaff = mapStaffFromApi(data.staff);

          setStaff(mappedStaff);
          console.log("Staff data loaded:", mappedStaff);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error("Error fetching staff:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [resolvedStaffId]);

  // Fetch documents for the staff
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!resolvedStaffId) return;

      try {
        const response = await authFetch(`/staff/documents/${resolvedStaffId}`);
        if (response.ok) {
          const docs = await response.json();
          setDocuments(docs);
        }
      } catch (err) {
        console.error("Error fetching documents:", err);
      }
    };

    fetchDocuments();
  }, [resolvedStaffId]);

  // Local editable state
  const [formData, setFormData] = useState(staff || {});

  // Update formData when staff data changes
  useEffect(() => {
    if (staff) {
      setFormData(staff);
    }
  }, [staff]);

  const profileHeaderImageSrc = useMemo(() => {
    const fromStaff = resolveProfileImage(
      formData || {},
      formData?.photo || staff?.photo || staff?.personalInfo?.image
    );
    if (fromStaff) return fromStaff;
    return getLatestPassportPhotoUrlFromDocs(documents || []);
  }, [documents, formData, staff]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Loading Staff Profile...
          </h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-700 mb-4">
            Error Loading Staff Profile
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700"
          >
            <FiArrowLeft className="w-5 h-5 mr-2" /> Back
          </button>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Staff Member Not Found
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700"
          >
            <FiArrowLeft className="w-5 h-5 mr-2" /> Back
          </button>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(staff);
    setValidationErrors({});
    setIsEditing(false);
  };

  const validateForm = () => {
    const nextErrors = {};
    const phoneDigits = (formData.phone || "").replace(/\D/g, "");
    const emergencyDigits = (formData.emergencyContact || "").replace(/\D/g, "");
    const experienceValue = String(formData.experience || "").trim();
    const salaryValue = String(formData.salary || "").trim();

    if (phoneDigits && phoneDigits.length !== 10) {
      nextErrors.phone = "Mobile number must be exactly 10 digits.";
    }
    if (emergencyDigits && emergencyDigits.length !== 10) {
      nextErrors.emergencyContact = "Emergency contact must be exactly 10 digits.";
    }
    if (salaryValue && !/^\d+(\.\d+)?$/.test(salaryValue)) {
      nextErrors.salary = "Salary must be numeric.";
    }
    if (experienceValue && !/^\d+\s*(year|years)?$/i.test(experienceValue)) {
      nextErrors.experience = 'Use format like "8" or "8 years".';
    }

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!staff.id) return;
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const experienceMatch = String(formData.experience || "").trim().match(/^(\d+)/);
      const numericExperience = experienceMatch ? Number(experienceMatch[1]) : 0;
      const sanitizedPhone = (formData.phone || "").replace(/\D/g, "").slice(0, 10);
      const sanitizedEmergency = (formData.emergencyContact || "").replace(/\D/g, "").slice(0, 10);
      const sanitizedSalary = String(formData.salary || "").replace(/[^\d.]/g, "");

      // Map frontend data back to backend structure
      const updateData = {
        personalInfo: {
          name: formData.name,
          role: formData.role,
          gender: formData.gender,
          department: formData.department,
          email: formData.contact,
          mobileNumber: sanitizedPhone,
          address: formData.address,
          emergencyContact: sanitizedEmergency,
          username: formData.username,
          password: formData.password
        },
        status: formData.status,
        qualification: formData.qualification,
        experience: numericExperience,
        joiningDate: formData.joiningDate,
        classesAssigned: formData.assignedClasses ? formData.assignedClasses.split(",").map(c => c.trim()) : [],
        salaryDetails: {
          salary: sanitizedSalary,
          lastPayment: formData.lastPayment,
          paymentStatus: formData.paymentStatus
        }
      };

      console.log("Sending update data:", updateData);
      console.log("Staff ID:", resolvedStaffId);

      const response = await authFetch(`/staff/${resolvedStaffId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend error:", errorData);
        throw new Error(errorData.message || 'Failed to update staff');
      }

      const data = await response.json();
      if (data.success) {
        if (data.staff) {
          setStaff(mapStaffFromApi(data.staff));
          sessionStorage.setItem(
            "staffProfileUpdated",
            JSON.stringify({ source: "sis", staff: data.staff })
          );
        }
        setIsEditing(false);
        setValidationErrors({});
        // Optionally show success message
        console.log('Staff updated successfully');
      }
    } catch (err) {
      console.error("Error updating staff:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === "phone" || name === "emergencyContact") {
      nextValue = value.replace(/\D/g, "").slice(0, 10);
    } else if (name === "salary") {
      nextValue = value.replace(/[^\d.]/g, "");
    }

    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const statusBadgeClasses = (status) => {
    const base =
      "px-3 py-1 text-sm font-medium rounded-full inline-flex items-center";
    if (status === "Active") return `${base} bg-green-100 text-green-800`;
    if (status === "On Leave") return `${base} bg-yellow-100 text-yellow-800`;
    return `${base} bg-gray-100 text-gray-800`;
  };

  const refreshDocuments = async () => {
    const response = await authFetch(`/staff/documents/${resolvedStaffId}`);
    if (response.ok) {
      const docs = await response.json();
      setDocuments(docs);
    }
  };

  const handleUploadDocument = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !resolvedStaffId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("staffId", resolvedStaffId);

    try {
      const res = await authFetch("/staff/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Upload failed");
      await refreshDocuments();
    } catch (err) {
      console.error("Upload failed:", err);
      alert(err.message || "Failed to upload document");
    } finally {
      event.target.value = "";
    }
  };

  const openDocument = async (doc, mode = "preview") => {
    try {
      const filename = doc?.path?.split("/").pop();
      if (!filename) return;
      const response = await authFetch(`/staff/${mode}/${filename}`);
      if (!response.ok) throw new Error(`Unable to ${mode} document`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      if (mode === "preview") {
        window.open(blobUrl, "_blank", "noopener,noreferrer");
      } else {
        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = doc.name || filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
    } catch (error) {
      console.error(`${mode} failed:`, error);
      alert(error.message || `${mode} failed`);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!resolvedStaffId || !documentId) return;
    if (!window.confirm("Delete this document?")) return;

    try {
      const response = await authFetch(`/staff/documents/${resolvedStaffId}/${documentId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Delete failed");
      await refreshDocuments();
    } catch (error) {
      console.error("Delete failed:", error);
      alert(error.message || "Failed to delete document");
    }
  };

  const OverviewTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <ProfileCard label="General Information" icon={<FiInfo />}>
          {!isEditing ? (
            <>
              <InfoDetail label="Staff ID" value={staff.staffId} />
              <InfoDetail label="Name" value={staff.name} />
              <InfoDetail label="Gender" value={staff.gender} />
              <InfoDetail label="Role" value={staff.role} />
              <InfoDetail label="Department" value={staff.department} />
              <InfoDetail label="Status" value={staff.status} />
              <InfoDetail label="Address" value={staff.address} />
              
            </>
          ) : (
            <>
              <EditableField
                label="Staff ID"
                name="staffId"
                value={formData.staffId}
                onChange={handleChange}
                readOnly
              />
              <EditableField label="Name" name="name" value={formData.name} onChange={handleChange} />
              <EditableField
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                type="select"
                options={["Male", "Female", "Other"]}
              />
              <EditableField label="Role" name="role" value={formData.role} onChange={handleChange} />
              <EditableField label="Department" name="department" value={formData.department} onChange={handleChange} />
              <EditableField
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                type="select"
                options={["Active", "On Leave"]}
              />
              <EditableField label="Address" name="address" value={formData.address} onChange={handleChange} />
            </>
          )}
        </ProfileCard>

        <ProfileCard label="Employment Details" icon={<FiInfo />}>
          {!isEditing ? (
            <>
              <InfoDetail label="Date of Joining" value={staff.joiningDate} />
              <InfoDetail label="Assigned Classes" value={staff.assignedClasses} />
              <InfoDetail label="Experience" value={staff.experience} />
              <InfoDetail label="Qualification" value={staff.qualification} />
            </>
          ) : (
            <>
              <EditableField
                label="Date of Joining"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleChange}
                type="date"
              />
              <EditableField label="Assigned Classes" name="assignedClasses" value={formData.assignedClasses} onChange={handleChange} />
              <EditableField
                label="Experience"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder='e.g. "8 years"'
                error={validationErrors.experience}
              />
              <EditableField label="Qualification" name="qualification" value={formData.qualification} onChange={handleChange} />
            </>
          )}
        </ProfileCard>

        
      </div>

      <div className="space-y-4">
        <ProfileCard label="Contact Information" icon={<FiInfo />}>
          {!isEditing ? (
            <>
              <InfoDetail label="Email" value={staff.contact} />
              <InfoDetail label="Mobile Number" value={staff.phone} />
              <InfoDetail label="Emergency Contact" value={staff.emergencyContact} />
            </>
          ) : (
            <>
              <EditableField label="Email" name="contact" value={formData.contact} onChange={handleChange} />
              <EditableField
                label="Mobile Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                maxLength={10}
                inputMode="numeric"
                pattern="\d{10}"
                error={validationErrors.phone}
              />
              <EditableField
                label="Emergency Contact"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                maxLength={10}
                inputMode="numeric"
                pattern="\d{10}"
                error={validationErrors.emergencyContact}
              />
            </>
          )}
        </ProfileCard>

        <ProfileCard label="Salary Details" icon={<FiInfo />}>
          {!isEditing ? (
            <>
              <InfoDetail label="Current Salary" value={staff.salary} />
              <InfoDetail label="Last Payment Date" value={staff.lastPayment} />
              <InfoDetail label="Payment Status" value={staff.paymentStatus} />
            </>
          ) : (
            <>
              <EditableField
                label="Current Salary"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                inputMode="decimal"
                pattern="^\d+(\.\d+)?$"
                error={validationErrors.salary}
              />
              <EditableField
                label="Last Payment Date"
                name="lastPayment"
                value={toInputDate(formData.lastPayment)}
                onChange={handleChange}
                type="date"
              />
              <EditableField
                label="Payment Status"
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
                type="select"
                options={["Paid", "Pending", "Unpaid"]}
              />
            </>
          )}
        </ProfileCard>

        <ProfileCard label="Credentials" icon={<FiInfo />}>
          {!isEditing ? (
            <>
              <InfoDetail label="Username" value={staff.username} />
              <InfoDetail label="Password" value={staff.password} />
            </>
          ) : (
            <>
              <EditableField label="Username" name="username" value={formData.username} onChange={handleChange} />
              <EditableField label="Password" name="password" value={formData.password} onChange={handleChange} type="password" />
            </>
          )}
        </ProfileCard>
      </div>
    </div>
  );

  const PerformanceTab = () => (
    <ProfileCard label="Performance" icon={<FiBarChart />}>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={staff.performance || []}
            margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="score"
              fill="#4f46e5"
              name="Performance Score"
              barSize={40}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ProfileCard>
  );

  const DocumentsTab = () => (
    <ProfileCard label="Documents" icon={<FiFileText />}>
      {/* Upload Button */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Documents
        </h3>
        <label className="bg-indigo-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-indigo-700">
          Upload Document
          <input
            type="file"
            accept={documentAccept}
            className="hidden"
            onChange={handleUploadDocument}
          />
        </label>
      </div>

      {/* Documents List */}
      <ul className="divide-y divide-gray-200">
        {documents.length > 0 ? (
          documents.map((doc) => (
            <li key={doc._id || doc.path} className="py-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">{doc.name}</p>
                <p className="text-gray-500">
                  {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "N/A"} - {((doc.size || 0) / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openDocument(doc, "preview")}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Preview
                </button>
                <button
                  onClick={() => openDocument(doc, "download")}
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  Download
                </button>
                <button
                  onClick={() => handleDeleteDocument(doc._id)}
                  className="text-red-600 hover:underline font-semibold"
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        ) : (
          <li className="py-3 text-gray-500">No documents uploaded yet.</li>
        )}
      </ul>
    </ProfileCard>
  );

  const LeaveTab = () => {
    const statusClass = (status) => {
      if (status === "Approved") return "bg-green-100 text-green-800";
      if (status === "Pending") return "bg-yellow-100 text-yellow-800";
      return "bg-red-100 text-red-800";
    };

    return (
      <ProfileCard label="Leave History" icon={<FiCalendar />}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">From</th>
                <th className="px-4 py-2">To</th>
                <th className="px-4 py-2">Days</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockLeaveHistory.map((leave, i) => (
                <tr key={i} className="border-b">
                  <td className="px-4 py-3">{leave.type}</td>
                  <td className="px-4 py-3">{leave.from}</td>
                  <td className="px-4 py-3">{leave.to}</td>
                  <td className="px-4 py-3">{leave.days}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${statusClass(
                        leave.status
                      )}`}
                    >
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ProfileCard>
    );
  };

  return (
    <div className="min-h-screen p-0 m-0 ">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <FiArrowLeft className="w-5 h-5 mr-2" /> Back to Staff Directory
          </button>
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4 flex flex-col items-center text-center gap-4 sm:flex-row sm:items-center sm:text-left sm:gap-6">
          <ProfileAvatar
            name={staff.name || "Staff"}
            imageSrc={profileHeaderImageSrc}
            sizeClassName="w-32 h-32 sm:w-36 sm:h-36 shrink-0"
            textClassName="text-3xl"
            className="ring-4 ring-indigo-200"
          />
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{staff.name}</h1>
              <p className="text-lg text-indigo-600 font-medium">{staff.role}</p>
              <p className="text-sm text-gray-500 font-medium">
                Staff ID: {staff.staffId || "N/A"}
              </p>
              <div className="mt-3">
                <span className={statusBadgeClasses(staff.status)}>
                  {staff.status}
                </span>
              </div>
            </div>
          </div>

          {/* Edit / Save / Cancel Buttons */}
          <div className="flex flex-wrap justify-center gap-2 sm:justify-end shrink-0">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700"
              >
                <FiEdit2 /> <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
                >
                  <FiCheck /> <span>Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-400"
                >
                  <FiX /> <span>Cancel</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <div className="bg-white rounded-xl shadow-md p-2 inline-flex space-x-2">
            <TabButton
              label="Overview"
              isActive={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              icon={<FiInfo />}
            />
            <TabButton
              label="Performance"
              isActive={activeTab === "performance"}
              onClick={() => setActiveTab("performance")}
              icon={<FiBarChart />}
            />
            <TabButton
              label="Documents"
              isActive={activeTab === "documents"}
              onClick={() => setActiveTab("documents")}
              icon={<FiFileText />}
            />
            <TabButton
              label="Leave History"
              isActive={activeTab === "leave"}
              onClick={() => setActiveTab("leave")}
              icon={<FiCalendar />}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "overview" && OverviewTab()}
          {activeTab === "performance" && PerformanceTab()}
          {activeTab === "documents" && DocumentsTab()}
          {activeTab === "leave" && LeaveTab()}
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
