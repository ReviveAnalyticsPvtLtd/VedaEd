import React, { useState } from "react";

export default function Class() {
  const [selectedType, setSelectedType] = useState("SMS");
  const [selectedClass, setSelectedClass] = useState("");
  const [message, setMessage] = useState("");
  const [sendOption, setSendOption] = useState("now");
  const [scheduleDate, setScheduleDate] = useState("");

  const classOptions = ["Class 1", "Class 2", "Class 3"];
  const sections = ["A", "B", "C", "D"];

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
              <label className="block font-medium text-gray-600 mb-1">
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
              <label className="block font-medium text-gray-600 mb-1">
                Send Through <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2  text-gray-700">
                  <input type="checkbox" className="w-4 h-4" /> SMS
                </label>
                <label className="flex items-center gap-2 text-gray-700">
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

        {/* Message To Section */}
        <div className="bg-white p-4 rounded-lg shadow-sm overflow-x-auto mt-6">
          <label className="text-lg block  font-medium text-gray-600 mb-1">
            Message To <span className="text-red-500">*</span>
          </label>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
          >
            <option value="">Select</option>
            {classOptions.map((cls, idx) => (
              <option key={idx} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          {/* Conditional Box */}
          <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
            {selectedClass === "" ? (
              <div className="text-gray-500 ">Select a class to view sections</div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-gray-700">
                {/* Section */}
                <div>
                  <p className="font-medium mb-2">Section</p>
                  {sections.map((sec) => (
                    <label key={sec} className="flex items-center gap-2 mb-1">
                      <input type="checkbox" className="w-4 h-4" /> {sec}
                    </label>
                  ))}
                </div>

                {/* Send To */}
                <div>
                  <p className="font-medium mb-2">Send To</p>
                  <label className="flex items-center gap-2 mb-1">
                    <input type="checkbox" className="w-4 h-4" /> Students
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" /> Guardians
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Send Now / Schedule */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <label className="flex items-center gap-2 text-gray-700">
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

            <label className="flex items-center gap-2 text-gray-700">
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

            {/* Conditional Schedule Date-Time Input */}
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
              type="button"
              className="bg-blue-700 text-white flex items-center gap-2 px-5 py-2 rounded-md hover:bg-blue-800 transition ml-auto"
            >
             
              Submit
            </button>
          </div>
        </div>
      </div>
   
  );
}
