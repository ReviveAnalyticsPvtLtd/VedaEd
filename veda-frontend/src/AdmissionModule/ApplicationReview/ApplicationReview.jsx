import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiInfo,
  FiFileText,
  FiBarChart,
  FiDollarSign,
  FiDownload,
  FiEye
} from "react-icons/fi";
import axios from "axios";
import ProfileAvatar from "../../components/ProfileAvatar";
import config from "../../config";

/* ================= COMMON UI COMPONENTS (SAME AS STUDENT PROFILE) ================= */

const ProfileCard = ({ label, children, icon, className = "", bodyClassName = "" }) => (
  <div className={`bg-white rounded-xl shadow-md overflow-hidden h-full ${className}`}>
    <div className={`p-4 sm:p-5 md:p-6 ${bodyClassName}`}>
      <div className="flex items-center mb-4">
        <div className="text-indigo-500 mr-3">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
      </div>
      <div className="space-y-3 text-sm text-gray-600">{children}</div>
    </div>
  </div>
);

const InfoDetail = ({
  label,
  value,
  editable,
  type = "text",
  error,
  onChange,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-b-0">
    <p className="font-medium text-gray-500">{label}</p>

    <div className="col-span-2">
      {editable ? (
        <>
          <input
            type={type}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              error ? "border-red-500" : "border-gray-300"
            }`}
          />
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </>
      ) : (
        <p>{value || "N/A"}</p>
      )}
    </div>
  </div>
);

const TabButton = ({ label, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex-1 min-w-[150px] sm:min-w-fit flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 text-sm font-medium rounded-lg transition ${
      isActive
        ? "bg-indigo-600 text-white shadow"
        : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const getBackendBaseUrl = () => {
  const apiBase = (config.API_BASE_URL || "http://localhost:5000/api").trim();
  return apiBase.replace(/\/api\/?$/, "");
};

const encodePathSegments = (value = "") =>
  value
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const getDocumentUrl = (doc) => {
  const backendBaseUrl = getBackendBaseUrl();
  const rawDocPath = doc?.path || doc?.url || doc?.fileUrl || doc?.document || "";
  const rawPath = String(rawDocPath).replace(/\\/g, "/").trim();
  if (!rawPath) return "";
  if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) return encodeURI(rawPath);
  // Handle absolute OS path: C:/.../public/uploads/file.png
  if (rawPath.includes("public/uploads/")) {
    const trimmed = rawPath.split("public/uploads/")[1]?.replace(/^\/+/, "") || "";
    return trimmed ? `${backendBaseUrl}/uploads/${encodePathSegments(trimmed)}` : "";
  }
  // Handle already rooted uploads path: /uploads/file.png
  if (rawPath.startsWith("/uploads/")) {
    return `${backendBaseUrl}${encodeURI(rawPath)}`;
  }
  // Handle relative uploads path: uploads/file.png
  if (rawPath.startsWith("uploads/")) {
    return `${backendBaseUrl}/${encodeURI(rawPath)}`;
  }
  // Fallback to filename in uploads
  const filename = rawPath.split("/").pop();
  return filename ? `${backendBaseUrl}/uploads/${encodeURIComponent(filename)}` : "";
};

const getLatestPassportPhoto = (documents = []) => {
  if (!Array.isArray(documents) || documents.length === 0) return null;
  const matches = documents.filter(
    (doc) => (doc?.type || "").toLowerCase() === "passport size photo"
  );
  return matches.length ? matches[matches.length - 1] : null;
};

const compressImageToSquare = (file, size = 512, quality = 0.85) =>
  new Promise((resolve) => {
    if (!file || !file.type?.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        const srcW = img.width;
        const srcH = img.height;
        const srcSize = Math.min(srcW, srcH);
        const sx = Math.floor((srcW - srcSize) / 2);
        const sy = Math.floor((srcH - srcSize) / 2);

        // Center-crop to a square and resize to avatar-friendly dimensions.
        ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, size, size);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const optimized = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(optimized);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });

/* ================= MAIN COMPONENT ================= */

function ensureParentIdAccountHolderOnApp(app) {
  if (!app || typeof app !== "object") return app;
  const parents = app.parents && typeof app.parents === "object" ? { ...app.parents } : {};
  if (!parents.parentIdAccountHolder) {
    if (parents.father?.name?.trim()) parents.parentIdAccountHolder = "father";
    else if (parents.mother?.name?.trim()) parents.parentIdAccountHolder = "mother";
    else if (parents.guardian?.name?.trim()) parents.parentIdAccountHolder = "guardian";
    else parents.parentIdAccountHolder = "father";
  }
  return { ...app, parents };
}

const AdmissionReviewProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();
const [isEdit, setIsEdit] = useState(false);
const [formData, setFormData] = useState({
  personalInfo: {},
  contactInfo: {},
  earlierAcademic: {},
  parents: {
    father: {},
    mother: {},
    guardian: {},
    parentIdAccountHolder: "father",
  },
  parentInfo: {},
  documents: [],
});


const [errors, setErrors] = useState({});
const [documentError, setDocumentError] = useState("");
const [previewDoc, setPreviewDoc] = useState(null);
const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [application, setApplication] = useState(
    state ? ensureParentIdAccountHolderOnApp(state) : null
  );
  const [loading, setLoading] = useState(!state);
  const [activeTab, setActiveTab] = useState("profile");

  const fetchApplication = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.API_BASE_URL}/admission/application/${id}`);
      if (res.data.success) {
        const data = ensureParentIdAccountHolderOnApp(res.data.data);
        setApplication(data);
        setFormData(data);
      }
    } catch (err) {
      console.error("Error fetching application details:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
  if (application) setFormData(ensureParentIdAccountHolderOnApp(application));
}, [application]);


  useEffect(() => {
    if (!application) {
      fetchApplication();
    }
  }, [application, fetchApplication]);

  if (loading) return <div className="p-10 text-center">Loading application details...</div>;
  if (!application) return <div className="p-10 text-center text-red-500">Application not found.</div>;

const handleToggleEdit = () => {
  if (isEdit) {
    setFormData(application); // RESET DATA
    setErrors({});
  }
  setIsEdit(!isEdit);
};

const handleDocumentUpload = async (file, type) => {
  setDocumentError("");
  const form = new FormData();
  form.append("file", file);
  form.append("type", type);

  try {
    const res = await axios.post(
      `${config.API_BASE_URL}/admission/application/${id}/upload`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    if (res.data.success) {
      const updatedApplication = res.data.data;
      const updatedDocuments = updatedApplication?.documents || [];
      setApplication((prev) => ({
        ...(prev || {}),
        ...(updatedApplication || {}),
        documents: updatedDocuments,
      }));
      setFormData((prev) => ({
        ...prev,
        documents: updatedDocuments,
      }));
    }
  } catch (err) {
    console.error("Upload failed", err);
    setDocumentError(
      err?.response?.data?.message || "Document upload failed. Please try again."
    );
  }
};
const handleDeleteDocument = async (docId) => {
  try {
    await axios.delete(
      `${config.API_BASE_URL}/admission/application/${id}/document/${docId}`
    );

    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter(d => d._id !== docId),
    }));
    setApplication(prev => ({
      ...prev,
      documents: (prev.documents || []).filter(d => d._id !== docId),
    }));
  } catch (err) {
    console.error("Delete failed", err);
  }
};



const getFileNameFromDoc = (doc, fallbackName = "document") => {
  if (doc?.name && String(doc.name).trim()) return doc.name;
  const rawPath = (doc?.path || "").replace(/\\/g, "/");
  const fileNameFromPath = rawPath.split("/").pop();
  return fileNameFromPath || fallbackName;
};

const handleDownload = async (doc) => {
  setDocumentError("");
  const fileUrl = getDocumentUrl(doc);
  if (!fileUrl) {
    setDocumentError("Document URL is invalid.");
    return;
  }

  try {
    const response = await axios.get(fileUrl, { responseType: "blob" });
    const blobUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = getFileNameFromDoc(doc);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    // Fallback path for edge cases where blob request fails due browser/network policies
    try {
      const fallbackLink = document.createElement("a");
      fallbackLink.href = fileUrl;
      fallbackLink.download = getFileNameFromDoc(doc);
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      fallbackLink.remove();
    } catch (fallbackError) {
      setDocumentError("Document file is missing or inaccessible. Please re-upload this document.");
    }
  }
};

  const handlePreview = async (doc) => {
  setDocumentError("");
  const fileUrl = getDocumentUrl(doc);
  if (!fileUrl) {
    setDocumentError("Document URL is invalid.");
    return;
  }

  setPreviewDoc({ ...doc, previewUrl: fileUrl });
  setIsPreviewOpen(true);
};
const closePreview = () => {
  setIsPreviewOpen(false);
  setPreviewDoc(null);
};

const getPreviewType = (doc) => {
  const fileType = (doc?.fileType || "").toLowerCase();
  const name = (doc?.name || "").toLowerCase();

  if (fileType.startsWith("image/")) return "image";
  if (fileType === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  return "unsupported";
};
const handleChange = (path, value) => {
  setFormData(prev => {
    const updated = structuredClone(prev); // ⭐ IMPORTANT

    const keys = path.split(".");
    let obj = updated;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
    return updated;
  });
};

const handleSave = async () => {
  // agar error hai toh save mat karo
  if (Object.values(errors).some(e => e)) return;

  try {
    await axios.put(
      `${config.API_BASE_URL}/admission/application/${id}`,
      formData
    );

    setApplication(formData); // UI update
    setIsEdit(false);
  } catch (err) {
    console.error("Save failed", err);
  }
};
const handleNumberChange = (path, value) => {
  if (!/^\d*$/.test(value)) {
    setErrors(prev => ({
      ...prev,
      [path]: "Only numbers allowed"
    }));
    return; // ❌ value update hi nahi hogi
  }

  setErrors(prev => ({ ...prev, [path]: "" }));
  handleChange(path, value);
};
const handleEmailChange = (path, value) => {
  handleChange(path, value);

  if (
    value &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  ) {
    setErrors(prev => ({
      ...prev,
      [path]: "Invalid email format"
    }));
  } else {
    setErrors(prev => ({ ...prev, [path]: "" }));
  }
};


  return (
    <>
    <div className="min-h-screen px-3 py-4 sm:px-4 md:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">

      
<div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
  
  {/* LEFT */}
  <button
    onClick={() => navigate(-1)}
    className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800"
  >
    <FiArrowLeft className="mr-2" />
    Back to Application List
  </button>

  {/* CENTER */}
  <div className="text-xs sm:text-sm text-gray-600 break-all md:text-center">
    <span className="font-semibold">Application ID:</span>{" "}
    {application.applicationId || application._id}
  </div>

  {/* RIGHT (BUTTON GROUP) */}
  <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
    <button
      onClick={handleToggleEdit}
      className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold"
    >
      {isEdit ? "Cancel Edit" : "Edit Profile"}
    </button>

    {isEdit && (
      <button
        onClick={handleSave}
        className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold"
      >
        Save Changes
      </button>
    )}
  </div>
</div>


      {/*  PROFILE HEADER */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4 flex flex-col items-center text-center gap-4 sm:flex-row sm:items-center sm:text-left sm:gap-6">
        <div className="flex flex-col items-center gap-2">
          <ProfileAvatar
            name={(isEdit ? formData : application).personalInfo?.name || "Applicant"}
            imageSrc={getDocumentUrl(getLatestPassportPhoto((isEdit ? formData : application).documents))}
            sizeClassName="w-24 h-24 sm:w-28 sm:h-28 shrink-0"
            textClassName="text-3xl"
            className="ring-4 ring-indigo-200"
          />
          {isEdit && (
            <label className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800">
              Change Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const compressedFile = await compressImageToSquare(file);
                    handleDocumentUpload(compressedFile, "Passport Size Photo");
                  }
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
  {(isEdit ? formData : application).personalInfo?.name}
</h1>

          <p className="text-indigo-600 font-medium">
            Applying For Class: {application.personalInfo?.classApplied ||  "N/A"}
          </p>
          <p className="text-sm text-gray-500">
            Status: <span className={`font-semibold ${application.applicationStatus === 'Approved' ? 'text-green-600' : application.applicationStatus === 'Rejected' ? 'text-red-600' : 'text-yellow-600'}`}>{application.applicationStatus}</span>
          </p>
        </div>
      </div>

      {/* 🧷 TABS */}
      <div className="mb-4">
        <div className="bg-white rounded-xl shadow-md p-2 flex flex-wrap gap-2">
          <TabButton
            label="Application Profile"
            icon={<FiInfo />}
            isActive={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
          <TabButton
            label="Documents"
            icon={<FiFileText />}
            isActive={activeTab === "documents"}
            onClick={() => setActiveTab("documents")}
          />
          <TabButton
            label="Assessment"
            icon={<FiBarChart />}
            isActive={activeTab === "assessment"}
            onClick={() => setActiveTab("assessment")}
          />
          <TabButton
            label="Payment"
            icon={<FiDollarSign />}
            isActive={activeTab === "payment"}
            onClick={() => setActiveTab("payment")}
          />
        </div>
      </div>

      {/* ================= TAB CONTENT ================= */}

    {/*  APPLICATION PROFILE */}
{activeTab === "profile" && (
  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">

    {/* PERSONAL INFORMATION */}
    <ProfileCard
      label="Personal Information"
      icon={<FiInfo />}
      className="bg-white"
    >
      <InfoDetail
        label="Full Name"
        value={formData.personalInfo?.name}
        editable={isEdit}
        onChange={(v) => handleChange("personalInfo.name", v)}
      />
      <InfoDetail
        label="Date of Birth"
        value={formData.personalInfo?.dateOfBirth}
        editable={isEdit}
        onChange={(v) => handleChange("personalInfo.dateOfBirth", v)}
      />
      <InfoDetail
        label="Gender"
        value={formData.personalInfo?.gender}
        editable={isEdit}
        onChange={(v) => handleChange("personalInfo.gender", v)}
      />
      <InfoDetail
        label="Blood Group"
        value={formData.personalInfo?.bloodGroup}
        editable={isEdit}
        onChange={(v) => handleChange("personalInfo.bloodGroup", v)}
      />
      <InfoDetail
        label="Nationality"
        value={formData.personalInfo?.nationality}
        editable={isEdit}
        onChange={(v) => handleChange("personalInfo.nationality", v)}
      />
      <InfoDetail
        label="Religion"
        value={formData.personalInfo?.religion}
        editable={isEdit}
        onChange={(v) => handleChange("personalInfo.religion", v)}
      />
      <InfoDetail
        label="Class"
        value={formData.personalInfo?.classApplied}
        editable={isEdit}
        onChange={(v) => handleChange("personalInfo.classApplied", v)}
      />
    </ProfileCard>

    {/* CONTACT INFORMATION */}
    <ProfileCard
      label="Contact Information"
      icon={<FiInfo />}
      className="bg-white"
    >
   <InfoDetail
  label="Phone"
  value={formData.contactInfo?.phone || ""}
  editable={isEdit}
  error={errors["contactInfo.phone"]}
  onChange={(v) => handleNumberChange("contactInfo.phone", v)}
/>



  <InfoDetail
  label="Alternate Phone"
  value={formData.contactInfo?.alternatePhone || ""}
  editable={isEdit}
  error={errors["contactInfo.alternatePhone"]}
  onChange={(v) =>
    handleNumberChange("contactInfo.alternatePhone", v)
  }
/>


      <InfoDetail
  label="Email"
  value={formData.contactInfo?.email || ""}
  editable={isEdit}
  error={errors["contactInfo.email"]}
  onChange={(v) => handleEmailChange("contactInfo.email", v)}
/>


      <InfoDetail
        label="Address"
        value={formData.contactInfo?.address}
        editable={isEdit}
        onChange={(v) => handleChange("contactInfo.address", v)}
      />
      <InfoDetail
        label="City"
        value={formData.contactInfo?.city}
        editable={isEdit}
        onChange={(v) => handleChange("contactInfo.city", v)}
      />
      <InfoDetail
        label="State"
        value={formData.contactInfo?.state}
        editable={isEdit}
        onChange={(v) => handleChange("contactInfo.state", v)}
      />
      <InfoDetail
        label="Zip Code"
        value={formData.contactInfo?.zipCode}
        editable={isEdit}
        onChange={(v) => handleChange("contactInfo.zipCode", v)}
      />
    </ProfileCard>

    {/* ACADEMIC INFORMATION */}
    <ProfileCard
      label="Earlier Academic Information"
      icon={<FiInfo />}
      className="bg-white"
    >
      <InfoDetail
        label="Previous School"
        value={formData.earlierAcademic?.schoolName}
        editable={isEdit}
        onChange={(v) => handleChange("earlierAcademic.schoolName", v)}
      />
      <InfoDetail
        label="Board"
        value={formData.earlierAcademic?.board}
        editable={isEdit}
        onChange={(v) => handleChange("earlierAcademic.board", v)}
      />
      <InfoDetail
        label="Last Class Studied"
        value={formData.earlierAcademic?.lastClass}
        editable={isEdit}
        onChange={(v) => handleChange("earlierAcademic.lastClass", v)}
      />
      <InfoDetail
        label="Academic Year"
        value={formData.earlierAcademic?.academicYear}
        editable={isEdit}
        onChange={(v) => handleChange("earlierAcademic.academicYear", v)}
      />
    </ProfileCard>

    {/* PARENT / GUARDIAN DETAILS */}
    <ProfileCard
      label="Parent / Guardian Details"
      icon={<FiInfo />}
      className="bg-white"
    >
      <InfoDetail
        label="Father Name"
        value={formData.parents?.father?.name}
        editable={isEdit}
        onChange={(v) => handleChange("parents.father.name", v)}
      />
      <InfoDetail
        label="Father Occupation"
        value={formData.parents?.father?.occupation || ""}
        editable={isEdit}
        onChange={(v) => handleChange("parents.father.occupation", v)}
      />
      <InfoDetail
        label="Father Phone Number"
        value={formData.parents?.father?.phone || ""}
        editable={isEdit}
        error={errors["parents.father.phone"]}
        onChange={(v) => handleNumberChange("parents.father.phone", v)}
      />
      <InfoDetail
        label="Father Email ID"
        value={formData.parents?.father?.email || ""}
        editable={isEdit}
        error={errors["parents.father.email"]}
        onChange={(v) => handleEmailChange("parents.father.email", v)}
      />
      <InfoDetail
        label="Mother Name"
        value={formData.parents?.mother?.name}
        editable={isEdit}
        onChange={(v) => handleChange("parents.mother.name", v)}
      />
      <InfoDetail
        label="Mother Occupation"
        value={formData.parents?.mother?.occupation || ""}
        editable={isEdit}
        onChange={(v) => handleChange("parents.mother.occupation", v)}
      />
      <InfoDetail
        label="Mother Phone Number"
        value={formData.parents?.mother?.phone || ""}
        editable={isEdit}
        error={errors["parents.mother.phone"]}
        onChange={(v) => handleNumberChange("parents.mother.phone", v)}
      />
      <InfoDetail
        label="Mother Email ID"
        value={formData.parents?.mother?.email || ""}
        editable={isEdit}
        error={errors["parents.mother.email"]}
        onChange={(v) => handleEmailChange("parents.mother.email", v)}
      />
      <InfoDetail
        label="Guardian Name"
        value={formData.parents?.guardian?.name}
        editable={isEdit}
        onChange={(v) => handleChange("parents.guardian.name", v)}
      />
      <InfoDetail
        label="Guardian Relation"
        value={formData.parents?.guardian?.relation || ""}
        editable={isEdit}
        onChange={(v) => handleChange("parents.guardian.relation", v)}
      />
      <InfoDetail
        label="Guardian Phone Number"
        value={formData.parents?.guardian?.phone || ""}
        editable={isEdit}
        error={errors["parents.guardian.phone"]}
        onChange={(v) => handleNumberChange("parents.guardian.phone", v)}
      />
      <InfoDetail
        label="Guardian Email ID"
        value={formData.parents?.guardian?.email || ""}
        editable={isEdit}
        error={errors["parents.guardian.email"]}
        onChange={(v) => handleEmailChange("parents.guardian.email", v)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-b-0">
        <p className="font-medium text-gray-500">Parent ID account (login)</p>
        <div className="col-span-2">
          {isEdit ? (
            <select
              className="w-full px-3 py-2 border rounded-md text-sm border-gray-300"
              value={formData.parents?.parentIdAccountHolder || "father"}
              onChange={(e) => handleChange("parents.parentIdAccountHolder", e.target.value)}
            >
              <option value="father">Father</option>
              <option value="mother">Mother</option>
              <option value="guardian">Guardian</option>
            </select>
          ) : (
            <p>
              {formData.parents?.parentIdAccountHolder === "mother"
                ? "Mother"
                : formData.parents?.parentIdAccountHolder === "guardian"
                  ? "Guardian"
                  : "Father"}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Only this person is linked to the application Parent ID in the admin parent list and parent portal login.
          </p>
        </div>
      </div>
    </ProfileCard>

  </div>
)}


    {/*  DOCUMENTS */}
{activeTab === "documents" && (
  <ProfileCard label="Uploaded Documents" icon={<FiFileText />} className="bg-white">
    {documentError ? (
      <div className="mb-3 p-2 rounded-md bg-red-50 text-red-600 text-sm">
        {documentError}
      </div>
    ) : null}
    {isEdit && (
  <div className="mb-4">
    <label className="text-sm font-medium text-gray-600">
      Upload Document
    </label>
    <input
      type="file"
      className="mt-1 block text-sm"
      onChange={(e) => {
        const file = e.target.files[0];
        if (file) handleDocumentUpload(file, "General Document");
      }}
    />
  </div>
)}

    <ul className="divide-y">
      {((isEdit ? formData : application).documents || []).length > 0 ? (
        ((isEdit ? formData : application).documents || []).map((doc, idx) => (
          <li key={idx} className="py-3 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-start sm:items-center gap-2">
              <FiFileText className="text-gray-400" />
              <span className="break-all">
                {doc.name} <span className="text-xs text-gray-400">({doc.type})</span>
              </span>
            </div>
           <div className="flex flex-wrap gap-3 sm:gap-4">
  <button onClick={() => handlePreview(doc)} className="text-blue-600">
    <FiEye /> Preview
  </button>

  <button onClick={() => handleDownload(doc)} className="text-indigo-600">
    <FiDownload /> Download
  </button>

  {isEdit && (
    <button
      onClick={() => handleDeleteDocument(doc._id)}
      className="text-red-600"
    >
      Delete
    </button>
  )}
</div>

          </li>
        ))
      ) : (
        <p className="text-gray-500">No documents uploaded.</p>
      )}
    </ul>
  </ProfileCard>
)}


      {/*  ASSESSMENT */}
      {activeTab === "assessment" && (
        <ProfileCard label="Assessment" icon={<FiBarChart />} className="bg-white">
          <p className="text-gray-500">
            Assessment will be available after evaluation.
          </p>
        </ProfileCard>
      )}

      {/*  PAYMENT */}
      {activeTab === "payment" && (
        <ProfileCard label="Payment" icon={<FiDollarSign />} className="bg-white">
          {isEdit ? (
            <>
              <div className="border-b pb-3 mb-3">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Admission Fee Status
                </label>
                <select
                  value={(formData.admissionFee?.status || formData.personalInfo?.fees || "Due")}
                  onChange={(e) => {
                    const nextStatus = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      admissionFee: {
                        ...(prev.admissionFee || {}),
                        status: nextStatus,
                      },
                      personalInfo: {
                        ...(prev.personalInfo || {}),
                        fees: nextStatus,
                      },
                    }));
                  }}
                  className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="Due">Due</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div className="border-b pb-3 mb-3">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Admission Fee Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.admissionFee?.amount ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      admissionFee: {
                        ...(prev.admissionFee || {}),
                        amount: raw === "" ? "" : Number(raw),
                      },
                    }));
                  }}
                  className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter amount"
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-500 border-b pb-2 mb-2">
                Admission Fee Status:{" "}
                <span
                  className={`font-semibold ${
                    ((application.admissionFee?.status || application.personalInfo?.fees) === "Paid")
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {application.admissionFee?.status || application.personalInfo?.fees || "Due"}
                </span>
              </p>
              <p className="text-gray-500 border-b pb-2 mb-2">
                Admission Fee Amount:{" "}
                <span className="font-semibold text-gray-700">
                  ₹ {application.admissionFee?.amount ?? "0"}
                </span>
              </p>
            </>
          )}
          <p className="text-gray-500">
            Detailed payment history will be available after confirmation.
          </p>
        </ProfileCard>
      )}
    </div>
    </div>

    {isPreviewOpen && previewDoc ? (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 truncate">{getFileNameFromDoc(previewDoc)}</p>
              <p className="text-xs text-gray-500">{previewDoc.type || "Document preview"}</p>
            </div>
            <button
              onClick={closePreview}
              className="px-3 py-1.5 rounded-md text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Close
            </button>
          </div>

          <div className="flex-1 bg-gray-50 p-3 sm:p-4">
            {getPreviewType(previewDoc) === "image" ? (
              <div className="h-full w-full flex items-center justify-center">
                <img
                  src={previewDoc.previewUrl}
                  alt={getFileNameFromDoc(previewDoc)}
                  className="max-h-full max-w-full object-contain rounded-md"
                />
              </div>
            ) : null}

            {getPreviewType(previewDoc) === "pdf" ? (
              <iframe
                title={`Preview ${getFileNameFromDoc(previewDoc)}`}
                src={previewDoc.previewUrl}
                className="w-full h-full rounded-md border border-gray-200 bg-white"
              />
            ) : null}

            {getPreviewType(previewDoc) === "unsupported" ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-6">
                <p className="text-gray-700 mb-2">Preview is not available for this file type.</p>
                <p className="text-sm text-gray-500 mb-4">
                  You can still download the file to view it in a local application.
                </p>
                <button
                  onClick={() => handleDownload(previewDoc)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm"
                >
                  Download File
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
};

export default AdmissionReviewProfile;
