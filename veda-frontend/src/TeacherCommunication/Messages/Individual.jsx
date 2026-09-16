import React, { useState, useEffect } from "react";
import { FiSearch, FiTrash2, FiUser } from "react-icons/fi";
import CommunicationAPI from "../communicationAPI";
import { studentAPI } from "../../services/studentAPI";
import staffAPI from "../../services/staffAPI";
import { parentAPI } from "../../services/parentAPI";

export default function Individual({ templates = [] }) {
  const [selectedType, setSelectedType] = useState("SMS");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [sendOption, setSendOption] = useState("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const availableTemplates = templates.filter((t) => t.type === selectedType);

  const handleTemplateChange = (e) => {
    const id = e.target.value;
    setSelectedTemplateId(id);
    const template = templates.find((t) => String(t.id) === id);
    if (template) setMessage(template.content);
  };

  // --- Message To States ---
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [addedList, setAddedList] = useState([]);
  const [displaySearch, setDisplaySearch] = useState("");
  const [filteredAdded, setFilteredAdded] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [parents, setParents] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);
  }, []);

  // Load user list depending on chosen role
  useEffect(() => {
    setSearch("");
    setSuggestions([]);

    const loadRoleData = async () => {
      try {
        if (role === "Student" && students.length === 0) {
          const res = await studentAPI.getAllStudents();
          setStudents(res?.students || res?.data || res || []);
        } else if (role === "Teacher" && teachers.length === 0) {
          const res = await staffAPI.getAllStaff();
          const list = res?.staff || res?.data || res || [];
          setTeachers(
            list.filter((s) => {
              const r = s.personalInfo?.role || "";
              const d = s.personalInfo?.designation || "";
              return r.toLowerCase() === "teacher" || d.toLowerCase().includes("teacher");
            })
          );
        } else if (role === "Parent" && parents.length === 0) {
          const res = await parentAPI.getAllParents();
          setParents(res?.parents || res?.data || res || []);
        }
      } catch (err) {
        console.error("Failed to load users for selection:", err);
      }
    };

    if (role) loadRoleData();
  }, [role, students.length, teachers.length, parents.length]);

  // --- Handle search & suggestion filtering ---
  const handleSearch = (value) => {
    setSearch(value);
    if (!role || value.trim() === "") {
      setSuggestions([]);
      return;
    }

    const term = value.toLowerCase();
    let source = [];
    if (role === "Student") source = students;
    else if (role === "Teacher") source = teachers;
    else if (role === "Parent") source = parents;

    const model = role === "Parent" ? "Parent" : role === "Teacher" ? "Teacher" : "Student";

    const filtered = source
      .map((item) => {
        let id = item._id;
        let name = "";
        let extra = "";

        if (role === "Student") {
          name = item.personalInfo?.fullName || item.personalInfo?.name || "N/A";
          extra = `Class: ${item.academicInfo?.class || "N/A"}`;
        } else if (role === "Teacher") {
          name = item.personalInfo?.name || item.personalInfo?.fullName || "N/A";
          extra = `Role: ${item.personalInfo?.role || "Teacher"}`;
        } else if (role === "Parent") {
          name = item.fatherInfo?.fatherName || item.motherInfo?.motherName || item.name || "N/A";
          extra = `Parent ID: ${item.parentId || "N/A"}`;
        }

        return { id, name, extra, model };
      })
      .filter((p) => p.name && p.name.toLowerCase().includes(term));

    setSuggestions(filtered.slice(0, 10));
  };

  // --- Add selected person ---
  const handleAdd = (person) => {
    if (!person) return;
    if (!addedList.some((a) => a.id === person.id)) {
      setAddedList([
        ...addedList,
        { id: person.id, name: person.name, extra: person.extra, model: person.model },
      ]);
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

  // --- Send Message ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || addedList.length === 0 || isLoading)
      return;

    const senderId = currentUser?.refId || currentUser?._id;
    if (!senderId) {
      alert("Sender not found. Please log in again.");
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all(
        addedList.map((p) =>
          CommunicationAPI.createMessage({
            sender: senderId,
            senderModel: "Teacher",
            receiver: p.id,
            receiverModel: p.model,
            subject: title.trim(),
            content: message.trim(),
            messageType: "text",
          })
        )
      );

      alert(`Message sent successfully to ${addedList.length} recipient(s).`);
      setAddedList([]);
      setTitle("");
      setMessage("");
      setSelectedTemplateId("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert(`Failed to send message: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Send {selectedType} (Teacher)</h3>
        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value);
            setSelectedTemplateId("");
          }}
          className="border border-gray-300 rounded-md px-3 py-1  focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="SMS">SMS</option>
          <option value="Email">Email</option>
        </select>
      </div>

      {/* Form Section */}
      <form
        id="individual-message-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
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
            {availableTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title Input */}
        <div>
          <label className="block font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Enter title"
          />
        </div>

        {/* Send Through Options */}
        <div>
          <label className="block  font-medium text-gray-700 mb-1">
            Send Through <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2  text-gray-700">
              <input type="checkbox" className="w-4 h-4" /> SMS
            </label>
            <label className="flex items-center gap-2  text-gray-700">
              <input type="checkbox" className="w-4 h-4" /> Mobile App
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
          ></textarea>
          <div className=" text-gray-500 text-right mt-1">
            Character Count: {message.length}
          </div>
        </div>
      </form>

      {/* MESSAGE TO SECTION */}
      <div className="bg-white p-4 rounded-lg shadow-sm overflow-x-auto mt-3">
        <label className="block  font-medium text-gray-700 mb-2">
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
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none flex-grow"
          />

          <button
            onClick={() => handleAdd(suggestions[0])}
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
                className="px-3 py-2  text-gray-700 cursor-pointer hover:bg-blue-50"
              >
                {s.name} ({s.extra}) - {s.id}
              </div>
            ))}
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
              className="w-full border border-gray-300 rounded-md px-3 py-2  focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <FiSearch className="absolute right-3 top-3 text-gray-500" />
          </div>

          {filteredAdded.length > 0 ? (
            <div className="space-y-2">
              {filteredAdded.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-3 py-2 "
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
            <div className="text-gray-500  text-center py-3">
              No entries found
            </div>
          )}
        </div>
      </div>

      {/* Send Now / Schedule */}
      <div className="flex flex-wrap items-center gap-3 pt-4">
        <label className="flex items-center gap-2  text-gray-700">
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

        <label className="flex items-center gap-2  text-gray-700">
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
            <span className=" text-gray-700 font-medium">
              Schedule Date Time <span className="text-red-500">*</span>
            </span>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2  focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </>
        )}

        <button
          type="submit"
          form="individual-message-form"
          disabled={isLoading || !title.trim() || !message.trim() || addedList.length === 0}
          className="bg-blue-700 text-white flex items-center gap-2 px-5 py-2 rounded-md hover:bg-blue-800 transition ml-auto"
        >
          {isLoading ? "Sending..." : "Submit"}
        </button>
      </div>
    </div>
  );
}