import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiDownload } from "react-icons/fi";
import axios from "axios";
import config from "../../config";

export default function CashierSearchFeesDue() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [filters, setFilters] = useState({
    class: "All",
    section: "All",
  });
  const [dueList, setDueList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${config.API_BASE_URL}/classes`);
        if (res.data.success) {
          setClasses(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch classes", err);
      }
    };
    fetchClasses();
    fetchDues();
  }, []);

  useEffect(() => {
    if (filters.class === "All") {
      setSections([]);
      setFilters((prev) => ({ ...prev, section: "All" }));
    } else {
      const selectedClass = classes.find((c) => c.name === filters.class);
      if (selectedClass && selectedClass.sections) {
        setSections(selectedClass.sections);
      } else {
        setSections([]);
      }
      setFilters((prev) => ({ ...prev, section: "All" }));
    }
  }, [filters.class, classes]);

  const fetchDues = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${config.API_BASE_URL}/fees/collect/dues?class=${filters.class}&section=${filters.section}`
      );
      setDueList(res.data);
    } catch (err) {
      console.error("Failed to fetch dues", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchDues();
  };

  const handleExport = () => {
    const csv = [
      ["Student Name", "Class", "Admission No", "Expected Fee", "Paid Fee", "Balance Due", "Mobile"],
      ...dueList.map((d) => [
        d.student.name,
        `${d.student.class} (${d.student.section})`,
        d.student.admission,
        d.totalExpected,
        d.totalPaid,
        d.balance,
        d.student.mobile,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "due-fees-report.csv";
    a.click();
  };

  return (
    <div className="p-0 min-h-screen">
      <div className="text-gray-500 text-sm mb-2 flex gap-1">
        <span>Admin Fees</span> &gt; <span>Search Due</span>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Search Due Fees</h2>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Select Criteria</h2>
        <div className="grid grid-cols-2 gap-4">
          <select
            className="border p-2 rounded"
            value={filters.class}
            onChange={(e) => setFilters({ ...filters, class: e.target.value })}
          >
            <option value="All">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="border p-2 rounded"
            value={filters.section}
            onChange={(e) => setFilters({ ...filters, section: e.target.value })}
            disabled={filters.class === "All"}
          >
            <option value="All">All Sections</option>
            {sections.map((s) => (
              <option key={s._id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
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

      <div className="bg-white p-4 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Outstanding Due List</h2>
          {dueList.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 text-sm bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200"
            >
              <FiDownload /> Export CSV
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-4">Loading outstanding dues...</p>
        ) : dueList.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No outstanding dues found</p>
        ) : (
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Student Name</th>
                <th className="p-2">Class</th>
                <th className="p-2">Admission No</th>
                <th className="p-2">Total Expected</th>
                <th className="p-2">Total Paid</th>
                <th className="p-2">Balance Due</th>
                <th className="p-2">Mobile No</th>
                <th className="p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {dueList.map((d) => (
                <tr key={d.student.id} className="border-t">
                  <td className="p-2 font-semibold text-blue-600">{d.student.name}</td>
                  <td className="p-2">
                    {d.student.class} ({d.student.section})
                  </td>
                  <td className="p-2">{d.student.admission}</td>
                  <td className="p-2">₹{d.totalExpected}</td>
                  <td className="p-2 text-green-600 font-semibold">₹{d.totalPaid}</td>
                  <td className="p-2 text-red-600 font-bold">₹{d.balance}</td>
                  <td className="p-2">{d.student.mobile}</td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() =>
                        navigate(`/admin/fees/collect-fees/${d.student.id}`, {
                          state: {
                            id: d.student.id,
                            admissionNo: d.student.admission,
                            class: d.student.class,
                            section: d.student.section,
                            name: d.student.name,
                            mobile: d.student.mobile,
                          },
                        })
                      }
                      className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
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
}
