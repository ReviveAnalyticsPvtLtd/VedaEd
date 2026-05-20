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
import { authFetch } from "../services/apiClient";
import ProfileAvatar from "../components/ProfileAvatar";

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
    name: c.name,
    grade: c.class != null ? String(c.class) : "N/A",
    section: c.section != null ? String(c.section) : "N/A",
    stdId: c.stdId,
  }));
  const primaryChildren =
    (p.children && p.children.length > 0
      ? p.children.map((child) => ({
          name: child.personalInfo?.name || child.name,
          grade:
            child.personalInfo?.class?.name ||
            child.personalInfo?.class ||
            child.grade,
          section:
            child.personalInfo?.section?.name ||
            child.personalInfo?.section ||
            child.section,
          stdId: child.personalInfo?.stdId || child.stdId,
        }))
      : legacyChildren) || [];
  return {
    id: p._id,
    parentId: p.parentId,
    name: p.name || p.fatherName,
    email: p.email,
    phone: p.phone || p.fatherNumber,
    status: p.status,
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

const ParentProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { parentId } = useParams();
  const parentData = location.state || null;
  const resolvedParentId = parentData?._id || parentData?.id || parentId;

  const [parent, setParent] = useState(
    parentData
      ? {
          ...parentData,
          id: parentData._id, // Ensure id field is set from _id
        }
      : null
  );
  const [engagement, setEngagement] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [pageLoading, setPageLoading] = useState(() => Boolean(resolvedParentId));
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const profilePhotoInputRef = useRef(null);

  // Fetch parent data from backend if ID is provided
  useEffect(() => {
    const fetchParent = async () => {
      console.log("useEffect triggered - ID:", resolvedParentId);
      console.log("Current parent state:", parent);

      if (!resolvedParentId) {
        console.log("No ID provided in URL params");
        return;
      }

      console.log("Fetching parent with ID:", resolvedParentId);
      setPageLoading(true);
      setLoadError(null);

      try {
        const response = await authFetch(`/parents/${resolvedParentId}`);
        if (!response.ok) {
          throw new Error("Parent not found");
        }

        const data = await response.json();
        console.log("API Response:", data);

        if (data.success && data.parent) {
          const mappedParent = mapApiParentToState(data.parent);
          if (mappedParent) {
            setParent(mappedParent);
            console.log("Parent data loaded:", mappedParent);
          } else {
            throw new Error("Invalid response format");
          }
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Error fetching parent:", err);
        setLoadError(err.message);
      } finally {
        setPageLoading(false);
      }
    };

    fetchParent();
  }, [resolvedParentId]);

  // Mock data for engagement, meetings (can be replaced with real API calls later)
  useEffect(() => {
    // Set mock data for now
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
        const response = await authFetch(`/parents/documents/${resolvedParentId}`);
        if (response.ok) {
          const docs = await response.json();
          setDocuments(docs);
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

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-700 mb-4">
            Error Loading Parent Profile
          </h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
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

  if (!parent) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Parent Profile Not Found
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

  const handleChange = (field, value) => {
    setParent({ ...parent, [field]: value });
  };

  const saveChanges = async () => {
    console.log("Save button clicked!");
    console.log("Parent data:", parent);
    console.log("Parent ID:", parent?.id);
    console.log("URL ID:", resolvedParentId);

    // Use URL id as fallback if parent.id is not available
    const currentParentId = parent?.id || resolvedParentId;

    if (!currentParentId) {
      console.error("No parent ID found!");
      alert("No parent ID found. Cannot save.");
      return;
    }

    console.log("Using parent ID:", currentParentId);

    setSaving(true);
    setSaveError(null);

    try {
      // Check if parent data exists
      if (!parent) {
        console.error("No parent data available!");
        setSaveError("No parent data available. Cannot save.");
        return;
      }

      // Do not send password unless you add a dedicated "change password" flow —
      // the API used to re-hash an echoed bcrypt string and break login.
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

      console.log("Sending update data:", updateData);
      console.log("Parent ID:", currentParentId);

      const response = await authFetch(
        `/parents/${currentParentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        let message = "Failed to update parent";
        try {
          const errorData = await response.json();
          message = errorData.message || message;
        } catch {
          /* non-JSON error body */
        }
        console.error("Backend error:", message);
        throw new Error(message);
      }

      const data = await response.json();
      if (data.success && data.parent) {
        const mapped = mapApiParentToState(data.parent);
        if (mapped) setParent(mapped);
        setIsEditing(false);
        setSaveError(null);
        console.log("Parent updated successfully");
      }
    } catch (err) {
      console.error("Error updating parent:", err);
      setSaveError(err.message || "Failed to update parent");
    } finally {
      setSaving(false);
    }
  };

  const refreshDocuments = async (currentParentId) => {
    const response = await authFetch(`/parents/documents/${currentParentId}`);
    if (response.ok) {
      const docs = await response.json();
      setDocuments(docs);
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
            <p>No student linked.</p>
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
    <div className="min-h-screen p-0 m-0">
      <div className="mb-4">
        {saveError ? (
          <div
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {saveError}
          </div>
        ) : null}
        {/* Top Bar */}
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-600 hover:text-indigo-800 font-medium"
          >
            <FiArrowLeft className="w-5 h-5 mr-2" /> Back to Parent Directory
          </button>

          {isEditing ? (
            <div className="space-x-2">
              <button
                type="button"
                onClick={saveChanges}
                disabled={saving}
                className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FiSave className="mr-2" /> {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSaveError(null);
                  setIsEditing(false);
                }}
                className="inline-flex items-center bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400"
              >
                <FiX className="mr-2" /> Cancel
              </button>
            </div>
          ) : null}
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <ProfileAvatar
              name={parent.name}
              imageSrc={parent.photo}
              sizeClassName="w-32 h-32 shrink-0"
              textClassName="text-4xl"
            />
            <input
              ref={profilePhotoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              className="hidden"
              onChange={handleProfilePhotoSelected}
            />
            <button
              type="button"
              disabled={photoUploading}
              onClick={() => profilePhotoInputRef.current?.click()}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {photoUploading ? "Uploading…" : "Change photo"}
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-3 w-full min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 break-words">{parent.name}</h1>
                <p className="text-lg text-indigo-600 font-medium">
                  {parent.occupation || "Parent"}
                </p>
                {parent.relation ? (
                  <p className="text-sm text-gray-500 mt-1">Relation: {parent.relation}</p>
                ) : null}
              </div>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    setSaveError(null);
                    setIsEditing(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 self-center sm:self-start bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 shadow-sm whitespace-nowrap"
                >
                  <FiEdit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : null}
            </div>
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
              label="Engagement"
              isActive={activeTab === "engagement"}
              onClick={() => setActiveTab("engagement")}
              icon={<FiUsers />}
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

        {/* Tab Contents */}
        <div>
          {activeTab === "overview" && OverviewTab()}

          {activeTab === "engagement" && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={engagement}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="activity" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="bg-white rounded-xl shadow-md p-4">
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
                    <li
                      key={doc._id || doc.path}
                      className="py-3 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{doc.name}</p>
                        <p className="text-gray-500">
                          {doc.uploadedAt
                            ? new Date(doc.uploadedAt).toLocaleDateString()
                            : "N/A"}{" "}
                          - {((doc.size || 0) / 1024 / 1024).toFixed(2)} MB
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
                  <li className="py-3 text-gray-500">
                    No documents uploaded yet.
                  </li>
                )}
              </ul>
            </div>
          )}

          {activeTab === "meetings" && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <table className="w-full text-left">
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
                      <td className="px-4 py-3">{meeting.status}</td>
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

export default ParentProfile;
