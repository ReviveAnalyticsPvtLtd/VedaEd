import React, { useState, useEffect } from "react";
import CommunicationAPI from "../communicationAPI";

export default function Class() {
  const [selectedType, setSelectedType] = useState("SMS");
  const [selectedClass, setSelectedClass] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sendOption, setSendOption] = useState("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [channels, setChannels] = useState({ sms: true, app: true });
  const [selectedSections, setSelectedSections] = useState([]);
  const [targets, setTargets] = useState({ students: false, guardians: false });
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const classOptions = ["Class 1", "Class 2", "Class 3"];
  const sections = ["A", "B", "C", "D"];

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

  const toggleChannel = (ch) => {
    setChannels((prev) => ({ ...prev, [ch]: !prev[ch] }));
  };

  const toggleTarget = (t) => {
    setTargets((prev) => ({ ...prev, [t]: !prev[t] }));
  };

  const toggleSection = (sec) => {
    setSelectedSections((prev) =>
      prev.includes(sec) ? prev.filter((s) => s !== sec) : [...prev, sec]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      alert("Please select a class under Message To.");
      return;
    }
    if (!targets.students && !targets.guardians) {
      alert("Please select at least one target (Students or Guardians).");
      return;
    }
    if (!title.trim() || !message.trim() || isLoading) return;

    const selectedChannels = Object.keys(channels).filter((ch) => channels[ch]);
    if (selectedChannels.length === 0) {
      alert("Please select at least one channel (SMS or Mobile App).");
      return;
    }

    let audience = "all";
    if (targets.students && !targets.guardians) audience = "students";
    else if (!targets.students && targets.guardians) audience = "parents";

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
          ? "Class message scheduled successfully!"
          : "Class message sent successfully!"
      );
      setTitle("");
      setMessage("");
      setSelectedTemplateId("");
      setSelectedSections([]);
    } catch (error) {
      console.error("Error sending class message:", error);
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
        <form id="class-message-form" onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block font-medium text-gray-700 mb-1">
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
            <label className="block font-medium text-gray-700 mb-1">
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
              <label className="flex items-center gap-2 text-gray-700">
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

      {/* Message To Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm overflow-x-auto mt-6">
        <label className="text-lg block  font-semibold text-gray-900 mb-1">
          Message To <span className="text-red-500">*</span>
        </label>

        <select
          value={selectedClass}
          onChange={(e) => {
            setSelectedClass(e.target.value);
            setSelectedSections([]);
          }}
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
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={selectedSections.includes(sec)}
                      onChange={() => toggleSection(sec)}
                    />{" "}
                    {sec}
                  </label>
                ))}
              </div>

              {/* Send To */}
              <div>
                <p className="font-medium mb-2">Send To</p>
                <label className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={targets.students}
                    onChange={() => toggleTarget("students")}
                  />{" "}
                  Students
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={targets.guardians}
                    onChange={() => toggleTarget("guardians")}
                  />{" "}
                  Guardians
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
            type="submit"
            form="class-message-form"
            disabled={isLoading || !title.trim() || !message.trim()}
            className="bg-blue-700 text-white flex items-center gap-2 px-5 py-2 rounded-md hover:bg-blue-800 transition ml-auto"
          >
            {isLoading ? "Sending..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}