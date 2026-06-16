import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { useNavigate,Link } from "react-router-dom";
import axios from "axios";
import config from "../../../config";

const SuperAdminSISSubjectGroup = () => {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [editId, setEditId] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const groupsPerPage = 10;

  const navigate = useNavigate();


  useEffect(() => {
    fetchGroups();
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setSections([]);
      setSelectedSections([]);
      return;
    }

    const token = localStorage.getItem("token");
    axios
      .get(`${config.API_BASE_URL}/sections?classId=${selectedClass}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.data)) {
          setSections(res.data.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching sections:", error);
      });
  }, [selectedClass]);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${config.API_BASE_URL}/subGroups/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setGroups(res.data.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [classRes, subjectRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/classes`, { headers }),
        axios.get(`${config.API_BASE_URL}/subjects`, { headers }),
      ]);
      setClasses(classRes.data.data);
      setSubjects(subjectRes.data.data);
    } catch (error) {
      console.error("Error fetching dropdowns:", error);
    }
  };

  const handleSectionChange = (id) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubjectChange = (id) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (
      !name ||
      !selectedClass ||
      selectedSections.length === 0 ||
      selectedSubjects.length === 0
    ) {
      alert("Please fill all required fields.");
      return;
    }

    const payload = {
      name,
      classes: selectedClass,
      sections: selectedSections,
      subjects: selectedSubjects,
    };

    try {
      let res;
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      if (editId) {
        res = await axios.put(
          `${config.API_BASE_URL}/subGroups/${editId}`,
          payload,
          { headers }
        );
      } else {
        res = await axios.post(`${config.API_BASE_URL}/subGroups/`, payload, { headers });
      }

      if (res.data.success) {
        alert(res.data.message);
        fetchGroups();
        resetForm();
      }
    } catch (error) {
      console.error("Error saving group:", error);
      alert(error.response?.data?.message || "Failed to save group");
    }
  };

  const resetForm = () => {
    setName("");
    setSelectedClass("");
    setSelectedSections([]);
    setSelectedSubjects([]);
    setEditId(null);
  };

  const handleEdit = (group) => {
    setName(group.name);
    setSelectedClass(group.classes._id);
    setSelectedSections(group.sections.map((s) => s._id));
    setSelectedSubjects(group.subjects.map((s) => s._id));
    setEditId(group._id);

    const token = localStorage.getItem("token");
    axios
      .get(`${config.API_BASE_URL}/sections?classId=${group.classes._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.data))
          setSections(res.data.data);
      })
      .catch((error) => console.error("Error fetching sections:", error));
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this subject group?")) {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.delete(
          `${config.API_BASE_URL}/subGroups/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          alert(res.data.message);
          fetchGroups();
        }
      } catch (error) {
        console.error("Error deleting group:", error);
        alert(error.response?.data?.message || "Failed to delete group");
      }
    }
  };

  // Pagination logic
  const indexOfLast = currentPage * groupsPerPage;
  const indexOfFirst = indexOfLast - groupsPerPage;
  const currentGroups = groups.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(groups.length / groupsPerPage) || 1;

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* Form Section */}
      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
        <h2 className="text-lg font-semibold mb-4">
          {editId ? "Edit Subject Group" : "Add Subject Group"}
        </h2>
<div className="flex gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter subject group name"
          className="w-72 border px-6 py-2 rounded-md mb-4 text-sm "
        />

        <select
          value={selectedClass}
          onChange={(e) => {
            setSelectedClass(e.target.value);
            setSelectedSections([]);
          }}
          className=" border px-3 py-2 rounded-md mb-4 text-sm"
        >
          <option value="">Select Class</option>
          {classes.map((cls) => (
            <option key={cls._id} value={cls._id}>
              {cls.name}
            </option>
          ))}
        </select>
</div>
        {selectedClass && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {sections.map((sec) => (
                <label
                  key={sec._id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedSections.includes(sec._id)}
                    onChange={() => handleSectionChange(sec._id)}
                  />
                  {sec.name}
                </label>
              ))}
            </div>
          </>
        )}

        <label className="block text-lg font-medium mb-1">
          Subjects <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {subjects.map((sub) => (
            <label key={sub._id} className="flex items-center gap-2 ">
              <input
                type="checkbox"
                checked={selectedSubjects.includes(sub._id)}
                onChange={() => handleSubjectChange(sub._id)}
              />
              {sub.subjectName}
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded-md "
          >
            {editId ? "Update" : "Save"}
          </button>
          {editId && (
            <button
              onClick={resetForm}
              className="bg-gray-500 text-white px-4 py-2 rounded-md "
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List Section */}
      <div className="bg-white p-3 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Subject Group List</h2>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 border text-left">Name</th>
                <th className="p-2 border text-left">Class</th>
                <th className="p-2 border text-left">Sections</th>
                <th className="p-2 border text-left">Subjects</th>
                <th className="p-2 border text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentGroups.length > 0 ? (
                currentGroups.map((g) => (
                  <tr key={g._id} className="text-center hover:bg-gray-50">
                    <td className="p-2 border text-left  text-gray-800">
                      {g.name}
                    </td>
                    <td className="p-2 border text-left text-gray-700">
                      {g.classes?.name}
                    </td>

                    <td className="p-2 border text-left">
                      <div className="flex flex-wrap gap-1">
                        {g.sections.map((s) => (
                          <span
                            key={s._id}
                            className="bg-blue-100 text-blue-700  px-2 py-1 rounded-full"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-2 border text-left">
                      <div className="flex flex-wrap gap-1">
                        {g.subjects.map((sub) => (
                          <span
                            key={sub._id}
                            className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full"
                          >
                            {sub.subjectName}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-2 border text-center">
                      <button
                        onClick={() => handleEdit(g)}
                        className="text-blue-600 hover:text-blue-800 mx-1"
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(g._id)}
                        className="text-red-600 hover:text-red-800 mx-1"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">
                    No subject groups found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center text-sm text-gray-500 mt-3">
          <p>
            Page {currentPage} of {totalPages}
          </p>
          <div className="space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

       {/* Next button */}
            <div className="fixed bottom-4 left-[calc(16rem+1rem)] right-8 flex justify-between z-40">
              {/* Back Button */}
              <button
                onClick={() => navigate(-1)}
                className="bg-gray-500 text-white px-6 py-2 rounded-md shadow hover:bg-gray-600"
              >
                ← Back
              </button>
            
              {/* Next Button */}
              <Link
               to="/superadmin/sis/classes-schedules/assign-teacher"
                className="bg-blue-600 text-white px-6 py-2 rounded-md shadow hover:bg-blue-700"
              >
                Next →
              </Link>
            </div>
    </div>
  );
};

export default SuperAdminSISSubjectGroup;
