import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSend } from "react-icons/fi";
import CommunicationAPI from "../communicationAPI";

export default function Group() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("Information");
  const [sendOption, setSendOption] = useState("now");
  const [scheduleDate, setScheduleDate] = useState("");
  
  // Channels
  const [channels, setChannels] = useState({
    sms: false,
    email: false,
    app: true, // default app
    whatsapp: false
  });

  // Primary Audience segment
  const [audience, setAudience] = useState("all");

  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);
  }, []);

  const toggleChannel = (ch) => {
    setChannels(prev => ({ ...prev, [ch]: !prev[ch] }));
  };

  const handleChannelCheckboxChange = (ch) => {
    toggleChannel(ch);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || isLoading) return;

    const selectedChannels = Object.keys(channels).filter(ch => channels[ch]);
    if (selectedChannels.length === 0) {
      alert("Please select at least one delivery channel (SMS, Email, or Mobile App).");
      return;
    }

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

      const notificationData = {
        title: title.trim(),
        description: message.trim(),
        type,
        audience,
        createdBy: authorId,
        createdByModel: authorModel,
        channels: selectedChannels,
        publishDate: publishDateVal,
        status: sendOption === "schedule" ? "scheduled" : "sent"
      };

      await CommunicationAPI.createNotification(notificationData);
      
      alert(sendOption === "schedule" 
        ? "Group notification scheduled successfully!" 
        : "Group notification sent successfully!"
      );
      
      navigate("/communication/logs");
    } catch (error) {
      console.error("Error sending group notification:", error);
      alert(`Failed to send notification: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-0 m-0 space-y-6">
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiSend className="text-blue-600" /> Compose Group Broadcast Notification
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
                placeholder="Enter a brief title"
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
            {/* Target Audience Segment */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Target Audience <span className="text-red-500">*</span>
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">Everyone (All Roles)</option>
                <option value="students">All Students</option>
                <option value="parents">All Parents / Guardians</option>
                <option value="teachers">All Teachers</option>
                <option value="staff">All Staff Members</option>
              </select>
            </div>

            {/* Delivery Channels */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Delivery Channels <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4 py-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={channels.app}
                    onChange={() => handleChannelCheckboxChange('app')}
                    className="w-4 h-4 rounded text-blue-600" 
                  /> 
                  In-App Notification
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={channels.email}
                    onChange={() => handleChannelCheckboxChange('email')}
                    className="w-4 h-4 rounded text-blue-600" 
                  /> 
                  Email Broadcast
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={channels.sms}
                    onChange={() => handleChannelCheckboxChange('sms')}
                    className="w-4 h-4 rounded text-blue-600" 
                  /> 
                  SMS Alert
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={channels.whatsapp}
                    onChange={() => handleChannelCheckboxChange('whatsapp')}
                    className="w-4 h-4 rounded text-blue-600" 
                  /> 
                  WhatsApp Broadcast
                </label>
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Message Content <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              placeholder="Type your message details here..."
              required
            ></textarea>
            <div className="text-xs text-gray-400 text-right mt-1">
              Character Count: {message.length} characters
            </div>
          </div>

          {/* Send / Schedule Option */}
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
              disabled={isLoading || !title.trim() || !message.trim()}
              className={`px-6 py-2 rounded-lg font-semibold text-white text-sm ml-auto transition ${
                !title.trim() || !message.trim() || isLoading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading 
                ? "Sending..." 
                : sendOption === "schedule" 
                ? "Schedule Broadcast" 
                : "Send Broadcast"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
