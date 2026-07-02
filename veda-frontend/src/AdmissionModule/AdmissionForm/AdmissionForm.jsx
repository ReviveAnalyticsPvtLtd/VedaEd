import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { State, City } from "country-state-city";
import config from "../../config";

const allStates = State.getStatesOfCountry("IN");
import HelpInfo from "../../components/HelpInfo";
import {
  FiUser,
  FiPhone,
  FiBookOpen,
  FiSave,
  FiX,
  FiUpload,
  FiFileText,
  FiEye,
  FiTrash2,
  FiCamera,
  FiImage,
} from "react-icons/fi";

// Reusable Form Field Component
const FormField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
  className = "",
  error,
  children,
  ...props
}) => (
  <div className={className}>
    <label className="block text-sm font-medium mb-1">
      {label} {required && "*"}
    </label>

    {children || (
     <input
  type={type}
  name={name}
  value={value}
  placeholder={placeholder}
  className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2
    ${error ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"}`}

  onKeyDown={(e) => {
    const letterOnlyFields = [
      "studentName",
      "fatherName",
      "motherName",
      "guardianName",
      "emergencyContactName",
    ];

    const numberOnlyFields = [
      "phone",
      "alternatePhone",
      "fatherPhone",
      "motherPhone",
      "guardianPhone",
      "emergencyContactPhone",
      "zipCode",
    ];

    // ✅ LETTERS ONLY
    if (
      letterOnlyFields.includes(name) &&
      !/^[a-zA-Z\s]$/.test(e.key) &&
      !["Backspace", "Tab", "ArrowLeft", "ArrowRight"].includes(e.key)
    ) {
      e.preventDefault(); // ❌ TYPE NAHI HOGA
    }

    // ✅ NUMBERS ONLY
    if (
      numberOnlyFields.includes(name) &&
      !/^\d$/.test(e.key) &&
      !["Backspace", "Tab", "ArrowLeft", "ArrowRight"].includes(e.key)
    ) {
      e.preventDefault(); // ❌ TYPE NAHI HOGA
    }
  }}

  onChange={onChange}
/>
    )}

    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);


// Reusable Select Component
const SelectField = ({ label, name, value, onChange, required = false, options = [], className = "", children }) => (
  <FormField label={label} name={name} required={required} className={className}>
    {children || (
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select {label.replace("*", "").trim()}</option>
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
    )}
  </FormField>
);

// Section Header Component
const SectionHeader = ({ icon, title }) => (
  <h3 className="text-lg font-semibold mb-4 pb-2 border-b flex items-center gap-2">
    {icon} {title}
  </h3>
);

const validateField = (name, value) => {
  switch (name) {
    case "email":
    case "fatherEmail":
    case "motherEmail":
    case "guardianEmail":
      return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? "Enter valid email"
        : "";

        case "previousSchoolName":
case "previousSchoolBoard":
case "previousClass":
case "yearOfStudy":
  return !value ? "This field is required" : "";


    case "phone":
    case "alternatePhone":
    case "fatherPhone":
    case "motherPhone":
    case "guardianPhone":
    case "emergencyContactPhone":
      return !/^\d{10}$/.test(value)
        ? "Enter 10 digit number"
        : "";

    case "zipCode":
      return value && !/^\d{6}$/.test(value)
        ? "Enter valid zip code"
        : "";

    case "studentName":
    case "fatherName":
    case "motherName":
    case "guardianName":
      return value && !/^[a-zA-Z\s]+$/.test(value)
        ? "Only letters allowed"
        : "";

    default:
      return "";
  }
};

const INDIA_DATA = {
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Agra", "Varanasi"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"],
  "Delhi": ["New Delhi", "Dwarka", "Rohini", "Saket"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
  "Rajasthan": ["Jaipur", "Udaipur", "Jodhpur"],
};

// 🔤 Capitalize helpers
const capitalizeFirst = (str = "") =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

const capitalizeEachWord = (str = "") =>
  str
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
    // 🧑‍🎓 Fields which need EACH WORD Capital
const NAME_FIELDS = [
  "studentName",
  "fatherName",
  "motherName",
  "guardianName",
  "emergencyContactName","nationality",
  "religion",
  "address",
  "previousSchoolName",
  "previousSchoolBoard",
  "previousClass",
  "yearOfStudy",
  "fatherOccupation",
  "motherOccupation",
  "guardianRelation",
  "emergencyContactRelation",
  "medicalConditions",
  "specialNeeds",
  "remarks",
];


const TEXT_FIELDS = [

 
];

export default function AdmissionForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [classes, setClasses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
const [errors, setErrors] = useState({});
const [stateQuery, setStateQuery] = useState("");
const [cityQuery, setCityQuery] = useState("");
const [showStateList, setShowStateList] = useState(false);
const [showCityList, setShowCityList] = useState(false);

const [feesDetails, setFeesDetails] = useState({
  amount: "",
  paymentMode: "Cash",
  receiptNumber: "",
  paymentDate: "",
  remarks: "",
});

  const [formData, setFormData] = useState({
    studentName: "", dateOfBirth: "", gender: "", bloodGroup: "", nationality: "", religion: "",
    classApplied: "",
    email: "", phone: "", alternatePhone: "", address: "", city: "", state: "", zipCode: "",
   previousSchoolName: "",
previousSchoolBoard: "",
previousClass: "",
yearOfStudy: "",

    fatherName: "", fatherOccupation: "", fatherPhone: "", fatherEmail: "",
    motherName: "", motherOccupation: "", motherPhone: "", motherEmail: "",
    guardianName: "", guardianRelation: "", guardianPhone: "", guardianEmail: "",
    parentIdAccountHolder: "father",
    emergencyContactName: "", emergencyContactRelation: "", emergencyContactPhone: "",
    previousSchool: "", transportRequired: "", medicalConditions: "", specialNeeds: "",
     feesStatus: "Due",
  });

  
  const selectedStateObj = formData.state ? allStates.find(s => s.name === formData.state) : null;
  const citiesOfSelectedState = selectedStateObj ? City.getCitiesOfState("IN", selectedStateObj.isoCode) : [];

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${config.API_BASE_URL}/classes`);
        if (res.data.success && Array.isArray(res.data.data)) {
          setClasses(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching classes:", err);
      }
    };
    fetchClasses();
  }, []);

 

 const handleChange = (e) => {
  const { name, value, type } = e.target;

  let newValue = value;

  // 🧑‍🎓 Name fields → Each word Capital
  if (NAME_FIELDS.includes(name)) {
    newValue = capitalizeEachWord(value);
  }

  // ✍️ Normal text → First letter Capital
  else if (
    TEXT_FIELDS.includes(name) &&
    type === "text"
  ) {
    newValue = capitalizeFirst(value);
  }

  setFormData((prev) => ({
    ...prev,
    [name]: newValue,
  }));

  const error = validateField(name, newValue);
  setErrors((prev) => ({
    ...prev,
    [name]: error,
  }));
};

  const handleDocumentUpload = (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileData = {
      id: Date.now(),
      file,
      name: file.name,
      type: documentType,
      size: file.size,
      fileType: file.type,
      preview: URL.createObjectURL(file),
    };
    setDocuments((prev) => {
      // Remove existing document of same type if any
      const filtered = prev.filter((d) => d.type !== documentType);
      return [...filtered, fileData];
    });
    e.target.value = "";
  };

  const handleDrop = (e, documentType) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    const event = {
      target: { files: [file] },
    };
    handleDocumentUpload(event, documentType);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleRemoveDocument = (id) => {
    setDocuments((prev) => {
      const doc = prev.find((d) => d.id === id);
      if (doc?.preview) URL.revokeObjectURL(doc.preview);
      return prev.filter((d) => d.id !== id);
    });
    if (previewDoc?.id === id) setPreviewDoc(null);
  };

  const handlePreviewDocument = (doc) => {
    if (doc.fileType.startsWith("image/")) {
      setPreviewDoc(doc);
    } else if (doc.fileType === "application/pdf") {
      window.open(doc.preview, "_blank");
    } else {
      window.open(doc.preview, "_blank");
    }
  };


  const handleFeesChange = (e) => {
  const { name, value } = e.target;
  setFeesDetails((prev) => ({ ...prev, [name]: value }));
};


  const uploadDocuments = async (applicationId) => {
    for (const doc of documents) {
      const formData = new FormData();
      formData.append("applicationId", applicationId);
      formData.append("type", doc.type);
      formData.append("file", doc.file);
      try {
        await axios.post(`${config.API_BASE_URL}/admission/application/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (err) {
        console.error(`Error uploading document ${doc.name}:`, err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    //  stop submit if any validation error exists
if (Object.values(errors).some((e) => e)) {
  setErrorMsg("Please fix form errors");
  setLoading(false);
  return;
}
if (
  !formData.previousSchoolName ||
  !formData.previousSchoolBoard ||
  !formData.previousClass ||
  !formData.yearOfStudy
) {
  setErrorMsg("Please fill all academic details");
  setLoading(false);
  return;
}

    const holder = formData.parentIdAccountHolder || "father";
    const holderName =
      holder === "mother"
        ? formData.motherName
        : holder === "guardian"
          ? formData.guardianName
          : formData.fatherName;
    if (!holderName || !String(holderName).trim()) {
      setErrorMsg(
        "Please enter the name for the parent/guardian you selected for Parent ID login (Father, Mother, or Guardian)."
      );
      setLoading(false);
      return;
    }

    try {
      const newStudent = {
  personalInfo: {
    name: formData.studentName,
    classApplied: formData.classApplied,
    fees: formData.feesStatus,
    dateOfBirth: formData.dateOfBirth,
    gender: formData.gender,
    bloodGroup: formData.bloodGroup,
    nationality: formData.nationality,
    religion: formData.religion,
  },

  contactInfo: {
    email: formData.email,
    phone: formData.phone,
    alternatePhone: formData.alternatePhone,
    address: formData.address,
    city: formData.city,
    state: formData.state,
    zipCode: formData.zipCode,
  },

  earlierAcademic: {
    schoolName: formData.previousSchoolName,
    board: formData.previousSchoolBoard,
    lastClass: formData.previousClass,
    academicYear: formData.yearOfStudy,
  },

  parents: {
    parentIdAccountHolder: formData.parentIdAccountHolder || "father",
    father: {
      name: formData.fatherName,
      occupation: formData.fatherOccupation,
      phone: formData.fatherPhone,
      email: formData.fatherEmail,
    },
    mother: {
      name: formData.motherName,
      occupation: formData.motherOccupation,
      phone: formData.motherPhone,
      email: formData.motherEmail,
    },
    guardian: {
      name: formData.guardianName,
      relation: formData.guardianRelation,
      phone: formData.guardianPhone,
      email: formData.guardianEmail,
    },
  },

  emergencyContact: {
    name: formData.emergencyContactName,
    relation: formData.emergencyContactRelation,
    phone: formData.emergencyContactPhone,
  },

  transportRequired: formData.transportRequired,
  medicalConditions: formData.medicalConditions,
  specialNeeds: formData.specialNeeds,
  admissionFee: {
    status: formData.feesStatus,
    amount: Number(feesDetails.amount) || 0,
    paymentMode: feesDetails.paymentMode,
    receiptNumber: feesDetails.receiptNumber,
    paymentDate: feesDetails.paymentDate,
    remarks: feesDetails.remarks,
  },
};

      const res = await axios.post(`${config.API_BASE_URL}/admission/application/apply`, newStudent);

      if (res.data.success) {
        const applicationId = res.data.data?._id || res.data.data?.id;
        if (applicationId && documents.length > 0) {
          await uploadDocuments(applicationId);
        }
        setSuccessMsg("Application submitted to application list ");
        setTimeout(() => navigate("/admission/application-list"), 2000);
      } else {
        setErrorMsg(res.data.message || "Failed to enroll student");
      }
    } catch (err) {
      console.error("Error enrolling student:", err);
      setErrorMsg(err.response?.data?.message || "Error enrolling student. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* Breadcrumbs */}
      <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <button
          onClick={() => navigate("/students")}
          className="hover:underline"
        >
          Students
        </button>
        <span className="mx-1">&gt;</span>
        <span>Admission Form</span>
      </div>

      <div className="flex items-center justify-between mb-4">
             <h2 className="text-2xl font-bold">Admission Form</h2>
           
             <HelpInfo
  title="Admission Form Help"
  description={`1.1 Overview

This form is used to capture detailed information required for admitting a new student into the institution. Please fill in all mandatory fields marked with an asterisk (*).

2. Personal Information

Includes essential details like Full Name, Date of Birth, Gender, Blood Group, Nationality, and Religion. Accurate data here ensures correct student records.

3. Contact Information

Enter valid Email, Phone Number, Alternate Phone, and full Address details including Street, City, State, and Zip Code for communication and emergency purposes.

4. Academic Information

Capture Student ID, Roll Number, Class, Section, Academic Year, Admission Date, Admission Type, and details about the Previous School, if any.

5. Parent/Guardian Information

Separate sections for Father's, Mother's, and Guardian's information (if applicable), including names, occupations, phone numbers, and emails for contact and verification.

6. Emergency Contact

Provide an emergency contact name, relation, and phone number to ensure quick communication in case of emergencies.

7. Additional Information

Specify if transport is required, current fees status, any medical conditions or allergies, and special educational or physical needs.

8. Documents

Upload mandatory documents such as Passport Size Photo, Aadhaar Copy, Marksheet, and Migration Certificate. Supported formats include PDF, JPG, PNG with size restrictions.

9. Login Credentials

Username is auto-generated but editable; set a secure password for the student’s login access.`}
  steps={[
    "Fill all required fields marked with * carefully.",
    "Verify contact details for accuracy.",
    "Upload clear and valid documents as per the specified formats and sizes.",
    "Set a strong password for student login security.",
    "Review the entire form before submitting to avoid errors."
  ]}
/>

           </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
          Overview
        </button>
      </div>

      {/* Main content box */}
      
       
         

      {/* Messages */}
      {successMsg && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-0">
        {/* Personal Information */}
        
        <div className="bg-white p-4 rounded-lg shadow-sm mb-3">
          <SectionHeader icon={<FiUser />} title="Personal Information" />
          <div className="grid grid-cols-2 gap-3">
           <FormField
  label="Full Name"
  name="studentName"
  value={formData.studentName}
  onChange={handleChange}
  required
  error={errors.studentName}
/>

            <FormField label="Date of Birth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} type="date" required />
            <SelectField label="Gender" name="gender" value={formData.gender} onChange={handleChange} required options={["Male", "Female", "Other"]} />
            <SelectField
              label="Class"
              name="classApplied"
              value={formData.classApplied}
              onChange={handleChange}
              required
              options={classes.map((cls) => ({
                value: cls.className || cls.name || cls.class || cls._id,
                label: cls.className || cls.name || cls.class || "N/A",
              }))}
            />
            <SelectField label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
            <FormField label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
            <FormField label="Religion" name="religion" value={formData.religion} onChange={handleChange} />
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-3">
          <SectionHeader icon={<FiPhone />} title="Contact Information" />
          <div className="grid grid-cols-2 gap-3">
            <FormField
  label="Email"
  name="email"
  value={formData.email}
  onChange={handleChange}
  type="email"
  error={errors.email}
/>

           <FormField
  label="Phone Number"
  name="phone"
  value={formData.phone}
  onChange={handleChange}
  type="tel"
  required
  error={errors.phone}
/>

            <FormField 
  label="Alternate Phone" 
  name="alternatePhone" 
  value={formData.alternatePhone} 
  onChange={handleChange} 
  type="tel"
  error={errors.alternatePhone}
/>
            <FormField label="Address" name="address" value={formData.address} onChange={handleChange} placeholder="Street address" className="col-span-2" />
            <div>
              <label className="block text-sm font-medium mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <select
                name="state"
                value={formData.state || ""}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, state: e.target.value, city: "" }));
                }}
                required
                className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              >
                <option value="">Select State</option>
                {allStates.map((state) => (
                  <option key={state.isoCode} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <select
                name="city"
                value={formData.city || ""}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, city: e.target.value }));
                }}
                required
                disabled={!formData.state}
                className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed bg-white text-sm"
              >
                <option value="">Select City</option>
                {citiesOfSelectedState.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

          <FormField
  label="Zip Code"
  name="zipCode"
  value={formData.zipCode}
  onChange={handleChange}
  error={errors.zipCode}
/>

          </div>
        </div>

        {/* Earlier Academic Information */}
<div className="bg-white p-4 rounded-lg shadow-sm mb-3">
  <SectionHeader icon={<FiBookOpen />} title="Earlier Academic Information" />
  <div className="grid grid-cols-2 gap-3">
   <FormField
  label="Previous School Name"
  name="previousSchoolName"
  value={formData.previousSchoolName}
  onChange={handleChange}
  error={errors.previousSchoolName}
/>

   <FormField
  label="Board / University"
  name="previousSchoolBoard"
  value={formData.previousSchoolBoard}
  onChange={handleChange}
  error={errors.previousSchoolBoard}
/>

  <FormField
  label="Class Last Studied"
  name="previousClass"
  value={formData.previousClass}
  onChange={handleChange}
  error={errors.previousClass}
/>
<FormField
  label="Academic Year"
  name="yearOfStudy"
  value={formData.yearOfStudy}
  onChange={handleChange}
  error={errors.yearOfStudy}
/>
  </div>
</div>


        {/* Parent/Guardian Information */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-3">
          <SectionHeader icon={<FiUser />} title="Parent/Guardian Information" />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <h4 className="col-span-2 font-medium text-gray-700 mb-2">Father's Information</h4>
            <FormField label="Father's Name" name="fatherName" value={formData.fatherName} onChange={handleChange} />
            <FormField label="Occupation" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} />
           <FormField
  label="Phone"
  name="fatherPhone"
  value={formData.fatherPhone}
  onChange={handleChange}
  type="tel"
  error={errors.fatherPhone}
/>

            <FormField
  label="Email"
  name="fatherEmail"
  value={formData.fatherEmail}
  onChange={handleChange}
  type="email"
  error={errors.fatherEmail}
/>

          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <h4 className="col-span-2 font-medium text-gray-700 mb-2">Mother's Information</h4>
            <FormField label="Mother's Name" name="motherName" value={formData.motherName} onChange={handleChange} />
            <FormField label="Occupation" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} />
            <FormField
  label="Phone"
  name="motherPhone"
  value={formData.motherPhone}
  onChange={handleChange}
  type="tel"
  error={errors.motherPhone}
/>

           <FormField
  label="Email"
  name="motherEmail"
  value={formData.motherEmail}
  onChange={handleChange}
  type="email"
  error={errors.motherEmail}
/>

          </div>
          <div className="grid grid-cols-2 gap-4">
            <h4 className="col-span-2 font-medium text-gray-700 mb-2">Guardian Information (if applicable)</h4>
            <FormField label="Guardian's Name" name="guardianName" value={formData.guardianName} onChange={handleChange} />
            <FormField label="Relation" name="guardianRelation" value={formData.guardianRelation} onChange={handleChange} placeholder="e.g., Uncle, Aunt" />
           <FormField
  label="Phone"
  name="guardianPhone"
  value={formData.guardianPhone}
  onChange={handleChange}
  type="tel"
  error={errors.guardianPhone}
/>

           <FormField
  label="Email"
  name="guardianEmail"
  value={formData.guardianEmail}
  onChange={handleChange}
  type="email"
  error={errors.guardianEmail}
/>

          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 col-span-2">
            <p className="font-medium text-gray-700 mb-1">Parent ID login account</p>
            <p className="text-xs text-gray-500 mb-3">
              One Parent ID is issued per application. Choose which parent or guardian will use that ID for the parent portal. You should still complete all parent and guardian details above.
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { value: "father", label: "Father" },
                { value: "mother", label: "Mother" },
                { value: "guardian", label: "Guardian" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="parentIdAccountHolder"
                    value={opt.value}
                    checked={formData.parentIdAccountHolder === opt.value}
                    onChange={handleChange}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-3">
          <SectionHeader icon={<FiPhone />} title="Emergency Contact" />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Contact Name" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} required />
            <FormField label="Relation" name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleChange} placeholder="e.g., Father, Mother, Uncle" required />
           <FormField
  label="Phone Number"
  name="emergencyContactPhone"
  value={formData.emergencyContactPhone}
  onChange={handleChange}
  type="tel"
  required
  error={errors.emergencyContactPhone}
/>

          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-3">
          <SectionHeader icon={<FiBookOpen />} title="Additional Information" />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Transport Required" name="transportRequired" value={formData.transportRequired} onChange={handleChange} options={["Yes", "No"]} />
            <SelectField label="Fees Status" name="feesStatus" value={formData.feesStatus} onChange={handleChange} options={["Paid", "Due"]} />
            <FormField label="Medical Conditions" name="medicalConditions" value={formData.medicalConditions} onChange={handleChange} className="col-span-2">
              <textarea name="medicalConditions" value={formData.medicalConditions} onChange={handleChange} rows="3" placeholder="Any known medical conditions or allergies" className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </FormField>
            <FormField label="Special Needs" name="specialNeeds" value={formData.specialNeeds} onChange={handleChange} className="col-span-2">
              <textarea name="specialNeeds" value={formData.specialNeeds} onChange={handleChange} rows="3" placeholder="Any special educational or physical needs" className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </FormField>
          </div>
        </div>


{/* Registration / Admission Fees */}
<div className="bg-white p-4 rounded-lg shadow-sm mb-3">
  <SectionHeader icon={<FiBookOpen />} title="Registration / Admission Fees" />

  <div className="grid grid-cols-2 gap-3">
    <FormField
      label="Fees Amount (₹)"
      name="amount"
      type="number"
      value={feesDetails.amount}
      onChange={handleFeesChange}
      required
      placeholder="Enter paid amount"
    />

    <SelectField
      label="Payment Mode"
      name="paymentMode"
      value={feesDetails.paymentMode}
      onChange={handleFeesChange}
      options={["Cash", "UPI", "Bank Transfer"]}
      required
    />

    {(feesDetails.paymentMode === "UPI" ||
      feesDetails.paymentMode === "Bank Transfer") && (
      <>
        <FormField
          label="Receipt / Transaction No"
          name="receiptNumber"
          value={feesDetails.receiptNumber}
          onChange={handleFeesChange}
          placeholder="Enter receipt / UTR number"
          required
        />

        <FormField
          label="Payment Date & Time"
          name="paymentDate"
          type="datetime-local"
          value={feesDetails.paymentDate}
          onChange={handleFeesChange}
          required
        />
      </>
    )}

    {feesDetails.paymentMode === "Cash" && (
      <FormField
        label="Payment Date"
        name="paymentDate"
        type="date"
        value={feesDetails.paymentDate}
        onChange={handleFeesChange}
        required
      />
    )}

    <FormField
      label="Remarks"
      name="remarks"
      value={feesDetails.remarks}
      onChange={handleFeesChange}
      placeholder="Optional remarks"
      className="col-span-2"
    >
      <textarea
        name="remarks"
        value={feesDetails.remarks}
        onChange={handleFeesChange}
        rows="2"
        className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </FormField>
  </div>
</div>

        {/* Documents Section */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-3">
          <SectionHeader icon={<FiFileText />} title="Documents" />
          <p className=" text-gray-600 mb-3">
            Please upload all required documents in PDF, JPG, or PNG format. Maximum file size: 5MB per document.
          </p>
          
          <div className="space-y-6">
            {/* Passport Size Photo */}
            <div>
              <label className="block  font-medium mb-2">
                Passport Size Photo <span className="text-red-500">*</span>
              </label>
              <p className=" text-gray-500 mb-2">
                Format: JPG, PNG | Max: 2MB | Size: 35mm x 45mm
              </p>
              {documents.find((d) => d.type === "Passport Size Photo") ? (
                <div className="border border-green-300 bg-green-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiCamera className="text-green-600 text-xl" />
                    <div>
                      <p className="font-medium  text-green-900">
                        {documents.find((d) => d.type === "Passport Size Photo").name}
                      </p>
                      <p className=" text-green-700">
                        {(documents.find((d) => d.type === "Passport Size Photo").size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePreviewDocument(documents.find((d) => d.type === "Passport Size Photo"))}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiEye />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(documents.find((d) => d.type === "Passport Size Photo").id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  onDrop={(e) => handleDrop(e, "Passport Size Photo")}
                  onDragOver={handleDragOver}
                >
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleDocumentUpload(e, "Passport Size Photo")}
                    accept=".jpg,.jpeg,.png"
                  />
                  <FiCamera className="mx-auto text-gray-400 text-4xl mb-3" />
                  <p className="text-gray-700 font-medium mb-1">Click to upload photo</p>
                  <p className="text-gray-500 ">or drag and drop</p>
                </label>
              )}
            </div>

            {/* Aadhaar Copy */}
            <div>
              <label className="block  font-medium mb-2">
                Aadhaar Copy <span className="text-red-500">*</span>
              </label>
              <p className="text-gray-500 mb-2">
                Format: PDF, JPG, PNG | Max: 5MB
              </p>
              {documents.find((d) => d.type === "Aadhaar Copy") ? (
                <div className="border border-green-300 bg-green-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiFileText className="text-green-600 text-xl" />
                    <div>
                      <p className="font-medium  text-green-900">
                        {documents.find((d) => d.type === "Aadhaar Copy").name}
                      </p>
                      <p className=" text-green-700">
                        {(documents.find((d) => d.type === "Aadhaar Copy").size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePreviewDocument(documents.find((d) => d.type === "Aadhaar Copy"))}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiEye />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(documents.find((d) => d.type === "Aadhaar Copy").id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  onDrop={(e) => handleDrop(e, "Aadhaar Copy")}
                  onDragOver={handleDragOver}
                >
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleDocumentUpload(e, "Aadhaar Copy")}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <FiFileText className="mx-auto text-gray-400 text-4xl mb-3" />
                  <p className="text-gray-700 font-medium mb-1">Click to upload document</p>
                  <p className="text-gray-500 ">or drag and drop</p>
                </label>
              )}
            </div>

            {/* Marksheet */}
            <div>
              <label className="block  font-medium mb-2">
                Marksheet <span className="text-red-500">*</span>
              </label>
              <p className=" text-gray-500 mb-2">
                Format: PDF, JPG, PNG | Max: 5MB
              </p>
              {documents.find((d) => d.type === "Marksheet") ? (
                <div className="border border-green-300 bg-green-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiFileText className="text-green-600 text-xl" />
                    <div>
                      <p className="font-medium  text-green-900">
                        {documents.find((d) => d.type === "Marksheet").name}
                      </p>
                      <p className=" text-green-700">
                        {(documents.find((d) => d.type === "Marksheet").size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePreviewDocument(documents.find((d) => d.type === "Marksheet"))}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiEye />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(documents.find((d) => d.type === "Marksheet").id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  onDrop={(e) => handleDrop(e, "Marksheet")}
                  onDragOver={handleDragOver}
                >
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleDocumentUpload(e, "Marksheet")}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <FiFileText className="mx-auto text-gray-400 text-4xl mb-3" />
                  <p className="text-gray-700 font-medium mb-1">Click to upload document</p>
                  <p className="text-gray-500 ">or drag and drop</p>
                </label>
              )}
            </div>

            {/* Migration Certificate */}
            <div>
              <label className="block  font-medium mb-2">
                Migration Certificate <span className="text-red-500">*</span>
              </label>
              <p className=" text-gray-500 mb-2">
                Format: PDF, JPG, PNG | Max: 5MB
              </p>
              {documents.find((d) => d.type === "Migration Certificate") ? (
                <div className="border border-green-300 bg-green-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiFileText className="text-green-600 text-xl" />
                    <div>
                      <p className="font-medium text-green-900">
                        {documents.find((d) => d.type === "Migration Certificate").name}
                      </p>
                      <p className="text-green-700">
                        {(documents.find((d) => d.type === "Migration Certificate").size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePreviewDocument(documents.find((d) => d.type === "Migration Certificate"))}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiEye />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(documents.find((d) => d.type === "Migration Certificate").id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  onDrop={(e) => handleDrop(e, "Migration Certificate")}
                  onDragOver={handleDragOver}
                >
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleDocumentUpload(e, "Migration Certificate")}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <FiFileText className="mx-auto text-gray-400 text-4xl mb-3" />
                  <p className="text-gray-700 font-medium mb-1">Click to upload document</p>
                  <p className="text-gray-500 ">or drag and drop</p>
                </label>
              )}
            </div>
          </div>
          {previewDoc && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setPreviewDoc(null)}>
              <div className="bg-white p-4 rounded-lg max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">{previewDoc.type || previewDoc.name}</h3>
                  <button onClick={() => setPreviewDoc(null)} className="text-gray-500 hover:text-gray-700">
                    <FiX size={24} />
                  </button>
                </div>
                {previewDoc.fileType.startsWith("image/") && (
                  <img src={previewDoc.preview} alt={previewDoc.name} className="max-w-full h-auto" />
                )}
                {previewDoc.fileType === "application/pdf" && (
                  <iframe src={previewDoc.preview} className="w-full h-[70vh]" title={previewDoc.name} />
                )}
              </div>
            </div>
          )}
        </div>

        

        
        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 mb-16">
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                <FiSave /> Save & Enroll Student
              </>
            )}
          </button>
        </div>
      </form>{/* FIXED BOTTOM NAVIGATION */}
<div className="fixed bottom-4 left-[calc(16rem+1rem)] right-8 flex justify-between z-40">
  <button
    onClick={() => navigate("/admission/interview-list")}
    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
  >
    Back
  </button>

  <button
    onClick={() => navigate("/admission/application-offer")}
    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
  >
    Next →
  </button>
</div>
    </div>
    
  );
}