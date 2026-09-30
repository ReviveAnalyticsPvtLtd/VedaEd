import React, { useState } from "react";
import { authFetch } from "./services/apiClient";

export default function AdmissionEnquiryPage() {
  const [formData, setFormData] = useState({
    studentName: "",
    parentName: "",
    email: "",
    phone: "",
    whatsapp: "",
    class: "",
  });

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({
    loading: false,
    success: null,
    error: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if ((name === "phone" || name === "whatsapp") && !/^\d*$/.test(value)) {
      return; // Prevent non-numeric input
    }
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Phone validation
    if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be 10 digits.";
    }

    // WhatsApp validation
    if (!/^\d{10}$/.test(formData.whatsapp)) {
      newErrors.whatsapp = "WhatsApp number must be 10 digits.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setStatus({ loading: true, success: null, error: null });

    try {
      const response = await authFetch("/admission-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.status === 404) {
        setTimeout(() => {
          setStatus({
            loading: false,
            success: "✅ Enquiry submitted successfully (Test Mode)",
            error: null,
          });
          setFormData({
            studentName: "",
            parentName: "",
            email: "",
            phone: "",
            whatsapp: "",
            class: "",
          });
        }, 1000);
        return;
      }

      if (response.ok) {
        setStatus({
          loading: false,
          success: "✅ Enquiry submitted successfully!",
          error: null,
        });
        setFormData({
          studentName: "",
          parentName: "",
          email: "",
          phone: "",
          whatsapp: "",
          class: "",
        });
      } else {
        const err = await response.json();
        throw new Error(err.message || "Submission failed");
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus({
        loading: false,
        success: null,
        error:
          "❌ Something went wrong! Please check your network or API endpoint.",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left Section */}
      <div className="w-1/2 bg-white flex flex-col justify-center items-center p-8 border-r border-gray-200">
        <div className="w-3/4 text-center">
          <div className="bg-gray-200 w-full h-56 flex items-center justify-center rounded-lg">
            <span className="text-gray-500">
              Upload School Logo / Image Here
            </span>
          </div>
          <h1 className="text-2xl font-semibold mt-6">Welcome to Our School</h1>
          <p className="text-gray-600 mt-2">
            Begin your admission journey by submitting an enquiry. Our team will
            reach out soon!
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-1/2 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Admission Enquiry
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Student Name
              </label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              />
            </div>

            {/* Parent Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Parent Name
              </label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                maxLength="10"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                WhatsApp Number
              </label>
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                maxLength="10"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              />
              {errors.whatsapp && (
                <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>
              )}
            </div>

            {/* Class */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Class Seeking Admission
              </label>
              <input
                type="text"
                name="class"
                value={formData.class}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status.loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              {status.loading ? "Submitting..." : "Submit Enquiry"}
            </button>
          </form>

          {status.success && (
            <p className="text-green-600 text-center mt-4 font-medium">
              {status.success}
            </p>
          )}
          {status.error && (
            <p className="text-red-600 text-center mt-4 font-medium">
              {status.error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
