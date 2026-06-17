import React, { useState, useEffect } from "react";
import { FiSearch, FiTrash2, FiUser } from "react-icons/fi";

export default function Individual() {
  const [selectedType, setSelectedType] = useState("SMS");
  const [message, setMessage] = useState("");
  const [sendOption, setSendOption] = useState("now");
  const [scheduleDate, setScheduleDate] = useState("");

  // --- Message To States ---
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [addedList, setAddedList] = useState([]);
  const [displaySearch, setDisplaySearch] = useState("");
  const [filteredAdded, setFilteredAdded] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // --- Mock Data ---
  const mockData = {
    Parent: [
      { id: "P101", name: "Raj Sharma", extra: "Parent of Class 5A" },
      { id: "P102", name: "Meena Gupta", extra: "Parent of Class 7B" },
      { id: "P103", name: "Amit Lal", extra: "Parent of Class 9C" },
    ],
    Teacher: [
      { id: "T201", name: "Sunita Verma", extra: "Math" },
      { id: "T202", name: "Anil Kumar", extra: "Science" },
      { id: "T203", name: "Ravi Das", extra: "English" },
    ],
    Student: [
      { id: "S301", name: "Amit Sharma", extra: "Class 8A" },
      { id: "S302", name: "Priya Mehta", extra: "Class 7B" },
      { id: "S303", name: "Rohit Patel", extra: "Class 6C" },
    ],
  };

  // --- Handle search & suggestion filtering ---
  const handleSearch = (value) => {
    setSearch(value);
    if (!role || value.trim() === "") {
      setSuggestions([]);
      return;
    }
    const filtered = mockData[role].filter((person) =>
      person.name.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(filtered);
  };

  // --- Add selected person ---
  const handleAdd = () => {
    if (!role || !search.trim()) return;

    const found = mockData[role].find(
      (p) => p.name.toLowerCase() === search.toLowerCase()
    );
    if (found && !addedList.some((a) => a.id === found.id)) {
      setAddedList([...addedList, { ...found, role }]);
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
          <form className="space-y-4">
            {/* Template Dropdown */}
            <div>
              <label className="block  font-medium text-gray-600 mb-1">
                {selectedType} Template
              </label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="">Select</option>
              </select>
            </div>

            {/* Title Input */}
            <div>
              <label className="block  font-medium text-gray-600 mb-1">
                Title
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter title"
              />
            </div>

            {/* Send Through Options */}
            <div>
              <label className="block  font-medium text-gray-600 mb-1">
                Send Through <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
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
              <label className="block  font-medium text-gray-600 mb-1">
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

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Send {selectedType}
              </button>
            </div>
          </form>
        </div>

        {/* ✅ MESSAGE TO SECTION */}
        <div className="bg-white p-4 rounded-lg shadow-sm overflow-x-auto mt-6">
          <label className="block text-lg font-medium text-gray-600 mb-2">
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
                  onClick={() => {
                    setSearch(s.name);
                    setSuggestions([]);
                  }}
                  className="px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-blue-50"
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
            type="button"
            className="bg-blue-700 text-white flex items-center gap-2 px-5 py-2 rounded-md hover:bg-blue-800 transition ml-auto"
          >
            Submit
          </button>
        </div>
      </div>
    
  );
}
