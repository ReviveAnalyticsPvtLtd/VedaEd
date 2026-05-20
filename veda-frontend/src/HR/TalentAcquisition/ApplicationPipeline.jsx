import React, { useMemo, useState, useEffect } from "react";
import { FiEye, FiCheckCircle, FiUserPlus, FiArrowRight } from "react-icons/fi";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import config from "../../config";

export default function ApplicationPipeline() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal Details state
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/hr-recruitment/applications");
      if (res.data.success) {
        setApplications(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateDayMonthYear = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      await apiClient.put(`/hr-recruitment/applications/${appId}/status`, { status: newStatus });
      setApplications(prev => prev.map(a => a._id === appId ? { ...a, status: newStatus } : a));
      if (selectedApp && selectedApp._id === appId) {
        setSelectedApp(prev => ({ ...prev, status: newStatus }));
      }
      alert(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    }
  };

  const handleConvertToEmployee = async (appId) => {
    if (window.confirm("Convert this candidate to a permanent employee?")) {
      try {
        await apiClient.post(`/hr-recruitment/applications/${appId}/convert`);
        alert("Converted successfully!");
        fetchApplications();
        setIsDetailsModalOpen(false);
      } catch (error) {
        console.error(error);
        alert("Error converting employee");
      }
    }
  };

  /* ================= FILTER ================= */
  const filteredData = useMemo(() => {
    return applications.filter((a) => {
      const matchSearch = 
        (a.applicantName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.mobile || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = !statusFilter || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  /* ================= EXPORT ================= */
  const exportToExcel = () => {
    const sourceData =
      selectedIds.length > 0
        ? applications.filter(app => selectedIds.includes(app._id))
        : filteredData;

    const dataToExport = sourceData.map(app => ({
      "Application ID": app._id,
      "Candidate Name": app.applicantName,
      "Role Type": app.roleType,
      "Email": app.email,
      "Mobile": app.mobile,
      "Vacancy Applied For": app.vacancy?.jobTitle || "N/A",
      "Qualification": app.qualification,
      "Experience": app.experience,
      "Status": app.status,
      "Form Date": formatDateDayMonthYear(app.createdAt)
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Talent Candidates");
    XLSX.writeFile(wb, "CandidateApplicationList.xlsx");
  };

  return (
    <div className="p-0 m-0 min-h-screen mb-20 relative">
      {/* Breadcrumbs */}
      <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <span>HR</span>
        <span>&gt;</span>
        <span>Talent Acquisition</span>
        <span>&gt;</span>
        <span>Application Pipeline</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Application Pipeline</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-4 text-gray-600 border-b">
        <button className="pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
          Overview
        </button>
      </div>

      {/* Summary Widget */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">Total Applications</p>
          <p className="text-2xl font-bold text-gray-800">{applications.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">Pending Screening</p>
          <p className="text-2xl font-bold text-gray-800">{applications.filter(a => a.status === "Screening" || a.status === "Applied").length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">In Interview Process</p>
          <p className="text-2xl font-bold text-gray-800">{applications.filter(a => a.status.includes("Interview")).length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">Joined Employees</p>
          <p className="text-2xl font-bold text-gray-800">{applications.filter(a => a.status === "Joined").length}</p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Candidates Applications</h3>

        {/* Top Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by Name, Email or Mobile"
              className="border rounded-md px-3 py-2 text-sm w-72"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Interview Round 1">Interview Round 1</option>
              <option value="Interview Round 2">Interview Round 2</option>
              <option value="Selected">Selected</option>
              <option value="Offer Sent">Offer Sent</option>
              <option value="Documents Verified">Documents Verified</option>
              <option value="Training Started">Training Started</option>
              <option value="Joined">Joined</option>
            </select>
          </div>

          <div>
            <select
              className="border px-3 py-2 text-sm rounded-md bg-white hover:bg-gray-50 cursor-pointer"
              onChange={(e) => {
                if (e.target.value === "excel") exportToExcel();
              }}
            >
              <option value="">Bulk Action</option>
              <option value="excel">Export Excel</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border text-center w-12">
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      setSelectedIds(
                        e.target.checked ? paginatedData.map((x) => x._id) : []
                      )
                    }
                  />
                </th>
                <th className="p-3 border text-center w-16">S.No</th>
                <th className="p-3 border text-left">Candidate Name</th>
                <th className="p-3 border text-left">Role & Dept</th>
                <th className="p-3 border text-left">Qualification</th>
                <th className="p-3 border text-left">Experience</th>
                <th className="p-3 border text-left">Mobile No.</th>
                <th className="p-3 border text-left">Status</th>
                <th className="p-3 border text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-gray-500">Loading...</td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-gray-500">No applications found</td>
                </tr>
              ) : (
                paginatedData.map((a, index) => (
                  <tr key={a._id} className="hover:bg-gray-50 border-b">
                    <td className="p-3 border text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(a._id)}
                        onChange={() =>
                          setSelectedIds((prev) =>
                            prev.includes(a._id)
                              ? prev.filter((id) => id !== a._id)
                              : [...prev, a._id]
                          )
                        }
                      />
                    </td>
                    <td className="p-3 border text-center font-medium text-gray-500">
                      {startIndex + index + 1}
                    </td>
                    <td className="p-3 border font-semibold text-gray-800">{a.applicantName}</td>
                    <td className="p-3 border">
                      <div className="font-medium">{a.roleType}</div>
                      <div className="text-xs text-gray-500">{a.vacancy?.jobTitle || "Direct Apply"}</div>
                    </td>
                    <td className="p-3 border">{a.qualification}</td>
                    <td className="p-3 border">{a.experience || "Fresh"}</td>
                    <td className="p-3 border">{a.mobile}</td>
                    <td className="p-3 border">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${a.status === 'Joined' ? 'bg-green-100 text-green-700' : 
                          a.status === 'Selected' ? 'bg-blue-100 text-blue-700' :
                          a.status.includes('Interview') ? 'bg-purple-100 text-purple-700' :
                          'bg-yellow-100 text-yellow-700'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 border text-center">
                      <button
                        onClick={() => {
                          setSelectedApp(a);
                          setIsDetailsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 mx-auto"
                        title="View Details"
                      >
                        <FiEye /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredData.length > itemsPerPage && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-4 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 transition text-sm"
              >
                Previous
              </button>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-4 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 transition text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {isDetailsModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-blue-600 text-white p-6 rounded-t-xl flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{selectedApp.applicantName}</h3>
                <p className="text-xs text-blue-100 mt-1">Application Details</p>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-white hover:text-gray-200 text-xl font-bold bg-blue-700 hover:bg-blue-800 rounded-full h-8 w-8 flex items-center justify-center transition"
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Job Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
                <div>
                  <span className="block text-xs font-semibold text-gray-500">Applying Vacancy</span>
                  <span className="font-medium text-gray-800">{selectedApp.vacancy?.jobTitle || "Direct Application"}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-500">Role Type</span>
                  <span className="font-medium text-gray-800">{selectedApp.roleType}</span>
                </div>
              </div>

              {/* Personal Info */}
              <div>
                <h4 className="font-bold text-gray-700 mb-3 border-b pb-1 text-sm uppercase">Personal Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="block text-xs text-gray-500">Father's Name</span>
                    <span className="font-semibold text-gray-800">{selectedApp.fatherName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Date of Birth</span>
                    <span className="font-semibold text-gray-800">{selectedApp.dob || "N/A"}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Gender</span>
                    <span className="font-semibold text-gray-800">{selectedApp.gender}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Email ID</span>
                    <span className="font-semibold text-gray-800">{selectedApp.email}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Mobile No.</span>
                    <span className="font-semibold text-gray-800">{selectedApp.mobile}</span>
                  </div>
                  <div className="md:col-span-3">
                    <span className="block text-xs text-gray-500">Address</span>
                    <span className="font-semibold text-gray-800">{selectedApp.address || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Professional details */}
              <div>
                <h4 className="font-bold text-gray-700 mb-3 border-b pb-1 text-sm uppercase">Professional Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-xs text-gray-500">Highest Qualification</span>
                    <span className="font-semibold text-gray-800">{selectedApp.qualification}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Total Experience (Years)</span>
                    <span className="font-semibold text-gray-800">{selectedApp.experience || "N/A"}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Current Salary</span>
                    <span className="font-semibold text-gray-800">{selectedApp.currentSalary || "N/A"}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Expected Salary</span>
                    <span className="font-semibold text-gray-800">{selectedApp.expectedSalary || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div>
                <h4 className="font-bold text-gray-700 mb-3 border-b pb-1 text-sm uppercase">Uploaded Documents</h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  {selectedApp.resumeUrl ? (
                    <a
                      href={`${config.API_BASE_URL.replace("/api", "")}/${selectedApp.resumeUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                    >
                      📄 Click to View Resume / CV
                    </a>
                  ) : (
                    <div className="p-3 bg-gray-50 text-gray-400 border border-dashed rounded-lg">No Resume uploaded</div>
                  )}

                  {selectedApp.aadhaarUrl ? (
                    <a
                      href={`${config.API_BASE_URL.replace("/api", "")}/${selectedApp.aadhaarUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                    >
                      🪪 Click to View Aadhaar Card
                    </a>
                  ) : (
                    <div className="p-3 bg-gray-50 text-gray-400 border border-dashed rounded-lg">No Aadhaar uploaded</div>
                  )}

                  {selectedApp.panUrl ? (
                    <a
                      href={`${config.API_BASE_URL.replace("/api", "")}/${selectedApp.panUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                    >
                      💳 Click to View PAN Card
                    </a>
                  ) : (
                    <div className="p-3 bg-gray-50 text-gray-400 border border-dashed rounded-lg">No PAN uploaded</div>
                  )}

                  {selectedApp.photoUrl ? (
                    <a
                      href={`${config.API_BASE_URL.replace("/api", "")}/${selectedApp.photoUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                    >
                      📸 Click to View Passport Photo
                    </a>
                  ) : (
                    <div className="p-3 bg-gray-50 text-gray-400 border border-dashed rounded-lg">No Passport Photo uploaded</div>
                  )}
                </div>
              </div>

              {/* Status Update Controls */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Change Candidate Status</label>
                <div className="flex flex-wrap gap-2">
                  {["Applied", "Screening", "Interview Round 1", "Interview Round 2", "Selected", "Offer Sent", "Documents Verified", "Training Started", "Joined"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateStatus(selectedApp._id, st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition
                        ${selectedApp.status === st 
                          ? "bg-blue-600 border-blue-600 text-white" 
                          : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Joined conversion to Permanent Employee */}
              {selectedApp.status === "Joined" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-green-800 text-sm">Convert Candidate to Permanent Employee</h5>
                    <p className="text-xs text-green-600 mt-1">This will automatically generate a staff entry and user profile in the database.</p>
                  </div>
                  <button
                    onClick={() => handleConvertToEmployee(selectedApp._id)}
                    className="bg-green-600 text-white font-medium py-2 px-4 rounded hover:bg-green-700 text-xs flex items-center gap-1 shadow-sm transition"
                  >
                    <FiUserPlus /> Convert to Staff
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-100 p-4 rounded-b-xl flex justify-end">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="bg-gray-300 text-gray-700 px-5 py-2 rounded-lg font-medium hover:bg-gray-400 text-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BACK & NEXT NAVIGATION BUTTONS - BOTTOM (NOT FIXED) */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200">
        <button
          onClick={() => navigate("/hr/talent-acquisition/apply")}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 font-medium transition"
        >
          Back
        </button>

        <button
          onClick={() => navigate("/hr/dashboard")}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium transition"
        >
          Complete
        </button>
      </div>
    </div>
  );
}
