import React, { useState, useMemo, useEffect } from "react";
import { FiTrash2, FiPlus, FiBriefcase, FiCheckCircle, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";

export default function VacancyDashboard() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    vacancyId: "",
    department: "",
    jobTitle: "",
    roleType: "Teaching",
    requiredSkills: "",
    experienceRequired: "",
    salaryRange: "",
    openings: 1,
    lastDateToApply: "",
    status: "Published",
  });

  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [filters, setFilters] = useState({
    search: "",
    roleType: "",
  });

  useEffect(() => {
    fetchVacancies();
  }, []);

  const fetchVacancies = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/hr-recruitment/vacancies");
      setVacancies(res.data.data);
    } catch (err) {
      console.error("Error fetching vacancies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVacancy = async (e) => {
    e.preventDefault();

    if (!form.vacancyId || !form.jobTitle || !form.department) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        ...form,
        requiredSkills: form.requiredSkills ? form.requiredSkills.split(",").map(s => s.trim()) : [],
      };
      if (!payload.lastDateToApply) {
        delete payload.lastDateToApply;
      }
      
      const res = await apiClient.post("/hr-recruitment/vacancies", payload);
      if (res.data.success) {
        setVacancies([res.data.data, ...vacancies]);
        setForm({
          vacancyId: "",
          department: "",
          jobTitle: "",
          roleType: "Teaching",
          requiredSkills: "",
          experienceRequired: "",
          salaryRange: "",
          openings: 1,
          lastDateToApply: "",
          status: "Published",
        });
        alert("Vacancy created successfully!");
      }
    } catch (err) {
      console.error("Error adding vacancy:", err);
      alert("Failed to add vacancy");
    }
  };

  const handleDeleteVacancy = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vacancy?")) return;
    try {
      // In a real application, you might call delete API. Here we filter or set closed
      setVacancies(vacancies.filter((v) => v._id !== id));
      alert("Vacancy deleted successfully");
    } catch (err) {
      console.error("Error deleting vacancy:", err);
    }
  };

  const filteredVacancies = useMemo(() => {
    return vacancies.filter((v) => {
      const matchSearch = v.jobTitle.toLowerCase().includes(filters.search.toLowerCase()) || 
                          v.department.toLowerCase().includes(filters.search.toLowerCase()) ||
                          v.vacancyId.toLowerCase().includes(filters.search.toLowerCase());
      const matchRole = !filters.roleType || v.roleType === filters.roleType;
      return matchSearch && matchRole;
    });
  }, [vacancies, filters]);

  const totalPages = Math.ceil(filteredVacancies.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentVacancies = filteredVacancies.slice(indexOfFirst, indexOfLast);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return (
    <div className="p-0 min-h-screen mb-20">
      {/* Breadcrumbs */}
      <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <span>HR</span>
        <span>&gt;</span>
        <span>Talent Acquisition</span>
        <span>&gt;</span>
        <span>Vacancy Setup</span>
      </div>

      {/* Header */}
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-800">Vacancy Setup</h2>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-500 text-white rounded-lg"><FiBriefcase size={20} /></div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">Total Vacancies</p>
            <p className="text-xl font-bold text-gray-800">{vacancies.length}</p>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-green-500 text-white rounded-lg"><FiCheckCircle size={20} /></div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">Published</p>
            <p className="text-xl font-bold text-gray-800">{vacancies.filter(v => v.status === "Published").length}</p>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-gray-500 text-white rounded-lg"><FiUsers size={20} /></div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">Total Openings</p>
            <p className="text-xl font-bold text-gray-800">{vacancies.reduce((acc, curr) => acc + (curr.openings || 1), 0)}</p>
          </div>
        </div>
      </div>

      {/* Add Vacancy Form directly embedded */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
        <h3 className="font-semibold mb-4 text-gray-700 text-lg flex items-center gap-2 border-b pb-2">
          <FiPlus className="text-blue-500" /> Create Vacancy
        </h3>

        <form onSubmit={handleAddVacancy} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Vacancy ID *</label>
            <input
              type="text"
              required
              placeholder="e.g. VAC-001"
              value={form.vacancyId}
              onChange={(e) => setForm({ ...form, vacancyId: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Role Type *</label>
            <select
              value={form.roleType}
              onChange={(e) => setForm({ ...form, roleType: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="Teaching">Teaching</option>
              <option value="Non-Teaching">Non-Teaching</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Job Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Math Teacher"
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Department *</label>
            <input
              type="text"
              required
              placeholder="e.g. Academics"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Experience Required</label>
            <input
              type="text"
              placeholder="e.g. 3+ years"
              value={form.experienceRequired}
              onChange={(e) => setForm({ ...form, experienceRequired: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Salary Range</label>
            <input
              type="text"
              placeholder="e.g. ₹30,000 - ₹50,000"
              value={form.salaryRange}
              onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Number of Openings</label>
            <input
              type="number"
              min="1"
              value={form.openings}
              onChange={(e) => setForm({ ...form, openings: parseInt(e.target.value) || 1 })}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Last Date to Apply</label>
            <input
              type="date"
              value={form.lastDateToApply}
              onChange={(e) => setForm({ ...form, lastDateToApply: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-3">
            <label className="text-sm font-medium text-gray-600">Required Skills (Comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Communication, Problem Solving, Classroom Management"
              value={form.requiredSkills}
              onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="col-span-1 md:col-span-3 pt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition shadow"
            >
              Save & Publish Vacancy
            </button>
          </div>
        </form>
      </div>

      {/* Search Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search by Job ID, Title or Department"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filters.roleType}
            onChange={(e) => setFilters({ ...filters, roleType: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="Teaching">Teaching</option>
            <option value="Non-Teaching">Non-Teaching</option>
          </select>
        </div>
      </div>

      {/* Vacancy Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3 text-left">S.No</th>
              <th className="p-3 text-left">Job ID</th>
              <th className="p-3 text-left">Job Title & Dept</th>
              <th className="p-3 text-left">Role Type</th>
              <th className="p-3 text-left">Openings</th>
              <th className="p-3 text-left">Salary Range</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="p-6 text-center text-gray-500">Loading...</td>
              </tr>
            ) : filteredVacancies.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-6 text-center text-gray-500">No vacancy defined</td>
              </tr>
            ) : (
              currentVacancies.map((v, index) => (
                <tr key={v._id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-600">
                    {indexOfFirst + index + 1}
                  </td>
                  <td className="p-3 font-semibold text-gray-800">{v.vacancyId}</td>
                  <td className="p-3">
                    <div className="font-semibold text-gray-800">{v.jobTitle}</div>
                    <div className="text-xs text-gray-500">{v.department}</div>
                  </td>
                  <td className="p-3">{v.roleType}</td>
                  <td className="p-3 font-medium">{v.openings}</td>
                  <td className="p-3 text-gray-600">{v.salaryRange || "Not Specified"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                      ${v.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteVacancy(v._id)}
                      className="text-red-500 hover:text-red-700 transition"
                      title="Delete Vacancy"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredVacancies.length > itemsPerPage && (
        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* BACK & NEXT NAVIGATION BUTTONS - BOTTOM (NOT FIXED) */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200">
        <button
          onClick={() => navigate("/hr/dashboard")}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 font-medium transition"
        >
          Back
        </button>

        <button
          onClick={() => navigate("/hr/talent-acquisition/apply")}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-medium transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}
