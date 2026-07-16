import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiTrash2, FiUser, FiSend } from "react-icons/fi";
import { studentAPI } from "../../services/studentAPI";
import staffAPI from "../../services/staffAPI";
import { parentAPI } from "../../services/parentAPI";
import CommunicationAPI from "../communicationAPI";

export default function Individual() {
  const [selectedType, setSelectedType] = useState("app"); // default channel
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("Information");
  const [sendOption, setSendOption] = useState("now");
  const [scheduleDate, setScheduleDate] = useState("");

  // Targets
  const [role, setRole] = useState("Student");
  const [search, setSearch] = useState("");
  const [addedList, setAddedList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // Data cache
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [parents, setParents] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);
  }, []);

  // Fetch users depending on chosen role
  useEffect(() => {
    const loadRoleData = async () => {
      try {
        if (role === "Student" && students.length === 0) {
          const res = await studentAPI.getAllStudents();
          const list = res.students || res || [];
          setStudents(list);
        } else if (role === "Teacher" && teachers.length === 0) {
          const res = await staffAPI.getAllStaff();
          const list = res.staff || res || [];
          const filteredTeachers = list.filter(s => {
            const r = s.personalInfo?.role || "";
            const d = s.personalInfo?.designation || "";
            return r.toLowerCase() === "teacher" || d.toLowerCase().includes("teacher");
          });
          setTeachers(filteredTeachers);
        } else if (role === "Parent" && parents.length === 0) {
          const res = await parentAPI.getAllParents();
          const list = res.parents || res || [];
          setParents(list);
        }
      } catch (err) {
        console.error("Failed to load users for individual selection:", err);
      }
    };
    loadRoleData();
    setSearch("");
    setSuggestions([]);
  }, [role, students.length, teachers.length, parents.length]);

  const handleSearch = (val) => {
    setSearch(val);
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }

    const term = val.toLowerCase();
    let source = [];
    if (role === "Student") source = students;
    else if (role === "Teacher") source = teachers;
    else if (role === "Parent") source = parents;

    const filtered = source.map(item => {
      let id = item._id;
      let name = "";
      let extra = "";

      if (role === "Student") {
        name = item.personalInfo?.fullName || item.personalInfo?.name || "N/A";
        extra = `Class: ${item.academicInfo?.class || "N/A"}`;
      } else if (role === "Teacher") {
        name = item.personalInfo?.name || "N/A";
        extra = `Role: ${item.personalInfo?.role || "Teacher"}`;
      } else if (role === "Parent") {
        name = item.fatherInfo?.fatherName || item.motherInfo?.motherName || item.name || "N/A";
        extra = `Parent ID: ${item.parentId || "N/A"}`;
      }

      return { id, name, extra };
    }).filter(p => p.name.toLowerCase().includes(term));

    setSuggestions(filtered.slice(0, 10)); // Limit to 10 suggestions
  };

  const handleAdd = (person) => {
    if (!addedList.some(a => a.id === person.id)) {
      setAddedList([...addedList, { ...person, role }]);
    }
    setSearch("");
    setSuggestions([]);
  };

  const handleDelete = (id) => {
    setAddedList(addedList.filter(item => item.id !== id));
  };

  const canSubmit = () => {
    return title.trim().length > 0 && message.trim().length > 0 && addedList.length > 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!canSubmit() || isLoading) return;

    setIsLoading(true);
    try {
      const authorId = (currentUser?.role?.toLowerCase() === "admin" || currentUser?.role?.toLowerCase() === "superadmin")
        ? currentUser?._id
        : currentUser?.refId || currentUser?._id || "68c1b2977fa6e0a4c8af3242";
      const authorModel = currentUser?.role?.toLowerCase() === "teacher" 
        ? "Teacher" 
        : (currentUser?.role?.toLowerCase() === "admin" || currentUser?.role?.toLowerCase() === "superadmin")
        ? "Admin"
        : "Staff";

      const publishDateVal = sendOption === "schedule" && scheduleDate
        ? new Date(scheduleDate).toISOString()
        : new Date().toISOString();

      const specificTargets = addedList.map(item => item.id);

      const notificationData = {
        title: title.trim(),
        description: message.trim(),
        type,
        audience: role.toLowerCase() + "s",
        specificTargets,
        specificTargetModel: role,
        createdBy: authorId,
        createdByModel: authorModel,
        channels: [selectedType],
        publishDate: publishDateVal,
        status: sendOption === "schedule" ? "scheduled" : "sent"
      };

      await CommunicationAPI.createNotification(notificationData);
      
      alert(sendOption === "schedule"
        ? "Individual notification scheduled successfully!"
        : "Individual notification sent successfully!"
      );
      
      setAddedList([]);
      setTitle("");
      setMessage("");
    } catch (error) {
      console.error("Error sending individual notification:", error);
      alert(`Failed to send notification: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-0 m-0 space-y-6">
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiSend className="text-blue-600" /> Send Personalized Individual Notification
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Notification Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Notification Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Notification Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Information">Information Broadcast</option>
                <option value="Reminder">Reminder Alert</option>
                <option value="Urgent">Urgent Notification</option>
                <option value="Academic">Academic Notice</option>
                <option value="Examination">Examination Alert</option>
                <option value="Fee Related">Fee Reminder</option>
                <option value="Transport Related">Transport Update</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Delivery Channel */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Preferred Channel
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="app">Mobile App Notification</option>
                <option value="email">Email Notification</option>
                <option value="sms">SMS Notification</option>
                <option value="whatsapp">WhatsApp Notification</option>
              </select>
            </div>
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Message Content <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              placeholder="Type personalized message here..."
              required
            ></textarea>
          </div>

          {/* Message To Lookup */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Add Recipient (Search by name) <span className="text-red-500">*</span>
            </label>
            
            <div className="flex gap-2">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="Student">Student</option>
                <option value="Parent">Parent</option>
                <option value="Teacher">Teacher</option>
              </select>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={`Search ${role.toLowerCase()} by name...`}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <FiSearch className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>

            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <div className="border border-gray-200 bg-white rounded-lg mt-1.5 max-h-48 overflow-y-auto divide-y shadow-sm">
                {suggestions.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleAdd(p)}
                    className="px-4 py-2.5 text-sm text-gray-700 cursor-pointer hover:bg-blue-50/50 flex justify-between items-center"
                  >
                    <div>
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-gray-400 text-xs ml-2">({p.extra})</span>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">Add +</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Added list */}
          {addedList.length > 0 && (
            <div className="bg-gray-50 border border-gray-150 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipients ({addedList.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {addedList.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs shadow-sm"
                  >
                    <div className="flex items-center gap-1.5">
                      <FiUser className="text-gray-400" />
                      <span>
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-gray-400 text-[10px] ml-1.5">({p.extra})</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduling & Submit */}
          <div className="border-t border-gray-100 pt-4 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
              <input
                type="radio"
                name="sendOption"
                value="now"
                checked={sendOption === "now"}
                onChange={() => setSendOption("now")}
                className="w-4 h-4 text-blue-600"
              />
              Send Immediately
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
              <input
                type="radio"
                name="sendOption"
                value="schedule"
                checked={sendOption === "schedule"}
                onChange={() => setSendOption("schedule")}
                className="w-4 h-4 text-blue-600"
              />
              Schedule for Later
            </label>

            {sendOption === "schedule" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Date & Time:</span>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit() || isLoading}
              className={`px-6 py-2 rounded-lg font-semibold text-white text-sm ml-auto transition ${
                !canSubmit() || isLoading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading 
                ? "Sending..." 
                : sendOption === "schedule" 
                ? "Schedule Notification" 
                : "Send Notification"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
