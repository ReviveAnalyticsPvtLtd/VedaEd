import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import config from "../../../config";

export default function SuperAdminSISAttendanceByClass() {
  const navigate = useNavigate();
  const [backendClasses, setBackendClasses] = useState([]);
  const [rawClassesData, setRawClassesData] = useState([]);
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");

  // Fetch classes from backend
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch(`${config.API_BASE_URL}/classes`);
        if (!response.ok) return;
        const payload = await response.json();
        const list = Array.isArray(payload?.data) ? payload.data : [];
        setRawClassesData(list);
        // Expand each class into entries per section like "Class 1 - A"
        const mapped = list.flatMap((c) => {
          const className = c?.name || "";
          const sections = Array.isArray(c?.sections) ? c.sections : [];
          if (sections.length === 0) {
            return [
              {
                id: c._id,
                name: className,
                homeroom: c?.homeroom || "",
                className,
                sectionName: "",
              },
            ];
          }
          return sections.map((sec) => ({
            id: c._id,
            name: `${className} - ${sec?.name || ""}`.trim(),
            homeroom: c?.homeroom || "",
            className,
            sectionName: sec?.name || "",
          }));
        });
        setBackendClasses(mapped);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };

    fetchClasses();
  }, []);

  // Reset section filter when class changes
  useEffect(() => {
    if (!classFilter) {
      setSectionFilter("");
    }
  }, [classFilter]);

  // Extract unique class names
  const uniqueClassNames = [
    ...new Set(rawClassesData.map((c) => c?.name).filter(Boolean)),
  ].sort();

  // Get sections for selected class
  const availableSections = classFilter
    ? (() => {
        const selectedClass = rawClassesData.find((c) => c?.name === classFilter);
        if (!selectedClass || !Array.isArray(selectedClass.sections)) return [];
        return selectedClass.sections
          .map((sec) => (typeof sec === "object" ? sec?.name : sec))
          .filter(Boolean);
      })()
    : [];

  // Use only backend classes
  const allClasses = backendClasses;

  // 🔍 Filter classes based on Class + Section
  const filteredClasses = allClasses.filter((cls) => {
    const matchesClass = classFilter
      ? cls.className === classFilter
      : true;

    const matchesSection = sectionFilter
      ? cls.sectionName === sectionFilter
      : true;

    return matchesClass && matchesSection;
  });

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Class filter */}
          <div className="flex flex-col">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full border px-3 py-2 rounded-md "
            >
              <option value="">Search Class</option>
              {uniqueClassNames.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>

          {/* Section filter */}
          <div className="flex flex-col">
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              disabled={!classFilter}
              className="w-full border px-3 py-2 rounded-md  disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Search Section</option>
              {availableSections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>

          {/* Date picker */}
          <div className="flex flex-col">
            <input
              type="date"
              placeholder="Search Date"
              className="w-full border px-3 py-2 rounded-md "
            />
          </div>
        </div>
      </div>


      {/* Filtered List */}
      <div className="bg-white p-3 rounded-lg shadow-sm border">
        <div className="space-y-4">
          {filteredClasses.length > 0 ? (
            filteredClasses.map((cls) => (
              <div
                key={`${cls.id}-${cls.sectionName}`}
                onClick={() => {
                  const params = new URLSearchParams({
                    section: cls.sectionName || "",
                    class: cls.className || "",
                  });
                  navigate(`${cls.id}?${params.toString()}`);
                }}
                className="flex items-center p-4 bg-white rounded-lg border hover:bg-gray-50 cursor-pointer transition-all"
              >
                <div className="w-10 h-10 bg-orange-400 rounded-md mr-4"></div>
                <div>
                  <h3 className="">{cls.name}</h3>
                  <p className=" text-gray-500">
                    Homeroom: {cls.homeroom}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm italic">No classes found</p>
          )}
        </div>
      </div>
    </div>
    
  );
}
