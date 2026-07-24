import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import axios from "../../services/apiClient";
import config from "../../config";

const CollectFees = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    class: "All",
    section: "All",
    keyword: "",
  });

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);

  useEffect(() => {
    // Fetch classes for dropdown
    const fetchMeta = async () => {
       try {
         const cRes = await axios.get(`${config.API_BASE_URL}/classes`);
         if (cRes.data.success) {
            setClasses(cRes.data.data);
         }
       } catch(e) { console.log("Meta fetch failed"); }
    };
    fetchMeta();
  }, []);

  // Update sections when class changes
  useEffect(() => {
    if (filters.class === "All") {
      setAvailableSections([]);
      setFilters(prev => ({ ...prev, section: "All" }));
    } else {
      const selectedClass = classes.find(c => c.name === filters.class);
      if (selectedClass && selectedClass.sections) {
        setAvailableSections(selectedClass.sections);
      } else {
        setAvailableSections([]);
      }
      setFilters(prev => ({ ...prev, section: "All" }));
    }
  }, [filters.class, classes]);

  // 🔥 Dummy Data (Search ke baad load hoga)
  const handleSearch = async () => {
    try {
      const { class: cls, section: sec, keyword } = filters;
      const res = await axios.get(`${config.API_BASE_URL}/students?class=${cls}&section=${sec}&keyword=${keyword}`);
      if (res.data.success) {
        setStudents(res.data.students.map(s => ({
            id: s._id,
            admissionNo: s.personalInfo.stdId,
            class: s.personalInfo.class,
            section: s.personalInfo.section,
            name: s.personalInfo.name,
            father: s.parent?.fatherName || "N/A",
            dob: s.personalInfo.DOB || "N/A",
            mobile: s.personalInfo.contactDetails?.mobileNumber || "N/A"
        })));
      }
    } catch(e) { console.log("Search failed"); }
  };

  return (
    <div className="p-0 min-h-screen">
        {/* Breadcrumb */}
              <div className="text-gray-500 text-sm mb-2 flex gap-1">
                <span>Admin Fees</span> &gt; <span>Collect Fees</span>
              </div>
        
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Collect Fees</h2>
            
              </div>
        
              {/* Tabs */}
              <div className="flex gap-6 text-sm mb-4 border-b">
                <button className="pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
                  Overview
                </button>
              </div>
      {/* 🔹 Select Criteria */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Select Criteria</h2>

        <div className="grid grid-cols-3 gap-4">
          <select
            className="border p-2 rounded"
            value={filters.class}
            onChange={(e) =>
              setFilters({ ...filters, class: e.target.value })
            }
          >
            <option value="All">All Classes</option>
            {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
          </select>

          <select
            className="border p-2 rounded"
            value={filters.section}
            onChange={(e) =>
              setFilters({ ...filters, section: e.target.value })
            }
            disabled={filters.class === "All"}
          >
            <option value="All">All Sections</option>
            {availableSections.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
          </select>

          <input
            type="text"
            placeholder="Search By Student Name, Roll Number..."
            className="border p-2 rounded"
            value={filters.keyword}
            onChange={(e) =>
              setFilters({ ...filters, keyword: e.target.value })
            }
          />
        </div>

        <div className="mt-4">
          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FiSearch /> Search
          </button>
        </div>
      </div>

      {/* 🔹 Student List */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Student List</h2>

        {students.length === 0 ? (
          <p className="text-center text-gray-400">
            No data available in table
          </p>
        ) : (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Class</th>
                <th className="p-2">Section</th>
                <th className="p-2">Admission No</th>
                <th className="p-2">Student Name</th>
                <th className="p-2">Father Name</th>
                <th className="p-2">Date Of Birth</th>
                <th className="p-2">Mobile No.</th>
                <th className="p-2 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {students.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-2">{item.class}</td>
                  <td className="p-2">{item.section}</td>
                  <td className="p-2">{item.admissionNo}</td>

                  {/* 🔥 clickable name */}
                  <td
                    className="p-2 text-blue-600 cursor-pointer"
                    onClick={() =>
                      navigate(`/admin/collect-fees/${item.id}`, {
                        state: item,
                      })
                    }
                  >
                    {item.name}
                  </td>

                  <td className="p-2">{item.father}</td>
                  <td className="p-2">{item.dob}</td>
                  <td className="p-2">{item.mobile}</td>

                  <td className="p-2 text-center">
                  <button
  onClick={() =>
    navigate(`/admin/fees/collect-fees/${item.id}`, {
      state: item,
    })
  }
  className="bg-blue-500 text-white px-3 py-1 rounded"
>
  Collect Fees
</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CollectFees;