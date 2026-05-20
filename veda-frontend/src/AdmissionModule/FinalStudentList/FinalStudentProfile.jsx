import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiInfo,
  FiFileText,
  FiDollarSign,
  FiEdit3,
  FiSave,
  FiX,
  FiDownload,
  FiTrash2,
  FiEye,
} from "react-icons/fi";
import axios from "axios";
import jsPDF from "jspdf";
import config from "../../config";
import ProfileAvatar from "../../components/ProfileAvatar";
import {
  getStudentDocumentUrl,
  getLatestPassportPhotoUrlFromDocs,
} from "../../utils/studentProfileMedia";

/* ================= CONSTANTS ================= */

const documentAccept =
  ".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx";

/* ================= INITIAL DATA ================= */

const initialStudent = {
  stdId: "",
  name: "",
  class: "",
  dob: "",
  gender: "",
  bloodGroup: "",
  nationality: "",
  religion: "",
  email: "",
  phone: "",
  altPhone: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  previousSchool: "",
  board: "",
  lastClass: "",
  academicYear: "",
  fatherName: "",
  fatherOccupation: "",
  fatherPhone: "",
  fatherEmail: "",
  motherName: "",
  motherOccupation: "",
  motherPhone: "",
  motherEmail: "",
  guardianName: "",
  guardianRelation: "",
  guardianPhone: "",
  guardianEmail: "",
  emergencyName: "",
  emergencyRelation: "",
  emergencyPhone: "",
  transportRequired: "",
  feeStatus: "",
  medicalConditions: "",
  specialNeeds: "",
  admissionFeeAmount: "",
  regFeeAmount: "",
  paymentMode: "",
  paymentDate: "",
  receiptNo: "",
  remarks: "",
};
const initialDocs = [];

const normalizeDocument = (doc = {}, idx = 0) => ({
  id: doc._id || doc.id || idx + 1,
  _id: doc._id || doc.id || idx + 1,
  name: doc.name || doc.type || `Document ${idx + 1}`,
  type: doc.type || "",
  fileType: doc.fileType || "",
  path: doc.path || "",
  fileUrl: getStudentDocumentUrl(doc) || "",
  date: doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "-",
});

const mapStudentForProfile = (raw = {}) => {
  const personal = raw.personalInfo || {};
  const contact = raw.contactInfo || {};
  const earlierAcademic = raw.earlierAcademic || {};
  const parents = raw.parents || {};
  const feeInfo = raw.feeInfo || {};
  const admissionFee = raw.admissionFee || {};
  const [street = "", city = "", stateZip = ""] = String(
    contact.address || ""
  )
    .split(",")
    .map((item) => item.trim());
  const stateFromAddress = stateZip.replace(/\s+\d{4,10}$/, "").trim();
  const zipFromAddressMatch = stateZip.match(/(\d{4,10})$/);
  const zipFromAddress = zipFromAddressMatch ? zipFromAddressMatch[1] : "";

  return {
    stdId: personal.stdId || "",
    name: personal.name || "",
    class: personal.class || personal.classApplied || "",
    dob: personal.dateOfBirth || "",
    gender: personal.gender || "",
    bloodGroup: personal.bloodGroup || "",
    nationality: personal.nationality || "",
    religion: personal.religion || "",
    email: contact.email || "",
    phone: contact.phone || "",
    altPhone: contact.alternatePhone || "",
    street,
    city: contact.city || city,
    state: contact.state || stateFromAddress,
    zip: contact.zipCode || contact.zip || zipFromAddress,
    previousSchool: earlierAcademic.schoolName || "",
    board: earlierAcademic.board || "",
    lastClass: earlierAcademic.lastClass || "",
    academicYear: earlierAcademic.academicYear || "",
    fatherName: parents.father?.name || "",
    fatherOccupation: parents.father?.occupation || "",
    fatherPhone: parents.father?.phone || "",
    fatherEmail: parents.father?.email || "",
    motherName: parents.mother?.name || "",
    motherOccupation: parents.mother?.occupation || "",
    motherPhone: parents.mother?.phone || "",
    motherEmail: parents.mother?.email || "",
    guardianName: parents.guardian?.name || "",
    guardianRelation: parents.guardian?.relation || "",
    guardianPhone: parents.guardian?.phone || "",
    guardianEmail: parents.guardian?.email || "",
    emergencyName: raw.emergencyContact?.name || "",
    emergencyRelation: raw.emergencyContact?.relation || "",
    emergencyPhone: raw.emergencyContact?.phone || "",
    transportRequired: raw.transportRequired || "",
    feeStatus: admissionFee.status || personal.fees || "",
    medicalConditions: raw.medicalConditions || "",
    specialNeeds: raw.specialNeeds || "",
    admissionFeeAmount: admissionFee.amount ?? feeInfo.admissionFee ?? "",
    regFeeAmount: admissionFee.amount ?? feeInfo.admissionFee ?? "",
    paymentMode: admissionFee.paymentMode || feeInfo.paymentMode || "",
    paymentDate: admissionFee.paymentDate || feeInfo.paymentDate || "",
    receiptNo: admissionFee.receiptNumber || feeInfo.receiptNo || "",
    remarks:
      admissionFee.remarks ||
      feeInfo.remarks ||
      raw.remarks ||
      raw.admissionRemarks ||
      personal.remarks ||
      "",
  };
};

/* ================= SMALL COMPONENTS ================= */

const ProfileCard = ({ label, icon, children }) => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden">
    <div className="p-4 sm:p-5 md:p-6">
      <div className="flex items-center mb-4 gap-2 text-indigo-500">
      {icon}
      <h3 className="font-semibold text-lg text-gray-800">{label}</h3>
      </div>
      <div className="space-y-3 text-sm text-gray-600">{children}</div>
    </div>
  </div>
);

const Field = ({ label, value, isEditing, onChange, type = "text" }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-b-0">
    <p className="text-gray-500 font-medium">{label}</p>
    <div className="col-span-2">
      {isEditing ? (
        <input
          type={type}
          className="w-full px-3 py-2 border rounded-md text-sm border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <p>{value || "N/A"}</p>
      )}
    </div>
  </div>
);

/* ================= MAIN COMPONENT ================= */

const FinalStudentProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  /* REAL SAVED DATA */
  const [student, setStudent] = useState(initialStudent);

  /* EDIT COPY (IMPORTANT – FIX FOR BACKSPACE BUG) */
  const [editStudent, setEditStudent] = useState(null);

  const [documents, setDocuments] = useState(initialDocs);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [documentError, setDocumentError] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const stateStudent = location.state;
    if (stateStudent) {
      setStudent(mapStudentForProfile(stateStudent));
      setDocuments((stateStudent.documents || []).map(normalizeDocument));
    }

    const fetchStudent = async () => {
      try {
        const res = await axios.get(
          `${config.API_BASE_URL}/admission/application/${id}`
        );
        if (res.data?.success && res.data?.data) {
          setStudent(mapStudentForProfile(res.data.data));
          setDocuments((res.data.data.documents || []).map(normalizeDocument));
        }
      } catch (error) {
        console.error("Failed to fetch final student profile:", error);
      }
    };

    if (id) {
      fetchStudent();
    }
  }, [location.state, id]);

  /* ================= EDIT FLOW ================= */

  const downloadReceipt = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    let y = 70;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("STUDENT FEE RECEIPT", pageWidth / 2, y, { align: "center" });

    y += 34;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);

    y += 28;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const rows = [
      ["Student Name", data.name || "N/A"],
      ["Student ID", data.stdId || "N/A"],
      ["Admission Fee", `Rs ${data.admissionFeeAmount || 0}`],
      ["Receipt No", data.receiptNo || "N/A"],
      ["Payment Date", data.paymentDate || "N/A"],
      ["Payment Mode", data.paymentMode || "N/A"],
      ["Amount Paid", `Rs ${data.regFeeAmount || 0}`],
      ["Remarks", data.remarks || "-"],
      ["Status", data.feeStatus || "N/A"],
    ];

    rows.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), margin + 135, y);
      y += 24;
    });

    y += 16;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);

    y += 24;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated on: ${new Date().toLocaleString()}`,
      margin,
      y
    );

    doc.save(`Fee_Receipt_${data.stdId || "student"}.pdf`);
  };

  const startEdit = () => {
    setEditStudent({ ...student });
    setIsEditing(true);
  };

  const saveEdit = () => {
    setStudent(editStudent);
    setEditStudent(null);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditStudent(null);
    setIsEditing(false);
  };

  const changeField = (key, value) => {
    setEditStudent((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Guard against transient null during edit-mode state transitions.
  const data = isEditing ? (editStudent || student) : student;

  /* ================= DOCUMENTS ================= */

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

      if (res.data?.success) {
        const nextDocs = (res.data?.data?.documents || []).map(normalizeDocument);
        setDocuments(nextDocs);
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
      setDocuments((prev) =>
        prev.filter((doc) => String(doc._id || doc.id) !== String(docId))
      );
    } catch (err) {
      console.error("Delete failed", err);
      setDocumentError("Failed to delete document. Please try again.");
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
    const fileUrl = getStudentDocumentUrl(doc);
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

  const handlePreview = (doc) => {
    setDocumentError("");
    const fileUrl = getStudentDocumentUrl(doc);
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

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError("");
    setIsPhotoUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", "Passport Size Photo");

      const res = await axios.post(
        `${config.API_BASE_URL}/admission/application/${id}/upload`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data?.success) {
        const nextDocs = (res.data?.data?.documents || []).map(normalizeDocument);
        setDocuments(nextDocs);
      } else {
        setPhotoError("Unable to update profile picture.");
      }
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
      setPhotoError("Profile picture upload failed. Please try again.");
    } finally {
      setIsPhotoUploading(false);
      e.target.value = "";
    }
  };

  /* ================= UI ================= */

  return (
    <>
    <div className="min-h-screen px-3 py-4 sm:px-4 md:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-4">
      {/* HEADER */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800"
        >
          <FiArrowLeft className="mr-2" /> Back to Student List
        </button>

        {!isEditing ? (
          <button
            onClick={startEdit}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold"
          >
            <FiEdit3 className="inline mr-2" /> Edit
          </button>
        ) : (
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
            <button
              onClick={saveEdit}
              className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold"
            >
              <FiSave className="inline mr-2" /> Save
            </button>
            <button
              onClick={cancelEdit}
              className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-semibold"
            >
              <FiX className="inline mr-2" /> Cancel
            </button>
          </div>
        )}
      </div>

      {/* PROFILE HEADER */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4 flex flex-col items-center text-center gap-4 sm:flex-row sm:items-center sm:text-left sm:gap-6">
        <div className="flex flex-col items-center gap-2">
          <ProfileAvatar
            name={data.name || "Student"}
            imageSrc={getLatestPassportPhotoUrlFromDocs(documents)}
            sizeClassName="w-24 h-24 sm:w-28 sm:h-28 shrink-0"
            textClassName="text-3xl"
            className="ring-4 ring-indigo-200"
          />
          {isEditing && (
            <label className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800">
              {isPhotoUploading ? "Uploading..." : "Change Photo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePhotoUpload}
                disabled={isPhotoUploading}
              />
            </label>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
          <p className="text-indigo-600 font-medium">
            Class: {data.class || "N/A"}
          </p>
          <p className="text-sm text-gray-500 font-medium">
            Student ID: {data.stdId}
          </p>
          {photoError ? (
            <p className="text-xs text-red-500 mt-1">{photoError}</p>
          ) : null}
        </div>
      </div>

      {/* TABS */}
      <div className="mb-4">
      <div className="bg-white rounded-xl shadow-md p-2 flex flex-wrap gap-2">
        {["overview", "fee", "documents"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 min-w-[130px] sm:min-w-fit px-3 sm:px-4 py-2.5 text-sm font-medium rounded-lg transition ${
              activeTab === t
                ? "bg-indigo-600 text-white shadow"
                : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      </div>

      {activeTab === "overview" && (
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5">

    {/* LEFT */}
    <div className="lg:col-span-2 space-y-4">

      <ProfileCard label="Personal Information" icon={<FiInfo />}>
        <Field label="Full Name" value={data.name} isEditing={isEditing} onChange={(v)=>changeField("name",v)} />
        <Field label="Date of Birth" type="date" value={data.dob} isEditing={isEditing} onChange={(v)=>changeField("dob",v)} />
        <Field label="Gender" value={data.gender} isEditing={isEditing} onChange={(v)=>changeField("gender",v)} />
        <Field label="Blood Group" value={data.bloodGroup} isEditing={isEditing} onChange={(v)=>changeField("bloodGroup",v)} />
        <Field label="Nationality" value={data.nationality} isEditing={isEditing} onChange={(v)=>changeField("nationality",v)} />
        <Field label="Religion" value={data.religion} isEditing={isEditing} onChange={(v)=>changeField("religion",v)} />
      </ProfileCard>

      <ProfileCard label="Contact Information" icon={<FiInfo />}>
        <Field label="Email" value={data.email} isEditing={isEditing} onChange={(v)=>changeField("email",v)} />
        <Field label="Phone" value={data.phone} isEditing={isEditing} onChange={(v)=>changeField("phone",v)} />
        <Field label="Alternate Phone" value={data.altPhone} isEditing={isEditing} onChange={(v)=>changeField("altPhone",v)} />
        <Field label="Street" value={data.street} isEditing={isEditing} onChange={(v)=>changeField("street",v)} />
        <Field label="City" value={data.city} isEditing={isEditing} onChange={(v)=>changeField("city",v)} />
        <Field label="State" value={data.state} isEditing={isEditing} onChange={(v)=>changeField("state",v)} />
        <Field label="Zip Code" value={data.zip} isEditing={isEditing} onChange={(v)=>changeField("zip",v)} />
      </ProfileCard>

      <ProfileCard label="Earlier Academic Information" icon={<FiInfo />}>
        <Field label="Previous School" value={data.previousSchool} isEditing={isEditing} onChange={(v)=>changeField("previousSchool",v)} />
        <Field label="Board / University" value={data.board} isEditing={isEditing} onChange={(v)=>changeField("board",v)} />
        <Field label="Class Last Studied" value={data.lastClass} isEditing={isEditing} onChange={(v)=>changeField("lastClass",v)} />
        <Field label="Academic Year" value={data.academicYear} isEditing={isEditing} onChange={(v)=>changeField("academicYear",v)} />
      </ProfileCard>

    </div>

    {/* RIGHT */}
    <div className="space-y-4">

      <ProfileCard label="Parent / Guardian Information" icon={<FiInfo />}>
        <Field label="Father Name" value={data.fatherName} isEditing={isEditing} onChange={(v)=>changeField("fatherName",v)} />
        <Field label="Father Occupation" value={data.fatherOccupation} isEditing={isEditing} onChange={(v)=>changeField("fatherOccupation",v)} />
        <Field label="Father Phone" value={data.fatherPhone} isEditing={isEditing} onChange={(v)=>changeField("fatherPhone",v)} />
        <Field label="Father Email" value={data.fatherEmail} isEditing={isEditing} onChange={(v)=>changeField("fatherEmail",v)} />

        <Field label="Mother Name" value={data.motherName} isEditing={isEditing} onChange={(v)=>changeField("motherName",v)} />
        <Field label="Mother Occupation" value={data.motherOccupation} isEditing={isEditing} onChange={(v)=>changeField("motherOccupation",v)} />
        <Field label="Mother Phone" value={data.motherPhone} isEditing={isEditing} onChange={(v)=>changeField("motherPhone",v)} />
        <Field label="Mother Email" value={data.motherEmail} isEditing={isEditing} onChange={(v)=>changeField("motherEmail",v)} />

        <Field label="Guardian Name" value={data.guardianName} isEditing={isEditing} onChange={(v)=>changeField("guardianName",v)} />
        <Field label="Relation" value={data.guardianRelation} isEditing={isEditing} onChange={(v)=>changeField("guardianRelation",v)} />
        <Field label="Guardian Phone" value={data.guardianPhone} isEditing={isEditing} onChange={(v)=>changeField("guardianPhone",v)} />
        <Field label="Guardian Email" value={data.guardianEmail} isEditing={isEditing} onChange={(v)=>changeField("guardianEmail",v)} />
      </ProfileCard>

      <ProfileCard label="Emergency Contact" icon={<FiInfo />}>
        <Field label="Contact Name" value={data.emergencyName} isEditing={isEditing} onChange={(v)=>changeField("emergencyName",v)} />
        <Field label="Relation" value={data.emergencyRelation} isEditing={isEditing} onChange={(v)=>changeField("emergencyRelation",v)} />
        <Field label="Phone" value={data.emergencyPhone} isEditing={isEditing} onChange={(v)=>changeField("emergencyPhone",v)} />
      </ProfileCard>

    </div>
  </div>
)}

      

      {/* FEE */}
      {activeTab === "fee" && (
  <ProfileCard label="Registration / Admission Fees" icon={<FiDollarSign />}>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">

      <div>
        <p className="text-gray-500">Receipt Number</p>
        <p className="font-semibold">{data.receiptNo || "N/A"}</p>
      </div>

      <div>
        <p className="text-gray-500">Payment Date</p>
        <p className="font-semibold">{data.paymentDate || "N/A"}</p>
      </div>

      <div>
        <p className="text-gray-500">Payment Mode</p>
        <p className="font-semibold">{data.paymentMode}</p>
      </div>

      <div>
        <p className="text-gray-500">Admission Fee</p>
        <p className="font-semibold text-indigo-600">
          ₹ {data.admissionFeeAmount || 0}
        </p>
      </div>

      <div>
        <p className="text-gray-500">Amount Paid</p>
        <p className="font-semibold text-green-600">
          ₹ {data.regFeeAmount || 0}
        </p>
      </div>

      <div className="col-span-2">
        <p className="text-gray-500">Remarks</p>
        <p>{data.remarks || "—"}</p>
      </div>

      <div className="col-span-2 flex items-center justify-between mt-3">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            data.feeStatus === "Paid"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {data.feeStatus}
        </span>

        <button
          onClick={downloadReceipt}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg"
        >
          <FiDownload /> Download Receipt
        </button>
      </div>
    </div>
  </ProfileCard>
)}
      {/* DOCUMENTS */}
      {activeTab === "documents" && (
        <ProfileCard label="Uploaded Documents" icon={<FiFileText />}>
          {documentError ? (
            <div className="mb-3 p-2 rounded-md bg-red-50 text-red-600 text-sm">
              {documentError}
            </div>
          ) : null}

          {isEditing && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-600">
                Upload Document
              </label>
              <input
                type="file"
                accept={documentAccept}
                className="mt-1 block text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDocumentUpload(file, "General Document");
                  e.target.value = "";
                }}
              />
            </div>
          )}

          <ul className="divide-y">
            {documents.length > 0 ? (
              documents.map((doc, idx) => (
                <li key={doc._id || doc.id || idx} className="py-3 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                  <div className="flex items-start sm:items-center gap-2">
                    <FiFileText className="text-gray-400" />
                    <span className="break-all">
                      {doc.name} <span className="text-xs text-gray-400">({doc.type || "Document"})</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 sm:gap-4">
                    <button onClick={() => handlePreview(doc)} className="text-blue-600 inline-flex items-center gap-1">
                      <FiEye /> Preview
                    </button>

                    <button onClick={() => handleDownload(doc)} className="text-indigo-600 inline-flex items-center gap-1">
                      <FiDownload /> Download
                    </button>

                    {isEditing && (
                      <button
                        onClick={() => handleDeleteDocument(doc._id || doc.id)}
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

export default FinalStudentProfile;