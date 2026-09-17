import React, { useState, useEffect } from "react";
import CommunicationAPI from "../communicationAPI";

export default function Group() {
  const [selectedType, setSelectedType] = useState("SMS");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [channels, setChannels] = useState({ sms: true, app: true });
  const [sendOption, setSendOption] = useState("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [messageTo, setMessageTo] = useState({
    students: false,
    guardians: false,
    admin: false,
    teacher: false,
    accountant: false,
    librarian: false,
    receptionist: false,
    superAdmin: false,
  });

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

  const toggleMessageTo = (key) => {
    setMessageTo((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleChannel = (ch) => {
    setChannels((prev) => ({ ...prev, [ch]: !prev[ch] }));
  };

  const deriveAudience = () => {
    const audiences = new Set();
    if (messageTo.students) audiences.add("students");
    if (messageTo.guardians) audiences.add("parents");
    if (messageTo.teacher) audiences.add("teachers");
    if (
      messageTo.admin ||
      messageTo.accountant ||
      messageTo.librarian ||
      messageTo.receptionist ||
      messageTo.superAdmin
    ) {
      audiences.add("staff");
    }
    if (audiences.size === 0) return "";
    if (audiences.size === 1) return [...audiences][0];
    return "all";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || isLoading) return;

    const audience = deriveAudience();
    if (!audience) {
      alert("Please select at least one group under Message To.");
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
          ? "Group message scheduled successfully!"
          : "Group message sent successfully!"
      );
      setTitle("");
      setMessage("");
      setSelectedTemplateId("");
    } catch (error) {
      console.error("Error sending group message:", error);
      alert(`Failed to send message: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* White Inner Box */}
      <div className="bg-white p-4 rounded-lg shadow-sm overflow-x-auto">
        {/* Header with Dropdown */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Send {selectedType}</h3>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="SMS">SMS</option>
            <option value="Email">Email</option>
          </select>
        </div>

        {/* Form Section */}
        <form id="group-message-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Template Dropdown */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
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
              Template ID (TID/Entity ID is required only for Indian SMS
              Gateway)
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

      {/* Message To Container */}
      <div className="bg-white p-4 rounded-lg shadow-sm overflow-x-auto mt-6">
        <h3 className="text-lg font-semibold mb-4">Message To</h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2  text-gray-700">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={messageTo.students}
                onChange={() => toggleMessageTo("students")}
              />
              Students
            </label>
            <label className="flex items-center gap-2  text-gray-700">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={messageTo.guardians}
                onChange={() => toggleMessageTo("guardians")}
              />
              Guardians
            </label>
            <label className="flex items-center gap-2  text-gray-700">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={messageTo.admin}
                onChange={() => toggleMessageTo("admin")}
              />
              Admin
            </label>
            <label className="flex items-center gap-2  text-gray-700">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={messageTo.teacher}
                onChange={() => toggleMessageTo("teacher")}
              />
              Teacher
            </label>
            <label className="flex items-center gap-2  text-gray-700">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={messageTo.accountant}
                onChange={() => toggleMessageTo("accountant")}
              />
              Accountant
            </label>
            <label className="flex items-center gap-2  text-gray-700">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={messageTo.librarian}
                onChange={() => toggleMessageTo("librarian")}
              />
              Librarian
            </label>
            <label className="flex items-center gap-2  text-gray-700">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={messageTo.receptionist}
                onChange={() => toggleMessageTo("receptionist")}
              />
              Receptionist
            </label>
            <label className="flex items-center gap-2  text-gray-700">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={messageTo.superAdmin}
                onChange={() => toggleMessageTo("superAdmin")}
              />
              Super Admin
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-4">
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
              <div className="flex items-center gap-2">
                <span className=" text-gray-700 font-medium">
                  Schedule Date Time <span className="text-red-500">*</span>
                </span>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              form="group-message-form"
              disabled={isLoading || !title.trim() || !message.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition ml-auto"
            >
              {isLoading ? "Sending..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}