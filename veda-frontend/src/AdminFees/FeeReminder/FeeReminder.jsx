import React, { useState, useEffect } from "react";
import { FiSearch, FiBell } from "react-icons/fi";
import axios from "axios";
import config from "../../config";

export default function FeeReminder() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("All");
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, setMessage] = useState(
    "Dear Parent, this is a reminder that the school fees for your ward are currently outstanding. Please clear the pending dues at the earliest. Thank you!"
  );
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

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

  const fetchDues = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${config.API_BASE_URL}/fees/collect/dues?class=${selectedClass}&section=All`
      );
      setStudents(res.data);
      setSelectedIds([]);
    } catch (err) {
      console.error("Failed to fetch dues", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchDues();
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(students.map((s) => s.student.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSendReminder = async () => {
    if (selectedIds.length === 0) return alert("Please select at least one student!");
    if (!message.trim()) return alert("Reminder message cannot be empty!");

    try {
      setSending(true);
      alert(`Reminders successfully sent to parents of ${selectedIds.length} students!`);
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      alert("Failed to send reminders");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-0 min-h-screen">
      <div className="text-gray-500 text-sm mb-2 flex gap-1">
        <span>Admin Fees</span> &gt; <span>Send Reminders</span>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Fee Due Reminders</h2>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left Form: Message Configuration */}
        <div className="col-span-4 bg-white p-4 rounded shadow h-fit">
          <h3 className="text-lg font-semibold mb-4">Message Setup</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Reminder Message Template</label>
              <textarea
                rows="6"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full mt-1 border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              onClick={handleSendReminder}
              disabled={sending || selectedIds.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded flex items-center justify-center gap-2"
            >
              <FiBell />
              {sending ? "Sending..." : `Send Reminders (${selectedIds.length})`}
            </button>
          </div>
        </div>

        {/* Right Panel: Student List */}
        <div className="col-span-8 bg-white p-4 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Select Outstanding Students</h3>
            <div className="flex gap-2">
              <select
                className="border p-2 rounded text-sm w-48"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="All">All Classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSearch}
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                <FiSearch />
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 py-4">Loading dues...</p>
          ) : students.length === 0 ? (
            <p className="text-center text-gray-400 py-4">No outstanding balance students found.</p>
          ) : (
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={students.length > 0 && selectedIds.length === students.length}
                    />
                  </th>
                  <th className="p-2">Student Name</th>
                  <th className="p-2">Class</th>
                  <th className="p-2">Admission No</th>
                  <th className="p-2">Balance Due</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.student.id} className="border-t">
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(s.student.id)}
                        onChange={() => handleSelect(s.student.id)}
                      />
                    </td>
                    <td className="p-2 font-semibold text-blue-600">{s.student.name}</td>
                    <td className="p-2">
                      {s.student.class} ({s.student.section})
                    </td>
                    <td className="p-2">{s.student.admission}</td>
                    <td className="p-2 text-red-600 font-bold">₹{s.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
