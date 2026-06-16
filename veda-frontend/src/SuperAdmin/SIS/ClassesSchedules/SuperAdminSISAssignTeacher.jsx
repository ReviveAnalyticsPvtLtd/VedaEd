import React, { useState, useEffect } from "react";
import Select from "react-select";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { useNavigate , Link} from "react-router-dom";
import config from "../../../config";
import api from "../../../services/apiClient";

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

  useEffect(() => {
  const fetchDropdownData = async () => {
    try {

      // Classes fetch
      const classRes = await fetch(`${config.API_BASE_URL}/classes`);
      const classData = await classRes.json();

      if (classData?.success && Array.isArray(classData.data)) {
        setClasses(classData.data);
      }

      // Staff fetch
      const staffRes = await api.get(`/staff`);

      console.log("FULL STAFF RESPONSE:", staffRes.data);

      if (
        staffRes.data?.success &&
        Array.isArray(staffRes.data.staff)
      ) {

        // ONLY TEACHERS
        const teacherList = staffRes.data.staff.filter(
          (s) =>
            s?.personalInfo?.role &&
            s.personalInfo.role.trim().toLowerCase() === "teacher"
        );

        console.log("FILTERED TEACHERS:", teacherList);

        setTeachers(teacherList);
      }

    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  fetchDropdownData();
}, []);

  useEffect(() => {
    if (!selectedClass) {
      setSections([]);
      setSelectedSection("");
      return;
    }
    fetch(`${config.API_BASE_URL}/sections?classId=${selectedClass}`)
      .then((res) => res.json())
      .then((sectionData) => {
        if (
          sectionData &&
          sectionData.success &&
          Array.isArray(sectionData.data)
        ) {
          setSections(sectionData.data);
        }
      })
      .catch((err) => console.error("Error fetching sections:", err));
  }, [selectedClass]);

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

  const handleSave = () => {
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
    fetch(`${config.API_BASE_URL}/assignTeachers/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId: selectedClass,
        sectionId: selectedSection,
        teachers: selectedTeachers,
        classTeacher: classTeacher,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchRecords();
          setSelectedClass("");
          setSelectedSection("");
          setSelectedTeachers([]);
          setClassTeacher(null);
        } else alert(data.message || "Error saving data");
      })
      .catch((err) => {
        console.error("Error saving data:", err);
        alert("Error saving data");
      });
  };
  

  const fetchRecords = () => {
    fetch(`${config.API_BASE_URL}/assignTeachers/`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const fetchedRecords = data.data.map((item) => ({
            id: String(item._id),
            className: item.class?.name || "",
            section: item.section?.name || "",
            teachers: Array.isArray(item.teachers)
              ? item.teachers.map(
                  (t) =>
                    `${t.personalInfo?.name} (${t.personalInfo?.staffId})${
                      item.classTeacher &&
                      item.classTeacher?.personalInfo?.staffId ===
                        t.personalInfo?.staffId
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

  const handleEdit = (record) => {
    const originalData = record.originalData;
    setIsEditing(true);
    setEditingRecord(originalData);
    setEditClass(originalData.class._id);
    setEditSection(originalData.section._id);
    setEditTeachers(originalData.teachers.map((t) => t._id));
    setEditClassTeacher(originalData.classTeacher._id);

    fetch(`${config.API_BASE_URL}/sections?classId=${originalData.class._id}`)
      .then((res) => res.json())
      .then((sectionData) => {
        if (sectionData && sectionData.success && Array.isArray(sectionData.data)) {
          setEditSections(sectionData.data);
        }
      })
      .catch((err) => console.error("Error fetching sections:", err));
  };

  const handleUpdate = () => {
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
    fetch(`${config.API_BASE_URL}/assignTeachers/${editingRecord._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId: editClass,
        sectionId: editSection,
        teachers: editTeachers,
        classTeacher: editClassTeacher,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchRecords();
          cancelEdit();
        } else alert(data.message || "Error updating data");
      })
      .catch((err) => {
        console.error("Error updating data:", err);
        alert("Error updating data");
      });
  };

  const handleDelete = (record) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      const deleteId = String(
        record.id || (record.originalData && record.originalData._id)
      );
      fetch(`${config.API_BASE_URL}/assignTeachers/${deleteId}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) fetchRecords();
          else alert(data.message || "Error deleting data");
        })
        .catch((err) => {
          console.error("Error deleting data:", err);
          alert("Error deleting data");
        });
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

const totalPages = Math.ceil(records.length / recordsPerPage);

const paginatedRecords = records.slice(
  (currentPage - 1) * recordsPerPage,
  currentPage * recordsPerPage
);

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* Add Form Card */}
      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
        <h2 className="text-lg font-semibold mb-4">Assign Class Teacher</h2>
<div className="flex items-center gap-4">

  {/* Class */}
  <div className="flex flex-col">
    <label className="  block mb-2">Class</label>
    <select
      value={selectedClass}
      onChange={(e) => setSelectedClass(e.target.value)}
      className="border px-3 py-2 rounded-md  w-40"
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
    <label className="text-base block mb-2">Section</label>
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
    <label className="text-base block mb-2">Teachers</label>
    <div >
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
      <label className="text-base block mb-2">
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
    <label className="h-8"></label> {/* Same label height for alignment */}
    <button
      onClick={handleSave}
      className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm"
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

          <label className="block  mb-1">
            Class <span className="text-red-500">*</span>
          </label>
          <select
            value={editClass}
            onChange={(e) => {
              setEditClass(e.target.value);
              setEditSection("");
              setEditSections([]);
              if (e.target.value) {
                fetch(`${config.API_BASE_URL}/sections?classId=${e.target.value}`)
                  .then((res) => res.json())
                  .then((sectionData) => {
                    if (sectionData && sectionData.success && Array.isArray(sectionData.data)) {
                      setEditSections(sectionData.data);
                    }
                  })
                  .catch((err) => console.error("Error fetching sections:", err));
              }
            }}
            className="w-full border px-3 py-2 rounded-md mb-4 "
          >
            <option value="">Select Class</option>
            {Array.isArray(classes) &&
              classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
          </select>

          <label className="block  mb-1">
            Section <span className="text-red-500">*</span>
          </label>
          <select
            value={editSection}
            onChange={(e) => setEditSection(e.target.value)}
            className="w-full border px-3 py-2 rounded-md mb-4"
          >
            <option value="">Select Section</option>
            {Array.isArray(editSections) &&
              editSections.map((sec) => (
                <option key={sec._id} value={sec._id}>
                  {sec.name}
                </option>
              ))}
          </select>

          <label className="block  mb-1">
            Teachers <span className="text-red-500">*</span>
          </label>
          <Select
            isMulti
            options={teacherOptions}
            value={teacherOptions.filter((opt) => editTeachers.includes(opt.value))}
            onChange={(selected) => {
              const newTeachers = selected.map((s) => s.value);
              setEditTeachers(newTeachers);
              // Reset class teacher if it's not in the new selection
              if (editClassTeacher && !newTeachers.includes(editClassTeacher)) {
                setEditClassTeacher(null);
              }
            }}
            placeholder="Search & select teachers..."
            className="mb-4"
          />

          {editTeachers.length > 0 && (
            <>
              <label className="block  mb-1">
                Mark Class Teacher <span className="text-red-500">*</span>
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
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleUpdate}
              className="bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Update
            </button>
            <button
              onClick={cancelEdit}
              className="bg-gray-500 text-white px-4 py-2 rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Records List Card */}
      <div className="bg-white p-3 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Class Teacher List</h2>
        <div className="overflow-x-auto">
          <table className="w-full border ">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 border text-left">Class</th>
                <th className="p-2 border text-left">Section</th>
                <th className="p-2 border text-left">Teachers</th>
                <th className="p-2 border text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(records) && records.length > 0 ? (
               paginatedRecords.map((r) => (

                  <tr key={r.id} className="text-center hover:bg-gray-50">
                    <td className="p-2 border text-left  text-gray-800">{r.className}</td>
                    <td className="p-2 border text-left text-gray-700">{r.section}</td>
                    <td className="p-2 border text-left">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(r.teachers) &&
                          r.teachers.map((t, i) => (
                            <span
                              key={i}
                              className={`${
                                t.includes("⭐")
                                  ? "bg-yellow-100 text-yellow-700 font-semibold"
                                  : "bg-green-100 text-green-700"
                              } text-xs px-2 py-1 rounded-full flex items-center gap-1`}
                            >
                              {t.includes("⭐") && <FaStar className="text-yellow-500" />}
                              {t.replace("⭐", "").trim()}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="p-2 border text-center">
                      <button
                        onClick={() => handleEdit(r)}
                        className="text-blue-600 hover:text-blue-800 mx-1"
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
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
                  <td colSpan="4" className="text-center py-4 text-gray-500">
                    No records found.
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
         to="/superadmin/sis/classes-schedules/timetable"
          className="bg-blue-600 text-white px-6 py-2 rounded-md shadow hover:bg-blue-700"
        >
          Next →
        </Link>
      </div>
    </div>
  );
};

export default SuperAdminSISAssignTeacher;
