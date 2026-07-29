import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../../services/apiClient";

export default function ByStudent() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const statusFilter = queryParams.get("status") || "";

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch all students and daily attendance from backend
  useEffect(() => {
    const fetchStudentsAndAttendance = async () => {
      try {
        const [studentsRes, attendanceRes] = await Promise.all([
          api.get("/students"),
          api.get(`/attendance/date/${date}`),
        ]);

        const studentList = Array.isArray(studentsRes.data?.students) ? studentsRes.data.students : [];
        const attendanceRecords = Array.isArray(attendanceRes.data?.data) ? attendanceRes.data.data : [];

        const mapped = studentList.map((s) => {
          const att = attendanceRecords.find((r) => String(r.student?._id || r.student) === String(s._id));
          return {
            id: s._id,
            name: s?.personalInfo?.name || "",
            grade: `${s?.personalInfo?.class || ""} - ${
              s?.personalInfo?.section || ""
            }`.trim(),
            status: att ? att.status : "Absent",
            time: att ? (att.time || "--") : "--",
          };
        });
        setStudents(mapped);
      } catch (err) {
        console.error("Error fetching students/attendance:", err);
      }
    };

    if (date) {
      fetchStudentsAndAttendance();
    }
  }, [date]);

  const markAttendance = async (id, newStatus) => {
    const updated = students.map((s) =>
      s.id === id
        ? {
            ...s,
            status: newStatus,
            time:
              newStatus === "Absent"
                ? "--"
                : new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
          }
        : s
    );
    setStudents(updated);

    try {
      const attendanceDate = date || new Date().toISOString();
      await api.put(`/attendance/student/${id}`, {
        status: newStatus,
        date: attendanceDate,
      });
    } catch (err) {
      console.error("Error updating attendance:", err);
    }
  };

  const exportReport = () => {
    const headers = ["ID,Name,Grade,Status,Time"];
    const rows = students.map(
      (s) => `${s.id},${s.name},${s.grade},${s.status},${s.time}`
    );
    const csv = [...headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-attendance-${date || "report"}.csv`;
    a.click();
  };
const filtered = students.filter((s) => {
  const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.grade.toLowerCase().includes(search.toLowerCase());
  const matchesStatus = statusFilter ? s.status.toLowerCase() === statusFilter.toLowerCase() : true;
  return matchesSearch && matchesStatus;
});
const indexOfLast = currentPage * itemsPerPage;
const indexOfFirst = indexOfLast - itemsPerPage;
const currentStudents = filtered.slice(indexOfFirst, indexOfLast);

const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
        <h2 className="text-lg font-semibold mb-4">Attendance by Student</h2>

        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4 gap-2">
          <input
            type="text"
            placeholder="Search by name or grade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded-md  w-full md:w-1/3 mb-3 md:mb-0"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border px-3 py-2 rounded-md  w-full md:w-1/4"
          />
          {statusFilter && (
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm">
              <span>Status: {statusFilter}</span>
              <button
                onClick={() => navigate("/admin/attendance/by-student")}
                className="hover:text-blue-900 font-bold ml-1"
              >
                ✕
              </button>
            </div>
          )}
          <button
            onClick={exportReport}
            className="ml-auto mt-3 md:mt-0 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition duration-150 ease-in-out"
          >
            Export Report
          </button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full border ">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 border text-left">Name</th>
                <th className="p-2 border text-left">Grade</th>
                <th className="p-2 border text-left">Status</th>
                <th className="p-2 border text-left">Time</th>
                <th className="p-2 border text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentStudents.map((student) => (

                <tr key={student.id} className="hover:bg-gray-50 transition">
                  <td className="p-2 border text-left">{student.name}</td>
                  <td className="p-2 border text-left">{student.grade}</td>
                  <td
                    className={`p-2 border text-left font-semibold ${
                      student.status === "Present"
                        ? "text-green-600"
                        : student.status === "Absent"
                        ? "text-red-600"
                        : "text-orange-500"
                    }`}
                  >
                    {student.status}
                  </td>
                  <td className="p-2 border text-left">{student.time}</td>
                  <td className="p-2 border text-left space-x-2">
                    <button
                      onClick={() => markAttendance(student.id, "Present")}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition duration-150 ease-in-out"
                    >
                      Present
                    </button>
                    <button
                      onClick={() => markAttendance(student.id, "Absent")}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition duration-150 ease-in-out"
                    >
                      Absent
                    </button>
                    <button
                      onClick={() => markAttendance(student.id, "Late")}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition duration-150 ease-in-out"
                    >
                      Late
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/admin/attendance/by-student/${student.id}`)
                      }
                      className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline ml-2"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-4 text-gray-500 italic"
                  >
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
        
      </div>
      
    </div>
  );
}
