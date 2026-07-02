import React, { useState, useMemo, useEffect } from "react";
import { FiTrash2 } from "react-icons/fi";
import axios from "axios";
import config from "../config";
import { useNavigate } from "react-router-dom";

export default function VacancySetup() {
   const navigate = useNavigate(); 
  const [form, setForm] = useState({
    academicYear: "",
    className: "",
    totalSeats: "",
    reservedSeats: "",
    startDate: "",
    endDate: "",
  });
const [errors, setErrors] = useState({
  totalSeats: "",
  reservedSeats: "",
});
  const [vacancies, setVacancies] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    academicYear: "",
    className: "",
  });

  useEffect(() => {
    fetchVacancies();
    const loadClasses = async () => {
      try {
        const res = await axios.get(`${config.API_BASE_URL}/classes`);
        setClasses(res.data || []);
      } catch (err) {
        console.error("Failed to load classes for vacancy:", err);
      }
    };
    loadClasses();
  }, []);
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;
  const fetchVacancies = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.API_BASE_URL}/admission/vacancy`);
      if (res.data.success) {
        setVacancies(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching vacancies:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= ADD VACANCY ================= */
  const handleAddVacancy = async (e) => {
    e.preventDefault();

    if (
      !form.academicYear ||
      !form.className ||
      !form.totalSeats
    ) {
      alert("Please fill required fields");
      return;
    }

    const total = Number(form.totalSeats);
const reserved = Number(form.reservedSeats || 0);

// ❌ Negative check
if (total < 0 || reserved < 0) {
  alert("Seats cannot be negative");
  return;
}

// ❌ Reserved > Total check
if (reserved > total) {
  alert("Reserved seats cannot be greater than total seats");
  return;
}
if (errors.totalSeats || errors.reservedSeats) {
  alert("Please fix errors before submitting");
  return;
}
    try {
      const payload = {
        ...form,
        totalSeats: Number(form.totalSeats),
        reservedSeats: Number(form.reservedSeats || 0),
      };
      const res = await axios.post(`${config.API_BASE_URL}/admission/vacancy`, payload);
      if (res.data.success) {
        setVacancies([res.data.data, ...vacancies]);
        setForm({
          academicYear: "",
          className: "",
          totalSeats: "",
          reservedSeats: "",
          startDate: "",
          endDate: "",
        });
      }
    } catch (err) {
      console.error("Error adding vacancy:", err);
      alert("Failed to add vacancy");
    }
  };

  const handleDeleteVacancy = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vacancy?")) return;
    try {
      const res = await axios.delete(`${config.API_BASE_URL}/admission/vacancy/${id}`);
      if (res.data.success) {
        setVacancies(vacancies.filter((v) => v._id !== id));
      }
    } catch (err) {
      console.error("Error deleting vacancy:", err);
    }
  };

  /* ================= FILTER ================= */
  const filteredVacancies = useMemo(() => {
    return vacancies.filter((v) => {
      return (
        (!filters.academicYear ||
          v.academicYear
            .toLowerCase()
            .includes(filters.academicYear.toLowerCase())) &&
        (!filters.className ||
          v.className === filters.className)
      );
    });
  }, [vacancies, filters]);
  const totalPages = Math.ceil(filteredVacancies.length / itemsPerPage) || 1;

const indexOfLast = currentPage * itemsPerPage;
const indexOfFirst = indexOfLast - itemsPerPage;

const currentVacancies = filteredVacancies.slice(
  indexOfFirst,
  indexOfLast
);
useEffect(() => {
  setCurrentPage(1);
}, [filters]);

  return (
    <div className="p-0 min-h-screen mb-10">
        <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <span>Admission</span>
        <span>&gt;</span>
        <span>Vacancy Setup</span>
      </div>
      {/* HEADER */}
      <div className="mb-5">
        <h2 className="text-2xl font-bold">
          Vacancy Setup
        </h2>
       
      </div>

      {/* ADD VACANCY */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
        <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
          Add Vacancy
        </h3>

        <form
          onSubmit={handleAddVacancy}
          className="grid grid-cols-3 gap-4"
        >
          {/* Academic Year */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">
              Academic Year
            </label>
            <input
              type="text"
              placeholder="e.g. 2025 to 2026"
              value={form.academicYear}
              onChange={(e) =>
                setForm({
                  ...form,
                  academicYear: e.target.value,
                })
              }
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Class */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">
              Class
            </label>
            <select
              value={form.className}
              onChange={(e) => {
                const selectedVal = e.target.value;
                const matchedClass = classes.find((c) => c.name === selectedVal);
                const capacity = matchedClass?.capacity ? Number(matchedClass.capacity) : "";
                setForm((prev) => ({
                  ...prev,
                  className: selectedVal,
                  totalSeats: capacity,
                  reservedSeats: "",
                }));
                setErrors((prev) => ({
                  ...prev,
                  totalSeats: "",
                  reservedSeats: "",
                }));
              }}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls.name}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Total Seats */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">
              Total Seats
            </label>
            <input
              type="number"
              min="0"
              value={form.totalSeats}
              readOnly
              className="border rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
              placeholder="Auto-populated from Class"
            />
            {errors.totalSeats && (
  <p className="text-red-500 text-xs mt-1">
    {errors.totalSeats}
  </p>
)}
          </div>

          {/* Reserved Seats */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">
              Reserved Seats
            </label>
           <input
  type="number"
  min="0"
  value={form.reservedSeats}
  onChange={(e) => {
  let value = Number(e.target.value);

  let error = "";

  if (value < 0) {
    error = "Reserved seats cannot be negative";
    value = 0;
  } else if (value > Number(form.totalSeats)) {
    error = "Reserved seats cannot be greater than total seats";
  }

  setErrors((prev) => ({
    ...prev,
    reservedSeats: error,
  }));

  setForm({
    ...form,
    reservedSeats: value,
  });
}}

              className="border rounded-lg px-3 py-2 text-sm"
            />
            {errors.reservedSeats && (
  <p className="text-red-500 text-xs mt-1">
    {errors.reservedSeats}
  </p>
)}
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">
              Application Start Date
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm({
                  ...form,
                  startDate: e.target.value,
                })
              }
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">
              Application End Date
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) =>
                setForm({
                  ...form,
                  endDate: e.target.value,
                })
              }
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="col-span-3">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Save Vacancy
            </button>
          </div>
        </form>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-lg  shadow-sm border mb-3">
      

        <div className="grid grid-cols-2 mb-3 gap-4">
          <div className="flex flex-col gap-1">
           
            <input
              type="text"
              placeholder="Search academic year"
              value={filters.academicYear}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  academicYear: e.target.value,
                })
              }
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
           
            <select
              value={filters.className}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  className: e.target.value,
                })
              }
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Classes</option>
              <option>Nursery</option>
              <option>LKG</option>
              <option>UKG</option>
              <option>Class 1</option>
              <option>Class 2</option>
              <option>Class 3</option>
              <option>Class 4</option>
              <option>Class 5</option>
              <option>Class 6</option>
              <option>Class 7</option>
              <option>Class 8</option>
              <option>Class 9</option>
              <option>Class 10</option>
            </select>
          </div>
        </div>
      

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-3">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Academic Year</th>
              <th className="p-3 text-left">Class</th>
              <th className="p-3 text-left">Total Seats</th>
              <th className="p-3 text-left">Reserved</th>
              <th className="p-3 text-left">Available</th>
              <th className="p-3 text-left">Duration</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                 <tr>
                 <td
                   colSpan="7"
                   className="p-6 text-center text-gray-500"
                 >
                   Loading...
                 </td>
               </tr>
            ) : filteredVacancies.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="p-6 text-center text-gray-500"
                >
                  No vacancy defined
                </td>
              </tr>
            ) : (
            currentVacancies.map((v) => (
                <tr
                  key={v._id}
                  className="border-t"
                >
                  <td className="p-3">
                    {v.academicYear}
                  </td>
                  <td className="p-3">{v.className}</td>
                  <td className="p-3">{v.totalSeats}</td>
                  <td className="p-3">
                    {v.reservedSeats || 0}
                  </td>
                  <td className="p-3 font-medium">
                    {v.availableSeats}
                  </td>
                  <td className="p-3">
                    {v.startDate} → {v.endDate}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleDeleteVacancy(v._id)} className="text-red-500 hover:text-red-700">
                        <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
      </div>
      {/* PAGINATION */}
{filteredVacancies.length > 0 && (
  <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
    <span>
      Page {currentPage} of {totalPages}
    </span>

    <div className="flex gap-2">
      <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(p => p - 1)}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Previous
      </button>

      <button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(p => p + 1)}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
)}
    </div>
     {/* BACK & NEXT BUTTONS – BOTTOM (NOT FIXED) */}
<div className="fixed bottom-4 left-[calc(16rem+1rem)] right-8 flex justify-between z-40">
  {/* BACK BUTTON */}
  <button
    onClick={() => navigate("/admission/admission-enquiry")}
    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
  >
    Back
  </button>

  {/* NEXT BUTTON */}
  <button
    onClick={() => navigate("/admission/admission-form")}
    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
  >
    Next
  </button>
</div>
    </div>
  );
}
