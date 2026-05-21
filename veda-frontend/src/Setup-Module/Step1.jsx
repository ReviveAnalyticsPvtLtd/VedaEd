import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Step1 = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    schoolName: "",
    schoolType: "",
    affiliation: "",
    academicYear: "",
    medium: "English",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    // simple validation
    if (!form.schoolName) {
      alert("School name required");
      return;
    }

    // optionally save in localStorage / context
    localStorage.setItem("step1Data", JSON.stringify(form));

    // redirect to step2
    navigate("/form/step-2");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8">
        
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
            🎓
          </div>
          <h2 className="text-lg font-semibold text-indigo-600">
            VedaEdu
          </h2>
        </div>

        <h1 className="text-3xl font-bold mb-2">
          Let’s set up your school
        </h1>
        <p className="text-gray-500 mb-6">
          Begin your digital transformation. You can change these details later.
        </p>

        {/* Progress */}
        <div className="flex justify-between text-sm mb-2">
          <span>STEP 1 OF 5</span>
          <span>20% COMPLETE</span>
        </div>
        <div className="w-full bg-gray-200 h-2 rounded mb-6">
          <div className="bg-indigo-600 h-2 w-1/5 rounded"></div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <input
            type="text"
            name="schoolName"
            placeholder="e.g. St. James Global Academy"
            value={form.schoolName}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2 focus:outline-indigo-500"
          />

          <div className="grid grid-cols-2 gap-4">
            <select
              name="schoolType"
              value={form.schoolType}
              onChange={handleChange}
              className="border rounded-lg px-4 py-2"
            >
              <option value="">Select Type</option>
              <option>Public</option>
              <option>Private</option>
            </select>

            <select
              name="affiliation"
              value={form.affiliation}
              onChange={handleChange}
              className="border rounded-lg px-4 py-2"
            >
              <option value="">Select Board</option>
              <option>CBSE</option>
              <option>ICSE</option>
              <option>State Board</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              name="academicYear"
              value={form.academicYear}
              onChange={handleChange}
              className="border rounded-lg px-4 py-2"
            />

            <select
              name="medium"
              value={form.medium}
              onChange={handleChange}
              className="border rounded-lg px-4 py-2"
            >
              <option>English</option>
              <option>Hindi</option>
            </select>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleSubmit}
          className="w-full mt-6 py-3 rounded-lg text-white font-semibold 
          bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90"
        >
          Continue Setup
        </button>
      </div>
    </div>
  );
};

export default Step1;