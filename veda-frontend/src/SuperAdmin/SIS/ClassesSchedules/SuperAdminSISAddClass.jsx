import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { utils, writeFile } from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import config from "../../../config";
import {  useNavigate } from "react-router-dom";


const SuperAdminSISAddClass = () => {
  const [classes, setClasses] = useState([]);
  const [className, setClassName] = useState("");
  const [classNameError, setClassNameError] = useState("");
  const [selectedSections, setSelectedSections] = useState([]);
  const [sections, setSections] = useState([]);
  const [newSection, setNewSection] = useState("");
  const [editId, setEditId] = useState(null);

  // ✅ Fetch sections and classes when component loads
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sections
        const secRes = await axios.get(`${config.API_BASE_URL}/sections`);
        console.log("fetch sections:", secRes);
        if (secRes.data.success) {
          setSections(secRes.data.data.map((s) => s.name));
        }

        // Fetch classes
        const classRes = await axios.get(`${config.API_BASE_URL}/classes`);
        console.log("fetch Classes:", classRes);
        if (classRes.data.success) {
          const formatted = classRes.data.data.map((c) => ({
            id: c._id,
            name: c.name,
            sections: c.sections.map((s) => s.name),
          }));
          setClasses(formatted);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  // Add / Update class
  // const handleSaveClass = async () => {
  //   if (!className) return alert("Class name required!");
  //   if (selectedSections.length === 0)
  //     return alert("Select at least one section!");

  //   try {
  //     // Step 1: Create sections in backend (only new ones)
  //     const sectionIds = [];
  //     for (let sec of selectedSections) {
  //       const res = await axios.post(`${config.API_BASE_URL}/sections`, {
  //         name: sec,
  //       });
  //       console.log("add sections:", res);
  //       if (res.data.success) {
  //         sectionIds.push(res.data.data._id);
  //       }
  //     }

  //     // Step 2: Create class in backend
  //     const classRes = await axios.post(`${config.API_BASE_URL}/classes`, {
  //       name: className,
  //       sections: sectionIds,
  //       capacity: "60",
  //     });
  //       console.log("Create class:", classRes);

  //     if (classRes.data.success) {
  //       const newClass = {
  //         id: classRes.data.data._id,
  //         name: classRes.data.data.name,
  //         sections: classRes.data.data.sections.map((s) => s.name),
  //       };
  //       setClasses([...classes, newClass]);
  //     }
  //   } catch (error) {
  //     console.error("Error creating class:", error);
  //     alert("Failed to save class!");
  //   }

  //   setClassName("");
  //   setSelectedSections([]);
  //   setEditId(null);
  // };
const navigate = useNavigate();
 const isValidClassName = (value) => {
  const trimmed = value.trim();
  // ONLY: "Class " + number
  const exactPattern = /^Class\s+[0-9]+$/;
  return exactPattern.test(trimmed);
};

  const handleSaveClass = async () => {
    if (!className) return alert("Class name required!");
    if (!isValidClassName(className)) {
      setClassNameError(
        "Class Name must be in format: Class 1 or Grade 1."
      );
      return;
    }
    setClassNameError("");
    if (selectedSections.length === 0)
      return alert("Select at least one section!");

    try {
      // Step 1: Create sections in backend (only new ones or reuse existing)
      const sectionIds = [];

      for (let sec of selectedSections) {
        try {
          const res = await axios.post(`${config.API_BASE_URL}/sections`, {
            name: sec,
          });
          if (res.data.success) {
            sectionIds.push(res.data.data._id);
          }
        } catch (err) {
          if (err.response && err.response.status === 409) {
            // Section already exists → fetch it instead of failing
            try {
              // Use the existing GET endpoint with name parameter
              const existing = await axios.get(
                `${config.API_BASE_URL}/sections?name=${encodeURIComponent(
                  sec
                )}`
              );
              if (existing.data.success && existing.data.data.length > 0) {
                sectionIds.push(existing.data.data[0]._id);
              } else {
                console.error(
                  `Section "${sec}" exists but couldn't be fetched`
                );
                alert(`Failed to find existing section: ${sec}`);
                return;
              }
            } catch (searchErr_1) {
              console.error(
                "Error searching for existing section:",
                searchErr_1
              );
              alert(`Failed to find existing section: ${sec}`);
              return;
            }
          } else {
            console.error("Error creating section:", err);
            alert(`Failed to create section: ${sec}`);
            return; // stop flow if unknown error
          }
        }
      }

      // Step 2: Create or Update class in backend
      try {
        let classRes;
        if (editId) {
          // Update existing class
          classRes = await axios.put(
            `${config.API_BASE_URL}/classes/${editId}`,
            {
              name: className,
              sections: sectionIds,
              capacity: "60",
            }
          );
        } else {
          // Create new class
          classRes = await axios.post(`${config.API_BASE_URL}/classes`, {
            name: className,
            sections: sectionIds,
            capacity: "60",
          });
        }

        if (classRes.data.success) {
          const classData = {
            id: classRes.data.data._id,
            name: classRes.data.data.name,
            sections: classRes.data.data.sections.map((s) => s.name),
          };

          if (editId) {
            // Update existing class in state
            setClasses(classes.map((c) => (c.id === editId ? classData : c)));
            alert("Class updated successfully!");
          } else {
            // Add new class to state
            setClasses([...classes, classData]);
            alert("Class created successfully!");
          }
        }
      } catch (err) {
        if (err.response && err.response.status === 409) {
          alert("Class already exists! Please use another name.");
        } else {
          console.error("Error saving class:", err);
          alert("Failed to save class!");
        }
        return;
      }
    } catch (error) {
      console.error("Error saving class:", error);
      if (error.response) {
        // Server responded with error status
        alert(
          `Server error: ${
            error.response.data?.message || "Unknown server error"
          }`
        );
      } else if (error.request) {
        // Request was made but no response received
        alert(
          "Network error: Could not connect to server. Please check if the backend is running."
        );
      } else {
        // Something else happened
        alert("Unexpected error while saving class!");
      }
    }

    // Reset form
    setClassName("");
    setSelectedSections([]);
    setEditId(null);
  };

  // Add new section (save to backend)
  const handleAddSection = async () => {
    if (!newSection) return;
    if (sections.includes(newSection)) return alert("Already exists!");

    try {
      const res = await axios.post(`${config.API_BASE_URL}/sections`, {
        name: newSection,
      });

      if (res.data.success) {
        alert("Section created successfully!");
        setSections([...sections, newSection]);
        setNewSection("");
        // Refresh sections from backend to get the latest data
        const secRes = await axios.get(`${config.API_BASE_URL}/sections`);
        if (secRes.data.success) {
          setSections(secRes.data.data.map((s) => s.name));
        }
      }
    } catch (error) {
      console.error("Error creating section:", error);
      if (error.response?.status === 409) {
        alert("Section already exists!");
      } else {
        alert(error.response?.data?.message || "Failed to create section");
      }
    }
  };

  // Delete section
  const handleDeleteSection = async (sectionName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete section "${sectionName}"?`
      )
    ) {
      return;
    }

    try {
      // First, find the section ID by name
      const searchRes = await axios.get(
        `${config.API_BASE_URL}/sections?name=${sectionName}`
      );

      if (searchRes.data.success && searchRes.data.data.length > 0) {
        const sectionId = searchRes.data.data[0]._id;

        // Delete the section
        const deleteRes = await axios.delete(
          `${config.API_BASE_URL}/sections/${sectionId}`
        );

        if (deleteRes.data.success) {
          alert("Section deleted successfully!");
          // Refresh sections from backend
          const secRes = await axios.get(`${config.API_BASE_URL}/sections`);
          if (secRes.data.success) {
            setSections(secRes.data.data.map((s) => s.name));
          }
        }
      } else {
        alert("Section not found!");
      }
    } catch (error) {
      console.error("Error deleting section:", error);
      if (error.response?.status === 404) {
        alert("Section not found!");
      } else if (error.response?.status === 400) {
        alert("Cannot delete section. It may be in use by classes.");
      } else {
        alert(error.response?.data?.message || "Failed to delete section");
      }
    }
  };

  // Delete class
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        const res = await axios.delete(
          `${config.API_BASE_URL}/classes/${id}`
        );
        if (res.data.success) {
          alert(res.data.message);
          // Remove from frontend state
          setClasses(classes.filter((c) => c.id !== id));
        }
      } catch (error) {
        console.error("Error deleting class:", error);
        alert(error.response?.data?.message || "Failed to delete class");
      }
    }
  };

  // Edit class
  const handleEdit = (cls) => {
    setClassName(cls.name);
    setClassNameError("");
    setSelectedSections(cls.sections);
    setEditId(cls.id);
  };

  // Export Excel
  const exportExcel = () => {
    const ws = utils.json_to_sheet(
      classes.map((c) => ({ Class: c.name, Sections: c.sections.join(", ") }))
    );
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Classes");
    writeFile(wb, "classes.xlsx");
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Class List", 14, 15);
    autoTable(doc, {
      head: [["Class", "Sections"]],
      body: classes.map((c) => [c.name, c.sections.join(", ")]),
    });
    doc.save("classes.pdf");
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      <nav className="text-sm mb-4">
        <ol className="flex text-gray-600">
          
          <li>
            <Link
              to="/superadmin/sis/classes-schedules/classes"
              className="text-gray-600 hover:underline"
            >
              Classes & Schedules
            </Link>
          </li>
          <li className="mx-2"></li>
          <li className="text-gray-600 ">Add Class & Section</li>
        </ol>
      </nav>
 <h2 className="text-xl font-semibold mb-4">Add Class & Section</h2>
     

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Add Class */}
        <div className="bg-white shadow p-4 rounded">
          <h3 className="text-lg  font-semibold mb-4">
            {editId ? "Edit Class" : "Add Class"}
          </h3>
          <label className="text-base block mb-2">Class Name*</label>
        <input
  value={className}
  onChange={(e) => {
    const value = e.target.value;
    setClassName(value);

    if (!value.trim()) {
      setClassNameError("");
    } else if (!isValidClassName(value)) {
      setClassNameError(
        "Invalid format. Use: Class 1 (C capital, rest small)"
      );
    } else {
      setClassNameError("");
    }
  }}
  placeholder="Class 1"
  className={`w-full border px-2 py-1 rounded ${
    classNameError ? "border-red-500" : ""
  }`}
/>
          {classNameError && (
            <p className="text-red-600 text-sm mt-1 mb-3">{classNameError}</p>
          )}
          {!classNameError && <div className="mb-3" />}
          <label className="text-base block mb-2">Sections*</label>
          <div className="flex flex-wrap gap-3 mb-3">
            {sections.map((sec) => (
              <label key={sec} className=" flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedSections.includes(sec)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSections([...selectedSections, sec]);
                    } else {
                      setSelectedSections(
                        selectedSections.filter((s) => s !== sec)
                      );
                    }
                  }}
                />
                {sec}
              </label>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSaveClass}
              className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
            >
              {editId ? "Update" : "Save"}
            </button>
            {editId && (
              <button
                onClick={() => {
                  setClassName("");
                  setClassNameError("");
                  setSelectedSections([]);
                  setEditId(null);
                }}
                className="bg-gray-500 text-white px-4 py-1 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Add Section */}
        <div className="bg-white shadow p-4 rounded">
          <h3 className="text-lg font-semibold mb-4">Add Section</h3>
          <label className="text-base block mb-2">Section name*</label>
          <div className="flex gap-2 mb-3">
            <input
              value={newSection}
              onChange={(e) => setNewSection(e.target.value.toUpperCase())}
              placeholder="Enter new section"
              className="flex-1 border px-2 py-1 rounded"
            />
            <button
              onClick={handleAddSection}
              className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
            >
              Save
            </button>
          </div>
          <h4 className=" mb-2">Sections List</h4>
          <ul className="border p-2 rounded max-h-40 overflow-y-auto">
            {sections.map((sec, i) => (
              <li key={i} className="py-1 flex items-center justify-between">
                <span>{sec}</span>
                <button
                  onClick={() => handleDeleteSection(sec)}
                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                  title="Delete section"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Class List */}
      <div className="bg-white shadow mt-4 p-4 rounded">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Class List</h3>
          <div className="flex gap-3">
            <button
              onClick={exportExcel}
              className="bg-green-600 text-white px-3 py-1 rounded-md text-sm"
            >
              Export Excel
            </button>
            <button
              onClick={exportPDF}
              className="bg-red-600 text-white px-3 py-1 rounded-md text-sm"
            >
              Export PDF
            </button>
          </div>
        </div>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Class</th>
              <th className="border px-2 py-1">Sections</th>
              <th className="border px-2 py-1">Action</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id}>
                <td className="border px-2 py-1">{c.name}</td>
                <td className="border px-2 py-1">{c.sections.join(", ")}</td>
                <td className="border px-2 py-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(c)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center py-3 text-gray-500">
                  No classes added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
     to="/superadmin/sis/classes-schedules/add-subject"
    className="bg-blue-600 text-white px-6 py-2 rounded-md shadow hover:bg-blue-700"
  >
    Next →
  </Link>
</div>


      
    </div>
  );
};

export default SuperAdminSISAddClass;
