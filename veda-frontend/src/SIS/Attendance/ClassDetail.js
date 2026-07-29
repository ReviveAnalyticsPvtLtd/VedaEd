import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import config from "../../config";
import { authFetch } from "../../services/apiClient";

export default function ClassDetail() {
  const { id } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const selectedClassName = query.get("class") || "";
  const selectedSectionName = query.get("section") || "";
  const initialDate = query.get("date") || new Date().toISOString().substring(0, 10);

  const [sectionId, setSectionId] = useState(query.get("sectionId") || "");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [students, setStudents] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [loading, setLoading] = useState(false);

  // Resolve sectionId if missing from query parameters
  useEffect(() => {
    if (!sectionId && selectedSectionName) {
      const resolveSectionId = async () => {
        try {
          const res = await authFetch(`/classes`);
          if (res.ok) {
            const payload = await res.json();
            const list = Array.isArray(payload?.data) ? payload.data : [];
            const clsData = list.find((c) => c._id === id);
            if (clsData && Array.isArray(clsData.sections)) {
              const sec = clsData.sections.find(
                (s) => String(s.name || s).toLowerCase() === selectedSectionName.toLowerCase()
              );
              if (sec) {
                setSectionId(sec._id);
              }
            }
          }
        } catch (err) {
          console.error("Error resolving sectionId:", err);
        }
      };
      resolveSectionId();
    }
  }, [sectionId, selectedSectionName, id]);

  // Fetch students and merge with attendance records for the selected date
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch students for this class/section
        const studentsResponse = await authFetch(`/students`);
        if (!studentsResponse.ok) return;
        const studentsPayload = await studentsResponse.json();
        const studentList = Array.isArray(studentsPayload?.students) ? studentsPayload.students : [];
        const filteredStudents = studentList.filter((s) => {
          const className = String(s?.personalInfo?.class || "").toLowerCase();
          const sectionName = String(s?.personalInfo?.section || "").toLowerCase();
          const classMatch = selectedClassName
            ? className === String(selectedClassName).toLowerCase()
            : className.includes(String(id).toLowerCase());
          const sectionMatch = selectedSectionName
            ? sectionName === String(selectedSectionName).toLowerCase()
            : true;
          return classMatch && sectionMatch;
        });

        // 2. Fetch existing daily attendance records if sectionId is resolved
        let attendanceRecords = [];
        if (sectionId && selectedDate) {
          try {
            const attResponse = await authFetch(`/attendance/class/${id}/${sectionId}/${selectedDate}`);
            if (attResponse.ok) {
              const attPayload = await attResponse.json();
              attendanceRecords = Array.isArray(attPayload?.data) ? attPayload.data : [];
            }
          } catch (err) {
            console.error("Error fetching class attendance:", err);
          }
        }

        // 3. Map students and default status/time if no attendance was saved
        const mapped = filteredStudents.map((s) => {
          const record = attendanceRecords.find(
            (r) => String(r.student?._id || r.student) === String(s._id)
          );
          return {
            id: s._id,
            name: s?.personalInfo?.name || "",
            roll: s?.personalInfo?.rollNo || s?.personalInfo?.rollno || "",
            status: record ? record.status : "Absent",
            time: record ? (record.time || "--") : "--",
          };
        });

        setStudents(mapped);
      } catch (error) {
        console.error("Error loading daily attendance roster:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, sectionId, selectedDate, selectedClassName, selectedSectionName]);

  const handleAttendanceChange = async (studentId, newStatus) => {
    const updatedStudents = students.map((s) =>
      s.id === studentId
        ? {
            ...s,
            status: newStatus,
            time:
              newStatus === "Present" || newStatus === "Late"
                ? new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--",
          }
        : s
    );
    setStudents(updatedStudents);

    // Immediate update for student's attendance on selected date
    try {
      const formattedDate = new Date(selectedDate).toISOString();
      await authFetch(`/attendance/student/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, date: formattedDate }),
      });
    } catch (error) {
      console.error("Error updating student attendance:", error);
    }
  };


  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedStudents = [...students].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setStudents(sortedStudents);
  };

  const handleExport = () => {
    const header = ["Roll No", "Name", "Status", "Time"];
    const rows = students.map((s) => [s.roll, s.name, s.status, s.time]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [header, ...rows].map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `class_${id}_attendance.csv`;
    link.click();
  };

  const handleSaveAttendance = async () => {
    if (!sectionId) {
      alert("Cannot save attendance: section ID is missing.");
      return;
    }
    try {
      const records = students.map((s) => ({
        studentId: s.id,
        status: s.status,
        time: s.time,
      }));

      const res = await authFetch(`/attendance/class`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: id,
          sectionId,
          date: selectedDate,
          records,
        }),
      });

      if (res.ok) {
        alert("Attendance saved successfully!");
      } else {
        const errorData = await res.json();
        alert(`Failed to save attendance: ${errorData.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error saving class attendance:", err);
      alert("Error saving attendance to backend.");
    }
  };

  return (
    <div className="p-0">
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/admin/attendance" className="hover:underline">
          Attendance
        </Link>{" "}
        ›{" "}
        <Link to="/admin/attendance/by-class" className="hover:underline">
          By Class
        </Link>{" "}
        › <span className="text-gray-700 font-medium">
  {selectedClassName} {selectedSectionName}
</span>
      </nav>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h1 className="text-2xl font-bold text-gray-700">
          {selectedClassName} {selectedSectionName} - Attendance
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-600">Select Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <p className="text-gray-500">Present</p>
          <h2 className="text-xl font-bold text-green-600">
            {students.filter((s) => s.status === "Present").length}
          </h2>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <p className="text-gray-500">Absent</p>
          <h2 className="text-xl font-bold text-red-600">
            {students.filter((s) => s.status === "Absent").length}
          </h2>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <p className="text-gray-500">Late</p>
          <h2 className="text-xl font-bold text-orange-500">
            {students.filter((s) => s.status === "Late").length}
          </h2>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg p-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">S.No</th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort("roll")}>
                Roll No
              </th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort("name")}>
                Student Name
              </th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort("status")}>
                Status
              </th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort("time")}>
                Time
              </th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, index) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{index + 1}</td>
                <td className="p-2">{s.roll}</td>
                <td className="p-2">{s.name}</td>
                <td
                  className={`p-2 font-semibold ${s.status === "Present"
                      ? "text-green-600"
                      : s.status === "Absent"
                        ? "text-red-600"
                        : "text-orange-500"
                    }`}
                >
                  {s.status}
                </td>
                <td className="p-2">{s.time}</td>
                <td className="p-2">
                  <select
                    value={s.status}
                    onChange={(e) => handleAttendanceChange(s.id, e.target.value)}
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    <option>Present</option>
                    <option>Absent</option>
                    <option>Late</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Buttons */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={handleSaveAttendance}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow transition duration-150 ease-in-out"
        >
          Save Attendance
        </button>
        <button
          onClick={handleExport}
          className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-sm rounded-lg shadow-sm transition duration-150 ease-in-out"
        >
          Export Report
        </button>
      </div>
    </div>
  );
}
