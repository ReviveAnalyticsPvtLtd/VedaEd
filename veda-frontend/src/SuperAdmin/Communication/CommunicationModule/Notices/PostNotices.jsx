import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CommunicationAPI from "../communicationAPI";

export default function PostNotices() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [noticeDate, setNoticeDate] = useState("");
  const [publishOn, setPublishOn] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState({
    Student: false,
    Parent: false,
    Admin: false,
    Teacher: false,
    Accountant: false,
    Librarian: false,
    Receptionist: false,
    "Super Admin": false,
  });
  const [channels, setChannels] = useState({ Email: false, SMS: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const selectedRoles = Object.keys(roles).filter((r) => roles[r]);

      // Determine target audience based on selected roles
      let targetAudience = "all";
      if (selectedRoles.length === 1) {
        if (selectedRoles.includes("Student")) targetAudience = "students";
        else if (selectedRoles.includes("Teacher")) targetAudience = "teachers";
        else if (selectedRoles.includes("Parent")) targetAudience = "parents";
        else if (
          selectedRoles.includes("Admin") ||
          selectedRoles.includes("Super Admin")
        )
          targetAudience = "staff";
      }

      // Prepare notice data for backend
      const noticeData = {
        title: title.trim(),
        content: message.trim(),
        author: "68c1b2977fa6e0a4c8af3242", // Using real admin ID from database
        authorModel: "Staff",
        category: "general",
        priority: "medium",
        targetAudience: targetAudience,
        attachments: [],
        publishDate: publishOn
          ? new Date(publishOn).toISOString()
          : new Date().toISOString(),
        expiryDate: noticeDate ? new Date(noticeDate).toISOString() : null,
        isPinned: false,
        tags: selectedRoles,
        status: "draft",
      };

      // Upload attachment if provided
      if (attachmentFile) {
        try {
          const uploadResponse = await CommunicationAPI.uploadAttachment(
            attachmentFile
          );
          noticeData.attachments = [
            {
              filename: uploadResponse.data.filename,
              originalName: uploadResponse.data.originalName,
              path: uploadResponse.data.path,
              size: uploadResponse.data.size,
            },
          ];
        } catch (uploadError) {
          console.error("Error uploading attachment:", uploadError);
          // Continue without attachment
        }
      }

      // Create notice
      const response = await CommunicationAPI.createNotice(noticeData);

      // Publish notice if "Send Now" is selected
      const sendOption = document.querySelector(
        'input[name="sendOption"]:checked'
      )?.value;
      if (sendOption === "now") {
        await CommunicationAPI.publishNotice(
          response.data._id,
          "68c1b2977fa6e0a4c8af3242",
          "Staff"
        );
      }

      alert("Notice created successfully!");
      navigate("/communication/logs");
    } catch (error) {
      console.error("Error creating notice:", error);
      alert(`Failed to create notice: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit =
    title.trim().length > 0 &&
    message.trim().length > 0 &&
    (roles.Student ||
      roles.Parent ||
      roles.Admin ||
      roles.Teacher ||
      roles.Accountant ||
      roles.Librarian ||
      roles.Receptionist ||
      roles["Super Admin"]);

  const toggleRole = (role) =>
    setRoles((prev) => ({ ...prev, [role]: !prev[role] }));
  const toggleChannel = (ch) =>
    setChannels((prev) => ({ ...prev, [ch]: !prev[ch] }));

  const onFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setAttachmentName(file ? file.name : "");
    setAttachmentFile(file);
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* Outer Gray Container */}
     
        {/* White Inner Box */}
        <div className="bg-white p-4 rounded-lg shadow-sm overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">Post Notices</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block  font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notice title"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Notice Date
                </label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={noticeDate}
                  onChange={(e) => setNoticeDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block  font-medium text-gray-700 mb-1">
                  Publish On
                </label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={publishOn}
                  onChange={(e) => setPublishOn(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block  font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                className="w-full border rounded px-3 py-2"
                rows="4"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your notice message"
                required
              />
            </div>

            <div>
              <label className="block  font-medium text-gray-700 mb-1">
                Attachment
              </label>
              <input type="file" onChange={onFileChange} />
              {attachmentName && (
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {attachmentName}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className={`px-4 py-2 rounded text-white ${
                  canSubmit && !isLoading
                    ? "bg-blue-600"
                    : "bg-blue-300 cursor-not-allowed"
                }`}
                disabled={!canSubmit || isLoading}
              >
                {isLoading ? "Creating..." : "Send Notice"}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded border"
                onClick={() => navigate("/communication/logs")}
              >
                View Logs
              </button>
            </div>
          </form>
        </div>

        {/* Message To Container */}
        <div className="bg-white p-4 rounded-lg shadow-sm overflow-x-auto mt-6">
          <h3 className="text-lg font-semibold mb-4">Message To</h3>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(roles).map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-2 text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={roles[role]}
                    onChange={() => toggleRole(role)}
                    className="w-4 h-4"
                  />
                  {role}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div>
                <div className=" font-medium text-gray-700 mb-2">
                  Send By
                </div>
                <div className="flex gap-6">
                  {Object.keys(channels).map((ch) => (
                    <label key={ch} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={channels[ch]}
                        onChange={() => toggleChannel(ch)}
                        className="w-4 h-4"
                      />
                      <span className="">{ch}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="ml-auto flex items-center gap-6">
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
                  type="button"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    
  );
}
