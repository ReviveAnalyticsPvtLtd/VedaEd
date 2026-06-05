import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import config from "../../../config";

const SuperAdminSISClasses = () => {
  const [classInput, setClassInput] = useState("");
  const [sectionInput, setSectionInput] = useState("");
  const [searchClass, setSearchClass] = useState("");
  const [searchSection, setSearchSection] = useState("");
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch classes from backend
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch(`${config.API_BASE_URL}/classes`);
        const data = await response.json();
        if (data.success) {
          setClasses(data.data);
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Apply filter button
  const handleApplyFilter = () => {
    setSearchClass(classInput);
    setSearchSection(sectionInput);
  };

  // Filtered Classes
  const filteredClasses = classes
    .map((cls) => {
      // Class filter
      const classMatch =
        searchClass === "" ||
        cls.name.toLowerCase().includes(searchClass.toLowerCase());

      if (!classMatch) return null;

      // Section filter
      let filteredSections = cls.sections || [];
      if (searchSection !== "") {
        filteredSections = (cls.sections || []).filter((sec) =>
          sec.name.toLowerCase().includes(searchSection.toLowerCase())
        );
      }

      if (filteredSections.length === 0) return null;

      return { ...cls, sections: filteredSections };
    })
    .filter(Boolean);

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border">
       {/* Heading */}
    <h3 className="text-lg font-semibold mb-4">Classes List</h3>
    {/* Search + Filter + Add (STAFF STYLE) */}
<div className="flex items-center gap-3 mb-4 w-full">

  {/* Search Class */}
  <div className="flex items-center border px-3 py-2 rounded-md bg-white w-1/4 min-w-[180px]">
    <input
      type="text"
      placeholder="Search class (eg: 1,2,3 etc..)"
      value={classInput}
      onChange={(e) => setClassInput(e.target.value)}
      className="w-full outline-none "
    />
  </div>

  {/* Search Section */}
  <div className="flex items-center border px-3 py-2 rounded-md bg-white w-1/4 min-w-[180px]">
    <input
      type="text"
      placeholder="Search section"
      value={sectionInput}
      onChange={(e) => setSectionInput(e.target.value)}
      className="w-full outline-none "
    />
  </div>

  {/* Apply Button */}
  <button
    onClick={handleApplyFilter}
    className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm"
  >
    Apply
  </button>

  {/* Add Class */}
  <button
    onClick={() => navigate("/superadmin/sis/classes-schedules/add-class")}
    className="ml-auto border border-blue-600 text-blue-600 px-4 py-2 rounded-md text-sm hover:bg-blue-50"
  >
    + Add Class
  </button>

  {/* Add Subject */}
  <button
    onClick={() => navigate("/superadmin/sis/classes-schedules/add-subject")}
    className="border border-blue-600 text-blue-600 px-4 py-2 rounded-md text-sm hover:bg-blue-50"
  >
    + Add Subject
  </button>

</div>

      {/* Class Cards */}
      {loading ? (
        <p className="text-gray-500">Loading classes...</p>
      ) : (
        <>
          {filteredClasses.map((cls) => (
            <div key={cls._id} className="mb-6 bg-white p-4 rounded shadow">
              <h3 className="  mb-4">{cls.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {cls.sections.map((sec) => (
                  <div
                    key={sec._id}
                    className="border rounded p-4 flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-blue-600  ">
                        Section {sec.name}
                      </p>
                      <p className="">
                        Capacity: {cls.capacity || "N/A"}
                      </p>
                     <p>
  Class Teacher: {sec.classTeacher || "N/A"}
</p>
                      <p  className="">Room: N/A</p>
                    </div>
                    <button
  onClick={() =>
    navigate(
      `/superadmin/sis/classes-schedules/class-detail/${cls._id}/${sec._id}`
    )
  }
  className="mt-4 bg-blue-500 text-white px-3 py-2 rounded"
>
  View Details
</button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredClasses.length === 0 && (
            <p className="text-gray-500">No classes found.</p>
          )}
        </>
      )}
    </div>
  );
};

export default SuperAdminSISClasses;
