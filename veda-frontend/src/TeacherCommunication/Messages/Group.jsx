import React, { useState, useEffect } from "react";
import CommunicationAPI from "../communicationAPI";
import { studentAPI } from "../../services/studentAPI";
import staffAPI from "../../services/staffAPI";
import { parentAPI } from "../../services/parentAPI";

export default function Group({ templates = [] }) {
  const [selectedType, setSelectedType] = useState("SMS");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messageTo, setMessageTo] = useState({
    students: true,
    guardians: false,
    teacher: false,
    accountant: false,
    librarian: false,
    receptionist: false,
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);
  }, []);

  const availableTemplates = templates.filter((t) => t.type === selectedType);

  const handleTemplateChange = (e) => {
    const id = e.target.value;
    setSelectedTemplateId(id);
    const template = templates.find((t) => String(t.id) === id);
    if (template) setMessage(template.content);
  };

  const toggleMessageTo = (key) => {
    setMessageTo((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resolveRecipients = async () => {
    const out = [];
    const [studentsRes, parentsRes, staffRes] = await Promise.all([
      studentAPI.getAllStudents().catch(() => ({})),
      parentAPI.getAllParents().catch(() => ({})),
      staffAPI.getAllStaff().catch(() => ({})),
    ]);

    const students = studentsRes?.students || studentsRes?.data || studentsRes || [];
    const parents = parentsRes?.parents || parentsRes?.data || parentsRes || [];
    const staff = staffRes?.staff || staffRes?.data || staffRes || [];

    if (messageTo.students) {
      students.forEach((s) => out.push({ _id: s._id, model: "Student" }));
    }
    if (messageTo.guardians) {
      parents.forEach((p) => out.push({ _id: p._id, model: "Parent" }));
    }

    const staffRoles = [];
    if (messageTo.teacher) staffRoles.push("teacher");
    if (messageTo.accountant) staffRoles.push("accountant");
    if (messageTo.librarian) staffRoles.push("librarian");
    if (messageTo.receptionist) staffRoles.push("receptionist");

    if (staffRoles.length > 0) {
      staff
        .filter((s) => {
          const role = (s.personalInfo?.role || "").toLowerCase();
          const desig = (s.personalInfo?.designation || "").toLowerCase();
          return staffRoles.some((r) => role === r || desig.includes(r));
        })
        .forEach((s) => out.push({ _id: s._id, model: "Teacher" }));
    }

    return out;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || isLoading) return;

    const selectedRoles = Object.keys(messageTo).filter((key) => messageTo[key]);
    if (selectedRoles.length === 0) {
      alert("Please select at least one recipient under Message To.");
      return;
    }

    const senderId = currentUser?.refId || currentUser?._id;
    if (!senderId) {
      alert("Sender not found. Please log in again.");
      return;
    }

    setIsLoading(true);
    try {
      const recipients = await resolveRecipients();
      if (recipients.length === 0) {
        alert("No recipients found for the selected roles.");
        return;
      }

      await Promise.all(
        recipients.map((r) =>
          CommunicationAPI.createMessage({
            sender: senderId,
            senderModel: "Teacher",
            receiver: r._id,
            receiverModel: r.model,
            subject: title.trim(),
            content: message.trim(),
            messageType: "text",
          })
        )
      );

      alert(`Message sent successfully to ${recipients.length} recipient(s).`);
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
      {/* Header with Dropdown */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Send {selectedType} (Teacher)</h3>
        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value);
            setSelectedTemplateId("");
          }}
          className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="SMS">SMS</option>
          <option value="Email">Email</option>
        </select>
      </div>

      {/* Form Section */}
      <form id="group-message-form" onSubmit={handleSubmit} className="space-y-4">
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

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !title.trim() || !message.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            {isLoading ? "Sending..." : `Send ${selectedType}`}
          </button>
        </div>
      </form>

      {/* Message To Container */}
      <div className="bg-white p-4 rounded-lg shadow-sm overflow-x-auto mt-6">
        <h3 className="text-lg font-semibold mb-4">Message To</h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2  text-gray-700">
              <input
                type="checkbox"
                checked={messageTo.students}
                onChange={() => toggleMessageTo("students")}
                className="w-4 h-4"
              />
              Students
            </label>
            <label className="flex items-center gap-2  text-gray-700">
              <input
                type="checkbox"
                checked={messageTo.guardians}
                onChange={() => toggleMessageTo("guardians")}
                className="w-4 h-4"
              />
              Guardians
            </label>
            {/* Admin and Super Admin are excluded for teachers */}
            <label className="flex items-center gap-2  text-gray-700">
              <input
                type="checkbox"
                checked={messageTo.teacher}
                onChange={() => toggleMessageTo("teacher")}
                className="w-4 h-4"
              />
              Teacher
            </label>
            <label className="flex items-center gap-2  text-gray-700">
              <input
                type="checkbox"
                checked={messageTo.accountant}
                onChange={() => toggleMessageTo("accountant")}
                className="w-4 h-4"
              />
              Accountant
            </label>
            <label className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={messageTo.librarian}
                onChange={() => toggleMessageTo("librarian")}
                className="w-4 h-4"
              />
              Librarian
            </label>
            <label className="flex items-center gap-2  text-gray-700">
              <input
                type="checkbox"
                checked={messageTo.receptionist}
                onChange={() => toggleMessageTo("receptionist")}
                className="w-4 h-4"
              />
              Receptionist
            </label>
          </div>

          <div className="flex items-center gap-6 pt-4">
            <label className="flex items-center gap-2  text-gray-700">
              <input
                type="radio"
                name="sendOption"
                value="now"
                defaultChecked
                className="w-4 h-4"
              />
              Send Now
            </label>
            <label className="flex items-center gap-2  text-gray-700">
              <input
                type="radio"
                name="sendOption"
                value="schedule"
                className="w-4 h-4"
              />
              Schedule
            </label>
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