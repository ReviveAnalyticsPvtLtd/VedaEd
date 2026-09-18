import React, { useState, useEffect } from "react";
import { FiSearch, FiTrash2, FiUser } from "react-icons/fi";
import CommunicationAPI from "../communicationAPI";
import { studentAPI } from "../../../../services/studentAPI";
import staffAPI from "../../../../services/staffAPI";
import { parentAPI } from "../../../../services/parentAPI";

export default function Individual() {
  const [selectedType, setSelectedType] = useState("SMS");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sendOption, setSendOption] = useState("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [channels, setChannels] = useState({ sms: true, app: true });
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);

    const fetchTemplates = async () => {
      try {
        const response = await CommunicationAPI.getMessageTemplates();
        setTemplates(response?.data || []);
      } catch (error) {
        console.error("Error fetching message templates:", error);
      }
    };
    fetchTemplates();
  }, []);

  const handleTemplateChange = (e) => {
    const id = e.target.value;
    setSelectedTemplateId(id);
    const template = templates.find((t) => String(t._id) === id);
    if (template) setMessage(template.message);
  };

  // --- Message To States ---
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [addedList, setAddedList] = useState([]);
  const [displaySearch, setDisplaySearch] = useState("");
  const [filteredAdded, setFilteredAdded] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // --- Recipient data (loaded from API) ---
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [parents, setParents] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(false);

  // --- Load real recipients depending on chosen role ---
  useEffect(() => {
    const loadRoleData = async () => {
      if (!role) return;
      setLoadingTargets(true);
      try {
        if (role === "Student" && students.length === 0) {
          const res = await studentAPI.getAllStudents();
          const list = res?.students || res || [];
          setStudents(list);
        } else if (role === "Teacher" && teachers.length === 0) {
          const res = await staffAPI.getAllStaff();
          const list = res?.staff || res || [];
          const filteredTeachers = list.filter((s) => {
            const r = s.personalInfo?.role || "";
            const d = s.personalInfo?.designation || "";
            return r.toLowerCase() === "teacher" || d.toLowerCase().includes("teacher");
          });
          setTeachers(filteredTeachers);
        } else if (role === "Parent" && parents.length === 0) {
          const res = await parentAPI.getAllParents();
          const list = res?.parents || res || [];
          setParents(list);
        }
      } catch (err) {
        console.error("Failed to load users for individual selection:", err);
      } finally {
        setLoadingTargets(false);
      }
    };
    loadRoleData();
    setSearch("");
    setSuggestions([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const getSourceData = () => {
    if (role === "Student") return students;
    if (role === "Teacher") return teachers;
    if (role === "Parent") return parents;
    return [];
  };

  const toSuggestion = (item) => {
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
      name =
        item.fatherInfo?.fatherName ||
        item.motherInfo?.motherName ||
        item.name ||
        "N/A";
      extra = `Parent ID: ${item.parentId || "N/A"}`;
    }

    return { id, name, extra };
  };

  // --- Handle search & suggestion filtering ---
  const handleSearch = (value) => {
    setSearch(value);
    const term = value.trim().toLowerCase();
    if (!role || term === "") {
      setSuggestions([]);
      return;
    }
    const filtered = getSourceData()
      .map(toSuggestion)
      .filter((person) => person.name.toLowerCase().includes(term))
      .slice(0, 10);
    setSuggestions(filtered);
  };

  // --- Add selected person ---
  const handleAdd = (person) => {
    if (!person) {
      const exact = getSourceData()
        .map(toSuggestion)
        .find((p) => p.name.toLowerCase() === search.trim().toLowerCase());
      if (exact) person = exact;
    }
    if (person && !addedList.some((a) => a.id === person.id)) {
      setAddedList([...addedList, { ...person, role }]);
    }
    setSearch("");
    setSuggestions([]);
  };

  const handleDelete = (id) => {
    setAddedList(addedList.filter((p) => p.id !== id));
  };

  const handleDisplaySearch = (value) => {
    setDisplaySearch(value);
    if (value.trim() === "") {
      setFilteredAdded(addedList);
    } else {
      setFilteredAdded(
        addedList.filter((p) =>
          p.name.toLowerCase().includes(value.toLowerCase())
        )
      );
    }
  };

  useEffect(() => {
    setFilteredAdded(addedList);
  }, [addedList]);

  const toggleChannel = (ch) => {
    setChannels((prev) => ({ ...prev, [ch]: !prev[ch] }));
  };

  const deriveAudience = () => {
    const roles = new Set(addedList.map((p) => p.role));
    if (roles.size === 0) return "";
    if (roles.size === 1) {
      const r = [...roles][0];
      if (r === "Student") return "students";
      if (r === "Parent") return "parents";
      if (r === "Teacher") return "teachers";
    }
    return "all";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || isLoading) return;

    const audience = deriveAudience();
    if (!audience) {
      alert("Please add at least one recipient under Message To.");
      return;
    }

    const selectedChannels = Object.keys(channels).filter((ch) => channels[ch]);
    if (selectedChannels.length === 0) {
      alert("Please select at least one channel (SMS or Mobile App).");
      return;
    }

    const authorId =
      currentUser?.role?.toLowerCase() === "superadmin" ||
      currentUser?.role?.toLowerCase() === "admin"
        ? currentUser?._id
        : currentUser?.refId || currentUser?._id || "68c1b2977fa6e0a4c8af3242";
    const authorModel =
      currentUser?.role?.toLowerCase() === "teacher"
        ? "Teacher"
        : currentUser?.role?.toLowerCase() === "admin" ||
          currentUser?.role?.toLowerCase() === "superadmin"
        ? "Admin"
        : "Staff";

    const publishDateVal =
      sendOption === "schedule" && scheduleDate
        ? new Date(scheduleDate).toISOString()
        : new Date().toISOString();

    const notificationData = {
      title: title.trim(),
      description: message.trim(),
      type: "Information",
      audience,
      createdBy: authorId,
      createdByModel: authorModel,
      channels: selectedChannels,
      publishDate: publishDateVal,
      status: sendOption === "schedule" ? "scheduled" : "sent",
    };

    setIsLoading(true);
    try {
      await CommunicationAPI.createNotification(notificationData);

      alert(
        sendOption === "schedule"
          ? "Individual message scheduled successfully!"
          : "Individual message sent successfully!"
      );
      setTitle("");
      setMessage("");
      setSelectedTemplateId("");
      setAddedList([]);
    } catch (error) {
      console.error("Error sending individual message:", error);
      alert(`Failed to send message: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* White Inner Box */}
      <div className="bg-white p-4 rounded-lg shadow-sm overflow-x-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Send {selectedType}</h3>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1  focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="SMS">SMS</option>
            <option value="Email">Email</option>
          </select>
        </div>

        {/* Form Section */}
        <form id="individual-message-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Template Dropdown */}
          <div>
            <label className="block  font-medium text-gray-700 mb-1">
              {selectedType} Template
            </label>
            <select
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Select</option>
              {templates.map((template) => (
                <option key={template._id} value={template._id}>
                  {template.title}
                </option>
              ))}
            </select>
          </div>

          {/* Title Input */}
          <div>
            <label className="block  font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter title"
              required
            />
          </div>

          {/* Send Through Options */}
          <div>
            <label className="block  font-medium text-gray-700 mb-1">
              Send Through <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2  text-gray-700">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={channels.sms}
                  onChange={() => toggleChannel("sms")}
                />{" "}
                SMS
              </label>
              <label className="flex items-center gap-2  text-gray-700">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={channels.app}
                  onChange={() => toggleChannel("app")}
                />{" "}
                Mobile App
              </label>
            </div>
            <p className=" text-gray-500 mt-1">
              Template ID (TID/Entity ID is required only for Indian SMS Gateway)
            </p>
            <input
              type="text"
              className="w-full mt-2 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter Template ID (if required)"
            />
          </div>

          {/* Message Box */}
          <div>
            <label className="block  font-medium text-gray-700 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              placeholder="Type your message here..."
              required
            ></textarea>
            <div className=" text-gray-500 text-right mt-1">
              Character Count: {message.length}
            </div>
          </div>
        </form>
      </div>

      {/* ✅ MESSAGE TO SECTION */}
      <div className="bg-white p-4 rounded-lg shadow-sm overflow-x-auto mt-6">
        <label className="block text-lg font-semibold text-gray-900 mb-2">
          Message To <span className="text-red-500">*</span>
        </label>

        {/* Select + Input + Add */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setSearch("");
              setSuggestions([]);
            }}
            className="border border-gray-300 rounded-md px-3 py-2  focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Select</option>
            <option value="Parent">Parent</option>
            <option value="Teacher">Teacher</option>
            <option value="Student">Student</option>
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Type name..."
            className="border border-gray-300 rounded-md px-3 py-2  focus:ring-2 focus:ring-blue-500 focus:outline-none flex-grow"
          />
          <button
            onClick={handleAdd}
            type="button"
            className="bg-blue-700 text-white px-5 py-2 rounded-md hover:bg-blue-800 transition"
          >
            Add
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="border border-gray-300 bg-white rounded-md mb-3 max-h-40 overflow-y-auto">
            {suggestions.map((s) => (
              <div
                key={s.id}
                onClick={() => handleAdd(s)}
                className="px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-blue-50"
              >
                {s.name} ({s.extra}) - {s.id}
              </div>
            ))}
          </div>
        )}

        {!suggestions.length && loadingTargets && (
          <div className="text-gray-500 text-sm mb-3">
            Loading {role.toLowerCase()}s...
          </div>
        )}

        {/* Lower Search + Added List */}
        <div className="border border-gray-300 rounded-md bg-gray-50 p-3">
          <div className="relative mb-3">
            <input
              type="text"
              value={displaySearch}
              onChange={(e) => handleDisplaySearch(e.target.value)}
              placeholder="Search..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <FiSearch className="absolute right-3 top-3 text-gray-500" />
          </div>

          {filteredAdded.length > 0 ? (
            <div className="space-y-2">
              {filteredAdded.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <FiUser className="text-gray-600" />
                    {p.name} ({p.id}){" "}
                    <span className="text-gray-500">({p.extra})</span>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm text-center py-3">
              No entries found
            </div>
          )}
        </div>
      </div>

      {/* Send Now / Schedule */}
      <div className="flex flex-wrap items-center gap-4 pt-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="radio"
            name="sendOption"
            value="now"
            checked={sendOption === "now"}
            onChange={() => setSendOption("now")}
            className="w-4 h-4"
          />
          Send Now
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="radio"
            name="sendOption"
            value="schedule"
            checked={sendOption === "schedule"}
            onChange={() => setSendOption("schedule")}
            className="w-4 h-4"
          />
          Schedule
        </label>

        {sendOption === "schedule" && (
          <>
            <span className="text-sm text-gray-700 font-medium">
              Schedule Date Time <span className="text-red-500">*</span>
            </span>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </>
        )}

        <button
          type="submit"
          form="individual-message-form"
          disabled={isLoading || !title.trim() || !message.trim()}
          className="bg-blue-700 text-white flex items-center gap-2 px-5 py-2 rounded-md hover:bg-blue-800 transition ml-auto"
        >
          {isLoading ? "Sending..." : "Submit"}
        </button>
      </div>
    </div>
  );
}