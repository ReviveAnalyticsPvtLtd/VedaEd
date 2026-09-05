import React, { useMemo, useState, useRef, useEffect  } from "react";
import { FiSearch, FiSave, FiChevronDown } from "react-icons/fi";
import HelpInfo from "../../components/HelpInfo";
import api from "../../services/apiClient";

export default function StaffAttendance() {
  const [activeTab] = useState("overview");
  const [selectedRole, setSelectedRole] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchStaff, setSearchStaff] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [loading, setLoading] = useState(false);
  

  const roles = [
    "Teacher",
    "Admin",
    "Accountant",
    "Librarian",
    "Receptionist",
    "Principal",
  ];

  /* ================= FETCH ================= */
  const handleSearch = async () => {
    setSuccessMsg("");
    if (!attendanceDate) {
      alert("Please select Date");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/staff/attendance/list", {
        params: { date: attendanceDate, role: selectedRole }
      });
      if (res.data.success) {
        setStaffList(res.data.attendance);
      }
    } catch (err) {
      console.error("Error fetching staff attendance:", err);
      alert(err?.response?.data?.message || "Failed to fetch staff list");
    } finally {
      setLoading(false);
      setSelectedStaffIds([]);
    }
  };

  /* ================= ATTENDANCE ================= */
  const handleAttendanceChange = (id, status) => {
    setStaffList((prev) =>
      prev.map((s) => (s._id === id ? { ...s, attendance: status } : s))
    );
  };

  const toggleStaffSelect = (id) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };


  const bulkRef = useRef(null);

  useEffect(() => {
  const handleClickOutside = (e) => {
    if (bulkRef.current && !bulkRef.current.contains(e.target)) {
      setShowBulk(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () =>
    document.removeEventListener("mousedown", handleClickOutside);
}, []);

  const applyBulkAttendance = (status) => {
    if (selectedStaffIds.length === 0) {
      alert("Select staff first");
      return;
    }

    setStaffList((prev) =>
      prev.map((s) =>
        selectedStaffIds.includes(s._id)
          ? { ...s, attendance: status }
          : s
      )
    );
    setShowBulk(false);
  };

  /* ================= SAVE ================= */
  const handleSaveAttendance = async () => {
    if (staffList.length === 0) {
      alert("No attendance to save");
      return;
    }

    const attendanceRecords = staffList
      .filter(s => s.attendance)
      .map(s => ({
        staff: s._id,
        date: attendanceDate,
        status: s.attendance,
        note: s.note || ""
      }));

    if (attendanceRecords.length === 0) {
      alert("No attendance status marked");
      return;
    }

    try {
      const res = await api.post("/staff/attendance/bulk", { attendanceRecords });
      if (res.data.success) {
        setSuccessMsg(`Attendance saved successfully for ${attendanceDate}`);
      }
    } catch (err) {
      console.error("Error saving attendance:", err);
      alert(err?.response?.data?.message || "Failed to save attendance");
    }
  };
const filteredStaffList = useMemo(() => {
  return staffList.filter((s) => {
    const search = searchStaff.toLowerCase();

    return (
      (s.name || "").toLowerCase().includes(search) ||
      (s.staffId || "").toLowerCase().includes(search)
    );
  });
}, [staffList, searchStaff]);
  /* ================= SUMMARY ================= */
  const summary = useMemo(() => {
    const total = staffList.length;
    const c = (s) => staffList.filter((x) => x.attendance === s).length;
    return {
      total,
      present: c("Present"),
      absent: c("Absent"),
      late: c("Late"),
      halfDay: c("Half Day"),
      holiday: c("Holiday"),
      leave: c("Leave"),
    };
  }, [staffList]);

  return (
    <div className="p-0 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Staff Attendance</h2>
        <HelpInfo title="Staff Attendance" />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-4 border-b">
        <button className="pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
          Overview
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <h3 className="text-lg font-semibold mb-3">Select Staff</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="border rounded-md p-2"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search Staff Name / ID"
            value={searchStaff}
            onChange={(e) => setSearchStaff(e.target.value)}
            className="border rounded-md p-2"
          />

          <input
            type="date"
            className="border rounded-md p-2"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
          />

          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2"
          >
            <FiSearch /> Search
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      {staffList.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
          {[
            ["Total", summary.total, "bg-gray-200"],
            ["Present", summary.present, "bg-green-200"],
            ["Absent", summary.absent, "bg-red-200"],
            ["Late", summary.late, "bg-yellow-200"],
            ["Half Day", summary.halfDay, "bg-orange-200"],
            ["Holiday", summary.holiday, "bg-blue-200"],
            ["Leave", summary.leave, "bg-teal-200"],
          ].map(([l, v, c]) => (
            <div key={l} className={`${c} p-4 rounded-lg text-center`}>
              <p className="text-sm font-medium">{l}</p>
              <p className="text-xl font-bold">{v}</p>
            </div>
          ))}
        </div>
      )}

      {/* TABLE */}
      {staffList.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex justify-between mb-3 relative">
            {/* BULK DROPDOWN */}
            <div className="relative" ref={bulkRef}>

              <button
                onClick={() => setShowBulk(!showBulk)}
                className="border px-3 py-2 rounded flex items-center gap-2 text-sm"
              >
                Bulk Action <FiChevronDown />
              </button>

              {showBulk && (
                <div className="absolute left-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-10">
                  {[
                    "Present",
                    "Absent",
                    "Late",
                    "Half Day",
                    "Holiday",
                    "Leave",
                  ].map((s) => (
                    <div
                      key={s}
                      onClick={() => applyBulkAttendance(s)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      Mark {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSaveAttendance}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FiSave /> Save Attendance
            </button>
          </div>

          {successMsg && (
            <div className="text-green-600 mb-2 font-medium">
              {successMsg}
            </div>
          )}

          <table className="w-full border text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="p-2 border"></th>
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaffList.map((s) => (
                <tr key={s._id}>
                  <td className="p-2 border text-center">
                    <input
                      type="checkbox"
                      checked={selectedStaffIds.includes(s._id)}
                      onChange={() => toggleStaffSelect(s._id)}
                    />
                  </td>
                  <td className="p-2 border text-center">{s.staffId}</td>
                  <td className="p-2 border font-medium text-center">{s.name}</td>
                  <td className="p-2 border text-center">
                    {[
                      "Present",
                      "Absent",
                      "Late",
                      "Half Day",
                      "Holiday",
                      "Leave",
                    ].map((st) => (
                      <label key={st} className="mr-2">
                        <input
                          type="radio"
                          checked={s.attendance === st}
                          name={`attendance-${s._id}`}
                          onChange={() =>
                            handleAttendanceChange(s._id, st)
                          }
                        />{" "}
                        {st}
                      </label>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
