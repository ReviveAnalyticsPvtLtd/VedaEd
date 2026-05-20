import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { FiUpload, FiCheck, FiFileText, FiUser, FiBriefcase, FiPhone, FiBookOpen } from "react-icons/fi";

export default function CandidateForm() {
  const navigate = useNavigate();
  const [vacancies, setVacancies] = useState([]);
  const [formData, setFormData] = useState({
    vacancy: "", roleType: "Teaching", applicantName: "", fatherName: "", dob: "", gender: "Male",
    mobile: "", email: "", address: "", qualification: "", experience: "", currentSalary: "",
    expectedSalary: "", subject: "", classesHandled: "", demoClassExperience: false
  });
  
  const [files, setFiles] = useState({
    resume: null,
    aadhaar: null,
    pan: null,
    photo: null
  });

  useEffect(() => {
    // Fetch active vacancies
    const fetchVacs = async () => {
      try {
        const res = await apiClient.get("/hr-recruitment/vacancies");
        setVacancies(res.data.data.filter(v => v.status === "Published"));
      } catch (err) {
        console.error(err);
      }
    };
    fetchVacs();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({
        ...prev,
        [fileType]: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      
      // Append fields
      Object.keys(formData).forEach(key => {
        if (key === "classesHandled") {
          data.append(key, formData.classesHandled.split(",").map(s => s.trim()));
        } else {
          data.append(key, formData[key]);
        }
      });

      // Append files
      if (files.resume) data.append("resume", files.resume);
      if (files.aadhaar) data.append("aadhaar", files.aadhaar);
      if (files.pan) data.append("pan", files.pan);
      if (files.photo) data.append("photo", files.photo);

      await apiClient.post("/hr-recruitment/applications", data, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      alert("Application submitted successfully!");
      setFormData({
        vacancy: "", roleType: "Teaching", applicantName: "", fatherName: "", dob: "", gender: "Male",
        mobile: "", email: "", address: "", qualification: "", experience: "", currentSalary: "",
        expectedSalary: "", subject: "", classesHandled: "", demoClassExperience: false
      });
      setFiles({
        resume: null,
        aadhaar: null,
        pan: null,
        photo: null
      });
    } catch (error) {
      console.error(error);
      alert("Error submitting application");
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* Breadcrumbs */}
      <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <span>HR</span>
        <span>&gt;</span>
        <span>Talent Acquisition</span>
        <span>&gt;</span>
        <span>Candidate Application</span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Candidate Application Form</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Details */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b flex items-center gap-2">
            <FiBriefcase className="text-blue-500" /> Job Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Applying For (Vacancy)</label>
              <select name="vacancy" required className="w-full border rounded-lg p-2" onChange={handleChange} value={formData.vacancy}>
                <option value="">Select a vacancy</option>
                {vacancies.map(v => <option key={v._id} value={v._id}>{v.jobTitle} ({v.vacancyId})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role Type</label>
              <select name="roleType" className="w-full border rounded-lg p-2" onChange={handleChange} value={formData.roleType}>
                <option value="Teaching">Teaching</option>
                <option value="Non-Teaching">Non-Teaching</option>
              </select>
            </div>
          </div>
        </section>

        {/* Personal Details */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b flex items-center gap-2">
            <FiUser className="text-blue-500" /> Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" name="applicantName" required className="w-full border rounded-lg p-2" onChange={handleChange} value={formData.applicantName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
              <input type="text" name="fatherName" className="w-full border rounded-lg p-2" onChange={handleChange} value={formData.fatherName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" name="dob" className="w-full border rounded-lg p-2" onChange={handleChange} value={formData.dob} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select name="gender" className="w-full border rounded-lg p-2" onChange={handleChange} value={formData.gender}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No.</label>
              <input type="tel" name="mobile" required className="w-full border rounded-lg p-2" onChange={handleChange} value={formData.mobile} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
              <input type="email" name="email" required className="w-full border rounded-lg p-2" onChange={handleChange} value={formData.email} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
              <textarea name="address" rows="2" className="w-full border rounded-lg p-2" onChange={handleChange} value={formData.address}></textarea>
            </div>
          </div>
        </section>

        {/* Professional Details */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b flex items-center gap-2">
            <FiBookOpen className="text-blue-500" /> Professional Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Highest Qualification</label>
              <input type="text" name="qualification" required className="w-full border rounded-lg p-2" onChange={handleChange} value={formData.qualification} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Experience (Years)</label>
              <input type="text" name="experience" className="w-full border rounded-lg p-2" onChange={handleChange} value={formData.experience} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Salary</label>
              <input type="text" name="currentSalary" className="w-full border rounded-lg p-2" onChange={handleChange} value={formData.currentSalary} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Salary</label>
              <input type="text" name="expectedSalary" className="w-full border rounded-lg p-2" onChange={handleChange} value={formData.expectedSalary} />
            </div>
          </div>
        </section>

        {/* Teacher Specific (Conditional) */}
        {formData.roleType === "Teaching" && (
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-purple-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b flex items-center gap-2">
              <FiBookOpen className="text-purple-500" /> Teaching Specific Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Specialization</label>
                <input type="text" name="subject" className="w-full border rounded-lg p-2" onChange={handleChange} value={formData.subject} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classes Handled (comma separated)</label>
                <input type="text" name="classesHandled" className="w-full border rounded-lg p-2" placeholder="e.g. Class 9, Class 10" onChange={handleChange} value={formData.classesHandled} />
              </div>
              <div className="md:col-span-2 flex items-center gap-2 mt-2">
                <input type="checkbox" id="demoClass" name="demoClassExperience" className="w-4 h-4 text-blue-600 animate-pulse" onChange={handleChange} checked={formData.demoClassExperience} />
                <label htmlFor="demoClass" className="text-sm font-medium text-gray-700">Has experience conducting Demo Classes?</label>
              </div>
            </div>
          </section>
        )}

        {/* Document Upload Option (Just like Admission Module) */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b flex items-center gap-2">
            <FiFileText className="text-blue-500" /> Documents Upload
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CV / Resume */}
            <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition relative">
              <label className="cursor-pointer block">
                <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange(e, "resume")} />
                <div className="flex flex-col items-center gap-2">
                  <FiUpload className="text-gray-400 text-2xl" />
                  <span className="text-sm font-medium text-gray-700">CV / Resume *</span>
                  <span className="text-xs text-gray-400">PDF, DOC (Max 5MB)</span>
                  {files.resume ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1 font-semibold mt-2">
                      <FiCheck /> {files.resume.name}
                    </span>
                  ) : null}
                </div>
              </label>
            </div>

            {/* Aadhaar Card */}
            <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition relative">
              <label className="cursor-pointer block">
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, "aadhaar")} />
                <div className="flex flex-col items-center gap-2">
                  <FiUpload className="text-gray-400 text-2xl" />
                  <span className="text-sm font-medium text-gray-700">Aadhaar Card Copy</span>
                  <span className="text-xs text-gray-400">Image, PDF (Max 2MB)</span>
                  {files.aadhaar ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1 font-semibold mt-2">
                      <FiCheck /> {files.aadhaar.name}
                    </span>
                  ) : null}
                </div>
              </label>
            </div>

            {/* PAN Card */}
            <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition relative">
              <label className="cursor-pointer block">
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, "pan")} />
                <div className="flex flex-col items-center gap-2">
                  <FiUpload className="text-gray-400 text-2xl" />
                  <span className="text-sm font-medium text-gray-700">PAN Card Copy</span>
                  <span className="text-xs text-gray-400">Image, PDF (Max 2MB)</span>
                  {files.pan ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1 font-semibold mt-2">
                      <FiCheck /> {files.pan.name}
                    </span>
                  ) : null}
                </div>
              </label>
            </div>

            {/* Passport Size Photo */}
            <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition relative">
              <label className="cursor-pointer block">
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, "photo")} />
                <div className="flex flex-col items-center gap-2">
                  <FiUpload className="text-gray-400 text-2xl" />
                  <span className="text-sm font-medium text-gray-700">Passport Photo</span>
                  <span className="text-xs text-gray-400">JPEG, PNG (Max 1MB)</span>
                  {files.photo ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1 font-semibold mt-2">
                      <FiCheck /> {files.photo.name}
                    </span>
                  ) : null}
                </div>
              </label>
            </div>
          </div>
        </section>

        <div className="flex justify-between items-center pt-8 mt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/hr/talent-acquisition/vacancy")}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 font-medium transition"
          >
            Back
          </button>

          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg shadow-md hover:shadow-lg transition"
            >
              Submit Application
            </button>

            <button
              type="button"
              onClick={() => navigate("/hr/talent-acquisition/pipeline")}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-medium transition"
            >
              Next
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
