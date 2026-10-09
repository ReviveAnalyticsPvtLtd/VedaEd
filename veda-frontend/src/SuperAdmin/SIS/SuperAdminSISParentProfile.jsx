import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiInfo,
  FiUsers,
  FiFileText,
  FiMail,
  FiCalendar,
  FiEdit3,
  FiSave,
  FiX,
} from "react-icons/fi";
import api, { authFetch } from "../../services/apiClient";
import ProfileAvatar from "../../components/ProfileAvatar";

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

const documentAccept = ".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx";

/** Normalize GET/PUT parent payload into UI state (password hash is not stored in React state). */
const mapApiParentToState = (p) => {
  if (!p) return null;
  const legacyChildren = (p.childDetails || []).map((c) => ({
    name: c.name || "Student",
    grade: c.class != null ? String(c.class) : "N/A",
    section: c.section != null ? String(c.section) : "N/A",
    stdId: c.stdId || "N/A",
  }));
  const primaryChildren =
    (p.children && p.children.length > 0
      ? p.children.map((child) => ({
          name: child.personalInfo?.name || child.name || "Student",
          grade:
            child.personalInfo?.class?.name ||
            child.personalInfo?.class ||
            child.grade ||
            "N/A",
          section:
            child.personalInfo?.section?.name ||
            child.personalInfo?.section ||
            child.section ||
            "N/A",
          stdId: child.personalInfo?.stdId || child.stdId || "N/A",
        }))
      : legacyChildren) || [];
  return {
    id: p._id || p.id,
    parentId: p.parentId || "N/A",
    name: p.name || p.fatherName || "Unnamed Parent",
    email: p.email || "N/A",
    phone: p.phone || p.fatherNumber || "N/A",
    status: p.status || "Active",
    occupation: p.occupation || p.fatherOccupation || "Parent",
    relation: p.relation || p.role || "Parent",
    address:
      p.address ||
      (typeof p.permanentAddress?.line1 === "string" && p.permanentAddress.line1 !== "N/A"
        ? [
            p.permanentAddress.line1,
            p.permanentAddress.line2,
            p.permanentAddress.city,
            p.permanentAddress.state,
            p.permanentAddress.pincode,
          ]
            .filter(Boolean)
            .join(", ")
        : ""),
    photo: p.photo || p.profilePhoto || "",
    children: primaryChildren,
    documents: p.documents || [],
  };
};

// Input field component for editing
const InputField = ({ label, value, onChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2 border-b border-gray-100 last:border-b-0">
    <p className="font-medium text-gray-500">{label}</p>
    <input
      type="text"
      className="col-span-2 border rounded-lg px-3 py-1 text-sm"
      value={value || ""}
      onChange={onChange}
    />
  </div>
);

// Info display component
const InfoDetail = ({ label, value }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2 border-b border-gray-100 last:border-b-0">
    <p className="font-medium text-gray-500">{label}</p>
    <p className="col-span-2">{value || "N/A"}</p>
  </div>
);

// Tab button component
const TabButton = ({ label, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? "bg-indigo-600 text-white shadow"
        : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const SuperAdminSISParentProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id, parentId } = useParams();
  const parentData = location.state || null;
  const resolvedParentId = id || parentId || parentData?._id || parentData?.id;

  const [parent, setParent] = useState(() => (parentData ? mapApiParentToState(parentData) : null));
  const [engagement, setEngagement] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [pageLoading, setPageLoading] = useState(() => !parentData && Boolean(resolvedParentId));
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const profilePhotoInputRef = useRef(null);

  // Fetch parent data from backend if ID is provided
  useEffect(() => {
    const fetchParent = async () => {
      if (!resolvedParentId) {
        setPageLoading(false);
        return;
      }

      if (!parentData) {
        setPageLoading(true);
      }
      setLoadError(null);

      try {
        const res = await api.get(`/parents/${resolvedParentId}`);
        const data = res.data;

        if (data.success && data.parent) {
          const mappedParent = mapApiParentToState(data.parent);
          if (mappedParent) {
            setParent(mappedParent);
          }
        }
      } catch (err) {
        console.error("Error fetching parent:", err);
        if (!parentData && !parent) {
          setLoadError(err.response?.data?.message || err.message || "Parent not found");
        }
      } finally {
        setPageLoading(false);
      }
    };

    fetchParent();
  }, [resolvedParentId]);

  // Mock data for engagement, meetings
  useEffect(() => {
    setEngagement([
      { activity: "PTA Meeting", count: 3 },
      { activity: "School Events", count: 5 },
      { activity: "Volunteer Work", count: 2 },
    ]);

    setMeetings([
      {
        topic: "Academic Progress",
        date: "2023-10-15",
        notes: "Discussed student performance",
        status: "Completed",
      },
      {
        topic: "Behavioral Issues",
        date: "2023-11-20",
        notes: "Addressing classroom behavior",
        status: "Scheduled",
      },
    ]);
  }, []);

  // Fetch documents for the parent
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!resolvedParentId) return;

      try {
        const res = await api.get(`/parents/documents/${resolvedParentId}`);
        if (res.data && Array.isArray(res.data)) {
          setDocuments(res.data);
        }
      } catch (err) {
        console.error("Error fetching documents:", err);
      }
    };

    fetchDocuments();
  }, [resolvedParentId]);

  const handleProfilePhotoSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const routeId = parent?.id || parent?._id || resolvedParentId;
    if (!routeId) {
      alert("Missing parent id.");
      return;
    }
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await authFetch(`/parents/${routeId}/profile-photo`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Upload failed");
      }
      setParent((prev) => (prev ? { ...prev, photo: data.photo } : prev));
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to upload photo");
    } finally {
      setPhotoUploading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Loading Parent Profile...
          </h2>
        </div>
      </div>
    );
  }

  if (loadError && !parent) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-700 mb-4">
            Error Loading Parent Profile
          </h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <button
            onClick={() => navigate("/superadmin/sis/parents")}
            className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700"
          >
            <FiArrowLeft className="w-5 h-5 mr-2" /> Back
          </button>
        </div>
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Parent Profile Not Found
          </h2>
          <button
            onClick={() => navigate("/superadmin/sis/parents")}
            className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700"
          >
            <FiArrowLeft className="w-5 h-5 mr-2" /> Back
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (field, value) => {
    setParent({ ...parent, [field]: value });
  };

  const saveChanges = async () => {
    const currentParentId = parent?.id || resolvedParentId;

    if (!currentParentId) {
      alert("No parent ID found. Cannot save.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const updateData = {
        name: parent.name,
        email: parent.email,
        phone: parent.phone,
        parentId: parent.parentId,
        status: parent.status,
        occupation: parent.occupation,
        relation: parent.relation,
        address: parent.address,
      };

      const res = await api.put(`/parents/${currentParentId}`, updateData);

      if (res.data?.success && res.data?.parent) {
        const mapped = mapApiParentToState(res.data.parent);
        if (mapped) setParent(mapped);
        setIsEditing(false);
        setSaveError(null);
      }
    } catch (err) {
      console.error("Error updating parent:", err);
      setSaveError(err.response?.data?.message || err.message || "Failed to update parent");
    } finally {
      setSaving(false);
    }
  };

  const refreshDocuments = async (currentParentId) => {
    try {
      const res = await api.get(`/parents/documents/${currentParentId}`);
      if (res.data && Array.isArray(res.data)) {
        setDocuments(res.data);
      }
    } catch (err) {
      console.error("Error refreshing documents:", err);
    }
  };

  const handleUploadDocument = async (event) => {
    const file = event.target.files?.[0];
    const currentParentId = parent?.id || resolvedParentId;
    if (!file || !currentParentId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("parentId", currentParentId);

    try {
      const res = await authFetch("/parents/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Upload failed");
      await refreshDocuments(currentParentId);
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

      const response = await authFetch(`/parents/${mode}/${filename}`);
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
    const currentParentId = parent?.id || resolvedParentId;
    if (!currentParentId || !documentId) return;
    if (!window.confirm("Delete this document?")) return;

    try {
      const response = await authFetch(`/parents/documents/${currentParentId}/${documentId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Delete failed");
      }
      await refreshDocuments(currentParentId);
    } catch (error) {
      console.error("Delete failed:", error);
      alert(error.message || "Failed to delete document");
    }
  };

  // Overview Tab
  const OverviewTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {/* General Information */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center mb-4">
            <FiInfo className="text-indigo-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">
              General Information
            </h3>
          </div>
          {isEditing ? (
            <>
              <InputField
                label="Parent ID"
                value={parent.parentId}
                onChange={(e) => handleChange("parentId", e.target.value)}
              />
              <InputField
                label="Name"
                value={parent.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
              <InputField
                label="Occupation"
                value={parent.occupation}
                onChange={(e) => handleChange("occupation", e.target.value)}
              />
              <InputField
                label="Relation"
                value={parent.relation}
                onChange={(e) => handleChange("relation", e.target.value)}
              />
            </>
          ) : (
            <>
              <InfoDetail label="Parent ID" value={parent.parentId} />
              <InfoDetail label="Name" value={parent.name} />
              <InfoDetail label="Occupation" value={parent.occupation} />
              <InfoDetail label="Relation" value={parent.relation} />
            </>
          )}
        </div>

        {/* Student Information */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center mb-4">
            <FiUsers className="text-indigo-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">
              Student Information
            </h3>
          </div>
          {parent.children?.length > 0 ? (
            parent.children.map((child, i) => (
              <div
                key={i}
                className="py-2 border-b border-gray-200 last:border-b-0"
              >
                {isEditing ? (
                  <>
                    <InputField
                      label="Student Name"
                      value={child.name}
                      onChange={(e) => {
                        const updatedChildren = [...parent.children];
                        updatedChildren[i].name = e.target.value;
                        setParent({ ...parent, children: updatedChildren });
                      }}
                    />
                    <InputField
                      label="Grade"
                      value={child.grade}
                      onChange={(e) => {
                        const updatedChildren = [...parent.children];
                        updatedChildren[i].grade = e.target.value;
                        setParent({ ...parent, children: updatedChildren });
                      }}
                    />
                    <InputField
                      label="Section"
                      value={child.section}
                      onChange={(e) => {
                        const updatedChildren = [...parent.children];
                        updatedChildren[i].section = e.target.value;
                        setParent({ ...parent, children: updatedChildren });
                      }}
                    />
                  </>
                ) : (
                  <>
                    <p className="font-medium text-gray-700">{child.name}</p>
                    <p className="text-sm text-gray-500">
                      Student ID: {child.stdId != null && String(child.stdId).trim() ? child.stdId : "N/A"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Grade: {child.grade}, Section: {child.section}
                    </p>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No student linked.</p>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center mb-4">
            <FiMail className="text-indigo-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Contact</h3>
          </div>
          {isEditing ? (
            <>
              <InputField
                label="Email"
                value={parent.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              <InputField
                label="Phone"
                value={parent.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
              <InputField
                label="Address"
                value={parent.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </>
          ) : (
            <>
              <InfoDetail label="Email" value={parent.email} />
              <InfoDetail label="Phone" value={parent.phone} />
              <InfoDetail label="Address" value={parent.address} />
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back button & Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/superadmin/sis/parents")}
            className="inline-flex items-center bg-white text-gray-700 px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-gray-50 border border-gray-200"
          >
            <FiArrowLeft className="w-5 h-5 mr-2" /> Back to Parents
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <ProfileAvatar
                name={parent.name}
                imageSrc={parent.photo}
                sizeClassName="w-24 h-24 text-2xl"
              />
              <input
                type="file"
                ref={profilePhotoInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleProfilePhotoSelected}
              />
              <button
                type="button"
                disabled={photoUploading}
                onClick={() => profilePhotoInputRef.current?.click()}
                className="absolute inset-0 bg-black bg-opacity-40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold"
              >
                {photoUploading ? "..." : "Change"}
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{parent.name}</h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Parent ID: {parent.parentId} • {parent.relation}
                  </p>
                </div>

                <div className="flex items-center gap-3 justify-center sm:justify-end">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveChanges}
                        disabled={saving}
                        className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm disabled:opacity-50"
                      >
                        <FiSave className="mr-2" /> {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="inline-flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
                      >
                        <FiX className="mr-2" /> Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
                    >
                      <FiEdit3 className="mr-2" /> Edit Profile
                    </button>
                  )}
                </div>
              </div>

              {saveError && (
                <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                  {saveError}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-6 border-t border-gray-100 pt-4 overflow-x-auto">
            <TabButton
              label="Overview"
              isActive={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              icon={<FiInfo />}
            />
            <TabButton
              label="Engagement"
              isActive={activeTab === "engagement"}
              onClick={() => setActiveTab("engagement")}
              icon={<FiCalendar />}
            />
            <TabButton
              label="Documents"
              isActive={activeTab === "documents"}
              onClick={() => setActiveTab("documents")}
              icon={<FiFileText />}
            />
            <TabButton
              label="Meetings"
              isActive={activeTab === "meetings"}
              onClick={() => setActiveTab("meetings")}
              icon={<FiCalendar />}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "overview" && <OverviewTab />}

          {activeTab === "engagement" && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Engagement Activity</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagement}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="activity" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Uploaded Documents</h3>
                <label className="bg-indigo-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-indigo-700 text-sm font-medium">
                  Upload Document
                  <input
                    type="file"
                    className="hidden"
                    accept={documentAccept}
                    onChange={handleUploadDocument}
                  />
                </label>
              </div>
              <ul className="divide-y divide-gray-200">
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <li
                      key={doc._id}
                      className="py-3 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{doc.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {doc.uploadedAt
                            ? new Date(doc.uploadedAt).toLocaleDateString()
                            : "N/A"}{" "}
                          - {((doc.size || 0) / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="flex gap-3 text-sm">
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
                  <li className="py-6 text-center text-gray-500">
                    No documents uploaded yet.
                  </li>
                )}
              </ul>
            </div>
          )}

          {activeTab === "meetings" && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Meetings</h3>
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">Topic</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Notes</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((meeting, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-3">{meeting.topic}</td>
                      <td className="px-4 py-3">{meeting.date}</td>
                      <td className="px-4 py-3">{meeting.notes}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700 font-medium">
                          {meeting.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSISParentProfile;
