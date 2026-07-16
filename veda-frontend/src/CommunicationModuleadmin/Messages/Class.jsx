import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSend } from "react-icons/fi";
import classAPI from "../../services/classAPI";
import CommunicationAPI from "../communicationAPI";

export default function Class() {
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

  // Class & Section Picker
  const [classList, setClassList] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [availableSections, setAvailableSections] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);

  // Send targets (Students/Guardians)
  const [targets, setTargets] = useState({
    students: true,
    parents: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Load user profile & classes
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);

    const loadClasses = async () => {
      try {
        const response = await classAPI.getAllClasses();
        if (response?.success) {
          setClassList(response.data || []);
        }
      } catch (err) {
        console.error("Failed to load classes:", err);
      }
    };
    loadClasses();
  }, []);

  // Update sections when class changes
  useEffect(() => {
    if (selectedClass) {
      const clsObj = classList.find(c => c._id === selectedClass);
      if (clsObj) {
        setAvailableSections(clsObj.sections || []);
        setSelectedSections([]);
      }
    } else {
      setAvailableSections([]);
      setSelectedSections([]);
    }
  }, [selectedClass, classList]);

  const toggleChannel = (ch) => {
    setChannels(prev => ({ ...prev, [ch]: !prev[ch] }));
  };

  const toggleTarget = (t) => {
    setTargets(prev => ({ ...prev, [t]: !prev[t] }));
  };

  const toggleSection = (secId) => {
    setSelectedSections(prev => 
      prev.includes(secId) ? prev.filter(id => id !== secId) : [...prev, secId]
    );
  };

  const canSubmit = () => {
    if (!title.trim() || !message.trim() || !selectedClass) return false;
    if (!targets.students && !targets.parents) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit() || isLoading) return;

    const selectedChannels = Object.keys(channels).filter(ch => channels[ch]);
    if (selectedChannels.length === 0) {
      alert("Please select at least one delivery channel.");
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

      // Determine audience type:
      let audience = "all";
      if (targets.students && !targets.parents) audience = "students";
      else if (!targets.students && targets.parents) audience = "parents";

      // Class/Section targets
      let specificTargets = [];
      let specificTargetModel = "Class";

      if (selectedSections.length > 0) {
        specificTargets = selectedSections;
        specificTargetModel = "Section";
      } else {
        specificTargets = [selectedClass];
        specificTargetModel = "Class";
      }

      const notificationData = {
        title: title.trim(),
        description: message.trim(),
        type,
        audience,
        specificTargets,
        specificTargetModel,
        createdBy: authorId,
        createdByModel: authorModel,
        channels: selectedChannels,
        publishDate: publishDateVal,
        status: sendOption === "schedule" ? "scheduled" : "sent"
      };

      await CommunicationAPI.createNotification(notificationData);
      
      alert(sendOption === "schedule" 
        ? "Class notification scheduled successfully!" 
        : "Class notification sent successfully!"
      );
      
      navigate("/communication/logs");
    } catch (error) {
      console.error("Error sending class notification:", error);
      alert(`Failed to send notification: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-0 m-0 space-y-6">
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiSend className="text-blue-600" /> Compose Class-Targeted Notification
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
            {/* Target Class Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Target Class <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                <option value="">Choose class...</option>
                {classList.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
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
                    onChange={() => toggleChannel('app')}
                    className="w-4 h-4 rounded text-blue-600" 
                  /> 
                  In-App Notification
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={channels.email}
                    onChange={() => toggleChannel('email')}
                    className="w-4 h-4 rounded text-blue-600" 
                  /> 
                  Email
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={channels.sms}
                    onChange={() => toggleChannel('sms')}
                    className="w-4 h-4 rounded text-blue-600" 
                  /> 
                  SMS
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={channels.whatsapp}
                    onChange={() => toggleChannel('whatsapp')}
                    className="w-4 h-4 rounded text-blue-600" 
                  /> 
                  WhatsApp
                </label>
              </div>
            </div>
          </div>

          {/* Conditional Sections & Segment Targets */}
          {selectedClass && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 border border-gray-150 rounded-lg">
              {/* Sections Selector */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Target Sections (Broad class if empty)</p>
                {availableSections.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No sections defined for this class</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {availableSections.map(sec => (
                      <label key={sec._id} className="flex items-center gap-1.5 text-sm text-gray-700 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSections.includes(sec._id)}
                          onChange={() => toggleSection(sec._id)}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        Section {sec.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Audience Targets inside class */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Send Notification To</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-sm text-gray-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={targets.students}
                      onChange={() => toggleTarget('students')}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    Students
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-gray-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={targets.parents}
                      onChange={() => toggleTarget('parents')}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    Parents / Guardians
                  </label>
                </div>
              </div>
            </div>
          )}

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
