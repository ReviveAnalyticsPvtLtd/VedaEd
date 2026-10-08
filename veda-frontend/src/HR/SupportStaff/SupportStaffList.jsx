import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiSearch } from "react-icons/fi";
import apiClient from "../../services/apiClient";

const SupportStaffList = () => {
  const navigate = useNavigate();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/support-staff");
      const rows = res.data?.data || [];
      // Server already scopes by school and returns only support records
      // (role="Other" with a designation).
      setStaff(
        rows.map((s) => ({
          id: s._id,
          staffId: s.personalInfo?.staffId || "",
          name: s.personalInfo?.name || "",
          role: s.personalInfo?.designation || s.personalInfo?.role || "",
          department: s.personalInfo?.department || "",
          phone: s.personalInfo?.mobileNumber || "",
          status: s.status || "Active",
        }))
      );
    } catch (err) {
      console.error("Error fetching support staff:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Dynamic department list
  const departments = useMemo(() => {
    return [...new Set(staff.map((s) => s.department))];
  }, [staff]);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.length} selected staff member(s)? This also removes their login account.`)) {
      return;
    }
    try {
      await Promise.all(selected.map((id) => apiClient.delete(`/support-staff/${id}`)));
      setStaff((prev) => prev.filter((s) => !selected.includes(s.id)));
      setSelected([]);
    } catch (err) {
      console.error("Error deleting staff:", err);
      alert(err?.response?.data?.message || "Failed to delete staff");
    }
  };

  const exportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Staff ID,Name,Role,Department,Phone,Status"]
        .concat(
          staff.map(
            (s) =>
              `${s.staffId},${s.name},${s.role},${s.department},${s.phone},${s.status}`
          )
        )
        .join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "support_staff.csv";
    link.click();
  };

  // ✅ Filtering Logic
  const filteredStaff = staff.filter((s) => {
    return (
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.staffId.toLowerCase().includes(search.toLowerCase())) &&
      (departmentFilter ? s.department === departmentFilter : true) &&
      (statusFilter ? s.status === statusFilter : true)
    );
  });

  return (
    <div className="p-0 m-0 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Support Staff</h1>

     <div className="flex gap-6 text-sm mb-4 border-b">
        <button className="pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
          Overview
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Support Staff</h3>
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <div className="flex gap-3 flex-wrap items-center">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md w-64 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="border px-4 py-2 rounded-md"
            >
              <option value="">All Departments</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border px-4 py-2 rounded-md"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
            </select>

            {/* Bulk Actions */}
            <select
              onChange={(e) => {
                if (e.target.value === "delete") handleBulkDelete();
                if (e.target.value === "export") exportCSV();
              }}
              className="border px-4 py-2 rounded-md"
            >
              <option>Bulk Actions</option>
              <option value="delete">Delete Selected</option>
              <option value="export">Export Excel</option>
            </select>
          </div>

          {/* Add Button */}
          <button
            onClick={() => navigate("/hr/support-staff/add")}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <FiPlus /> Add Support Staff
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">
                  
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      setSelected(
                        e.target.checked ? filteredStaff.map((s) => s.id) : []
                      )
                    }
                  />
                </th>
                <th className="p-3 border">Staff ID</th>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Role</th>
                <th className="p-3 border">Department</th>
                <th className="p-3 border">Phone</th>
                <th className="p-3 border">Status</th>
                <th className="p-3 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    No Support Staff Found
                  </td>
                </tr>
              ) : (
                filteredStaff.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-3 border">
                      <input
                        type="checkbox"
                        checked={selected.includes(s.id)}
                        onChange={() => toggleSelect(s.id)}
                      />
                    </td>
                    <td className="p-3 border">{s.staffId}</td>
                    <td className="p-3 border">{s.name}</td>
                    <td className="p-3 border">{s.role}</td>
                    <td className="p-3 border">{s.department}</td>
                    <td className="p-3 border">{s.phone}</td>
                    <td className="p-3 border">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          s.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 border">
                      <button
                        onClick={() =>
                          navigate(`/hr/support-staff/details/${s.id}`, {
                            state: s,
                          })
                        }
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          <div>
            Showing {filteredStaff.length} of {staff.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportStaffList;
