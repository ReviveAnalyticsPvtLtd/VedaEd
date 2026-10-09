import React, { useState, useEffect } from "react";
import Select from "react-select";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import api from "../../../services/apiClient";
import Pagination from "../../../components/common/Pagination";

const SuperAdminSISAssignTeacher = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [classTeacher, setClassTeacher] = useState(null);

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editClass, setEditClass] = useState("");
  const [editSection, setEditSection] = useState("");
  const [editTeachers, setEditTeachers] = useState([]);
  const [editClassTeacher, setEditClassTeacher] = useState(null);
  const [editSections, setEditSections] = useState([]);

  const fetchDropdownData = async () => {
    try {
      // Classes fetch
      const classRes = await api.get(`/classes`);
      if (classRes.data?.success && Array.isArray(classRes.data.data)) {
        setClasses(classRes.data.data);
      } else if (Array.isArray(classRes.data?.data)) {
        setClasses(classRes.data.data);
      }

      // Staff fetch
      const staffRes = await api.get(`/staff`);
      if (staffRes.data?.success && Array.isArray(staffRes.data.staff)) {
        // ONLY TEACHERS
        const teacherList = staffRes.data.staff.filter(
          (s) =>
            s?.personalInfo?.role &&
            s.personalInfo.role.trim().toLowerCase() === "teacher"
        );
        setTeachers(teacherList);
      }
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setSections([]);
      setSelectedSection("");
      return;
    }
    api
      .get(`/sections?classId=${selectedClass}`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setSections(res.data.data);
        } else if (Array.isArray(res.data?.data)) {
          setSections(res.data.data);
        }
      })
      .catch((err) => console.error("Error fetching sections:", err));
  }, [selectedClass]);

  const fetchRecords = () => {
    api
      .get(`/assignTeachers/`)
      .then((res) => {
        const data = res.data;
        if (data && (data.success || Array.isArray(data.data))) {
          const list = Array.isArray(data.data) ? data.data : [];
          const fetchedRecords = list.map((item) => ({
            id: String(item._id),
            className: item.class?.name || "",
            section: item.section?.name || "",
            teachers: Array.isArray(item.teachers)
              ? item.teachers.map(
                  (t) =>
                    `${t.personalInfo?.name} (${t.personalInfo?.staffId})${
                      item.classTeacher &&
                      (item.classTeacher?._id === t._id ||
                        item.classTeacher?.personalInfo?.staffId ===
                          t.personalInfo?.staffId)
                        ? " ⭐"
                        : ""
                    }`
                )
              : [],
            originalData: item,
          }));
          setRecords(fetchedRecords);
        }
      })
      .catch((err) => console.error("Error fetching records:", err));
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const teacherOptions = Array.isArray(teachers)
    ? teachers.map((t) => ({
        value: t._id,
        label: `${t.personalInfo?.name} (${t.personalInfo?.staffId})`,
      }))
    : [];
  const assignedClassTeachers = records
    .map((r) => r.originalData?.classTeacher?._id)
    .filter(Boolean);

  const handleSave = async () => {
    if (!selectedClass || !selectedSection || selectedTeachers.length === 0 || !classTeacher) {
      alert("Please fill all required fields including Class Teacher.");
      return;
    }

    // Ensure class teacher is one of the selected teachers
    if (!selectedTeachers.includes(classTeacher)) {
      alert("Class Teacher must be one of the selected teachers.");
      return;
    }
    // Prevent duplicate class teacher
    if (assignedClassTeachers.includes(classTeacher)) {
      alert("This teacher is already assigned as a Class Teacher.");
      return;
    }

    try {
      const res = await api.post(`/assignTeachers/`, {
        classId: selectedClass,
        sectionId: selectedSection,
        teachers: selectedTeachers,
        classTeacher: classTeacher,
      });
      if (res.data?.success) {
        fetchRecords();
        setSelectedClass("");
        setSelectedSection("");
        setSelectedTeachers([]);
        setClassTeacher(null);
      } else {
        alert(res.data?.message || "Error saving data");
      }
    } catch (err) {
      console.error("Error saving data:", err);
      alert(err.response?.data?.message || "Error saving data");
    }
  };

  const handleEdit = (record) => {
    const originalData = record.originalData;
    setIsEditing(true);
    setEditingRecord(originalData);
    setEditClass(originalData.class?._id || "");
    setEditSection(originalData.section?._id || "");
    setEditTeachers((originalData.teachers || []).map((t) => t._id));
    setEditClassTeacher(originalData.classTeacher?._id || null);

    if (originalData.class?._id) {
      api
        .get(`/sections?classId=${originalData.class._id}`)
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            setEditSections(res.data.data);
          } else if (Array.isArray(res.data?.data)) {
            setEditSections(res.data.data);
          }
        })
        .catch((err) => console.error("Error fetching sections:", err));
    }
  };

  const handleUpdate = async () => {
    if (!editClass || !editSection || editTeachers.length === 0 || !editClassTeacher) {
      alert("Please fill all required fields including Class Teacher.");
      return;
    }

    // Ensure class teacher is one of the selected teachers
    if (!editTeachers.includes(editClassTeacher)) {
      alert("Class Teacher must be one of the selected teachers.");
      return;
    }
    // Prevent duplicate class teacher while editing
    const alreadyAssigned = records.some(
      (r) =>
        r.originalData?.classTeacher?._id === editClassTeacher &&
        r.originalData?._id !== editingRecord._id
    );

    if (alreadyAssigned) {
      alert("This teacher is already assigned as a Class Teacher.");
      return;
    }

    try {
      const res = await api.put(`/assignTeachers/${editingRecord._id}`, {
        classId: editClass,
        sectionId: editSection,
        teachers: editTeachers,
        classTeacher: editClassTeacher,
      });
      if (res.data?.success) {
        fetchRecords();
        cancelEdit();
      } else {
        alert(res.data?.message || "Error updating data");
      }
    } catch (err) {
      console.error("Error updating data:", err);
      alert(err.response?.data?.message || "Error updating data");
    }
  };

  const handleDelete = async (record) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      const deleteId = String(
        record.id || (record.originalData && record.originalData._id)
      );
      try {
        const res = await api.delete(`/assignTeachers/${deleteId}`);
        if (res.data?.success) {
          fetchRecords();
        } else {
          alert(res.data?.message || "Error deleting data");
        }
      } catch (err) {
        console.error("Error deleting data:", err);
        alert(err.response?.data?.message || "Error deleting data");
      }
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingRecord(null);
    setEditClass("");
    setEditSection("");
    setEditTeachers([]);
    setEditClassTeacher(null);
    setEditSections([]);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  const totalPages = Math.ceil(records.length / recordsPerPage) || 1;

  const paginatedRecords = records.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* Add Form Card */}
      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
        <h2 className="text-lg font-semibold mb-4">Assign Class Teacher</h2>
        <div className="flex flex-wrap items-center gap-4">
          {/* Class */}
          <div className="flex flex-col">
            <label className="block mb-2 text-sm font-medium">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="border px-3 py-2 rounded-md w-40 text-sm"
            >
              <option value="">Select Class</option>
              {classes?.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div className="flex flex-col">
            <label className="block mb-2 text-sm font-medium">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="border px-3 py-2 rounded-md text-sm w-40"
            >
              <option value="">Select Section</option>
              {sections?.map((sec) => (
                <option key={sec._id} value={sec._id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Teachers */}
          <div className="flex flex-col w-64">
            <label className="block mb-2 text-sm font-medium">Teachers</label>
            <div>
              <Select
                isMulti
                options={teacherOptions}
                value={teacherOptions.filter((opt) =>
                  selectedTeachers.includes(opt.value)
                )}
                onChange={(selected) => {
                  const newTeachers = selected.map((s) => s.value);
                  setSelectedTeachers(newTeachers);
                  if (classTeacher && !newTeachers.includes(classTeacher)) {
                    setClassTeacher(null);
                  }
                }}
                placeholder="Select Teachers"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "38px",
                    height: "auto",
                    alignItems: "center",
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    padding: "2px 8px",
                  }),
                  multiValue: (base) => ({
                    ...base,
                    margin: "2px",
                  }),
                }}
              />
            </div>
          </div>

          {/* Class Teacher */}
          {selectedTeachers.length > 0 && (
            <div className="flex flex-col w-64">
              <label className="block mb-2 text-sm font-medium">
                Class Teacher <span className="text-red-500">*</span>
              </label>
              <select
                value={classTeacher || ""}
                onChange={(e) => setClassTeacher(e.target.value)}
                className="border px-3 py-2 rounded-md text-sm h-[38px]"
              >
                <option value="">Select Class Teacher</option>
                {selectedTeachers.map((id) => {
                  const t = teachers.find((x) => x._id === id);
                  return (
                    <option key={id} value={id}>
                      {t?.personalInfo?.name} ({t?.personalInfo?.staffId})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Save */}
          <div className="flex flex-col">
            <label className="h-6 mb-2"></label>
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Edit Form Card */}
      {isEditing && (
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
          <h2 className="text-lg font-semibold mb-4">Edit Class Teacher Assignment</h2>

          <label className="block mb-1 text-sm font-medium">
            Class <span className="text-red-500">*</span>
          </label>
          <select
            value={editClass}
            onChange={(e) => {
              setEditClass(e.target.value);
              setEditSection("");
              setEditSections([]);
              if (e.target.value) {
                api
                  .get(`/sections?classId=${e.target.value}`)
                  .then((res) => {
                    if (res.data?.success && Array.isArray(res.data.data)) {
                      setEditSections(res.data.data);
                    } else if (Array.isArray(res.data?.data)) {
                      setEditSections(res.data.data);
                    }
                  })
                  .catch((err) => console.error("Error fetching sections:", err));
              }
            }}
            className="w-full border px-3 py-2 rounded-md mb-4 text-sm"
          >
            <option value="">Select Class</option>
            {Array.isArray(classes) &&
              classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
          </select>

          <label className="block mb-1 text-sm font-medium">
            Section <span className="text-red-500">*</span>
          </label>
          <select
            value={editSection}
            onChange={(e) => setEditSection(e.target.value)}
            className="w-full border px-3 py-2 rounded-md mb-4 text-sm"
          >
            <option value="">Select Section</option>
            {Array.isArray(editSections) &&
              editSections.map((sec) => (
                <option key={sec._id} value={sec._id}>
                  {sec.name}
                </option>
              ))}
          </select>

          <label className="block mb-1 text-sm font-medium">
            Teachers <span className="text-red-500">*</span>
          </label>
          <div className="mb-4">
            <Select
              isMulti
              options={teacherOptions}
              value={teacherOptions.filter((opt) =>
                editTeachers.includes(opt.value)
              )}
              onChange={(selected) => {
                const newTeachers = selected.map((s) => s.value);
                setEditTeachers(newTeachers);
                if (editClassTeacher && !newTeachers.includes(editClassTeacher)) {
                  setEditClassTeacher(null);
                }
              }}
              placeholder="Select Teachers"
            />
          </div>

          <label className="block mb-1 text-sm font-medium">
            Class Teacher <span className="text-red-500">*</span>
          </label>
          <select
            value={editClassTeacher || ""}
            onChange={(e) => setEditClassTeacher(e.target.value)}
            className="w-full border px-3 py-2 rounded-md mb-4 text-sm"
          >
            <option value="">Select Class Teacher</option>
            {editTeachers.map((id) => {
              const t = teachers.find((x) => x._id === id);
              return (
                <option key={id} value={id}>
                  {t?.personalInfo?.name} ({t?.personalInfo?.staffId})
                </option>
              );
            })}
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Update
            </button>
            <button
              onClick={cancelEdit}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white p-3 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Assigned Teachers List</h3>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm min-w-[600px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Class</th>
                <th className="p-2 border">Section</th>
                <th className="p-2 border">Teachers</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((item) => (
                <tr key={item.id} className="text-center hover:bg-gray-50">
                  <td className="p-2 border">{item.className}</td>
                  <td className="p-2 border">{item.section}</td>
                  <td className="p-2 border text-left">
                    {item.teachers.join(", ")}
                  </td>
                  <td className="p-2 border">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedRecords.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default SuperAdminSISAssignTeacher;
